import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://weareailabs.com", "https://www.weareailabs.com"]);
const platforms = ["facebook", "youtube", "instagram", "x", "linkedin"] as const;
type Platform = typeof platforms[number];
const allowedHosts: Record<Platform, string[]> = {
  facebook: ["facebook.com", "www.facebook.com"],
  youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
  instagram: ["instagram.com", "www.instagram.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
};

function headers(origin: string | null) {
  const accepted = origin && allowedOrigins.has(origin) ? origin : "https://weareailabs.com";
  return {
    "Access-Control-Allow-Origin": accepted,
    "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

const reply = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: headers(req.headers.get("Origin")) });

function cleanProfile(value: unknown) {
  const profile = value as Record<string, unknown>;
  const platform = String(profile?.platform || "") as Platform;
  if (!platforms.includes(platform)) throw new Error("Unknown social platform");
  const handle = String(profile?.handle || "").trim().slice(0, 120);
  const rawUrl = String(profile?.profile_url || "").trim();
  let profileUrl: string | null = null;
  if (rawUrl) {
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch { throw new Error(`Enter a valid ${platform} profile URL`); }
    if (parsed.protocol !== "https:" || !allowedHosts[platform].includes(parsed.hostname.toLowerCase()) || parsed.username || parsed.password) {
      throw new Error(`Use an HTTPS ${platform} profile URL`);
    }
    parsed.search = "";
    parsed.hash = "";
    profileUrl = parsed.toString().replace(/\/$/, "");
  }
  const isEnabled = profile?.is_enabled === true;
  if (isEnabled && (!profileUrl || !handle)) throw new Error(`Add a handle and profile URL before enabling ${platform}`);
  return { platform, handle, profile_url: profileUrl, is_enabled: isEnabled, display_order: Number(profile?.display_order) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(req.headers.get("Origin")) });
  if (req.method !== "GET" && req.method !== "PATCH") return reply(req, 405, { error: "Method not allowed" });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return reply(req, 503, { error: "Service unavailable" });
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return reply(req, 401, { error: "Sign in required" });

    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth?.user) return reply(req, 401, { error: "Invalid session" });
    const { data: admin, error: roleError } = await db.from("backoffice_users")
      .select("role,is_active").eq("user_id", auth.user.id).maybeSingle();
    if (roleError || !admin?.is_active || admin.role !== "super_admin") return reply(req, 403, { error: "Site settings access denied" });

    if (req.method === "GET") {
      const { data, error } = await db.from("site_social_profiles")
        .select("platform,handle,profile_url,is_enabled,display_order").order("display_order", { ascending: true });
      if (error) throw error;
      return reply(req, 200, { profiles: data || [] });
    }

    const raw = await req.text();
    if (raw.length > 8000) return reply(req, 413, { error: "Request too large" });
    const body = JSON.parse(raw);
    if (!Array.isArray(body?.profiles) || body.profiles.length !== platforms.length) return reply(req, 400, { error: "Submit all five social profiles" });
    const profiles = body.profiles.map(cleanProfile);
    const ids = new Set(profiles.map((profile: { platform: string }) => profile.platform));
    const orders = new Set(profiles.map((profile: { display_order: number }) => profile.display_order));
    if (ids.size !== platforms.length || platforms.some(platform => !ids.has(platform)) || orders.size !== platforms.length || profiles.some((profile: { display_order: number }) => !Number.isInteger(profile.display_order) || profile.display_order < 1 || profile.display_order > 5)) {
      return reply(req, 400, { error: "Use each platform once and a unique order from 1 to 5" });
    }

    const { error: saveError } = await db.from("site_social_profiles").upsert(
      profiles.map((profile: Record<string, unknown>) => ({ ...profile, updated_by: auth.user.id, updated_at: new Date().toISOString() })),
      { onConflict: "platform" },
    );
    if (saveError) throw saveError;
    const { error: auditError } = await db.from("backoffice_audit_log").insert({
      user_id: auth.user.id,
      action: "site_social_profiles_updated",
      entity_type: "site_settings",
      entity_id: null,
      workshop_key: "ai-lab-mumbai-2026",
      details: { profiles: profiles.map((profile: { platform: string; handle: string; profile_url: string | null; is_enabled: boolean; display_order: number }) => ({ platform: profile.platform, handle: profile.handle, profile_url: profile.profile_url, is_enabled: profile.is_enabled, display_order: profile.display_order })) },
    });
    if (auditError) throw auditError;
    return reply(req, 200, { ok: true, profiles });
  } catch (error) {
    if (error instanceof SyntaxError) return reply(req, 400, { error: "Invalid JSON" });
    if (error instanceof Error && /social platform|profile URL|before enabling|HTTPS/.test(error.message)) return reply(req, 400, { error: error.message });
    console.error("social-profile-settings-admin failed", error instanceof Error ? error.message : "Unknown error");
    return reply(req, 500, { error: "Could not save social profile settings" });
  }
});
