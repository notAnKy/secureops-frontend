import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import ChatBot from "./ChatBot";

// ─── Types ────────────────────────────────────────────────────────────────────
type PageKey = "dashboard" | "create-request" | "my-requests" | "profile";

interface ClientLayoutProps {
  children: React.ReactNode;
  currentPage: PageKey;
  pageTitle?: string;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { key: PageKey; icon: string; label: string; to: string }[] = [
  { key: "dashboard",      icon: "⬡",  label: "Dashboard",  to: "/client/dashboard"      },
  { key: "create-request", icon: "＋", label: "New Request", to: "/client/create-request" },
  { key: "my-requests",    icon: "❏",  label: "My Requests", to: "/client/requests"       },
  { key: "profile",        icon: "◇",  label: "Profile",     to: "/client/profile"        },
];

const PAGE_TITLES: Record<PageKey, string> = {
  "dashboard":      "Dashboard",
  "create-request": "New Request",
  "my-requests":    "My Requests",
  "profile":        "My Profile",
};

// ─── Sidebar item ─────────────────────────────────────────────────────────────
function SidebarItem({
  icon, label, to, active, onClick,
}: {
  icon: string; label: string; to: string; active: boolean; onClick?: () => void;
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
      {active && (
        <div style={{
          marginLeft: "auto", width: 5, height: 5,
          borderRadius: "50%", background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
        }} />
      )}
    </Link>
  );
}

// ─── Sidebar content — shared between desktop and mobile drawer ───────────────
function SidebarContent({
  currentPage, user, onLogout, onNavClick,
}: {
  currentPage: PageKey;
  user: ReturnType<typeof authService.getCurrentUser>;
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      <div className="cl-sidebar-header">
        <div className="cl-logo-box">⬡</div>
        <div className="cl-logo-text">Secure<span>Ops</span></div>
      </div>

      <nav className="cl-nav">
        <span className="cl-nav-label">Main menu</span>
        {NAV_ITEMS.map(item => (
          <SidebarItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            to={item.to}
            active={item.key === currentPage}
            onClick={onNavClick}
          />
        ))}
      </nav>

      <div className="cl-profile-section">
        <div className="cl-profile-card">
          <div className="cl-profile-role">◈ Client</div>
          {user?.raisonSociale && (
            <div className="cl-profile-company">{user.raisonSociale}</div>
          )}
          <div className="cl-profile-code">{user?.code ?? "—"}</div>
          <div className="cl-profile-email">{user?.email ?? "—"}</div>
        </div>
        <button className="cl-logout-btn" onClick={onLogout}>
          <span>⏻</span> Sign out
        </button>
      </div>
    </>
  );
}

// ─── ClientLayout ─────────────────────────────────────────────────────────────
export default function ClientLayout({ children, currentPage, pageTitle }: ClientLayoutProps) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        .cl-layout { display: flex; min-height: 100vh; }

        .cl-sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--card); border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
        }

        .cl-sidebar-header {
          padding: 24px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
        }

        .cl-logo-box {
          width: 34px; height: 34px; border: 1.5px solid var(--accent);
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 15px; color: var(--accent);
          background: var(--aglow); flex-shrink: 0;
        }

        .cl-logo-text { font-family: var(--display); font-size: 15px; font-weight: 700; color: var(--tp); }
        .cl-logo-text span { color: var(--accent); }

        .cl-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }

        .cl-nav-label {
          font-family: var(--mono); font-size: 9px; color: var(--tm);
          text-transform: uppercase; letter-spacing: 0.12em;
          padding: 0 14px; margin: 16px 0 8px; display: block;
        }

        .cl-profile-section { padding: 16px 12px; border-top: 1px solid var(--border); }

        .cl-profile-card {
          background: var(--card2); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
        }

        .cl-profile-role {
          font-family: var(--mono); font-size: 9px; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;
        }

        .cl-profile-company {
          font-family: var(--display); font-size: 13px; font-weight: 700;
          color: var(--tp); margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .cl-profile-code { font-family: var(--mono); font-size: 11px; color: var(--ts); }

        .cl-profile-email {
          font-family: var(--mono); font-size: 10px; color: var(--tm);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .cl-logout-btn {
          width: 100%; padding: 9px 14px;
          background: rgba(255,77,109,0.07);
          border: 1px solid rgba(255,77,109,0.18);
          border-radius: 8px; color: #ff4d6d;
          font-family: var(--mono); font-size: 12px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
          letter-spacing: 0.02em;
        }

        .cl-logout-btn:hover {
          background: rgba(255,77,109,0.14);
          border-color: rgba(255,77,109,0.38);
        }

        .cl-main {
          margin-left: var(--sidebar-w);
          flex: 1; display: flex; flex-direction: column; min-height: 100vh;
        }

        .cl-topbar {
          height: 64px; padding: 0 32px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(10,12,15,0.85); backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 40;
        }

        .cl-topbar-left { display: flex; align-items: center; gap: 10px; }

        .cl-breadcrumb { font-family: var(--mono); font-size: 11px; color: var(--ts); }
        .cl-breadcrumb span { color: var(--tp); font-weight: 600; }

        .cl-status-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid var(--border); background: var(--aglow);
          font-family: var(--mono); font-size: 11px; color: var(--accent);
        }

        .cl-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); animation: clPulse 2s ease infinite;
        }

        @keyframes clPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,210,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(0,255,210,0); }
        }

        .cl-content { padding: 32px; flex: 1; }

        .cl-page-eyebrow {
          font-family: var(--mono); font-size: 10px; color: var(--accent);
          letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px;
        }

        .cl-page-title {
          font-family: var(--display); font-size: 26px; font-weight: 800;
          color: var(--tp); letter-spacing: -0.02em; margin-bottom: 4px;
        }

        .cl-page-sub {
          font-family: var(--mono); font-size: 12px; color: var(--ts); margin-bottom: 32px;
        }

        .cl-section-label {
          font-family: var(--mono); font-size: 10px; color: var(--ts);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }

        .cl-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .cl-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px;
        }

        .cl-loading {
          display: flex; align-items: center; justify-content: center;
          height: 300px; flex-direction: column; gap: 16px;
        }

        .cl-spinner {
          width: 32px; height: 32px; border: 2px solid var(--border);
          border-top-color: var(--accent); border-radius: 50%;
          animation: clSpin 0.8s linear infinite;
        }

        @keyframes clSpin { to { transform: rotate(360deg); } }

        .cl-error {
          padding: 16px 20px; background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.25); border-radius: 12px;
          font-family: var(--mono); font-size: 13px; color: var(--danger);
          margin-bottom: 24px;
        }

        .cl-hamburger {
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
        .cl-hamburger:hover { border-color: rgba(0,255,210,0.3); color: var(--accent); }

        .cl-drawer-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 60;
          backdrop-filter: blur(4px);
          animation: clBackdropIn 0.2s ease;
        }
        @keyframes clBackdropIn { from{opacity:0} to{opacity:1} }

        .cl-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 260px;
          background: var(--card);
          border-right: 1px solid var(--border);
          flex-direction: column;
          z-index: 70;
          animation: clDrawerIn 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes clDrawerIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }

        @media (max-width: 768px) {
          .cl-sidebar { display: none; }
          .cl-main { margin-left: 0; }
          .cl-topbar { padding: 0 16px; }
          .cl-content { padding: 16px; }
          .cl-hamburger { display: flex; align-items: center; justify-content: center; }
          .cl-drawer-backdrop.open { display: block; }
          .cl-drawer.open { display: flex; }
          .cl-status-badge { display: none; }
        }
      `}</style>

      <div className="cl-layout">

        <aside className="cl-sidebar">
          <SidebarContent currentPage={currentPage} user={user} onLogout={handleLogout} />
        </aside>

        <div
          className={`cl-drawer-backdrop ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`cl-drawer ${sidebarOpen ? "open" : ""}`}>
          <SidebarContent currentPage={currentPage} user={user} onLogout={handleLogout} onNavClick={() => setSidebarOpen(false)} />
        </aside>

        <main className="cl-main">
          <div className="cl-topbar">
            <div className="cl-topbar-left">
              <button className="cl-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Open navigation">
                ☰
              </button>
              <div className="cl-breadcrumb">
                SecureOps / <span>{title}</span>
              </div>
            </div>
            <div className="cl-status-badge">
              <div className="cl-status-dot" />
              System operational
            </div>
          </div>

          <div className="cl-content">
            {children}
          </div>
        </main>
      </div>
      <ChatBot />
    </>
  );
}