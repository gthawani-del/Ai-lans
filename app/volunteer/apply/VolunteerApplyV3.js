"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserRound, Camera } from "lucide-react";
import {
  getSupabaseBrowserClient,
  SUPABASE_URL,
} from "../../../lib/supabase-browser";
import {
  rules,
  initial,
  options,
  levels,
  configuredTools,
  commitments,
  COMMITMENT_VERSION,
  visible,
  normalize,
  validate,
  reviewSections,
} from "../../../lib/volunteer-v3.mjs";
import "./apply.css";
import "./v3.css";
const titles = [
  "Tell us about you",
  "Profile & skills",
  "Experience & work",
  "Background & commitments",
  "Review & submit",
];
const DRAFT = "ai-lab-volunteer-draft-v3";
const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export default function VolunteerApplyV3({ config }) {
  const [data, setData] = useState(initial),
    [step, setStep] = useState(0),
    [ready, setReady] = useState(false),
    [errors, setErrors] = useState({}),
    [touched, setTouched] = useState({}),
    [saveState, setSaveState] = useState("Saved on this device"),
    [busy, setBusy] = useState(false),
    [photoBusy, setPhotoBusy] = useState(false),
    [photoUrl, setPhotoUrl] = useState(""),
    [notice, setNotice] = useState(""),
    [receipt, setReceipt] = useState(null);
  const ids = useRef({ id: null, token: null }),
    queue = useRef(Promise.resolve()),
    latest = useRef(data),
    submitting = useRef(false),
    saveRevision = useRef(0),
    heading = useRef(null),
    fileInput = useRef(null);
  latest.current = data;
  const sb = getSupabaseBrowserClient();
  const tools = configuredTools(config.form_config);
  const checkData = (d, s = null) => validate(d, s, { activeTools: tools });
  const event = config.form_config?.workshop_details || {};
  const eventReady = !!(event.dates && event.hours && event.venue);
  const eventLabel = eventReady
    ? `${event.dates} · ${event.hours} · ${event.venue} · Asia/Kolkata`
    : "Workshop dates, hours and venue will be confirmed by the team.";
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = localStorage.getItem(DRAFT);
        if (raw) {
          const saved = JSON.parse(raw);
          setData({ ...initial, ...saved.data, photoApproved: false });
          setStep(Math.min(4, Math.max(0, saved.step || 0)));
        }
        ids.current = {
          id: localStorage.getItem("ai-lab-volunteer-id"),
          token: localStorage.getItem("ai-lab-volunteer-token"),
        };
        if (ids.current.id && ids.current.token) {
          const { data: s, error } = await sb.rpc(
            "get_volunteer_resume_state",
            { p_id: ids.current.id, p_token: ids.current.token },
          );
          if (error) throw error;
          if (s.status !== "draft") {
            setReceipt({ id: s.id });
            return;
          }
          setData((d) => ({
            ...d,
            photoApproved: ["review", "approved"].includes(s.photo_status),
          }));
          const r = await fetch(
            SUPABASE_URL + "/functions/v1/volunteer-photo-preview",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ids.current),
            },
          );
          if (r.ok) {
            const p = await r.json();
            if (active) setPhotoUrl(p.photo_url || "");
          }
        }
      } catch {
        setNotice(
          "We could not restore the online draft. Your local answers are retained; retry saving before submitting.",
        );
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (ready) heading.current?.focus();
  }, [step, ready]);
  function persistLocal(d, s) {
    localStorage.setItem(DRAFT, JSON.stringify({ data: d, step: s }));
  }
  function save(d = latest.current, s = step) {
    const revision = ++saveRevision.current;
    setSaveState("Saving…");
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          persistLocal(d, s);
          if (ids.current.id) {
            const { error } = await sb.rpc("save_volunteer_application", {
              p_id: ids.current.id,
              p_token: ids.current.token,
              p_payload: normalize(d),
              p_step: s + 1,
            });
            if (error) throw error;
          }
          if (revision === saveRevision.current)
            setSaveState(
              ids.current.id
                ? "Saved at " +
                    new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                : "Saved on this device",
            );
        } catch (e) {
          if (revision === saveRevision.current)
            setSaveState("Save failed — retry");
          throw e;
        }
      });
    return queue.current;
  }
  useEffect(() => {
    if (!ready || receipt || submitting.current) return;
    const t = setTimeout(() => {
      if (!submitting.current) save(data, step).catch(() => {});
    }, 650);
    return () => clearTimeout(t);
  }, [data, step, ready, receipt]);
  function set(k, v) {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => {
      const next = { ...e };
      delete next[k];
      return next;
    });
  }
  function changeStep(n) {
    setErrors({});
    setTouched({});
    setStep(n);
  }
  function check(s) {
    const e = checkData(data, s);
    setErrors(e);
    if (Object.keys(e).length) {
      setTimeout(() => document.getElementById("v3-errors")?.focus(), 0);
      return false;
    }
    return true;
  }
  function next() {
    if (check(step)) {
      setData(normalize(data));
      changeStep(step + 1);
    }
  }
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotice("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setErrors((e) => ({
        ...e,
        photoApproved: "Choose a JPG, PNG or WebP image under 5 MB.",
      }));
      return;
    }
    setPhotoBusy(true);
    try {
      const image = await createImageBitmap(file);
      if (image.width < 240 || image.height < 240)
        throw new Error("Choose a clear photo at least 240 × 240 pixels.");
      const scale = Math.min(800 / image.width, 800 / image.height, 1),
        canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas
        .getContext("2d")
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const blob = await new Promise((r) =>
        canvas.toBlob(r, "image/webp", 0.85),
      );
      if (!blob) throw new Error("Could not process this photo.");
      await queue.current.catch(() => {});
      const rt = ids.current.token || token();
      const body = new FormData();
      body.append("file", blob, "photo.webp");
      body.append("id", ids.current.id || "");
      body.append("token", rt);
      body.append("payload", JSON.stringify(normalize(latest.current)));
      const r = await fetch("/api/volunteer/photo-upload", {
        method: "POST",
        body,
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Photo upload failed.");
      ids.current = { id: result.id, token: result.token };
      localStorage.setItem("ai-lab-volunteer-id", result.id);
      localStorage.setItem("ai-lab-volunteer-token", result.token);
      if (photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(URL.createObjectURL(blob));
      set("photoApproved", true);
    } catch (e) {
      setErrors((x) => ({
        ...x,
        photoApproved: e.message || "Photo upload failed. Please retry.",
      }));
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function removePhoto() {
    if (photoBusy) return;
    setPhotoBusy(true);
    try {
      const { error } = await sb.rpc("remove_volunteer_photo", {
        p_id: ids.current.id,
        p_token: ids.current.token,
      });
      if (error) throw error;
      set("photoApproved", false);
      setPhotoUrl("");
    } catch {
      setNotice("Could not remove the photo. Please retry.");
    } finally {
      setPhotoBusy(false);
    }
  }
  async function submit() {
    if (submitting.current) return;
    const e = checkData(data);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      const s =
        rules.find((r) => r.key === first)?.step ?? (first === "stack" ? 1 : 0);
      setStep(s);
      setErrors(e);
      setTimeout(() => document.getElementById("v3-errors")?.focus(), 0);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setNotice("");
    try {
      await save(data, step);
      if (!ids.current.id)
        throw new Error("Upload your photo before submitting.");
      const payload = {
        ...normalize(data),
        commitmentEvent: eventReady
          ? eventLabel
          : "Schedule pending confirmation",
        consentVersion: COMMITMENT_VERSION,
      };
      const { data: r, error } = await sb.rpc("submit_volunteer_application", {
        p_id: ids.current.id,
        p_token: ids.current.token,
        p_payload: payload,
      });
      if (error) {
        try {
          const details = JSON.parse(error.details);
          if (details && typeof details === "object") {
            setErrors(details);
            const first = Object.keys(details)[0];
            setStep(rules.find((x) => x.key === first)?.step ?? 0);
            setTimeout(() => document.getElementById("v3-errors")?.focus(), 0);
          }
        } catch {}
        throw error;
      }
      setReceipt(r);
      [
        DRAFT,
        "ai-lab-volunteer-draft-v2",
        "ai-lab-volunteer-id",
        "ai-lab-volunteer-token",
      ].forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      setNotice(e.message || "Submission failed. Your answers are retained.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function field(r) {
    if (!visible(r, data)) return null;
    const id = "v3-" + r.key;
    const err =
      errors[r.key] || (touched[r.key] ? checkData(data, r.step)[r.key] : null);
    const common = {
      id,
      name: r.key,
      "aria-invalid": !!err,
      "aria-required": !!r.required,
      "aria-describedby": id + "-help",
      onBlur: () => setTouched((t) => ({ ...t, [r.key]: true })),
    };
    const control = r.boolean ? (
      <label className="v3-check">
        <input
          {...common}
          type="checkbox"
          checked={data[r.key] === true}
          onChange={(e) => set(r.key, e.target.checked)}
        />
        <span>
          {r.key === "commitmentAgreed"
            ? "I have read and agree to all the commitments above."
            : r.key === "accurate"
              ? "I confirm my application is accurate."
              : "I agree to the use of my application and photo for volunteer selection, photo review and workshop coordination."}
        </span>
      </label>
    ) : r.enum && r.enum.length <= 3 ? (
      <fieldset id={id} tabIndex={-1} aria-describedby={id + "-help"} aria-invalid={!!err}>
        <legend>{r.label} {!r.required && "(optional)"}</legend>
        <div className="v3-segments">
          {r.enum.map(value => <label key={value}>
            <input type="radio" name={r.key} value={value} checked={data[r.key] === value}
              aria-required={!!r.required} aria-invalid={!!err} aria-describedby={id + "-help"}
              onChange={() => set(r.key, value)} />
            <span>{value}</span>
          </label>)}
        </div>
      </fieldset>
    ) : r.array ? (
      <fieldset id={id} tabIndex={-1} aria-invalid={!!err} aria-describedby={id + "-help"}>
        <legend>
          {r.label} {r.required ? "" : "(optional)"}
        </legend>
        <div className="v3-choices">
          {r.array.map((x) => (
            <label key={x}>
              <input
                type="checkbox"
                aria-invalid={!!err}
                aria-describedby={id + "-help"}
                checked={(data[r.key] || []).includes(x)}
                onChange={(e) =>
                  set(
                    r.key,
                    e.target.checked
                      ? [...(data[r.key] || []), x]
                      : (data[r.key] || []).filter((v) => v !== x),
                  )
                }
              />
              {x}
            </label>
          ))}
        </div>
      </fieldset>
    ) : (
      <>
        <label htmlFor={id}>
          {r.label} {r.required ? "" : "(optional)"}
        </label>
        {r.enum ? (
          <select
            {...common}
            value={data[r.key] || ""}
            onChange={(e) => set(r.key, e.target.value)}
          >
            <option value="">Select an option</option>
            {r.enum.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ) : r.key === "phone" ? (
          <div className="v3-phone">
            <span aria-hidden="true">+91</span>
            <input {...common} type="tel" inputMode="tel" autoComplete="tel-national"
              aria-label="Indian mobile number, country code +91" maxLength={24}
              value={(data.phone || "").replace(/^(?:\+91|0091)\s*/, "")}
              onChange={e => {
                const value = e.target.value.replace(/^(?:\+91|0091)[\s-]*/, "");
                const digits = value.replace(/\D/g, "");
                set("phone", digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : value);
              }} placeholder="e.g., 98765 43210" />
          </div>
        ) : r.max >= 500 ? (
          <textarea
            {...common}
            rows={3}
            maxLength={r.max}
            value={data[r.key] || ""}
            onChange={(e) => set(r.key, e.target.value)}
          />
        ) : (
          <input
            {...common}
            type={
              r.url
                ? "url"
                : r.key === "email"
                  ? "email"
                  : r.key === "phone"
                    ? "tel"
                    : "text"
            }
            inputMode={
              ["postcode", "graduationYear"].includes(r.key)
                ? "numeric"
                : undefined
            }
            autoComplete={
              {
                name: "name",
                email: "email",
                phone: "tel",
                city: "address-level2",
                postcode: "postal-code",
                company: "organization",
                designation: "organization-title",
                addressStreetArea: "address-line1",
                addressBuilding: "address-line2",
              }[r.key] || "off"
            }
            maxLength={
              r.max ||
              (r.url
                ? 2048
                : r.key === "phone"
                  ? 24
                  : r.key === "postcode"
                    ? 6
                    : undefined)
            }
            value={data[r.key] || ""}
            onChange={(e) => set(r.key, e.target.value)}
            spellCheck={r.url || ["email", "postcode"].includes(r.key) ? false : undefined}
            placeholder={
              r.url
                ? "https://"
                : r.key === "email" ? "e.g., name@example.com"
                : r.key === "postcode" ? "e.g., 400001"
                  : undefined
            }
          />
        )}
      </>
    );
    return (
      <div
        className={
          "v3-field " + (r.array || r.boolean || r.max >= 500 || (r.enum && r.enum.length <= 3) ? "wide" : "")
        }
        key={r.key}
      >
        {control}
        <small id={id + "-help"} className={err ? "v3-error" : ""}>
          {err ||
            (r.max >= 500
              ? `${(data[r.key] || "").length}/${r.max} characters${r.min ? ` · minimum ${r.min}` : ""}`
              : r.url
                  ? "Use the platform shown in the label; HTTPS links only."
                  : "")}
        </small>
      </div>
    );
  }
  const optionalDetails = ["gender", "genderOther", "addressStreetArea", "addressBuilding", "linkedin", "github"];
  function fields(s) {
    return rules
      .filter(
        (r) =>
          r.step === s &&
          !optionalDetails.includes(r.key) &&
          !["commitmentAgreed", "accurate", "consent"].includes(r.key),
      )
      .sort((a, b) => {
        const position = r => r.key === "postcode" ? rules.findIndex(x => x.key === "city") : r.key === "city" ? rules.findIndex(x => x.key === "postcode") : rules.indexOf(r);
        return position(a) - position(b);
      })
      .map(field);
  }
  if (!ready)
    return (
      <main className="complete" role="status">
        Restoring your application…
      </main>
    );
  if (receipt)
    return (
      <main className="complete v3-complete">
        <h1>Application received</h1>
        <p>
          Your reference: <strong>{receipt.id}</strong>
        </p>
        {receipt.submitted_at && (
          <p>
            {new Date(receipt.submitted_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </p>
        )}
        <p>
          The team will review your experience and availability and contact you
          using your supplied details. Please do not submit again.
        </p>
        <Link href="/volunteer">Back to volunteer information</Link>
      </main>
    );
  return (
    <main className="v3-shell">
      <aside className="v3-rail">
        <h2>
          Volunteer.
          <br />
          Build together.
        </h2>
        <p>Technical, creative and operational backgrounds are welcome.</p>
        <details className="v3-context">
          <summary>Workshop details</summary>
          <p>{eventLabel}</p>
          <p>Technical, creative and operational backgrounds are welcome. Education and location do not automatically exclude you.</p>
        </details>
        <Link href="/volunteer">Explore the benefits →</Link>
      </aside>
      <section className="v3-main">
        <header>
          <p className="vf-eyebrow">Volunteer application</p>
          <p>
            Step {step + 1} of 5 · <span role="status" aria-live="polite" aria-atomic="true">{saveState}</span>
          </p>
          <h1 id="application-step-title" ref={heading} tabIndex={-1}>
            {titles[step]}
          </h1>
          <p>
            All fields are required unless marked optional.
          </p>
          <nav aria-label="Application progress">
            {titles.map((t, i) => (
              <button
                key={t}
                type="button"
                disabled={i > step}
                aria-label={`Step ${i + 1}: ${t}`}
                aria-current={step === i ? "step" : undefined}
                onClick={() => changeStep(i)}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                <small>{["You", "Profile & skills", "Experience & work", "Commitments", "Review"][i]}</small>
              </button>
            ))}
          </nav>
        </header>
        {notice && (
          <p role="alert" className="v3-error">
            {notice}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <div
            id="v3-errors"
            tabIndex={-1}
            role="alert"
            className="v3-error-summary"
          >
            <b>Please check these answers:</b>
            <ul>
              {Object.entries(errors).map(([k, v]) => (
                <li key={k}>
                  <a
                    href={"#v3-" + k}
                    onClick={() => document.getElementById("v3-" + k)?.focus()}
                  >
                    {v}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <form noValidate aria-labelledby="application-step-title" onSubmit={(event) => { event.preventDefault(); if (!busy && !photoBusy) { if (step === 4) submit(); else next(); } }}>
        <div className="v3-content">
          {step === 0 && (
            <>
              <div className="v3-photo" id="v3-photoApproved" tabIndex={-1}>
                {photoUrl ? <img src={photoUrl} alt="Your photo preview" /> : <div className="vf-photo-placeholder" aria-hidden="true"><UserRound size={42} strokeWidth={1.4} /></div>}
                <div>
                  <b>Profile photo</b>
                  <p>
                    For identification and team review. Only you should appear;
                    no inappropriate images.
                  </p>
                  <label className="v3-upload" htmlFor="v3-photo-file">
                    <Camera size={20} aria-hidden="true" />
                    <span>{photoBusy ? "Uploading photo…" : photoUrl ? "Change photo" : "Add your photo"}</span>
                  <input
                    ref={fileInput}
                    id="v3-photo-file"
                    aria-required="true"
                    aria-invalid={!!errors.photoApproved}
                    aria-describedby={errors.photoApproved ? "v3-photo-help v3-photo-error" : "v3-photo-help"}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={upload}
                    disabled={photoBusy}
                  />
                  </label>
                  <small id="v3-photo-help">
                    JPG, PNG or WebP · up to 5 MB · minimum 240 × 240 pixels
                  </small>
                  {photoBusy ? (
                    <p role="status">Processing and uploading…</p>
                  ) : (
                    data.photoApproved && (
                      <p>
                        Uploaded · pending team review{" "}
                        <button type="button" onClick={removePhoto}>
                          Remove photo
                        </button>
                      </p>
                    )
                  )}
                  {errors.photoApproved && (
                    <p id="v3-photo-error" role="alert" className="v3-error">
                      {errors.photoApproved}
                    </p>
                  )}
                </div>
              </div>
              <div className="v3-grid">{fields(0)}</div>
              <details className="v3-disclosure" open={optionalDetails.some(k => errors[k]) || undefined}>
                <summary>More about you <span>(optional)</span></summary>
                <p>Gender, address and profile links.</p>
                <div className="v3-grid">{rules.filter(r => optionalDetails.includes(r.key)).map(field)}</div>
              </details>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="v3-group-title">Your interests & strengths</h2>
              <div className="v3-grid">{fields(1)}</div>
              <fieldset id="v3-stack" tabIndex={-1} aria-describedby={errors.stack ? "v3-stack-error" : undefined}>
                <legend>Your tools</legend>
                <p>
                  New to it: not used yet · Used it: tried with guidance ·
                  Comfortable: work independently · Built with it: delivered
                  work using it. Beginners are welcome.
                </p>
                {tools.map(([k, l]) => (
                  <div className="v3-tool" key={k}>
                    <label htmlFor={"tool-" + k}>{l}</label>
                    <select
                      id={"tool-" + k}
                      aria-required="true"
                      aria-invalid={!!errors.stack && !data.stack[k]}
                      aria-describedby={errors.stack ? "v3-stack-error" : undefined}
                      value={data.stack[k] || ""}
                      onChange={(e) =>
                        set("stack", { ...data.stack, [k]: e.target.value })
                      }
                    >
                      <option value="">Select level</option>
                      {levels.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {errors.stack && <p id="v3-stack-error" className="v3-error">{errors.stack}</p>}
              </fieldset>
              <fieldset id="v3-customTools" tabIndex={-1} aria-describedby={errors.customTools ? "v3-customTools-error" : undefined}>
                <legend>Additional tools (optional)</legend>
                {data.customTools.map((t, i) => (
                  <div className="v3-tool v3-custom-tool" key={i}>
                    <label htmlFor={"custom-tool-" + i}>Tool {i + 1} name
                    <input
                      id={"custom-tool-" + i}
                      aria-invalid={!!errors.customTools}
                      aria-describedby={errors.customTools ? "v3-customTools-error" : undefined}
                      maxLength={80}
                      value={t.name}
                      onChange={(e) =>
                        set(
                          "customTools",
                          data.customTools.map((v, j) =>
                            i === j ? { ...v, name: e.target.value } : v,
                          ),
                        )
                      }
                    />
                    </label>
                    <label htmlFor={"custom-level-" + i}>Proficiency
                    <select
                      id={"custom-level-" + i}
                      aria-invalid={!!errors.customTools}
                      aria-describedby={errors.customTools ? "v3-customTools-error" : undefined}
                      aria-label={"Proficiency for additional tool " + (i + 1)}
                      value={t.level}
                      onChange={(e) =>
                        set(
                          "customTools",
                          data.customTools.map((v, j) =>
                            i === j ? { ...v, level: e.target.value } : v,
                          ),
                        )
                      }
                    >
                      <option value="">Select level</option>
                      {levels.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                    </label>
                    <button
                      type="button"
                      aria-label={"Remove additional tool " + (i + 1)}
                      onClick={() =>
                        set(
                          "customTools",
                          data.customTools.filter((_, j) => i !== j),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={data.customTools.length >= 10}
                  onClick={() =>
                    set("customTools", [
                      ...data.customTools,
                      { name: "", level: "" },
                    ])
                  }
                >
                  + Add another tool
                </button>
                {errors.customTools && (
                  <p id="v3-customTools-error" className="v3-error">{errors.customTools}</p>
                )}
              </fieldset>
            </>
          )}
          {step === 2 && (
            <>
              <p>
                Share relevant technical, design, research or operational work.
                Private work is welcome; never share passwords, API keys or
                confidential documents.
              </p>
              <div className="v3-grid">{fields(2)}</div>
              {data.experienceStatus === "Some experience" && (
                <fieldset id="v3-involvement" tabIndex={-1} aria-describedby={errors.involvement ? "v3-involvement-error" : undefined}>
                  <legend>Your involvement</legend>
                  {(data.contributionAreas || []).map((x) => (
                    <div className="v3-tool" key={x}>
                      <label
                        htmlFor={
                          "depth-" + options.contributionAreas.indexOf(x)
                        }
                      >
                        {x}
                      </label>
                      <select
                        id={"depth-" + options.contributionAreas.indexOf(x)}
                        aria-required="true"
                        aria-invalid={!!errors.involvement && !data.involvement[x]}
                        aria-describedby={errors.involvement ? "v3-involvement-error" : undefined}
                        value={data.involvement[x] || ""}
                        onChange={(e) =>
                          set("involvement", {
                            ...data.involvement,
                            [x]: e.target.value,
                          })
                        }
                      >
                        <option value="">Select depth</option>
                        {options.involvement.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {errors.involvement && (
                    <p id="v3-involvement-error" className="v3-error">{errors.involvement}</p>
                  )}
                </fieldset>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="v3-group-title">Education & languages</h2>
              <div className="v3-grid">{fields(3)}</div>
              <section className="v3-commitments">
                <h2>Your volunteer commitments</h2>
                <p>All commitments are required for this role.</p>
                <p>{eventLabel}</p>
                {!eventReady && (
                  <p>
                    <strong>
                      Agreement is provisional until you receive the schedule.
                      The team must reconfirm your availability once dates and
                      hours are published.
                    </strong>
                  </p>
                )}
                <ul>
                  {commitments.map((c) => (
                    <li key={c}>
                      <span aria-hidden="true">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
                {field(rules.find((r) => r.key === "commitmentAgreed"))}
              </section>
            </>
          )}
          {step === 4 && (
            <>
              {reviewSections(data, tools).map((section) => (
                <details className="v3-review v3-disclosure" key={section.step}>
                  <summary>{titles[section.step]} <span>{section.rows.length} answers</span></summary>
                  <h2>
                    {titles[section.step]}{" "}
                    <button
                      type="button"
                      aria-label={"Edit " + titles[section.step]}
                      onClick={() => changeStep(section.step)}
                    >
                      Edit
                    </button>
                  </h2>
                  <dl>
                    {section.rows.map(([l, v]) => (
                      <div key={l}>
                        <dt>{l}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
              <section className="v3-review">
                <h2>How we use your application</h2>
                <p>
                  Your answers and photo are used by the workshop team for
                  selection, photo review and coordination. This agreement does
                  not grant permission for publicity or marketing use. You can
                  ask the workshop team to correct or delete your application.
                </p>
              </section>
              {field(rules.find((r) => r.key === "accurate"))}
              {field(rules.find((r) => r.key === "consent"))}
            </>
          )}
        </div>
        <footer className={`v3-actions ${step === 0 ? "v3-first-actions" : ""}`}>
          {step > 0 && <button
            type="button"
            disabled={step === 0 || busy || photoBusy}
            onClick={() => changeStep(step - 1)}
          >
            ← Back
          </button>}
          <span>
            {saveState}
            {saveState.startsWith("Save failed") && (
              <button type="button" onClick={() => save().catch(() => {})}>Retry</button>
            )}
          </span>
          <button
            type="submit"
            className="v3-primary"
            disabled={busy || photoBusy}
          >
            {busy
              ? "Submitting…"
              : step === 4
                ? "Submit application"
                : "Continue →"}
          </button>
        </footer>
        </form>
      </section>
    </main>
  );
}
