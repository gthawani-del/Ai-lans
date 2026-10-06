"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, BookOpen, BriefcaseBusiness, CalendarDays, FolderKanban, Home,
  Library, Search, ShieldCheck, Sparkles, Trophy, UserRound, UsersRound
} from "lucide-react";
import { BrandLogo } from "./brand-logo";

const nav = [
  ["/", "Home", Home],
  ["/learn", "Learn", BookOpen],
  ["/workshops", "Workshops", CalendarDays],
  ["/community", "Community", UsersRound],
  ["/projects", "Projects", FolderKanban],
  ["/library", "Library", Library],
  ["/skills", "Skills", Sparkles],
  ["/assessments", "Assessments", ShieldCheck],
  ["/certificates", "Certificates", Trophy],
  ["/profile", "Profile", UserRound],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <BrandLogo />
        <nav className="side-nav" aria-label="Primary">
          {nav.map(([href, label, Icon]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link className={active ? "nav-link active" : "nav-link"} href={href} key={href}>
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="searchbox">
            <Search size={18} />
            <input aria-label="Global search" placeholder="Search courses, workshops, people, resources..." />
          </label>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <div className="profile-chip">
              <div className="avatar">GT</div>
              <div><strong>Gaurav Thawani</strong><span>Learner</span></div>
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </section>
    </div>
  );
}
