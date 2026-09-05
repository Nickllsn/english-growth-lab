import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "今日" },
  { to: "/progress", label: "进度" },
  { to: "/outputs", label: "输出" },
  { to: "/roadmap", label: "路线" }
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="logo-mark">EGL</p>
          <h1 className="logo-name">English Growth Lab</h1>
          <p className="logo-tagline">
            每天阅读、倾听、表达，留下看得见的进步。
          </p>
        </div>
        <nav aria-label="主导航">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
