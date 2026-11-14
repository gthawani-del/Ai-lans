"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase-browser";
import LegacyVolunteerApply from "./LegacyVolunteerApply";
import VolunteerApplyV3 from "./VolunteerApplyV3";
export default function VolunteerApply() {
  const [config, setConfig] = useState(null),
    [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      const id = localStorage.getItem("ai-lab-volunteer-id"),
        token = localStorage.getItem("ai-lab-volunteer-token");
      const { data, error } = await getSupabaseBrowserClient().rpc(
        "get_volunteer_form_config",
        { p_id: id || null, p_token: token || null },
      );
      if (error) throw error;
      setConfig(data);
    } catch (e) {
      setError("We could not load the application. Please retry.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  if (error)
    return (
      <main className="complete">
        <h1>Application unavailable</h1>
        <p role="alert">{error}</p>
        <button onClick={load}>Retry</button>
      </main>
    );
  if (!config)
    return (
      <main className="complete" role="status">
        Loading application…
      </main>
    );
  if (config.is_open === false)
    return (
      <main className="complete">
        <h1>Applications are currently closed</h1>
        <p>Please check back when the next application window opens.</p>
      </main>
    );
  return config.form_config?.application_model === "enhanced_v3" ? (
    <VolunteerApplyV3 config={config} />
  ) : (
    <LegacyVolunteerApply />
  );
}
