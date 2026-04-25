import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import api from "@/services/api";
import ClientLayout from "./ClientLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecentRequest {
  id: number;
  description: string | null;
  etat: string | null;
  priorite: string | null;
  dateSoumission: string | null;
  dateLimite: string | null;
}

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  recentRequests: RecentRequest[];
}

interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ─── Guide steps ──────────────────────────────────────────────────────────────
const GUIDE_STEPS: { refKey: string; title: string; description: string }[] = [
  {
    refKey: "stats",
    title: "Your request stats",
    description: "These 4 cards give you an instant overview of all your security requests — how many are pending, actively in progress, and completed.",
  },
  {
    refKey: "actions",
    title: "Quick actions",
    description: "Jump straight to creating a new request or browsing all your existing ones. Use \"New Request\" to submit a new security service.",
  },
  {
    refKey: "recent",
    title: "Recent requests",
    description: "Your 5 most recent requests appear here. You can see the description, priority, status, and submission date. Click \"View →\" to open the full details and access validated reports.",
  },
  {
    refKey: "account",
    title: "Account details",
    description: "A quick glance at your account info — your user code, email, and company name. Click \"Profile\" in the sidebar to edit this information or change your password.",
  },
];

// ─── Spotlight tour ───────────────────────────────────────────────────────────
function SpotlightTour({
  refs,
  onClose,
}: {
  refs: Record<string, React.RefObject<HTMLDivElement | null>>;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<SpotRect | null>(null);
  const PAD     = 12;
  const current = GUIDE_STEPS[step];
  const total   = GUIDE_STEPS.length;
  const isLast  = step === total - 1;

  const computeSpot = useCallback(() => {
    const el = refs[current.refKey]?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Wait for scroll to finish before measuring
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setSpot({
        top:    rect.top    - PAD,
        left:   rect.left   - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
      });
    }, 450);
  }, [step]);

  useEffect(() => {
    // Always clear spot first — tooltip unmounts, no flash possible
    setSpot(null);
    const t = setTimeout(computeSpot, 60);
    return () => clearTimeout(t);
  }, [computeSpot]);

  useEffect(() => {
    window.addEventListener("resize", computeSpot);
    return () => window.removeEventListener("resize", computeSpot);
  }, [computeSpot]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleNext = () => { if (isLast) { onClose(); return; } setStep(s => s + 1); };
  const handlePrev = () => setStep(s => s - 1);

  // ── Smart tooltip position — always visible on screen ─────────────────────
  const getTooltipPosition = (): React.CSSProperties => {
    if (!spot) return {};

    const TOOLTIP_W   = 320;
    const TOOLTIP_H   = 290;
    const TOOLTIP_GAP = 16;
    const MARGIN      = 16;

    const idealLeft = spot.left + spot.width / 2 - TOOLTIP_W / 2;
    const left = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - TOOLTIP_W - MARGIN));

    const spaceBelow = window.innerHeight - (spot.top + spot.height);
    const spaceAbove = spot.top;

    let top: number;
    if (spaceBelow >= TOOLTIP_H + TOOLTIP_GAP) {
      top = spot.top + spot.height + TOOLTIP_GAP;
    } else if (spaceAbove >= TOOLTIP_H + TOOLTIP_GAP) {
      top = spot.top - TOOLTIP_H - TOOLTIP_GAP;
    } else {
      top = window.innerHeight / 2 - TOOLTIP_H / 2;
    }

    top = Math.max(MARGIN, Math.min(top, window.innerHeight - TOOLTIP_H - MARGIN));

    return { position: "fixed", top, left, width: TOOLTIP_W };
  };

  // ── SVG mask with rounded cutout ─────────────────────────────────────────
  const W = window.innerWidth;
  const H = window.innerHeight;

  const svgMask = spot
    ? `M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z
       M ${spot.left + 12} ${spot.top}
       Q ${spot.left} ${spot.top} ${spot.left} ${spot.top + 12}
       L ${spot.left} ${spot.top + spot.height - 12}
       Q ${spot.left} ${spot.top + spot.height} ${spot.left + 12} ${spot.top + spot.height}
       L ${spot.left + spot.width - 12} ${spot.top + spot.height}
       Q ${spot.left + spot.width} ${spot.top + spot.height} ${spot.left + spot.width} ${spot.top + spot.height - 12}
       L ${spot.left + spot.width} ${spot.top + 12}
       Q ${spot.left + spot.width} ${spot.top} ${spot.left + spot.width - 12} ${spot.top}
       Z`
    : `M 0 0 L ${W} 0 L ${W} ${H} L 0 ${H} Z`;

  return (
    <>
      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes spotIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Clickable backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 179 }}
        onClick={onClose}
      />

      {/* SVG dark overlay — fades in/out via fill transition */}
      <svg
        style={{ position: "fixed", inset: 0, zIndex: 180, pointerEvents: "none" }}
        width={W} height={H}
      >
        <path
          d={svgMask}
          fillRule="evenodd"
          fill={spot ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.4)"}
          style={{ transition: "fill 0.35s ease" }}
        />
        {spot && (
          <rect
            x={spot.left} y={spot.top}
            width={spot.width} height={spot.height}
            rx={12} fill="none"
            stroke="rgba(0,255,210,0.65)" strokeWidth={1.5}
            style={{ animation: "spotIn 0.3s ease" }}
          />
        )}
      </svg>

      {/* Tooltip — only mounted in DOM when spot is ready, so it can NEVER flash at 0,0 */}
      {spot && (
        <div
          style={{
            ...getTooltipPosition(),
            zIndex: 190,
            background: "#0f1218",
            border: "1px solid rgba(0,255,210,0.25)",
            borderRadius: 16,
            padding: "20px 22px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,210,0.06)",
            overflow: "hidden",
            animation: "tooltipIn 0.3s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Accent top line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #00ffd2, rgba(0,255,210,0.1))", borderRadius: "16px 16px 0 0" }} />

          {/* Step label + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em" }}>
              // Step {step + 1} of {total}
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "var(--ts)", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 2, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--tp)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)"}
            >✕</button>
          </div>

          {/* Title */}
          <div style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 800, color: "var(--tp)", letterSpacing: "-0.01em", marginBottom: 10 }}>
            {current.title}
          </div>

          {/* Description */}
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.75, marginBottom: 18 }}>
            {current.description}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 20 : 6, height: 6,
                  borderRadius: 3, border: "none", cursor: "pointer", padding: 0,
                  background: i === step ? "#00ffd2" : i < step ? "rgba(0,255,210,0.35)" : "rgba(255,255,255,0.12)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={handlePrev}
                style={{ flex: 1, padding: "9px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tp)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)"; }}
              >← Back</button>
            )}
            <button
              onClick={handleNext}
              style={{ flex: 2, padding: "9px", background: isLast ? "#00ffd2" : "rgba(0,255,210,0.1)", border: `1px solid ${isLast ? "#00ffd2" : "rgba(0,255,210,0.3)"}`, borderRadius: 8, color: isLast ? "#0a0c0f" : "#00ffd2", fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = isLast ? "#00ffe5" : "rgba(0,255,210,0.18)"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = isLast ? "#00ffd2" : "rgba(0,255,210,0.1)"}
            >
              {isLast ? "Done ✓" : "Next →"}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <div style={{ textAlign: "center" as const, marginTop: 10 }}>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--tm)"}
              >Skip tour</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    PENDING:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending"     },
    IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress" },
    COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed"   },
    CANCELLED:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",  label: "Cancelled"   },
  };
  const s = map[status ?? ""] ?? { color: "var(--ts)", bg: "rgba(255,255,255,0.06)", label: status ?? "—" };
  return (
    <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, letterSpacing: "0.05em", whiteSpace: "nowrap" as const }}>
      {s.label}
    </span>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>—</span>;
  const map: Record<string, { color: string }> = {
    HIGH:   { color: "#ff4d6d" },
    MEDIUM: { color: "#f59e0b" },
    LOW:    { color: "#10b981" },
  };
  const s = map[priority.toUpperCase()] ?? { color: "var(--ts)" };
  return <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: s.color, fontWeight: 600 }}>{priority}</span>;
}

// ─── Animated stat card ───────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent = false, delay = 0, sub }: {
  label: string; value: number; icon: string; accent?: boolean; delay?: number; sub?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [counted, setCounted] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    if (value === 0) { setCounted(0); return; }
    let current = 0;
    const step = Math.max(1, Math.floor(value / 40));
    const t = setInterval(() => {
      current += step;
      if (current >= value) { setCounted(value); clearInterval(t); }
      else setCounted(current);
    }, 20);
    return () => clearInterval(t);
  }, [visible, value]);

  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, rgba(0,255,210,0.12) 0%, rgba(0,255,210,0.04) 100%)" : "var(--card)",
      border: `1px solid ${accent ? "rgba(0,255,210,0.35)" : "var(--border)"}`,
      borderRadius: 14, padding: "24px 24px 20px",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      position: "relative" as const, overflow: "hidden",
      boxShadow: accent ? "0 0 32px rgba(0,255,210,0.07)" : "none",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: accent ? "radial-gradient(circle, rgba(0,255,210,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0,255,210,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        {sub && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "rgba(0,255,210,0.1)", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em" }}>{sub}</span>}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 800, color: accent ? "var(--accent)" : "var(--tp)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>{counted}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

// ─── Client Dashboard ─────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const user = authService.getCurrentUser();
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const refs = {
    stats:   useRef<HTMLDivElement>(null),
    actions: useRef<HTMLDivElement>(null),
    recent:  useRef<HTMLDivElement>(null),
    account: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    api.get<DashboardStats>("/client/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ClientLayout currentPage="dashboard">

      {/* Header + tour button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <div>
          <div className="cl-page-eyebrow">// Overview</div>
          <div className="cl-page-title">
            Welcome back, {user?.raisonSociale ?? user?.prenom ?? user?.code} 👋
          </div>
          <div className="cl-page-sub">
            Here's the current status of your security operations.
          </div>
        </div>

        <button
          onClick={() => setShowGuide(true)}
          title="Start page tour"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", flexShrink: 0, background: "rgba(0,255,210,0.06)", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 10, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", transition: "all 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.14)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.4)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.2)"; }}
        >
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,255,210,0.15)", border: "1px solid rgba(0,255,210,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: 12, fontWeight: 800, lineHeight: 1 }}>?</span>
          Page Tour
        </button>
      </div>

      {loading && (
        <div className="cl-loading">
          <div className="cl-spinner" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading your dashboard...</span>
        </div>
      )}

      {error && <div className="cl-error">✕ {error}</div>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="cl-section-label">Your requests</div>
          <div ref={refs.stats} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
            <StatCard label="Total Requests"  value={stats.totalRequests}      icon="📋" accent delay={0}   />
            <StatCard label="Pending"         value={stats.pendingRequests}    icon="⏳" sub="Awaiting" delay={80}  />
            <StatCard label="In Progress"     value={stats.inProgressRequests} icon="⚡" delay={160} />
            <StatCard label="Completed"       value={stats.completedRequests}  icon="✅" delay={240} />
          </div>

          {/* Quick actions */}
          <div className="cl-section-label">Quick actions</div>
          <div ref={refs.actions} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { icon: "＋", label: "New Request",  sub: "Submit a new security request",   to: "/client/create-request", accent: true  },
              { icon: "📋", label: "My Requests",  sub: "View all your submitted requests", to: "/client/requests",       accent: false },
            ].map((a, i) => (
              <Link key={i} to={a.to} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", background: a.accent ? "linear-gradient(135deg, rgba(0,255,210,0.12) 0%, rgba(0,255,210,0.04) 100%)" : "var(--card)", border: `1px solid ${a.accent ? "rgba(0,255,210,0.3)" : "var(--border)"}`, borderRadius: 12, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(0,255,210,0.35)"; el.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = a.accent ? "rgba(0,255,210,0.3)" : "var(--border)"; el.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: a.accent ? "rgba(0,255,210,0.15)" : "var(--aglow)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: a.accent ? "var(--accent)" : "var(--tp)", marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>{a.sub}</div>
                </div>
                <span style={{ marginLeft: "auto", color: a.accent ? "var(--accent)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 14 }}>→</span>
              </Link>
            ))}
          </div>

          {/* Recent requests */}
          <div className="cl-section-label">Recent requests</div>
          <div ref={refs.recent}>
            {stats.recentRequests.length === 0 ? (
              <div className="cl-card" style={{ textAlign: "center" as const, padding: "48px 24px" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>📭</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>No requests yet</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", marginBottom: 24 }}>Submit your first security request to get started.</div>
                <Link to="/client/create-request" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "var(--accent)", color: "#0a0c0f", borderRadius: 8, textDecoration: "none", fontFamily: "var(--display)", fontSize: 13, fontWeight: 700 }}>Create Request →</Link>
              </div>
            ) : (
              <div className="cl-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 140px 100px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  {["Description", "Priority", "Status", "Submitted", ""].map(h => (
                    <div key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{h}</div>
                  ))}
                </div>
                {stats.recentRequests.map((req, i) => (
                  <div key={req.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 140px 100px", padding: "14px 20px", alignItems: "center", borderBottom: i < stats.recentRequests.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tp)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, paddingRight: 12 }}>
                      {req.description ?? <span style={{ color: "var(--tm)" }}>No description</span>}
                    </div>
                    <PriorityBadge priority={req.priorite} />
                    <StatusBadge status={req.etat} />
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
                      {req.dateSoumission ? new Date(req.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link to={`/client/requests/${req.id}`} style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", textDecoration: "none", padding: "4px 10px", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 6, background: "rgba(0,255,210,0.06)", transition: "all 0.2s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.12)"}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.06)"}
                      >View →</Link>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", textAlign: "center" as const }}>
                  <Link to="/client/requests" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>View all requests →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Account info */}
          <div style={{ marginTop: 28 }}>
            <div className="cl-section-label">Account details</div>
            <div ref={refs.account} className="cl-card">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                {[
                  { label: "User code", value: user?.code          ?? "—" },
                  { label: "Email",     value: user?.email         ?? "—" },
                  { label: "Company",   value: user?.raisonSociale ?? "—" },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)", fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spotlight tour */}
      {showGuide && (
        <SpotlightTour
          refs={refs}
          onClose={() => setShowGuide(false)}
        />
      )}
    </ClientLayout>
  );
}