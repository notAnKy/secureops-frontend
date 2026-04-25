import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────
type PageKey = "tasks" | "task-details" | "profile";

interface EmployeeLayoutProps {
  children: React.ReactNode;
  currentPage: PageKey;
  pageTitle?: string;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS: { key: PageKey; icon: string; label: string; to: string }[] = [
  { key: "tasks",   icon: "☑", label: "My Tasks", to: "/employee/tasks"   },
  { key: "profile", icon: "◇", label: "Profile",  to: "/employee/profile" },
];

const PAGE_TITLES: Record<PageKey, string> = {
  "tasks":        "My Tasks",
  "task-details": "Task Details",
  "profile":      "My Profile",
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
        padding: "10px 14px", borderRadius: 10, textDecoration: "none",
        background: active ? "rgba(0,255,210,0.1)" : "transparent",
        border: active ? "1px solid rgba(0,255,210,0.2)" : "1px solid transparent",
        color: active ? "var(--accent)" : "var(--ts)",
        transition: "all 0.2s", marginBottom: 2,
        fontFamily: "var(--mono)", fontSize: 12,
        fontWeight: active ? 600 : 400, letterSpacing: "0.02em",
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
      <div className="emp-sidebar-header">
        <div className="emp-logo-box">⬡</div>
        <div className="emp-logo-text">Secure<span>Ops</span></div>
      </div>

      <nav className="emp-nav">
        <span className="emp-nav-label">Main menu</span>
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

      <div className="emp-profile-section">
        <div className="emp-profile-card">
          <div className="emp-profile-role">◇ Employee</div>
          <div className="emp-profile-name">{user?.prenom} {user?.nom}</div>
          <div className="emp-profile-code">{user?.code}</div>
          <div className="emp-profile-spec">{(user as any)?.specialite ?? ""}</div>
        </div>
        <button className="emp-logout-btn" onClick={onLogout}>
          <span>⏻</span> Sign out
        </button>
      </div>
    </>
  );
}

// ─── EmployeeLayout ───────────────────────────────────────────────────────────
export default function EmployeeLayout({ children, currentPage, pageTitle }: EmployeeLayoutProps) {
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
          --mono:    'JetBrains Mono', monospace;
          --display: 'Syne', sans-serif;
          --sidebar-w: 240px;
        }

        body { background: var(--bg); color: var(--tp); font-family: var(--display); }
        * { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }

        .emp-layout { display: flex; min-height: 100vh; }

        .emp-sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--card); border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
        }

        .emp-sidebar-header {
          padding: 24px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px;
        }

        .emp-logo-box {
          width: 34px; height: 34px; border: 1.5px solid var(--accent);
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 15px; color: var(--accent);
          background: var(--aglow); flex-shrink: 0;
        }

        .emp-logo-text { font-family: var(--display); font-size: 15px; font-weight: 700; color: var(--tp); }
        .emp-logo-text span { color: var(--accent); }

        .emp-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }

        .emp-nav-label {
          font-family: var(--mono); font-size: 9px; color: var(--tm);
          text-transform: uppercase; letter-spacing: 0.12em;
          padding: 0 14px; margin: 16px 0 8px; display: block;
        }

        .emp-profile-section { padding: 16px 12px; border-top: 1px solid var(--border); }

        .emp-profile-card {
          background: var(--card2); border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
        }

        .emp-profile-role {
          font-family: var(--mono); font-size: 9px; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;
        }

        .emp-profile-name {
          font-family: var(--display); font-size: 13px; font-weight: 700;
          color: var(--tp); margin-bottom: 2px;
        }

        .emp-profile-code { font-family: var(--mono); font-size: 11px; color: var(--ts); }

        .emp-profile-spec {
          font-family: var(--mono); font-size: 10px; color: var(--accent);
          opacity: 0.7; margin-top: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .emp-logout-btn {
          width: 100%; padding: 9px 14px;
          background: rgba(255,77,109,0.07);
          border: 1px solid rgba(255,77,109,0.18);
          border-radius: 8px; color: #ff4d6d;
          font-family: var(--mono); font-size: 12px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
          letter-spacing: 0.02em;
        }

        .emp-logout-btn:hover {
          background: rgba(255,77,109,0.14);
          border-color: rgba(255,77,109,0.38);
        }

        .emp-main {
          margin-left: var(--sidebar-w);
          flex: 1; display: flex; flex-direction: column; min-height: 100vh;
        }

        .emp-topbar {
          height: 64px; padding: 0 32px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(10,12,15,0.85); backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 40;
        }

        .emp-topbar-left { display: flex; align-items: center; gap: 10px; }

        .emp-breadcrumb { font-family: var(--mono); font-size: 11px; color: var(--ts); }
        .emp-breadcrumb span { color: var(--tp); font-weight: 600; }

        .emp-status-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid var(--border); background: var(--aglow);
          font-family: var(--mono); font-size: 11px; color: var(--accent);
        }

        .emp-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); animation: empPulse 2s ease infinite;
        }

        @keyframes empPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,210,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(0,255,210,0); }
        }

        .emp-content { padding: 32px; flex: 1; }

        .emp-page-eyebrow {
          font-family: var(--mono); font-size: 10px; color: var(--accent);
          letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 6px;
        }

        .emp-page-title {
          font-family: var(--display); font-size: 26px; font-weight: 800;
          color: var(--tp); letter-spacing: -0.02em; margin-bottom: 4px;
        }

        .emp-page-sub {
          font-family: var(--mono); font-size: 12px; color: var(--ts); margin-bottom: 32px;
        }

        .emp-section-label {
          font-family: var(--mono); font-size: 10px; color: var(--ts);
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }

        .emp-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .emp-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px;
        }

        .emp-loading {
          display: flex; align-items: center; justify-content: center;
          height: 300px; flex-direction: column; gap: 16px;
        }

        .emp-spinner {
          width: 32px; height: 32px; border: 2px solid var(--border);
          border-top-color: var(--accent); border-radius: 50%;
          animation: empSpin 0.8s linear infinite;
        }

        @keyframes empSpin { to { transform: rotate(360deg); } }

        .emp-error {
          padding: 16px 20px; background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.25); border-radius: 12px;
          font-family: var(--mono); font-size: 13px; color: var(--danger);
          margin-bottom: 24px;
        }

        .emp-hamburger {
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
        .emp-hamburger:hover { border-color: rgba(0,255,210,0.3); color: var(--accent); }

        .emp-drawer-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 60;
          backdrop-filter: blur(4px);
          animation: empBackdropIn 0.2s ease;
        }
        @keyframes empBackdropIn { from{opacity:0} to{opacity:1} }

        .emp-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 260px;
          background: var(--card);
          border-right: 1px solid var(--border);
          flex-direction: column;
          z-index: 70;
          animation: empDrawerIn 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes empDrawerIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }

        @media (max-width: 768px) {
          .emp-sidebar { display: none; }
          .emp-main { margin-left: 0; }
          .emp-topbar { padding: 0 16px; }
          .emp-content { padding: 16px; }
          .emp-hamburger { display: flex; align-items: center; justify-content: center; }
          .emp-drawer-backdrop.open { display: block; }
          .emp-drawer.open { display: flex; }
          .emp-status-badge { display: none; }
        }
      `}</style>

      <div className="emp-layout">

        <aside className="emp-sidebar">
          <SidebarContent currentPage={currentPage} user={user} onLogout={handleLogout} />
        </aside>

        <div
          className={`emp-drawer-backdrop ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`emp-drawer ${sidebarOpen ? "open" : ""}`}>
          <SidebarContent currentPage={currentPage} user={user} onLogout={handleLogout} onNavClick={() => setSidebarOpen(false)} />
        </aside>

        <main className="emp-main">
          <div className="emp-topbar">
            <div className="emp-topbar-left">
              <button
                className="emp-hamburger"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label="Open navigation"
              >
                ☰
              </button>
              <div className="emp-breadcrumb">
                SecureOps / <span>{title}</span>
              </div>
            </div>
            <div className="emp-status-badge">
              <div className="emp-status-dot" />
              System operational
            </div>
          </div>

          <div className="emp-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}