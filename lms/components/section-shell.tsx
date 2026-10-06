import { AppShell } from "./app-shell";

export function SectionShell({ title, eyebrow, copy }: { title: string; eyebrow: string; copy: string }) {
  return (
    <AppShell>
      <div className="page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div className="empty-module">
        <div>
          <span className="eyebrow">Module shell ready</span>
          <h2>{title}</h2>
          <p>This area is wired into the LMS navigation and will be implemented from the approved UI system.</p>
        </div>
      </div>
    </AppShell>
  );
}
