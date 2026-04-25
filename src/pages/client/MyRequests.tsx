import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import ClientLayout from "./ClientLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  services: ServiceDTO[];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  PENDING:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending",     icon: "⏳" },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress", icon: "⚡" },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed",   icon: "✅" },
  CANCELLED:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",  label: "Cancelled",   icon: "✕"  },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  HIGH:   { color: "#ff4d6d", label: "High"   },
  MEDIUM: { color: "#f59e0b", label: "Medium" },
  LOW:    { color: "#10b981", label: "Low"    },
};

function StatusBadge({ status }: { status: string | null }) {
  const s = STATUS_CONFIG[status ?? ""] ?? { color: "var(--ts)", bg: "rgba(255,255,255,0.06)", label: status ?? "—", icon: "" };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
      padding: "4px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 5,
      whiteSpace: "nowrap" as const,
    }}>
      <span style={{ fontSize: 11 }}>{s.icon}</span> {s.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string | null }) {
  const p = PRIORITY_CONFIG[priority ?? ""] ?? { color: "var(--tm)", label: priority ?? "—" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 11, color: p.color, fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block", boxShadow: `0 0 6px ${p.color}80` }} />
      {p.label}
    </span>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({ request, index }: { request: DemandeDTO; index: number }) {
  const totalPrice = request.services.reduce((sum, s) => sum + s.prix, 0);

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 24px",
      animation: `fadeUp 0.35s ease ${index * 50}ms both`,
      transition: "border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,210,0.25)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Request ID + date */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", fontWeight: 600, background: "rgba(0,255,210,0.08)", padding: "2px 8px", borderRadius: 6 }}>
              #{request.idDemande}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
              {request.dateSoumission
                ? new Date(request.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "—"}
            </span>
          </div>

          {/* Description */}
          <div style={{
            fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)",
            lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
          }}>
            {request.description ?? <span style={{ color: "var(--tm)" }}>No description provided.</span>}
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge status={request.etat} />
      </div>

      {/* Services chips */}
      {request.services.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 14 }}>
          {request.services.map(s => (
            <span key={s.id} style={{
              fontFamily: "var(--mono)", fontSize: 10,
              padding: "3px 10px", borderRadius: 20,
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              color: "var(--ts)",
            }}>
              {s.nom}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Priority */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Priority</span>
            <PriorityDot priority={request.priorite} />
          </div>

          {/* Deadline */}
          {request.dateLimite && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Deadline</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>
                {new Date(request.dateLimite).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          )}

          {/* Price */}
          {totalPrice > 0 && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Estimate</span>
              <span style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                €{totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* View details button */}
        <Link
          to={`/client/requests/${request.idDemande}`}
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
          View details →
        </Link>
      </div>
    </div>
  );
}

// ─── Main MyRequests ──────────────────────────────────────────────────────────
export default function MyRequests() {
  const [requests, setRequests] = useState<DemandeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<DemandeDTO[]>("/client/requests")
      .then(({ data }) => setRequests(data))
      .catch(() => setError("Failed to load requests."))
      .finally(() => setLoading(false));
  }, []);

  // Counts for filter tabs
  const counts = useMemo(() => ({
    ALL:         requests.length,
    PENDING:     requests.filter(r => r.etat === "PENDING").length,
    IN_PROGRESS: requests.filter(r => r.etat === "IN_PROGRESS").length,
    COMPLETED:   requests.filter(r => r.etat === "COMPLETED").length,
    CANCELLED:   requests.filter(r => r.etat === "CANCELLED").length,
  }), [requests]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== "ALL") list = list.filter(r => r.etat === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.description ?? "").toLowerCase().includes(q) ||
        String(r.idDemande).includes(q) ||
        r.services.some(s => s.nom.toLowerCase().includes(q))
      );
    }
    return list;
  }, [requests, statusFilter, search]);

  const filters: { key: string; label: string }[] = [
    { key: "ALL",         label: "All"         },
    { key: "PENDING",     label: "Pending"     },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED",   label: "Completed"   },
    { key: "CANCELLED",   label: "Cancelled"   },
  ];

  return (
    <ClientLayout currentPage="my-requests">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap" as const, gap: 16 }}>
        <div>
          <div className="cl-page-eyebrow">// My Requests</div>
          <div className="cl-page-title">My Requests</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
            {requests.length} total request{requests.length !== 1 ? "s" : ""}
          </div>
        </div>

        <Link
          to="/client/create-request"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", background: "var(--accent)", color: "#0a0c0f",
            borderRadius: 10, textDecoration: "none",
            fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
            letterSpacing: "0.03em", transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#00ffe5"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(0,255,210,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: 16 }}>+</span> New Request
        </Link>
      </div>

      {/* ── Filter tabs + Search ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 }}>

        {/* Status filter tabs */}
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

        {/* Search */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tm)", fontSize: 13 }}>⌕</span>
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "9px 14px 9px 34px", width: 260,
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--tp)",
              fontFamily: "var(--mono)", fontSize: 12, outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.4)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && <div className="cl-error">✕ {error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="cl-loading">
          <div className="cl-spinner" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading your requests...</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && requests.length === 0 && (
        <div style={{ textAlign: "center" as const, padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📭</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--tp)", marginBottom: 10 }}>
            No requests yet
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)", marginBottom: 28 }}>
            You haven't submitted any security requests yet.<br />Create your first one to get started.
          </div>
          <Link
            to="/client/create-request"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", background: "var(--accent)", color: "#0a0c0f",
              borderRadius: 10, textDecoration: "none",
              fontFamily: "var(--display)", fontSize: 14, fontWeight: 700,
            }}
          >
            Create your first request →
          </Link>
        </div>
      )}

      {/* ── No results from filter ── */}
      {!loading && !error && requests.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center" as const, padding: "48px 24px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
          No requests found{search ? ` matching "${search}"` : ` with status "${statusFilter}"`}.
        </div>
      )}

      {/* ── Request cards ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {filtered.map((request, i) => (
            <RequestCard key={request.idDemande} request={request} index={i} />
          ))}
        </div>
      )}
    </ClientLayout>
  );
}