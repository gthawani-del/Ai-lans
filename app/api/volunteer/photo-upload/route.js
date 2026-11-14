import { boundedBody } from "../../../../lib/bounded-request.mjs";
import { normalize } from "../../../../lib/volunteer-v3.mjs";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "../../../../lib/supabase-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message, status = 500) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request) {
  try {
    let form;
    try {
      const body = await boundedBody(request, 6 * 1024 * 1024);
      form = await new Response(body, {headers:{"Content-Type":request.headers.get("content-type") || ""}}).formData();
    } catch (error) {
      return fail(error instanceof RangeError ? "Maximum request size is 6 MB." : "Invalid upload request.", error instanceof RangeError ? 413 : 400);
    }
    const file = form.get("file");
    const suppliedId = String(form.get("id") || "").trim();
    const resumeToken = String(form.get("token") || "").trim();
    if (!resumeToken) return fail("Upload session token is missing.", 400);
    if (!file || typeof file.arrayBuffer !== "function")
      return fail("No photo was received.", 400);
    if (file.size > 5 * 1024 * 1024)
      return fail("Maximum upload size is 5 MB.", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      file.type !== "image/webp" ||
      bytes.length < 12 ||
      bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP"
    )
      return fail("Upload a valid processed WebP photo.", 400);
    let safeBytes;
    try {
      const image = sharp(bytes, { limitInputPixels: 20000000 });
      const meta = await image.metadata();
      if (meta.width < 240 || meta.height < 240)
        return fail("Photo must be at least 240 × 240 pixels.", 400);
      safeBytes = await image
        .rotate()
        .resize({
          width: 800,
          height: 800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return fail("The photo is corrupt or cannot be decoded.", 400);
    }
    let payload = {};
    try {
      const raw = String(form.get("payload") || "{}");
      if (Buffer.byteLength(raw) > 50000) return fail("Application payload is too large.", 413);
      payload = JSON.parse(raw);
      if (!payload || Array.isArray(payload) || typeof payload !== "object") return fail("Invalid application payload.", 400);
      payload = normalize(payload);
    } catch {
      return fail("Invalid application payload.", 400);
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    let appId = suppliedId;

    if (!appId) {
      const { data, error } = await sb.rpc("start_volunteer_application", {
        p_payload: payload,
        p_token: resumeToken,
      });
      if (error)
        return fail("Could not start the application. Please retry.", 502);
      appId = data?.id || "";
      if (!appId) return fail("Could not start the application.", 502);
    }

    const { data: session, error: sessionError } = await sb.rpc(
      "get_volunteer_resume_state",
      { p_id: appId, p_token: resumeToken },
    );
    if (sessionError || session?.status !== "draft")
      return fail("Invalid application session.", 403);
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const path = "pending/" + appId + "-" + nonce + ".webp";

    const { error: uploadError } = await sb.storage
      .from("volunteer-photos")
      .upload(path, safeBytes, { contentType: "image/webp", upsert: false });
    if (uploadError)
      return fail("Photo storage failed. Please retry.", 502);

    const { error: registerError } = await sb.rpc(
      "register_volunteer_photo_upload",
      {
        p_id: appId,
        p_token: resumeToken,
        p_path: path,
        p_moderation: {
          clientSanitized: true,
          model: "trusted_backoffice_review",
        },
      },
    );
    if (registerError)
      return fail("Photo registration failed. Please retry.", 502);

    return Response.json(
      { ok: true, id: appId, token: resumeToken, path },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return fail("Photo upload failed. Please retry.", 500);
  }
}
