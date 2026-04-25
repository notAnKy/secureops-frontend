import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import api from "@/services/api";
import AdminLayout from "./AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalEmployees: number;
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalServices: number;
}

// ─── Animated stat card ───────────────────────────────────────────────────────
function StatCard({
  label, value, icon, accent = false, delay = 0, sub,
}: {
  label: string; value: number; icon: string;
  accent?: boolean; delay?: number; sub?: string;
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
      background: accent
        ? "linear-gradient(135deg, rgba(0,255,210,0.12) 0%, rgba(0,255,210,0.04) 100%)"
        : "var(--card)",
      border: `1px solid ${accent ? "rgba(0,255,210,0.35)" : "var(--border)"}`,
      borderRadius: 14, padding: "24px 24px 20px",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      position: "relative" as const, overflow: "hidden",
      boxShadow: accent ? "0 0 32px rgba(0,255,210,0.07)" : "none",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: accent ? "radial-gradient(circle, rgba(0,255,210,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0,255,210,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        {sub && (
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "rgba(0,255,210,0.1)", padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em" }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 34, fontWeight: 800, color: accent ? "var(--accent)" : "var(--tp)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>
        {counted}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ stats }: { stats: DashboardStats }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const segments = [
    { label: "Pending",     value: stats.pendingRequests,    color: "#f59e0b" },
    { label: "In Progress", value: stats.inProgressRequests, color: "#00ffd2" },
    { label: "Completed",   value: stats.completedRequests,  color: "#10b981" },
    { label: "Cancelled",   value: stats.cancelledRequests,  color: "#ff4d6d" },
  ];

  const total = stats.totalRequests || 1;
  const SIZE  = 180;
  const R     = 70;
  const STROKE = 22;
  const cx    = SIZE / 2;
  const cy    = SIZE / 2;
  const circ  = 2 * Math.PI * R;

  // Build arc segments
  let cumulativeAngle = -90; // start from top

  const arcs = segments.map(seg => {
    const pct   = seg.value / total;
    const angle = pct * 360;
    const start = cumulativeAngle;
    cumulativeAngle += angle;

    // Convert to radians
    const startRad = (start * Math.PI) / 180;
    const endRad   = ((start + angle) * Math.PI) / 180;

    const x1 = cx + R * Math.cos(startRad);
    const y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(endRad);
    const y2 = cy + R * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    // Don't draw if value is 0
    if (seg.value === 0) return { ...seg, pct, path: null };

    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;

    return { ...seg, pct, path };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      {/* SVG donut */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE}>
          {/* Background circle */}
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE}
          />

          {/* Animated segments using stroke-dasharray trick */}
          {(() => {
            let offset = 0;
            return segments.map((seg, i) => {
              const pct   = seg.value / total;
              const dash  = pct * circ;
              const gap   = circ - dash;
              const currentOffset = offset;
              offset += dash;

              if (seg.value === 0) return null;

              return (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${animated ? dash : 0} ${animated ? gap : circ}`}
                  strokeDashoffset={-(currentOffset) + circ / 4}
                  strokeLinecap="butt"
                  style={{ transition: `stroke-dasharray 1s ease ${i * 100}ms` }}
                />
              );
            });
          })()}

          {/* Center text */}
          <text
            x={cx} y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#e8edf5"
            fontSize={28}
            fontWeight={800}
            fontFamily="'Syne', sans-serif"
          >
            {stats.totalRequests}
          </text>
          <text
            x={cx} y={cy + 16}
            textAnchor="middle"
            fill="#6b7a8d"
            fontSize={9}
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="1"
          >
            TOTAL
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {segments.map(seg => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0, boxShadow: `0 0 6px ${seg.color}60` }} />
              <div style={{ flex: 1, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
                {seg.label}
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--tp)", minWidth: 24, textAlign: "right" as const }}>
                {seg.value}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", minWidth: 34, textAlign: "right" as const }}>
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ stats }: { stats: DashboardStats }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  const bars = [
    { label: "Clients",     value: stats.totalClients,       color: "#818cf8", icon: "🏢" },
    { label: "Employees",   value: stats.totalEmployees,     color: "#00ffd2", icon: "🔍" },
    { label: "Services",    value: stats.totalServices,      color: "#f59e0b", icon: "🛡️" },
    { label: "Pending",     value: stats.pendingRequests,    color: "#f59e0b", icon: "⏳" },
    { label: "In Progress", value: stats.inProgressRequests, color: "#00ffd2", icon: "⚡" },
    { label: "Completed",   value: stats.completedRequests,  color: "#10b981", icon: "✅" },
    { label: "Cancelled",   value: stats.cancelledRequests,  color: "#ff4d6d", icon: "✕"  },
  ];

  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const CHART_H = 140;

  return (
    <div>
      {/* Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: CHART_H, paddingBottom: 0 }}>
        {bars.map((bar, i) => {
          const heightPct = bar.value / maxVal;
          const barH      = animated ? Math.max(4, heightPct * CHART_H) : 4;

          return (
            <div
              key={bar.label}
              style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
              title={`${bar.label}: ${bar.value}`}
            >
              {/* Value label above bar */}
              <div style={{
                fontFamily: "var(--display)", fontSize: 12, fontWeight: 700,
                color: "var(--tp)", opacity: animated ? 1 : 0,
                transition: `opacity 0.4s ease ${i * 80}ms`,
              }}>
                {bar.value}
              </div>

              {/* Bar */}
              <div style={{
                width: "100%", height: barH,
                background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}88 100%)`,
                borderRadius: "4px 4px 0 0",
                transition: `height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`,
                boxShadow: `0 0 12px ${bar.color}40`,
                position: "relative" as const,
                cursor: "default",
              }} />
            </div>
          );
        })}
      </div>

      {/* X-axis line */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 10px" }} />

      {/* Labels */}
      <div style={{ display: "flex", gap: 10 }}>
        {bars.map(bar => (
          <div
            key={bar.label}
            style={{ flex: 1, textAlign: "center" as const, fontFamily: "var(--mono)", fontSize: 8, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.06em", lineHeight: 1.3 }}
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/admin/dashboard/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setError("Failed to load dashboard stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout currentPage="dashboard">

      {/* Page header */}
      <div className="adm-page-eyebrow">// Overview</div>
      <div className="adm-page-title">
        Welcome back, {user?.prenom || user?.code} 👋
      </div>
      <div className="adm-page-sub">
        Here's what's happening across the platform today.
      </div>

      {loading && (
        <div className="adm-loading">
          <div className="adm-spinner" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading stats...</span>
        </div>
      )}

      {error && <div className="adm-error">✕ {error}</div>}

      {stats && (
        <>
          {/* ── Users row ── */}
          <div className="adm-section-label">Platform users</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            <StatCard label="Total Users"  value={stats.totalUsers}     icon="👥" accent delay={0}   />
            <StatCard label="Clients"      value={stats.totalClients}   icon="🏢" delay={80}  />
            <StatCard label="Employees"    value={stats.totalEmployees} icon="🔍" delay={160} />
            <StatCard label="Services"     value={stats.totalServices}  icon="🛡️" delay={240} />
          </div>

          {/* ── Requests row ── */}
          <div className="adm-section-label">Request overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            <StatCard label="Total Requests"  value={stats.totalRequests}      icon="📋" accent delay={300} />
            <StatCard label="Pending"         value={stats.pendingRequests}    icon="⏳" sub="Needs action" delay={380} />
            <StatCard label="In Progress"     value={stats.inProgressRequests} icon="⚡" delay={460} />
            <StatCard label="Completed"       value={stats.completedRequests}  icon="✅" delay={540} />
          </div>

          {/* ── Charts + actions row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            {/* Donut chart — request status breakdown */}
            <div>
              <div className="adm-section-label">Request status breakdown</div>
              <div className="adm-card">
                <DonutChart stats={stats} />
              </div>
            </div>

            {/* Bar chart — platform overview */}
            <div>
              <div className="adm-section-label">Platform overview</div>
              <div className="adm-card">
                <BarChart stats={stats} />
              </div>
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div className="adm-section-label">Quick actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { icon: "👤", label: "Create Employee", sub: "Add a new team member",     to: "/admin/users"    },
              { icon: "🛡️", label: "Add Service",    sub: "Expand service catalog",     to: "/admin/services" },
              { icon: "📋", label: "View Requests",  sub: "Review pending requests",     to: "/admin/requests" },
              { icon: "✅", label: "Assign Tasks",   sub: "Manage task assignments",     to: "/admin/requests" },
            ].map(a => (
              <Link key={a.to + a.label} to={a.to} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, textDecoration: "none",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(0,255,210,0.3)";
                  el.style.background  = "rgba(0,255,210,0.03)";
                  el.style.transform   = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "var(--border)";
                  el.style.background  = "var(--card)";
                  el.style.transform   = "translateY(0)";
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--aglow)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--tp)", marginBottom: 2 }}>{a.label}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{a.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}