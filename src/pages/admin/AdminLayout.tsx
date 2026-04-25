import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type PageKey = "dashboard" | "users" | "services" | "requests" | "tasks";

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: PageKey;
  pageTitle?: string;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { key: PageKey; icon: string; label: string; to: string }[] = [
  { key: "dashboard", icon: "⬡", label: "Dashboard", to: "/admin/dashboard" },
  { key: "users",     icon: "◎", label: "Users",     to: "/admin/users"     },
  { key: "services",  icon: "◈", label: "Services",  to: "/admin/services"  },
  { key: "requests",  icon: "❏", label: "Requests",  to: "/admin/requests"  },
];

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: "Admin Dashboard",
  users:     "Manage Users",
  services:  "Manage Services",
  requests:  "View Requests",
  tasks:     "Assign Tasks",
};

// ─── Sidebar item ─────────────────────────────────────────────────────────────
function SidebarItem({
  icon, label, to, active, onClick, badge,
}: {
  icon: string; label: string; to: string;
  active: boolean; onClick?: () => void; badge?: number;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 10,
        textDecoration: "none",
        background: active ? "rgba(0,255,210,0.1)" : "transparent",
        border: active ? "1px solid rgba(0,255,210,0.2)" : "1px solid transparent",
        color: active ? "var(--accent)" : "var(--ts)",
        transition: "all 0.2s", marginBottom: 2,
        fontFamily: "var(--mono)", fontSize: 12,
        fontWeight: active ? 600 : 400,
        letterSpacing: "0.02em",
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = "rgba(255,255,255,0.04)";
          el.style.color = "var(--tp)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.background = "transparent";
          el.style.color = "var(--ts)";
        }
      }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: "center" as const }}>{icon}</span>
      <span>{label}</span>

      {/* Badge — shows pending count, replaces active dot when present */}
      {badge && badge > 0 ? (
        <div style={{
          marginLeft: "auto",
          background: "#ff4d6d",
          color: "#fff",
          fontFamily: "var(--mono)",
          fontSize: 9,
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 20,
          minWidth: 18,
          textAlign: "center" as const,
          letterSpacing: "0.02em",
          boxShadow: "0 0 8px rgba(255,77,109,0.5)",
          animation: "badgePulse 2s ease infinite",
        }}>
          {badge > 99 ? "99+" : badge}
        </div>
      ) : active ? (
        <div style={{
          marginLeft: "auto", width: 5, height: 5,
          borderRadius: "50%", background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
        }} />
      ) : null}
    </Link>
  );
}

// ─── Sidebar content — shared between desktop and mobile drawer ───────────────
function SidebarContent({
  currentPage, user, onLogout, onNavClick, pendingCount,
}: {
  currentPage: PageKey;
  user: ReturnType<typeof authService.getCurrentUser>;
  onLogout: () => void;
  onNavClick?: () => void;
  pendingCount: number;
}) {
  return (
    <>
      <div className="adm-sidebar-header">
        <div className="adm-logo-box">⬡</div>
        <div className="adm-logo-text">Secure<span>Ops</span></div>
      </div>

      <nav className="adm-nav">
        <span className="adm-nav-label">Main menu</span>
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            to={item.to}
            active={item.key === currentPage}
            onClick={onNavClick}
            badge={item.key === "requests" ? pendingCount : undefined}
          />
        ))}
      </nav>

      <div className="adm-profile-section">
        <div className="adm-profile-card">
          <div className="adm-profile-role">⬡ Administrator</div>
          <div className="adm-profile-code">{user?.code ?? "—"}</div>
          <div className="adm-profile-email">{user?.email ?? "—"}</div>
        </div>
        <button className="adm-logout-btn" onClick={onLogout}>
          <span>⏻</span> Sign out
        </button>
      </div>
    </>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children, currentPage, pageTitle }: AdminLayoutProps) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending requests count on every page load
  useEffect(() => {
    api.get<{ pendingRequests: number }>("/admin/dashboard/stats")
      .then(({ data }) => setPendingCount(data.pendingRequests ?? 0))
      .catch(() => {}); // fail silently — badge just won't show
  }, [currentPage]); // re-fetch when navigating between pages

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const title = pageTitle ?? PAGE_TITLES[currentPage];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0a0c0f;
          --card:    #0f1218;
          --card2:   #131820;
          --accent:  #00ffd2;
          --adim:    #00c9a7;
          --aglow:   rgba(0,255,210,0.1);
          --border:  rgba(0,255,210,0.12);
          --tp:      #e8edf5;
          --ts:      #6b7a8d;
          --tm:      #3d4a5c;
          --danger:  #ff4d6d;
          --warning: #f59e0b;
          --success: #10b981;
          --mono:    'JetBrains Mono', monospace;
          --display: 'Syne', sans-serif;
          --sidebar-w: 240px;
        }

        body { background: var(--bg); color: var(--tp); font-family: var(--display); }
        * { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }

        .adm-layout { display: flex; min-height: 100vh; }

        /* ── SIDEBAR — desktop ── */
        .adm-sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--card); border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 50;
        }

        .adm-sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
        }

        .adm-logo-box {
          width: 34px; height: 34px;
          border: 1.5px solid var(--accent); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; color: var(--accent);
          background: var(--aglow); flex-shrink: 0;
        }

        .adm-logo-text { font-family: var(--display); font-size: 15px; font-weight: 700; color: var(--tp); }
        .adm-logo-text span { color: var(--accent); }

        .adm-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }

        .adm-nav-label {
          font-family: var(--mono); font-size: 9px; color: var(--tm);
          text-transform: uppercase; letter-spacing: 0.12em;
          padding: 0 14px; margin: 16px 0 8px; display: block;
        }

        .adm-profile-section {
          padding: 16px 12px;
          border-top: 1px solid var(--border);
        }

        .adm-profile-card {
          background: var(--card2); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
        }

        .adm-profile-role {
          font-family: var(--mono); font-size: 9px; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;
        }

        .adm-profile-code {
          font-family: var(--mono); font-size: 13px; font-weight: 600;
          color: var(--tp); margin-bottom: 2px;
        }

        .adm-profile-email {
          font-family: var(--mono); font-size: 10px; color: var(--ts);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .adm-logout-btn {
          width: 100%; padding: 9px 14px;
          background: rgba(255,77,109,0.07);
          border: 1px solid rgba(255,77,109,0.18);
          border-radius: 8px; color: #ff4d6d;
          font-family: var(--mono); font-size: 12px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
          letter-spacing: 0.02em;
        }

        .adm-logout-btn:hover {
          background: rgba(255,77,109,0.14);
          border-color: rgba(255,77,109,0.38);
        }

        /* ── MAIN ── */
        .adm-main {
          margin-left: var(--sidebar-w);
          flex: 1; display: flex; flex-direction: column; min-height: 100vh;
        }

        .adm-topbar {
          height: 64px; padding: 0 32px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(10,12,15,0.85); backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 40;
        }

        .adm-topbar-left { display: flex; align-items: center; gap: 10px; }

        .adm-breadcrumb {
          font-family: var(--mono); font-size: 11px; color: var(--ts);
        }

        .adm-breadcrumb span { color: var(--tp); font-weight: 600; }

        .adm-topbar-title {
          font-family: var(--display); font-size: 18px; font-weight: 700;
          color: var(--tp); letter-spacing: -0.01em;
        }

        .adm-topbar-divider {
          width: 1px; height: 20px; background: var(--border); margin: 0 4px;
        }

        .adm-status-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid var(--border); background: var(--aglow);
          font-family: var(--mono); font-size: 11px; color: var(--accent);
        }

        .adm-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
          animation: admPulse 2s ease infinite;
        }

        @keyframes admPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,210,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(0,255,210,0); }
        }

        /* Badge pulse animation */
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,77,109,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(255,77,109,0); }
        }

        .adm-content { padding: 32px; flex: 1; }

        .adm-page-eyebrow {
          font-family: var(--mono); font-size: 10px; color: var(--accent);
          letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px;
        }

        .adm-page-title {
          font-family: var(--display); font-size: 26px; font-weight: 800;
          color: var(--tp); letter-spacing: -0.02em; margin-bottom: 4px;
        }

        .adm-page-sub {
          font-family: var(--mono); font-size: 12px; color: var(--ts);
          margin-bottom: 32px;
        }

        .adm-section-label {
          font-family: var(--mono); font-size: 10px; color: var(--ts);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }

        .adm-section-label::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .adm-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px;
        }

        .adm-loading {
          display: flex; align-items: center; justify-content: center;
          height: 300px; flex-direction: column; gap: 16px;
        }

        .adm-spinner {
          width: 32px; height: 32px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%; animation: admSpin 0.8s linear infinite;
        }

        @keyframes admSpin { to { transform: rotate(360deg); } }

        .adm-error {
          padding: 16px 20px;
          background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.25);
          border-radius: 12px;
          font-family: var(--mono); font-size: 13px; color: var(--danger);
          margin-bottom: 24px;
        }

        .adm-hamburger {
          display: none;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          color: var(--ts);
          font-size: 18px;
          line-height: 1;
          transition: all 0.2s;
          margin-right: 12px;
        }
        .adm-hamburger:hover { border-color: rgba(0,255,210,0.3); color: var(--accent); }

        .adm-drawer-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 60;
          backdrop-filter: blur(4px);
          animation: backdropIn 0.2s ease;
        }
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }

        .adm-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 260px;
          background: var(--card);
          border-right: 1px solid var(--border);
          flex-direction: column;
          z-index: 70;
          animation: drawerIn 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes drawerIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }

        @media (max-width: 768px) {
          .adm-sidebar { display: none; }
          .adm-main { margin-left: 0; }
          .adm-topbar { padding: 0 16px; }
          .adm-content { padding: 16px; }
          .adm-hamburger { display: flex; align-items: center; justify-content: center; }
          .adm-drawer-backdrop.open { display: block; }
          .adm-drawer.open { display: flex; }
          .adm-status-badge { display: none; }
        }

        @media (max-width: 768px) {
          .adm-content > div { overflow-x: auto; }
        }
      `}</style>

      <div className="adm-layout">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="adm-sidebar">
          <SidebarContent
            currentPage={currentPage}
            user={user}
            onLogout={handleLogout}
            pendingCount={pendingCount}
          />
        </aside>

        {/* ── MOBILE DRAWER BACKDROP ── */}
        <div
          className={`adm-drawer-backdrop ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── MOBILE DRAWER SIDEBAR ── */}
        <aside className={`adm-drawer ${sidebarOpen ? "open" : ""}`}>
          <SidebarContent
            currentPage={currentPage}
            user={user}
            onLogout={handleLogout}
            onNavClick={() => setSidebarOpen(false)}
            pendingCount={pendingCount}
          />
        </aside>

        {/* ── MAIN ── */}
        <main className="adm-main">
          <div className="adm-topbar">
            <div className="adm-topbar-left">
              <button
                className="adm-hamburger"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="Open navigation"
              >
                ☰
              </button>
              <div className="adm-breadcrumb">
                SecureOps / <span>{title}</span>
              </div>
            </div>
            <div className="adm-status-badge">
              <div className="adm-status-dot" />
              System operational
            </div>
          </div>

          <div className="adm-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}