import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";

export default function NotFound() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const isLoggedIn = authService.isAuthenticated();
  const role       = authService.getRole();

  const homePath = () => {
    if (!isLoggedIn)         return "/";
    if (role === "ADMIN")    return "/admin/dashboard";
    if (role === "EMPLOYEE") return "/employee/tasks";
    return "/client/dashboard";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0c0f; }
        .nf-root {
          min-height: 100vh;
          background: #0a0c0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }
        .nf-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,255,210,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,210,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .nf-card {
          position: relative;
          text-align: center;
          max-width: 520px;
          width: 100%;
          animation: nfFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes nfFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: clamp(80px, 15vw, 140px);
          font-weight: 800;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(0,255,210,0.25);
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.04em;
          user-select: none;
        }
        .nf-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #00ffd2;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 16px;
        }
        .nf-title {
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 800;
          color: #e8edf5;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .nf-path {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #3d4a5c;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(0,255,210,0.08);
          border-radius: 8px;
          padding: 8px 16px;
          display: inline-block;
          margin-bottom: 16px;
          word-break: break-all;
          max-width: 100%;
        }
        .nf-desc {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #6b7a8d;
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .nf-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .nf-btn-primary {
          padding: 12px 28px;
          background: #00ffd2;
          color: #0a0c0f;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .nf-btn-primary:hover {
          background: #00ffe5;
          box-shadow: 0 0 24px rgba(0,255,210,0.35);
          transform: translateY(-1px);
        }
        .nf-btn-secondary {
          padding: 12px 28px;
          background: transparent;
          color: #6b7a8d;
          border: 1px solid rgba(0,255,210,0.12);
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nf-btn-secondary:hover {
          border-color: rgba(0,255,210,0.3);
          color: #e8edf5;
        }
        .nf-footer {
          margin-top: 48px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #3d4a5c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .nf-footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(0,255,210,0.3);
        }
      `}</style>

      <div className="nf-root">
        <div className="nf-card">
          <div className="nf-code">404</div>
          <div className="nf-eyebrow">// Page not found</div>
          <h1 className="nf-title">Oops — nothing here</h1>

          <div className="nf-path">{location.pathname}</div>

          <p className="nf-desc">
            The page you're looking for doesn't exist or you don't have
            permission to access it.
          </p>

          <div className="nf-actions">
            <button
              className="nf-btn-primary"
              onClick={() => navigate(homePath())}
            >
              {isLoggedIn ? "Go to dashboard" : "Go home"}
            </button>
            <button
              className="nf-btn-secondary"
              onClick={() => navigate(-1)}
            >
              ← Go back
            </button>
          </div>

          <div className="nf-footer">
            <div className="nf-footer-dot" />
            SecureOps
            <div className="nf-footer-dot" />
            Error 404
            <div className="nf-footer-dot" />
          </div>
        </div>
      </div>
    </>
  );
}