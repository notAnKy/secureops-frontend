import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import EmployeeLayout from "./EmployeeLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeeDTO {
  id: number;
  code: string;
  nom: string | null;
  prenom: string | null;
  specialite: string | null;
  email: string | null;
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

interface RapportDTO {
  idRapport: number;
  contenu: string;
  dateSoumission: string | null;
  estValide: boolean;
  employeCode: string | null;
  employeNom: string | null;
  employePrenom: string | null;
  tacheId: number | null;
  demandeId: number | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TASK_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started", color: "#6b7a8d", bg: "rgba(107,122,141,0.1)", icon: "○",  desc: "Work hasn't begun yet"        },
  { value: "IN_PROGRESS", label: "In Progress", color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   icon: "⚡", desc: "Currently working on this"    },
  { value: "COMPLETED",   label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.1)",  icon: "✅", desc: "Work is done"                 },
  { value: "RESOLVED",    label: "Resolved",    color: "#818cf8", bg: "rgba(129,140,248,0.1)", icon: "◆", desc: "Fully closed and confirmed"   },
];

// ─── Status update section ────────────────────────────────────────────────────
function StatusUpdater({
  taskId, current, onUpdated,
}: {
  taskId: number; current: string; onUpdated: (newStatus: string) => void;
}) {
  const [selected, setSelected] = useState(current);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = selected !== current;

  const handleSave = async () => {
    if (!hasChanged || loading) return;
    setLoading(true);
    setError(null);
    try {
      await api.put(`/employee/tasks/${taskId}/status`, { statut: selected });
      onUpdated(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update status.";
      setError(typeof msg === "string" ? msg : "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-card">
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 16 }}>
        // Update Status
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
        {TASK_STATUSES.map(s => {
          const isSelected = selected === s.value;
          const isCurrent = current === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelected(s.value)}
              style={{
                padding: "14px 12px", borderRadius: 10,
                background: isSelected ? s.bg : "var(--bg)",
                border: `${isSelected ? "1.5px" : "1px"} solid ${isSelected ? s.color + "60" : "var(--border)"}`,
                cursor: "pointer", textAlign: "left" as const,
                transition: "all 0.2s",
                boxShadow: isSelected ? `0 0 16px ${s.color}15` : "none",
                position: "relative" as const,
              }}
            >
              {isCurrent && !isSelected && (
                <div style={{ position: "absolute", top: 6, right: 8, fontFamily: "var(--mono)", fontSize: 8, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>current</div>
              )}
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: isSelected ? s.color : "var(--tp)", marginBottom: 3 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)" }}>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", marginBottom: 12, display: "flex", gap: 8 }}>
          <span>✕</span><span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanged || loading}
        style={{
          width: "100%", padding: "11px",
          background: hasChanged ? "var(--accent)" : "rgba(255,255,255,0.04)",
          color: hasChanged ? "#0a0c0f" : "var(--tm)",
          border: "none", borderRadius: 8,
          fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
          cursor: hasChanged ? "pointer" : "not-allowed",
          transition: "all 0.2s", letterSpacing: "0.04em",
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (hasChanged) { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,255,210,0.3)"; } }}
        onMouseLeave={e => { if (hasChanged) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; } }}
      >
        {loading ? "Saving..." : saved ? "✓ Saved!" : hasChanged ? "Save Status →" : "No changes"}
      </button>
    </div>
  );
}

// ─── Report card ──────────────────────────────────────────────────────────────
function ReportCard({ report, index }: { report: RapportDTO; index: number }) {
  return (
    <div style={{
      background: "var(--bg)", border: `1px solid ${report.estValide ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
      borderRadius: 12, padding: "16px 20px",
      animation: `fadeUp 0.3s ease ${index * 60}ms both`,
      position: "relative" as const,
    }}>
      {/* Validated indicator */}
      {report.estValide && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10b981, transparent)", borderRadius: "12px 12px 0 0" }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,255,210,0.1)", border: "1px solid rgba(0,255,210,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>
            {(report.employePrenom?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--tp)" }}>
              {report.employePrenom} {report.employeNom}
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", fontWeight: 400, marginLeft: 6 }}>{report.employeCode}</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)" }}>
              {report.dateSoumission
                ? new Date(report.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } as any)
                : "—"}
            </div>
          </div>
        </div>

        {/* Validation status */}
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
          padding: "3px 10px", borderRadius: 20,
          background: report.estValide ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
          color: report.estValide ? "#10b981" : "#f59e0b",
          letterSpacing: "0.05em",
        }}>
          {report.estValide ? "✓ Validated" : "⏳ Pending review"}
        </span>
      </div>

      {/* Content */}
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
        {report.contenu}
      </div>
    </div>
  );
}

// ─── Submit report form ───────────────────────────────────────────────────────
function ReportForm({
  taskId, onSubmitted,
}: {
  taskId: number; onSubmitted: (report: RapportDTO) => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<RapportDTO>(`/employee/tasks/${taskId}/report`, {
        contenu: content.trim(),
      });
      onSubmitted(data);
      setContent("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to submit report.";
      setError(typeof msg === "string" ? msg : "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-card">
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 14 }}>
        // Submit Report
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
            Report content<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe what you did, findings, results, and any recommendations..."
            rows={6}
            style={{
              width: "100%", padding: "12px 14px",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--tp)",
              fontFamily: "var(--mono)", fontSize: 13,
              outline: "none", resize: "vertical" as const, lineHeight: 1.7,
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", marginTop: 5 }}>
            {content.length} characters — be detailed and thorough
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", marginBottom: 12, display: "flex", gap: 8 }}>
            <span>✕</span><span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "#10b981", marginBottom: 12, display: "flex", gap: 8 }}>
            <span>✓</span><span>Report submitted successfully! Waiting for admin validation.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!content.trim() || loading}
          style={{
            width: "100%", padding: "11px",
            background: "var(--accent)", color: "#0a0c0f",
            border: "none", borderRadius: 8,
            fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
            cursor: content.trim() ? "pointer" : "not-allowed",
            letterSpacing: "0.04em",
            opacity: (!content.trim() || loading) ? 0.5 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (content.trim()) { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,255,210,0.3)"; } }}
          onMouseLeave={e => { if (content.trim()) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; } }}
        >
          {loading ? "Submitting..." : "Submit Report →"}
        </button>
      </form>
    </div>
  );
}

// ─── Main TaskDetails ─────────────────────────────────────────────────────────
export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);

  const [task, setTask] = useState<TacheDTO | null>(null);
  const [reports, setReports] = useState<RapportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    Promise.all([
      api.get<TacheDTO>(`/employee/tasks/${taskId}`),
      api.get<RapportDTO[]>(`/employee/tasks/${taskId}/reports`),
    ])
      .then(([taskRes, reportsRes]) => {
        setTask(taskRes.data);
        setReports(reportsRes.data);
      })
      .catch(err => {
        if (err.response?.status === 403) setError("You don't have access to this task.");
        else if (err.response?.status === 404) setError("Task not found.");
        else setError("Failed to load task details.");
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleStatusUpdated = (newStatus: string) => {
    setTask(prev => prev ? { ...prev, statut: newStatus } : prev);
  };

  const handleReportSubmitted = (report: RapportDTO) => {
    setReports(prev => [report, ...prev]);
  };

  const currentStatus = TASK_STATUSES.find(s => s.value === task?.statut);
  const isFinished = task?.statut === "COMPLETED" || task?.statut === "RESOLVED";

  return (
    <EmployeeLayout currentPage="task-details">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/employee/tasks"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--ts)"}
        >
          ← Back to My Tasks
        </Link>
      </div>

      {loading && <div className="emp-loading"><div className="emp-spinner" /></div>}

      {error && (
        <div style={{ textAlign: "center" as const, padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>{error}</div>
          <Link to="/employee/tasks" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>← Go back</Link>
        </div>
      )}

      {task && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: 28 }}>
            <div className="emp-page-eyebrow">// Task Details</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const, marginBottom: 6 }}>
              <div className="emp-page-title" style={{ marginBottom: 0 }}>
                Task #{task.idTache}
              </div>
              {currentStatus && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: currentStatus.bg, color: currentStatus.color, letterSpacing: "0.05em" }}>
                  {currentStatus.icon} {currentStatus.label}
                </span>
              )}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
              Part of Request #{task.demandeId}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>

              {/* Task description */}
              <div>
                <div className="emp-section-label">Task description</div>
                <div className="emp-card">
                  <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)", lineHeight: 1.8 }}>
                    {task.description}
                  </p>

                  {/* Dates */}
                  {(task.dateDebut || task.dateFinPrevue) && (
                    <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {task.dateDebut && (
                        <div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>Start date</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
                            {new Date(task.dateDebut).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                          </div>
                        </div>
                      )}
                      {task.dateFinPrevue && (
                        <div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>Due date</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: new Date(task.dateFinPrevue) < new Date() && !isFinished ? "#ff4d6d" : "var(--ts)", fontWeight: new Date(task.dateFinPrevue) < new Date() && !isFinished ? 600 : 400 }}>
                            {new Date(task.dateFinPrevue).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                            {new Date(task.dateFinPrevue) < new Date() && !isFinished && " — Overdue"}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Reports section */}
              <div>
                <div className="emp-section-label">
                  Reports ({reports.length})
                </div>

                {/* Submit report form */}
                <div style={{ marginBottom: 16 }}>
                  <ReportForm taskId={taskId} onSubmitted={handleReportSubmitted} />
                </div>

                {/* Existing reports */}
                {reports.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center" as const, fontFamily: "var(--mono)", fontSize: 12, color: "var(--tm)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}>
                    No reports submitted yet. Submit your first report above.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                    {reports.map((report, i) => (
                      <ReportCard key={report.idRapport} report={report} index={i} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>

              {/* Status updater */}
              <div>
                <div className="emp-section-label">Task status</div>
                <StatusUpdater
                  taskId={taskId}
                  current={task.statut}
                  onUpdated={handleStatusUpdated}
                />
              </div>

              {/* Team */}
              <div>
                <div className="emp-section-label">Assigned team</div>
                <div className="emp-card" style={{ padding: "8px 0" }}>
                  {task.employes.map((emp, i) => (
                    <div key={emp.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 20px",
                      borderBottom: i < task.employes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,255,210,0.1)", border: "1px solid rgba(0,255,210,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                        {(emp.prenom?.[0] ?? emp.code[0]).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--tp)" }}>
                          {emp.prenom} {emp.nom}
                        </div>
                        {emp.specialite && (
                          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", opacity: 0.7 }}>{emp.specialite}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick info */}
              <div>
                <div className="emp-section-label">Info</div>
                <div className="emp-card" style={{ padding: "4px 20px" }}>
                  {[
                    { label: "Task ID",    value: `#${task.idTache}` },
                    { label: "Request",    value: `#${task.demandeId}` },
                    { label: "Reports",    value: `${reports.length} submitted` },
                    { label: "Validated",  value: `${reports.filter(r => r.estValide).length} / ${reports.length}` },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{row.label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tp)", fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}