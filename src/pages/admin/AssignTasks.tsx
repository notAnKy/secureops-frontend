import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import AdminLayout from "./AdminLayout";
import { useToast, ToastContainer } from "@/components/Toast";

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

interface ServiceDTO {
  id: number;
  nom: string;
  type: string | null;
  prix: number;
}

interface DemandeDTO {
  idDemande: number;
  description: string | null;
  etat: string | null;
  priorite: string | null;
  dateSoumission: string | null;
  dateLimite: string | null;
  clientCode: string | null;
  clientRaisonSociale: string | null;
  services: ServiceDTO[];
}

interface RapportDTO {
  idRapport: number;
  contenu: string;
  dateSoumission: string | null;
  estValide: boolean;
  employeCode: string | null;
  employeNom: string | null;
  employePrenom: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  PENDING:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending",     icon: "⏳" },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress", icon: "⚡" },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed",   icon: "✅" },
  CANCELLED:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",  label: "Cancelled",   icon: "✕"  },
};

const TASK_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  NOT_STARTED: { color: "#6b7a8d", bg: "rgba(107,122,141,0.1)", label: "Not Started" },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress" },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed"   },
  RESOLVED:    { color: "#818cf8", bg: "rgba(129,140,248,0.1)", label: "Resolved"    },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  HIGH:   { color: "#ff4d6d", label: "High"   },
  MEDIUM: { color: "#f59e0b", label: "Medium" },
  LOW:    { color: "#10b981", label: "Low"    },
};

// ─── Employee picker modal ────────────────────────────────────────────────────
function EmployeePickerModal({
  taskId,
  alreadyAssigned,
  employees,
  onAssign,
  onClose,
}: {
  taskId: number;
  alreadyAssigned: EmployeeDTO[];
  employees: EmployeeDTO[];
  onAssign: (taskId: number, emp: EmployeeDTO) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [specialiteFilter, setSpecialiteFilter] = useState("ALL");
  const [assigning, setAssigning] = useState<number | null>(null);

  const assignedIds = alreadyAssigned.map(e => e.id);

  // Build unique speciality list from the employees array
  const specialities = useMemo(() => {
    const unique = employees
      .map(e => e.specialite)
      .filter((s): s is string => !!s);
    return Array.from(new Set(unique)).sort();
  }, [employees]);

  // Filter by both speciality chip and search text
  const filtered = employees.filter(e => {
    const matchesSpecialite =
      specialiteFilter === "ALL" || e.specialite === specialiteFilter;

    const q = search.toLowerCase();
    const matchesSearch =
      (e.code ?? "").toLowerCase().includes(q) ||
      (e.nom ?? "").toLowerCase().includes(q) ||
      (e.prenom ?? "").toLowerCase().includes(q) ||
      (e.specialite ?? "").toLowerCase().includes(q);

    return matchesSpecialite && matchesSearch;
  });

  const handleAssign = async (emp: EmployeeDTO) => {
    setAssigning(emp.id);
    try {
      await api.post(`/admin/tasks/${taskId}/assign`, { employeeId: emp.id });
      onAssign(taskId, emp);
    } catch {
      // handle silently
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, backdropFilter: "blur(4px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0f1218",
        border: "1px solid rgba(0,255,210,0.15)",
        borderRadius: 16, width: "100%", maxWidth: 520,
        maxHeight: "80vh", display: "flex", flexDirection: "column",
        animation: "fadeUp 0.2s ease",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "24px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Title row */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)",
                textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
              }}>
                // Assign Employee
              </div>
              <div style={{
                fontFamily: "var(--display)", fontSize: 18,
                fontWeight: 700, color: "var(--tp)",
              }}>
                Pick a specialist
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none",
                color: "var(--ts)", fontSize: 20, cursor: "pointer", padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: "var(--tm)", fontSize: 13,
            }}>
              ⌕
            </span>
            <input
              type="text"
              placeholder="Search by name, code or speciality..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "10px 14px 10px 34px",
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--tp)",
                fontFamily: "var(--mono)", fontSize: 12, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* ── NEW: Speciality filter chips ── */}
          {specialities.length > 0 && (
            <div style={{
              display: "flex", gap: 6,
              flexWrap: "wrap",
            }}>
              {/* "All" chip */}
              <button
                onClick={() => setSpecialiteFilter("ALL")}
                style={{
                  padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                  fontFamily: "var(--mono)", fontSize: 10,
                  fontWeight: specialiteFilter === "ALL" ? 600 : 400,
                  background: specialiteFilter === "ALL"
                    ? "rgba(0,255,210,0.15)"
                    : "transparent",
                  color: specialiteFilter === "ALL"
                    ? "var(--accent)"
                    : "var(--ts)",
                  border: specialiteFilter === "ALL"
                    ? "1px solid rgba(0,255,210,0.35)"
                    : "1px solid var(--border)",
                  transition: "all 0.15s",
                }}
              >
                All ({employees.length})
              </button>

              {/* One chip per unique speciality */}
              {specialities.map(spec => {
                const count = employees.filter(e => e.specialite === spec).length;
                const active = specialiteFilter === spec;
                return (
                  <button
                    key={spec}
                    onClick={() => setSpecialiteFilter(active ? "ALL" : spec)}
                    style={{
                      padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                      fontFamily: "var(--mono)", fontSize: 10,
                      fontWeight: active ? 600 : 400,
                      background: active
                        ? "rgba(0,255,210,0.15)"
                        : "transparent",
                      color: active ? "var(--accent)" : "var(--ts)",
                      border: active
                        ? "1px solid rgba(0,255,210,0.35)"
                        : "1px solid var(--border)",
                      transition: "all 0.15s",
                    }}
                  >
                    {spec} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Employee list ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: "32px 24px", textAlign: "center",
              fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)",
            }}>
              No employees found
              {specialiteFilter !== "ALL"
                ? ` with speciality "${specialiteFilter}"`
                : search
                  ? ` matching "${search}"`
                  : ""}.
            </div>
          ) : (
            filtered.map(emp => {
              const isAssigned = assignedIds.includes(emp.id);
              const isLoading = assigning === emp.id;

              return (
                <div
                  key={emp.id}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 24px", transition: "background 0.15s",
                    background: isAssigned ? "rgba(0,255,210,0.04)" : "transparent",
                  }}
                  onMouseEnter={e => {
                    if (!isAssigned)
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={e => {
                    if (!isAssigned)
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  {/* Employee info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isAssigned
                        ? "rgba(0,255,210,0.15)"
                        : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isAssigned ? "rgba(0,255,210,0.3)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
                      color: isAssigned ? "var(--accent)" : "var(--ts)",
                      flexShrink: 0,
                    }}>
                      {(emp.prenom?.[0] ?? emp.code[0]).toUpperCase()}
                    </div>

                    <div>
                      <div style={{
                        fontFamily: "var(--display)", fontSize: 13,
                        fontWeight: 700, color: "var(--tp)", marginBottom: 2,
                      }}>
                        {emp.prenom} {emp.nom}
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 10,
                          color: "var(--ts)", fontWeight: 400, marginLeft: 8,
                        }}>
                          {emp.code}
                        </span>
                      </div>
                      {emp.specialite && (
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 10,
                          color: "var(--accent)",
                          background: "rgba(0,255,210,0.08)",
                          padding: "1px 7px", borderRadius: 20,
                        }}>
                          {emp.specialite}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assign button or assigned label */}
                  {isAssigned ? (
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 11,
                      color: "var(--accent)", fontWeight: 600,
                    }}>
                      ✓ Assigned
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssign(emp)}
                      disabled={isLoading}
                      style={{
                        padding: "6px 14px",
                        background: "rgba(0,255,210,0.08)",
                        border: "1px solid rgba(0,255,210,0.2)",
                        borderRadius: 8, color: "var(--accent)",
                        fontFamily: "var(--mono)", fontSize: 11,
                        cursor: "pointer", transition: "all 0.2s",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.16)"
                      }
                      onMouseLeave={e =>
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.08)"
                      }
                    >
                      {isLoading ? "..." : "Assign →"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)",
          }}>
            {filtered.length} employee{filtered.length !== 1 ? "s" : ""} shown
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--ts)", fontFamily: "var(--mono)",
              fontSize: 12, cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task reports section ─────────────────────────────────────────────────────
function TaskReports({ taskId }: { taskId: number }) {
  const [reports, setReports] = useState<RapportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get<RapportDTO[]>(`/admin/tasks/${taskId}/reports`)
      .then(({ data }) => {
        setReports(data);
        if (data.length > 0) setExpanded(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleValidate = async (reportId: number, validate: boolean) => {
    setValidating(reportId);
    try {
      const endpoint = validate
        ? `/admin/reports/${reportId}/validate`
        : `/admin/reports/${reportId}/invalidate`;
      const { data } = await api.put<RapportDTO>(endpoint);
      setReports(prev => prev.map(r => r.idRapport === reportId ? data : r));
    } catch {
      // silently fail
    } finally {
      setValidating(null);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      marginTop: 16, paddingTop: 16,
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      {/* Expand / collapse header */}
      <button
        onClick={() => setExpanded(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          padding: 0, marginBottom: expanded ? 12 : 0, width: "100%",
        }}
      >
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Reports
        </span>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
          padding: "1px 7px", borderRadius: 20,
          background: reports.length > 0
            ? "rgba(0,255,210,0.1)"
            : "rgba(255,255,255,0.05)",
          color: reports.length > 0 ? "var(--accent)" : "var(--tm)",
        }}>
          {reports.length}
        </span>
        <span style={{
          fontFamily: "var(--mono)", fontSize: 10,
          color: "var(--tm)", marginLeft: "auto",
        }}>
          {reports.length === 0
            ? "No reports yet"
            : expanded ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {/* Report cards */}
      {expanded && reports.map((report, i) => (
        <div
          key={report.idRapport}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${report.estValide ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 10, padding: "14px 16px", marginBottom: 8,
            position: "relative",
            animation: `fadeUp 0.25s ease ${i * 40}ms both`,
          }}
        >
          {/* Green top line for validated */}
          {report.estValide && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, #10b981, transparent)",
              borderRadius: "10px 10px 0 0",
            }} />
          )}

          {/* Report header */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 10, gap: 8,
          }}>
            {/* Employee info */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(0,255,210,0.1)",
                border: "1px solid rgba(0,255,210,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--display)", fontSize: 10,
                fontWeight: 700, color: "var(--accent)", flexShrink: 0,
              }}>
                {(report.employePrenom?.[0] ?? "?").toUpperCase()}
              </div>
              <div>
                <div style={{
                  fontFamily: "var(--display)", fontSize: 11,
                  fontWeight: 700, color: "var(--tp)",
                }}>
                  {report.employePrenom} {report.employeNom}
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: 9,
                    color: "var(--ts)", fontWeight: 400, marginLeft: 6,
                  }}>
                    {report.employeCode}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)" }}>
                  {report.dateSoumission
                    ? new Date(report.dateSoumission).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )
                    : "—"}
                </div>
              </div>
            </div>

            {/* Validate / Invalidate button */}
            <button
              onClick={() => handleValidate(report.idRapport, !report.estValide)}
              disabled={validating === report.idRapport}
              style={{
                padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
                transition: "all 0.2s", flexShrink: 0,
                background: report.estValide
                  ? "rgba(255,77,109,0.08)"
                  : "rgba(16,185,129,0.1)",
                border: report.estValide
                  ? "1px solid rgba(255,77,109,0.25)"
                  : "1px solid rgba(16,185,129,0.3)",
                color: report.estValide ? "#ff4d6d" : "#10b981",
                opacity: validating === report.idRapport ? 0.6 : 1,
              }}
              onMouseEnter={e =>
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLButtonElement).style.opacity =
                  validating === report.idRapport ? "0.6" : "1"
              }
            >
              {validating === report.idRapport
                ? "..."
                : report.estValide
                  ? "✕ Invalidate"
                  : "✓ Validate"}
            </button>
          </div>

          {/* Report content */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)",
            lineHeight: 1.7, whiteSpace: "pre-wrap",
          }}>
            {report.contenu}
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600,
              padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em",
              background: report.estValide
                ? "rgba(16,185,129,0.1)"
                : "rgba(245,158,11,0.1)",
              color: report.estValide ? "#10b981" : "#f59e0b",
            }}>
              {report.estValide ? "✓ Validated" : "⏳ Pending validation"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task, employees, onDelete, onAssign, onUnassign, index, onToast,
}: {
  task: TacheDTO;
  employees: EmployeeDTO[];
  onDelete: (id: number) => void;
  onAssign: (taskId: number, emp: EmployeeDTO) => void;
  onUnassign: (taskId: number, empId: number) => void;
  index: number;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unassigning, setUnassigning] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ts = TASK_STATUS_CONFIG[task.statut] ?? {
    color: "var(--ts)", bg: "rgba(255,255,255,0.06)", label: task.statut,
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    setDeleting(true);
    try {
      await api.delete(`/admin/tasks/${task.idTache}`);
      onDelete(task.idTache);
      onToast(`Task #${task.idTache} deleted successfully`, "success");
    } catch {
      setDeleting(false);
      onToast(`Failed to delete task #${task.idTache}`, "error");
    }
  };

  const handleUnassign = async (empId: number) => {
    setUnassigning(empId);
    try {
      await api.delete(`/admin/tasks/${task.idTache}/assign/${empId}`);
      onUnassign(task.idTache, empId);
      onToast("Employee unassigned successfully", "success");
    } catch {
      setUnassigning(null);
      onToast("Failed to unassign employee", "error");
    }
  };

  return (
    <>
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "20px 24px",
        animation: `fadeUp 0.35s ease ${index * 60}ms both`,
        opacity: deleting ? 0.4 : 1, transition: "opacity 0.3s",
      }}>
        {/* Task header */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 16, gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{
                fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)",
                background: "rgba(0,255,210,0.08)", padding: "2px 8px",
                borderRadius: 6, fontWeight: 600,
              }}>
                Task #{task.idTache}
              </span>
              <span style={{
                fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
                padding: "2px 10px", borderRadius: 20,
                background: ts.bg, color: ts.color, letterSpacing: "0.04em",
              }}>
                {ts.label}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 13,
              color: "var(--tp)", lineHeight: 1.6,
            }}>
              {task.description}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "5px 12px",
              background: confirmDelete
                ? "rgba(255,77,109,0.2)"
                : "rgba(255,77,109,0.07)",
              border: confirmDelete
                ? "1px solid rgba(255,77,109,0.5)"
                : "1px solid rgba(255,77,109,0.2)",
              borderRadius: 6, color: "#ff4d6d",
              fontFamily: "var(--mono)", fontSize: 11,
              cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
              fontWeight: confirmDelete ? 700 : 400,
            }}
            onMouseEnter={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                confirmDelete ? "rgba(255,77,109,0.25)" : "rgba(255,77,109,0.15)"
            }
            onMouseLeave={e =>
              (e.currentTarget as HTMLButtonElement).style.background =
                confirmDelete ? "rgba(255,77,109,0.2)" : "rgba(255,77,109,0.07)"
            }
          >
            {deleting ? "Deleting..." : confirmDelete ? "⚠ Confirm?" : "Delete"}
          </button>
        </div>

        {/* Dates */}
        {(task.dateDebut || task.dateFinPrevue) && (
          <div style={{
            display: "flex", gap: 20, marginBottom: 16,
            padding: "10px 14px", background: "rgba(255,255,255,0.02)",
            borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)",
          }}>
            {task.dateDebut && (
              <div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3,
                }}>
                  Start date
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
                  {new Date(task.dateDebut).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </div>
              </div>
            )}
            {task.dateFinPrevue && (
              <div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3,
                }}>
                  Due date
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
                  {new Date(task.dateFinPrevue).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assigned employees */}
        <div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
          }}>
            Assigned specialists ({task.employes.length})
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {task.employes.length === 0 ? (
              <span style={{
                fontFamily: "var(--mono)", fontSize: 12,
                color: "var(--tm)", fontStyle: "italic",
              }}>
                No specialists assigned yet
              </span>
            ) : (
              task.employes.map(emp => (
                <div
                  key={emp.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px 6px 8px",
                    background: "rgba(0,255,210,0.06)",
                    border: "1px solid rgba(0,255,210,0.15)", borderRadius: 8,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "rgba(0,255,210,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--display)", fontSize: 10,
                    fontWeight: 700, color: "var(--accent)",
                  }}>
                    {(emp.prenom?.[0] ?? emp.code[0]).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "var(--display)", fontSize: 11,
                      fontWeight: 700, color: "var(--tp)",
                    }}>
                      {emp.prenom} {emp.nom}
                    </div>
                    {emp.specialite && (
                      <div style={{
                        fontFamily: "var(--mono)", fontSize: 9,
                        color: "var(--accent)", opacity: 0.7,
                      }}>
                        {emp.specialite}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnassign(emp.id)}
                    disabled={unassigning === emp.id}
                    style={{
                      background: "none", border: "none", color: "var(--tm)",
                      cursor: "pointer", fontSize: 13, padding: "0 2px",
                      lineHeight: 1, transition: "color 0.2s",
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget as HTMLButtonElement).style.color = "#ff4d6d"
                    }
                    onMouseLeave={e =>
                      (e.currentTarget as HTMLButtonElement).style.color = "var(--tm)"
                    }
                    title="Unassign"
                  >
                    {unassigning === emp.id ? "..." : "✕"}
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowPicker(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--ts)", fontFamily: "var(--mono)",
              fontSize: 11, cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.35)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)";
            }}
          >
            + Assign specialist
          </button>
        </div>

        {/* Reports section */}
        <TaskReports taskId={task.idTache} />
      </div>

      {showPicker && (
        <EmployeePickerModal
          taskId={task.idTache}
          alreadyAssigned={task.employes}
          employees={employees}
          onAssign={(taskId, emp) => { onAssign(taskId, emp); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── Create task form ─────────────────────────────────────────────────────────
function CreateTaskForm({
  requestId, onCreated,
}: {
  requestId: number;
  onCreated: (task: TacheDTO) => void;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFinPrevue, setDateFinPrevue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!description.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<TacheDTO>(
        `/admin/requests/${requestId}/tasks`,
        {
          description: description.trim(),
          dateDebut: dateDebut || null,
          dateFinPrevue: dateFinPrevue || null,
        }
      );
      onCreated(data);
      setDescription("");
      setDateDebut("");
      setDateFinPrevue("");
      setOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to create task.";
      setError(typeof msg === "string" ? msg : "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "14px", background: "transparent",
          border: "2px dashed rgba(0,255,210,0.2)", borderRadius: 14,
          color: "var(--ts)", fontFamily: "var(--display)", fontSize: 13,
          fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.45)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.2)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)";
        }}
      >
        <span style={{ fontSize: 18 }}>+</span> Add new task
      </button>
    );
  }

  return (
    <div style={{
      background: "var(--card)", border: "1px solid rgba(0,255,210,0.2)",
      borderRadius: 14, padding: "20px 24px",
      animation: "fadeUp 0.2s ease",
      boxShadow: "0 0 24px rgba(0,255,210,0.04)",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)",
        textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16,
      }}>
        // New task
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7,
          }}>
            Description<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what this task involves..."
            rows={3}
            autoFocus
            style={{
              width: "100%", padding: "10px 14px",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--tp)",
              fontFamily: "var(--mono)", fontSize: 13,
              outline: "none", resize: "vertical", lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7,
            }}>
              Start date{" "}
              <span style={{ color: "var(--tm)", textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </div>
            <input
              type="date" value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px",
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--tp)",
                fontFamily: "var(--mono)", fontSize: 12,
                outline: "none", colorScheme: "dark",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7,
            }}>
              Due date{" "}
              <span style={{ color: "var(--tm)", textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </div>
            <input
              type="date" value={dateFinPrevue}
              onChange={e => setDateFinPrevue(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px",
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--tp)",
                fontFamily: "var(--mono)", fontSize: 12,
                outline: "none", colorScheme: "dark",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", background: "rgba(255,77,109,0.08)",
            border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8,
            fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)",
            marginBottom: 14, display: "flex", gap: 8,
          }}>
            <span>✕</span><span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            style={{
              flex: 1, padding: "10px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--ts)", fontFamily: "var(--mono)",
              fontSize: 12, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!description.trim() || loading}
            style={{
              flex: 2, padding: "10px", background: "var(--accent)",
              color: "#0a0c0f", border: "none", borderRadius: 8,
              fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.04em",
              opacity: (!description.trim() || loading) ? 0.5 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Task →"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main AssignTasks ─────────────────────────────────────────────────────────
export default function AssignTasks() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);

  const [request, setRequest]     = useState<DemandeDTO | null>(null);
  const [tasks, setTasks]         = useState<TacheDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    if (!requestId) return;
    Promise.all([
      api.get<DemandeDTO>(`/admin/requests/${requestId}`),
      api.get<TacheDTO[]>(`/admin/requests/${requestId}/tasks`),
      api.get<EmployeeDTO[]>("/admin/employees"),
    ])
      .then(([reqRes, tasksRes, empsRes]) => {
        setRequest(reqRes.data);
        setTasks(tasksRes.data);
        setEmployees(empsRes.data);
      })
      .catch(() => setError("Failed to load request data."))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleTaskCreated  = (task: TacheDTO) =>
    setTasks(prev => [...prev, task]);

  const handleTaskDeleted  = (taskId: number) =>
    setTasks(prev => prev.filter(t => t.idTache !== taskId));

  const handleAssign = (taskId: number, emp: EmployeeDTO) =>
    setTasks(prev => prev.map(t =>
      t.idTache === taskId ? { ...t, employes: [...t.employes, emp] } : t
    ));

  const handleUnassign = (taskId: number, empId: number) =>
    setTasks(prev => prev.map(t =>
      t.idTache === taskId
        ? { ...t, employes: t.employes.filter(e => e.id !== empId) }
        : t
    ));

  const reqStatus      = STATUS_CONFIG[request?.etat ?? ""];
  const reqPriority    = PRIORITY_CONFIG[request?.priorite ?? ""];
  const totalAssignments = tasks.reduce((sum, t) => sum + t.employes.length, 0);

  return (
    <AdminLayout currentPage="requests">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/admin/requests"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)",
            textDecoration: "none", transition: "color 0.2s",
          }}
          onMouseEnter={e =>
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"
          }
          onMouseLeave={e =>
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--ts)"
          }
        >
          ← Back to Requests
        </Link>
      </div>

      {loading && <div className="adm-loading"><div className="adm-spinner" /></div>}
      {error   && <div className="adm-error">✕ {error}</div>}

      {request && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 320px",
          gap: 24, alignItems: "start",
        }}>

          {/* LEFT: Tasks */}
          <div>
            <div className="adm-page-eyebrow">// Request #{request.idDemande}</div>
            <div className="adm-page-title" style={{ marginBottom: 4 }}>Assign Tasks</div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 12,
              color: "var(--ts)", marginBottom: 28,
            }}>
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} ·{" "}
              {totalAssignments} assignment{totalAssignments !== 1 ? "s" : ""}
            </div>

            <div style={{
              display: "flex", flexDirection: "column", gap: 14, marginBottom: 14,
            }}>
              {tasks.length === 0 && (
                <div style={{
                  padding: "32px 24px", textAlign: "center",
                  fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)",
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 14,
                }}>
                  No tasks yet — create the first one below.
                </div>
              )}
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.idTache}
                  task={task}
                  employees={employees}
                  onDelete={handleTaskDeleted}
                  onAssign={handleAssign}
                  onUnassign={handleUnassign}
                  index={i}
                  onToast={(msg, type) => toast[type](msg)}
                />
              ))}
            </div>

            <CreateTaskForm requestId={requestId} onCreated={handleTaskCreated} />
          </div>

          {/* RIGHT: Request info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="adm-section-label">Request info</div>
              <div className="adm-card">
                {/* Client */}
                <div style={{
                  marginBottom: 14, paddingBottom: 14,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4,
                  }}>
                    Client
                  </div>
                  <div style={{
                    fontFamily: "var(--display)", fontSize: 14,
                    fontWeight: 700, color: "var(--tp)",
                  }}>
                    {request.clientRaisonSociale ?? "—"}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
                    {request.clientCode}
                  </div>
                </div>

                {/* Status + Priority */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  marginBottom: 14, paddingBottom: 14,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4,
                    }}>
                      Status
                    </div>
                    {reqStatus && (
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
                        padding: "3px 10px", borderRadius: 20,
                        background: reqStatus.bg, color: reqStatus.color,
                      }}>
                        {reqStatus.icon} {reqStatus.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4,
                    }}>
                      Priority
                    </div>
                    {reqPriority && (
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: 11,
                        fontWeight: 600, color: reqPriority.color,
                      }}>
                        {reqPriority.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  marginBottom: 14, paddingBottom: 14,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6,
                  }}>
                    Description
                  </div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 12,
                    color: "var(--ts)", lineHeight: 1.6,
                  }}>
                    {request.description ?? (
                      <span style={{ color: "var(--tm)" }}>No description.</span>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
                  }}>
                    Services
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {request.services.map(s => (
                      <div
                        key={s.id}
                        style={{
                          display: "flex", justifyContent: "space-between",
                          fontFamily: "var(--mono)", fontSize: 11,
                        }}
                      >
                        <span style={{ color: "var(--ts)" }}>{s.nom}</span>
                        <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                          €{s.prix.toLocaleString("en", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Available employees */}
            <div>
              <div className="adm-section-label">Available employees</div>
              <div className="adm-card" style={{ padding: "8px 0" }}>
                {employees.length === 0 ? (
                  <div style={{
                    padding: "16px 20px", fontFamily: "var(--mono)",
                    fontSize: 12, color: "var(--tm)",
                  }}>
                    No employees found. Create employees first.
                  </div>
                ) : (
                  employees.map((emp, i) => (
                    <div
                      key={emp.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 20px",
                        borderBottom: i < employees.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: "rgba(0,255,210,0.08)",
                        border: "1px solid rgba(0,255,210,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--display)", fontSize: 11,
                        fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                      }}>
                        {(emp.prenom?.[0] ?? emp.code[0]).toUpperCase()}
                      </div>
                      <div>
                        <div style={{
                          fontFamily: "var(--display)", fontSize: 12,
                          fontWeight: 700, color: "var(--tp)",
                        }}>
                          {emp.prenom} {emp.nom}
                        </div>
                        {emp.specialite && (
                          <div style={{
                            fontFamily: "var(--mono)", fontSize: 10,
                            color: "var(--accent)", opacity: 0.7,
                          }}>
                            {emp.specialite}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}