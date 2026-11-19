import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateCmsFormSubmission } from "./validator.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedOrigins = new Set(["https://weareailabs.com", "https://www.weareailabs.com"]);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const encoder = new TextEncoder();

function headers(origin: string | null) {
  const out: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff" };
  if (origin && allowedOrigins.has(origin)) {
    out["Access-Control-Allow-Origin"] = origin;
    out["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    out["Access-Control-Allow-Headers"] = "content-type, x-idempotency-key";
    out["Access-Control-Max-Age"] = "600";
  }
  return out;
}

function response(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

function validOrigin(origin: string | null) { return !!origin && allowedOrigins.has(origin); }

async function tokenHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${SERVICE_KEY}:${value}`));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request) {
  const candidate = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  return candidate && candidate.length <= 64 ? candidate : null;
}

async function sendNotification(outboxId: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("FORM_NOTIFICATION_FROM");
  if (!apiKey || !sender) {
    await admin.rpc("cms_service_mark_form_notification", { p_outbox_id: outboxId, p_status: "disabled", p_error_code: "provider_not_configured", p_provider_message_id: null });
    return "disabled";
  }
  const { data, error } = await admin.rpc("cms_service_get_form_notification", { p_outbox_id: outboxId });
  if (error || !data?.recipient_email) {
    await admin.rpc("cms_service_mark_form_notification", { p_outbox_id: outboxId, p_status: "disabled", p_error_code: "recipient_not_configured", p_provider_message_id: null });
    return "disabled";
  }
  try {
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": data.outbox_id },
      body: JSON.stringify({
        from: sender,
        to: [data.recipient_email],
        subject: `New response: ${data.form_name}`,
        text: `A response was submitted to ${data.form_name}.\nReference: ${data.submission_id}\nOpen the private backoffice inbox to review it.\nhttps://weareailabs.com/backoffice/forms`,
      }),
    });
    const provider = await mail.json().catch(() => ({}));
    if (!mail.ok) throw new Error(`provider_${mail.status}`);
    await admin.rpc("cms_service_mark_form_notification", { p_outbox_id: outboxId, p_status: "sent", p_error_code: null, p_provider_message_id: provider?.id || null });
    return "sent";
  } catch (error) {
    await admin.rpc("cms_service_mark_form_notification", { p_outbox_id: outboxId, p_status: "retry", p_error_code: error instanceof Error ? error.message.slice(0, 80) : "provider_error", p_provider_message_id: null });
    return "retry";
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method === "GET") {
    if (origin && !validOrigin(origin)) return response(403, { error: "Origin not allowed." }, null);
    const url = new URL(req.url);
    const handle = url.searchParams.get("handle") || "";
    const formId = url.searchParams.get("form_id") || "";
    if (formId && !/^[0-9a-f-]{36}$/i.test(formId)) return response(404, { error: "Form unavailable." }, origin);
    if (!formId && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle) || handle.length > 120)) return response(404, { error: "Form unavailable." }, origin);
    const { data, error } = formId
      ? await admin.rpc("cms_public_get_form_by_id", { p_form_id: formId })
      : await admin.rpc("cms_public_get_form", { p_handle: handle });
    if (error) return response(503, { error: "Form unavailable. Please try again later." }, origin);
    if (!data) return response(404, { error: "Form unavailable." }, origin);
    return response(200, data, origin);
  }
  if (req.method !== "POST") return response(405, { error: "Method not allowed." }, origin);
  if (!validOrigin(origin)) return response(403, { error: "Origin not allowed." }, origin);
  if (!/^application\/json(?:;|$)/i.test(req.headers.get("content-type") || "")) return response(415, { error: "Unsupported request." }, origin);
  const length = Number(req.headers.get("content-length") || 0);
  if (length > 32000) return response(413, { error: "This response is too large." }, origin);
  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 32000) return response(413, { error: "This response is too large." }, origin);
    payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("bad_body");
  } catch { return response(400, { error: "Check the form and try again." }, origin); }
  const handle = typeof payload.handle === "string" ? payload.handle : "";
  const versionId = typeof payload.version_id === "string" ? payload.version_id : "";
  const idempotencyKey = req.headers.get("x-idempotency-key") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle) || !/^[0-9a-f-]{36}$/i.test(versionId) || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return response(400, { error: "Reload the form and try again." }, origin);
  if (typeof payload._website === "string" && payload._website.length > 0) return response(400, { error: "Check the form and try again." }, origin);
  const ip = clientIp(req);
  if (!ip) return response(429, { error: "We could not verify this request. Please try again later." }, origin);

  const { data: form, error: loadError } = await admin.rpc("cms_public_get_form", { p_handle: handle });
  if (loadError || !form) return response(404, { error: "Form unavailable. Reload and try again." }, origin);
  if (form.version_id !== versionId) return response(409, { error: "This form has changed. Reload it before submitting." }, origin);
  if (form.availability_status !== "open") return response(409, { error: form.closed_message || "This form is currently closed." }, origin);
  const ipHash = await tokenHash(`${form.id}:${ip}`);
  const { data: withinLimit, error: rateError } = await admin.rpc("cms_private_consume_form_rate_limit", { p_form_id: form.id, p_client_hash: ipHash });
  if (rateError || withinLimit !== true) return response(429, { error: "Too many attempts. Please wait and try again." }, origin);
  const answers = payload.answers;
  const validation = validateCmsFormSubmission(form, answers);
  if (Object.keys(validation.errors).length) return response(400, { error: "Some answers need attention.", field_errors: validation.errors }, origin);

  const { data: configData, error: configError } = await admin.from("cms_form_studio_config").select("public_submissions_enabled").eq("singleton", true).maybeSingle();
  if (configError || !configData?.public_submissions_enabled) return response(503, { error: "Form submissions are temporarily unavailable." }, origin);
  const idHash = await tokenHash(`${form.id}:${idempotencyKey}`);
  const sourcePageId = typeof payload.source_page_id === "string" && /^[0-9a-f-]{36}$/i.test(payload.source_page_id) ? payload.source_page_id : null;
  const acceptedConsents = form.fields.filter((field: any) => (field.type === "consent" || (field.type === "boolean_checkbox" && field.key === "marketing_opt_in")) && validation.answers[field.key] === true).map((field: any) => field.key);
  const { data: saved, error: saveError } = await admin.rpc("cms_public_submit_form", {
    p_form_id: form.id,
    p_version_id: versionId,
    p_answers: validation.answers,
    p_source_page_id: sourcePageId,
    p_context_id: null,
    p_idempotency_hash: idHash,
    p_client_hash: ipHash,
    p_consents: acceptedConsents,
  });
  if (saveError) {
    const code = saveError.code || "";
    if (code === "42900") return response(429, { error: "Too many attempts. Please wait and try again." }, origin);
    if (code === "40001") return response(409, { error: "This form has changed. Reload it before submitting." }, origin);
    if (code === "22023") return response(400, { error: "Some answers need attention. Reload and try again." }, origin);
    return response(503, { error: "We could not save this response. Please try again." }, origin);
  }
  let notification = saved.notification_status || "disabled";
  if (saved.outbox_id) notification = await sendNotification(saved.outbox_id);
  return response(200, { ok: true, success: form.success?.text || "Your response has been received.", notification_status: notification }, origin);
});
