import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth.service";
import api from "@/services/api";
import EmployeeLayout from "./EmployeeLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeeDTO {
  id: number;
  code: string;
  nom: string | null;
  prenom: string | null;
  specialite: string | null;
}

interface TacheDTO {
  idTache: number;
  description: string;
  statut: string;
  dateDebut: string | null;
  dateFinPrevue: string | null;
  dateFinReelle: string | null;
  demandeId: number;
  employes: EmployeeDTO[];
}

// ─── Task status config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  NOT_STARTED: { color: "#6b7a8d", bg: "rgba(107,122,141,0.1)", label: "Not Started", icon: "○" },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress", icon: "⚡" },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed",   icon: "✅" },
  RESOLVED:    { color: "#818cf8", bg: "rgba(129,140,248,0.1)", label: "Resolved",    icon: "◆" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? { color: "var(--ts)", bg: "rgba(255,255,255,0.06)", label: status, icon: "?" };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
      padding: "4px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      letterSpacing: "0.05em",
      display: "inline-flex", alignItems: "center", gap: 5,
      whiteSpace: "nowrap" as const,
    }}>
      <span>{s.icon}</span> {s.label}
    </span>
  );
}

// ─── Deadline urgency helper ──────────────────────────────────────────────────
function getDeadlineInfo(dateFinPrevue: string | null): { label: string; color: string } | null {
  if (!dateFinPrevue) return null;
  const due = new Date(dateFinPrevue);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: `Overdue by ${Math.abs(diffDays)}d`, color: "#ff4d6d" };
  if (diffDays === 0) return { label: "Due today",                         color: "#ff4d6d" };
  if (diffDays <= 3)  return { label: `Due in ${diffDays}d`,               color: "#f59e0b" };
  if (diffDays <= 7)  return { label: `Due in ${diffDays}d`,               color: "#f59e0b" };
  return { label: due.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), color: "var(--ts)" };
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index }: { task: TacheDTO; index: number }) {
  const s = STATUS_CONFIG[task.statut] ?? STATUS_CONFIG.NOT_STARTED;
  const deadline = getDeadlineInfo(task.dateFinPrevue);
  const isOverdue = task.dateFinPrevue && new Date(task.dateFinPrevue) < new Date() && task.statut !== "COMPLETED" && task.statut !== "RESOLVED";

  return (
    <div style={{
      background: "var(--card)",
      border: `1px solid ${isOverdue ? "rgba(255,77,109,0.25)" : "var(--border)"}`,
      borderRadius: 14, padding: "20px 24px",
      animation: `fadeUp 0.35s ease ${index * 50}ms both`,
      transition: "all 0.2s",
      position: "relative" as const, overflow: "hidden",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isOverdue ? "rgba(255,77,109,0.4)" : "rgba(0,255,210,0.25)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isOverdue ? "rgba(255,77,109,0.25)" : "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Overdue indicator */}
      {isOverdue && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #ff4d6d, transparent)" }} />
      )}

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Task ID + request link */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "rgba(0,255,210,0.08)", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
              Task #{task.idTache}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)" }}>
              Request #{task.demandeId}
            </span>
          </div>

          {/* Description */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)",
            lineHeight: 1.6,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}>
            {task.description}
          </div>
        </div>

        <StatusBadge status={task.statut} />
      </div>

      {/* Dates row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16, flexWrap: "wrap" as const }}>
        {task.dateDebut && (
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Start</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
              {new Date(task.dateDebut).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
        {deadline && (
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Due</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: deadline.color, fontWeight: 600 }}>
              {deadline.label}
            </div>
          </div>
        )}
        {task.dateFinReelle && (
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 2 }}>Completed</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#10b981" }}>
              {new Date(task.dateFinReelle).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Team */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)" }}>Team:</span>
          <div style={{ display: "flex", gap: 4 }}>
            {task.employes.slice(0, 3).map(emp => (
              <div
                title={`${emp.prenom} ${emp.nom}`}
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(0,255,210,0.1)", border: "1px solid rgba(0,255,210,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, color: "var(--accent)",
                }}
              >
                {(emp.prenom?.[0] ?? emp.code[0]).toUpperCase()}
              </div>
            ))}
            {task.employes.length > 3 && (
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 9, color: "var(--ts)" }}>
                +{task.employes.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* View details */}
        <Link
          to={`/employee/tasks/${task.idTache}`}
          style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)",
            textDecoration: "none", padding: "6px 14px",
            border: "1px solid rgba(0,255,210,0.2)", borderRadius: 8,
            background: "rgba(0,255,210,0.06)", transition: "all 0.2s",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.12)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,255,210,0.35)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.06)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,255,210,0.2)"; }}
        >
          View & Update →
        </Link>
      </div>
    </div>
  );
}

// ─── Stat mini card ───────────────────────────────────────────────────────────
function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}80`, flexShrink: 0 }} />
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--tp)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Main MyTasks ─────────────────────────────────────────────────────────────
export default function MyTasks() {
  const user = authService.getCurrentUser();
  const [tasks, setTasks] = useState<TacheDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<TacheDTO[]>("/employee/tasks")
      .then(({ data }) => setTasks(data))
      .catch(() => setError("Failed to load your tasks."))
      .finally(() => setLoading(false));
  }, []);

  // Counts
  const counts = useMemo(() => ({
    ALL:         tasks.length,
    NOT_STARTED: tasks.filter(t => t.statut === "NOT_STARTED").length,
    IN_PROGRESS: tasks.filter(t => t.statut === "IN_PROGRESS").length,
    COMPLETED:   tasks.filter(t => t.statut === "COMPLETED").length,
    RESOLVED:    tasks.filter(t => t.statut === "RESOLVED").length,
  }), [tasks]);

  // Overdue count
  const overdueCount = useMemo(() =>
    tasks.filter(t =>
      t.dateFinPrevue &&
      new Date(t.dateFinPrevue) < new Date() &&
      t.statut !== "COMPLETED" &&
      t.statut !== "RESOLVED"
    ).length,
  [tasks]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "ALL") list = list.filter(t => t.statut === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        String(t.idTache).includes(q) ||
        String(t.demandeId).includes(q)
      );
    }
    return list;
  }, [tasks, statusFilter, search]);

  const filters = [
    { key: "ALL",         label: "All"         },
    { key: "NOT_STARTED", label: "Not Started" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED",   label: "Completed"   },
    { key: "RESOLVED",    label: "Resolved"    },
  ];

  return (
    <EmployeeLayout currentPage="tasks">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="emp-page-eyebrow">// My Work</div>
        <div className="emp-page-title">
          My Tasks
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
          Welcome back, {user?.prenom ?? user?.code} — you have{" "}
          <span style={{ color: counts.IN_PROGRESS > 0 ? "var(--accent)" : "var(--ts)", fontWeight: 600 }}>
            {counts.IN_PROGRESS} task{counts.IN_PROGRESS !== 1 ? "s" : ""} in progress
          </span>
          {overdueCount > 0 && (
            <span style={{ color: "#ff4d6d", fontWeight: 600, marginLeft: 6 }}>
              · {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      {/* ── Mini stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <MiniStat label="Not Started" value={counts.NOT_STARTED} color="#6b7a8d" />
        <MiniStat label="In Progress" value={counts.IN_PROGRESS} color="#00ffd2" />
        <MiniStat label="Completed"   value={counts.COMPLETED}   color="#10b981" />
        <MiniStat label="Resolved"    value={counts.RESOLVED}    color="#818cf8" />
      </div>

      {/* ── Filter tabs + Search ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, flexWrap: "wrap" as const }}>
          {filters.map(f => {
            const active = statusFilter === f.key;
            const sc = STATUS_CONFIG[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: "7px 14px", border: "none", borderRadius: 7,
                  background: active ? (sc ? sc.bg : "rgba(0,255,210,0.1)") : "transparent",
                  color: active ? (sc ? sc.color : "var(--accent)") : "var(--ts)",
                  fontFamily: "var(--mono)", fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                  outline: active ? `1px solid ${sc ? sc.color + "40" : "rgba(0,255,210,0.25)"}` : "none",
                }}
              >
                {f.label}{" "}
                <span style={{ opacity: 0.6, marginLeft: 4 }}>
                  {counts[f.key as keyof typeof counts]}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tm)", fontSize: 13 }}>⌕</span>
          <input
            type="text" placeholder="Search tasks..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "9px 14px 9px 34px", width: 240, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.4)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="emp-error">✕ {error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="emp-loading">
          <div className="emp-spinner" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading your tasks...</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && tasks.length === 0 && (
        <div style={{ textAlign: "center" as const, padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--tp)", marginBottom: 10 }}>
            No tasks assigned yet
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
            When an admin assigns tasks to you they will appear here.
          </div>
        </div>
      )}

      {/* ── No filter results ── */}
      {!loading && !error && tasks.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center" as const, padding: "48px 24px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
          No tasks found{search ? ` matching "${search}"` : ` with status "${statusFilter}"`}.
        </div>
      )}

      {/* ── Task cards ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {filtered.map((task, i) => (
            <TaskCard key={task.idTache} task={task} index={i} />
          ))}
        </div>
      )}
    </EmployeeLayout>
  );
}