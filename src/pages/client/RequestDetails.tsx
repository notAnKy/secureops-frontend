import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/api";
import ClientLayout from "./ClientLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceDTO {
  id: number;
  nom: string;
  type: string | null;
  prix: number;
  description: string | null;
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

interface ClientRapportDTO {
  idRapport: number;
  contenu: string;
  dateSoumission: string | null;
  employePrenom: string | null;
  employeNom: string | null;
  employeSpecialite: string | null;
  tacheId: number | null;
}

// ─── Status config — UNCHANGED ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string; step: number }> = {
  PENDING:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending",     icon: "⏳", step: 0 },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress", icon: "⚡", step: 1 },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed",   icon: "✅", step: 2 },
  CANCELLED:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",  label: "Cancelled",   icon: "✕",  step: -1 },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  HIGH:   { color: "#ff4d6d", label: "High",   icon: "▲" },
  MEDIUM: { color: "#f59e0b", label: "Medium", icon: "◇" },
  LOW:    { color: "#10b981", label: "Low",    icon: "▽" },
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Offensive Security": { bg: "rgba(255,77,109,0.1)",  color: "#ff4d6d" },
  "Assessment":         { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  "Audit":              { bg: "rgba(99,102,241,0.1)",  color: "#818cf8" },
  "Emergency":          { bg: "rgba(239,68,68,0.1)",   color: "#ef4444" },
  "Training":           { bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
  "Consulting":         { bg: "rgba(0,255,210,0.1)",   color: "#00ffd2" },
  "Monitoring":         { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
};

// ─── Status progress bar — UNCHANGED ─────────────────────────────────────────
function StatusProgress({ status }: { status: string | null }) {
  if (status === "CANCELLED") {
    return (
      <div style={{ padding: "16px 20px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--mono)", fontSize: 13, color: "#ff4d6d" }}>
        <span style={{ fontSize: 18 }}>✕</span>
        This request has been cancelled.
      </div>
    );
  }

  const steps = [
    { key: "PENDING",     label: "Submitted",   icon: "📋", desc: "Request received by our team"      },
    { key: "IN_PROGRESS", label: "In Progress",  icon: "⚡", desc: "Specialists assigned and working"  },
    { key: "COMPLETED",   label: "Completed",    icon: "✅", desc: "All tasks resolved"                },
  ];
  const currentStep = STATUS_CONFIG[status ?? ""]?.step ?? 0;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 20, left: 20, right: 20, height: 2, background: "var(--border)", zIndex: 0 }} />
      <div style={{ position: "absolute", top: 20, left: 20, height: 2, width: `${(currentStep / 2) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--adim))", transition: "width 0.8s ease", zIndex: 1 }} />
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
        {steps.map((s, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={s.key} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? (active ? "var(--accent)" : "rgba(0,255,210,0.3)") : "var(--card2)", border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: done && !active ? 14 : 18, transition: "all 0.4s", boxShadow: active ? "0 0 20px rgba(0,255,210,0.4)" : "none" }}>
                {done && !active ? "✓" : s.icon}
              </div>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: done ? "var(--tp)" : "var(--tm)", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", maxWidth: 120, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Info row — UNCHANGED ─────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: valueColor ?? "var(--tp)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ─── NEW: Cancel confirmation modal ──────────────────────────────────────────
function CancelModal({
  requestId, onConfirm, onCancel, loading,
}: {
  requestId: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "var(--card)", border: "1px solid rgba(255,77,109,0.25)",
        borderRadius: 16, padding: "32px", width: "100%", maxWidth: 420,
        animation: "fadeUp 0.2s ease",
      }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>⚠️</div>

        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>
          Cancel this request?
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.7, marginBottom: 20 }}>
          You are about to cancel <strong style={{ color: "var(--tp)" }}>Request #{requestId}</strong>.
          The request will be marked as cancelled and our team will be notified.
        </div>

        {/* Warning note */}
        <div style={{
          padding: "12px 14px", marginBottom: 24,
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <span style={{ flexShrink: 0 }}>ℹ️</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#f59e0b", lineHeight: 1.6 }}>
            Only pending requests can be cancelled. If you need to cancel an in-progress request please contact support.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}
          >
            Keep request
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "11px",
              background: "rgba(255,77,109,0.12)",
              border: "1px solid rgba(255,77,109,0.35)",
              borderRadius: 8, color: "#ff4d6d",
              fontFamily: "var(--mono)", fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600, opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.2)"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.12)"; }}
          >
            {loading ? "Cancelling..." : "Yes, cancel it"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF generator — UNCHANGED ───────────────────────────────────────────────
async function generateReportPDF(request: DemandeDTO, reports: ClientRapportDTO[]) {
  const jsPDFModule = await import(
    // @ts-ignore
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
  ).catch(() => null);

  if (!jsPDFModule && !(window as any).jspdf) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
  if (!jsPDF) { alert("PDF library could not be loaded. Please try again."); return; }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const margin = 20; const contentW = W - margin * 2; let y = 0;
  const DARK = [10, 12, 15] as [number, number, number];
  const ACCENT = [0, 255, 210] as [number, number, number];
  const WHITE = [232, 237, 245] as [number, number, number];
  const MUTED = [107, 122, 141] as [number, number, number];
  const CARD = [15, 18, 24] as [number, number, number];
  const SUCCESS = [16, 185, 129] as [number, number, number];

  doc.setFillColor(...DARK); doc.rect(0, 0, W, 52, "F");
  doc.setFillColor(...ACCENT); doc.setDrawColor(...ACCENT); doc.circle(margin + 8, 18, 7, "F");
  doc.setTextColor(...DARK); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("S", margin + 5.5, 20);
  doc.setTextColor(...WHITE); doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("Secure", margin + 18, 21);
  doc.setTextColor(...ACCENT); doc.text("Ops", margin + 44, 21);
  doc.setTextColor(...MUTED); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Cybersecurity Management Platform", margin + 18, 27);
  doc.setFillColor(...ACCENT); doc.roundedRect(W - margin - 40, 12, 40, 10, 2, 2, "F");
  doc.setTextColor(...DARK); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("SECURITY REPORT", W - margin - 36, 18.5);
  doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4); doc.line(margin, 36, W - margin, 36);
  doc.setTextColor(...MUTED); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  const generatedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Generated: ${generatedDate}`, margin, 43); doc.text(`Request #${request.idDemande}`, W / 2, 43, { align: "center" }); doc.text(`Reports: ${reports.length}`, W - margin, 43, { align: "right" });
  y = 60;
  doc.setFillColor(...CARD); doc.roundedRect(margin, y - 5, contentW, 8, 1, 1, "F");
  doc.setTextColor(...ACCENT); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("// REQUEST DETAILS", margin + 4, y + 0.5); y += 10;
  const col1 = margin; const col2 = margin + contentW / 2 + 2;
  const infoRows = [["Client", request.clientRaisonSociale ?? request.clientCode ?? "—"], ["Status", request.etat ?? "—"], ["Priority", request.priorite ?? "—"], ["Submitted", request.dateSoumission ? new Date(request.dateSoumission).toLocaleDateString("en-GB") : "—"], ["Deadline", request.dateLimite ? new Date(request.dateLimite).toLocaleDateString("en-GB") : "No deadline"], ["Services", `${request.services.length} service${request.services.length !== 1 ? "s" : ""}`]];
  infoRows.forEach(([label, val], i) => { const col = i % 2 === 0 ? col1 : col2; const row = Math.floor(i / 2); const ry = y + row * 10; doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(label.toUpperCase(), col, ry); doc.setTextColor(...WHITE); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(String(val), col, ry + 4.5); });
  y += Math.ceil(infoRows.length / 2) * 10 + 6;
  if (request.description) { doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("DESCRIPTION", margin, y); y += 4; doc.setFillColor(20, 24, 32); const descLines = doc.splitTextToSize(request.description, contentW - 8); const descH = descLines.length * 4.5 + 6; doc.roundedRect(margin, y, contentW, descH, 1, 1, "F"); doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.text(descLines, margin + 4, y + 5); y += descH + 6; }
  if (request.services.length > 0) { doc.setTextColor(...MUTED); doc.setFontSize(7); doc.text("SERVICES REQUESTED", margin, y); y += 5; request.services.forEach(s => { doc.setFillColor(20, 24, 32); doc.roundedRect(margin, y, contentW, 10, 1, 1, "F"); doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text(s.nom, margin + 4, y + 6.5); if (s.type) { doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(s.type, margin + 4 + doc.getTextWidth(s.nom) + 3, y + 6.5); } doc.setTextColor(...ACCENT); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text(`€${s.prix.toLocaleString("en", { minimumFractionDigits: 2 })}`, W - margin - 4, y + 6.5, { align: "right" }); y += 12; }); const total = request.services.reduce((sum, s) => sum + s.prix, 0); doc.setFillColor(...DARK); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3); doc.roundedRect(margin, y, contentW, 10, 1, 1, "FD"); doc.setTextColor(...ACCENT); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("TOTAL ESTIMATE", margin + 4, y + 6.5); doc.setFontSize(10); doc.text(`€${total.toLocaleString("en", { minimumFractionDigits: 2 })}`, W - margin - 4, y + 6.5, { align: "right" }); y += 16; }
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFillColor(...CARD); doc.roundedRect(margin, y - 5, contentW, 8, 1, 1, "F"); doc.setTextColor(...ACCENT); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text(`// VALIDATED REPORTS (${reports.length})`, margin + 4, y + 0.5); y += 12;
  if (reports.length === 0) { doc.setFillColor(20, 24, 32); doc.roundedRect(margin, y, contentW, 14, 1, 1, "F"); doc.setTextColor(...MUTED); doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.text("No validated reports available for this request.", margin + 4, y + 9); y += 20; }
  else { reports.forEach((report, idx) => { const contentLines = doc.splitTextToSize(report.contenu, contentW - 8); const reportH = contentLines.length * 4.5 + 32; if (y + reportH > 270) { doc.addPage(); y = 20; } doc.setFillColor(15, 20, 28); doc.setDrawColor(...SUCCESS); doc.setLineWidth(0.3); doc.roundedRect(margin, y, contentW, reportH, 2, 2, "FD"); doc.setFillColor(...SUCCESS); doc.roundedRect(margin, y, contentW, 2, 1, 1, "F"); doc.setFillColor(...DARK); doc.roundedRect(margin + 4, y + 6, 22, 7, 1, 1, "F"); doc.setTextColor(...ACCENT); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text(`REPORT #${idx + 1}`, margin + 5.5, y + 11); doc.setFillColor(...SUCCESS); doc.roundedRect(margin + 30, y + 6, 22, 7, 1, 1, "F"); doc.setTextColor(...DARK); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("✓ VALIDATED", margin + 31.5, y + 11); const empName = `${report.employePrenom ?? ""} ${report.employeNom ?? ""}`.trim() || "Unknown"; doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text(empName, W - margin - 4, y + 11, { align: "right" }); if (report.employeSpecialite) { doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(report.employeSpecialite, W - margin - 4, y + 16, { align: "right" }); } doc.setTextColor(...MUTED); doc.setFontSize(7); const reportDate = report.dateSoumission ? new Date(report.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"; doc.text(`Submitted: ${reportDate}`, margin + 4, y + 22); if (report.tacheId) { doc.text(`Task #${report.tacheId}`, W - margin - 4, y + 22, { align: "right" }); } doc.setDrawColor(30, 40, 55); doc.setLineWidth(0.3); doc.line(margin + 4, y + 25, W - margin - 4, y + 25); doc.setTextColor(200, 210, 220); doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.text(contentLines, margin + 4, y + 30); y += reportH + 8; }); }
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFillColor(...DARK); doc.rect(0, 287, W, 10, "F"); doc.setDrawColor(...ACCENT); doc.setLineWidth(0.3); doc.line(margin, 287, W - margin, 287); doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("SecureOps — Cybersecurity Management Platform", margin, 292); doc.text(`Page ${i} of ${pageCount}`, W - margin, 292, { align: "right" }); doc.text("CONFIDENTIAL", W / 2, 292, { align: "center" }); }
  doc.save(`SecureOps-Report-Request${request.idDemande}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Reports section — UNCHANGED ─────────────────────────────────────────────
function ReportsSection({ requestId, request }: { requestId: string; request: DemandeDTO }) {
  const [reports, setReports] = useState<ClientRapportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get<ClientRapportDTO[]>(`/client/requests/${requestId}/reports`)
      .then(({ data }) => setReports(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleDownload = async () => {
    setDownloading(true);
    try { await generateReportPDF(request, reports); }
    finally { setDownloading(false); }
  };

  if (loading) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="cl-section-label" style={{ marginBottom: 0, flex: 1 }}>
          Validated reports ({reports.length})
        </div>
        <button onClick={handleDownload} disabled={downloading} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", marginLeft: 16, background: downloading ? "rgba(0,255,210,0.06)" : "var(--accent)", color: downloading ? "var(--accent)" : "#0a0c0f", border: downloading ? "1px solid rgba(0,255,210,0.2)" : "none", borderRadius: 8, cursor: downloading ? "not-allowed" : "pointer", fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, transition: "all 0.2s", whiteSpace: "nowrap" as const, opacity: downloading ? 0.7 : 1 }} onMouseEnter={e => { if (!downloading) { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,255,210,0.3)"; } }} onMouseLeave={e => { if (!downloading) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; } }}>
          {downloading ? (<><span style={{ display: "inline-block", width: 12, height: 12, border: "1.5px solid rgba(0,255,210,0.3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Generating PDF...</>) : (<><span style={{ fontSize: 14 }}>⬇</span> Download PDF</>)}
        </button>
      </div>
      {reports.length === 0 ? (
        <div className="cl-card" style={{ textAlign: "center" as const, padding: "32px 24px" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Validated reports from our specialists will appear here once the work is completed and reviewed.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {reports.map((report, i) => (
            <div key={report.idRapport} style={{ background: "var(--card)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "20px 24px", position: "relative" as const, overflow: "hidden", animation: `fadeUp 0.35s ease ${i * 60}ms both` }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #10b981, transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap" as const, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "#10b981", flexShrink: 0 }}>{(report.employePrenom?.[0] ?? "?").toUpperCase()}</div>
                  <div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: "var(--tp)", marginBottom: 2 }}>{report.employePrenom} {report.employeNom}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {report.employeSpecialite && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#10b981", background: "rgba(16,185,129,0.08)", padding: "1px 7px", borderRadius: 20 }}>{report.employeSpecialite}</span>}
                      {report.tacheId && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)" }}>Task #{report.tacheId}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>{report.dateSoumission ? new Date(report.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10b981", letterSpacing: "0.05em" }}>✓ Validated</span>
                </div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.8, whiteSpace: "pre-wrap" as const, padding: "14px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>{report.contenu}</div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main RequestDetails ──────────────────────────────────────────────────────
export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<DemandeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── NEW: cancel state ────────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading]     = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<DemandeDTO>(`/client/requests/${id}`)
      .then(({ data }) => setRequest(data))
      .catch(err => {
        if (err.response?.status === 404) setError("Request not found.");
        else if (err.response?.status === 403) setError("You don't have access to this request.");
        else setError("Failed to load request details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ─── NEW: handle cancel ───────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!id) return;
    setCancelLoading(true);
    try {
      const { data } = await api.put<DemandeDTO>(`/client/requests/${id}/cancel`);
      setRequest(data);          // update local state — status becomes CANCELLED
      setShowCancelModal(false);
    } catch {
      setShowCancelModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  const totalPrice = request?.services.reduce((sum, s) => sum + s.prix, 0) ?? 0;
  const status = STATUS_CONFIG[request?.etat ?? ""];
  const priority = PRIORITY_CONFIG[request?.priorite ?? ""];

  return (
    <ClientLayout currentPage="my-requests">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Back link — UNCHANGED */}
      <div style={{ marginBottom: 24 }}>
        <Link to="/client/requests" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--ts)"}>
          ← Back to My Requests
        </Link>
      </div>

      {/* Loading — UNCHANGED */}
      {loading && (
        <div className="cl-loading">
          <div className="cl-spinner" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading request details...</span>
        </div>
      )}

      {/* Error — UNCHANGED */}
      {error && (
        <div style={{ textAlign: "center" as const, padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>{error}</div>
          <Link to="/client/requests" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>← Go back to requests</Link>
        </div>
      )}

      {request && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>

          {/* ── Page header — cancel button added ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap" as const, gap: 16 }}>
            <div>
              <div className="cl-page-eyebrow">// Request Details</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                <div className="cl-page-title" style={{ marginBottom: 0 }}>Request #{request.idDemande}</div>
                {status && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: status.bg, color: status.color, letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {status.icon} {status.label}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", marginTop: 6 }}>
                Submitted on {request.dateSoumission ? new Date(request.dateSoumission).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "—"}
              </div>
            </div>

            {/* ── NEW: Cancel button — only shown when PENDING ── */}
            {request.etat === "PENDING" && (
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 18px",
                  background: "rgba(255,77,109,0.07)",
                  border: "1px solid rgba(255,77,109,0.25)",
                  borderRadius: 10, cursor: "pointer",
                  fontFamily: "var(--mono)", fontSize: 12,
                  color: "#ff4d6d", fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.15)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,77,109,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.07)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,77,109,0.25)"; }}
              >
                <span>✕</span> Cancel Request
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

            {/* LEFT COLUMN — UNCHANGED */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
              <div>
                <div className="cl-section-label">Request status</div>
                <div className="cl-card"><StatusProgress status={request.etat} /></div>
              </div>
              <div>
                <div className="cl-section-label">Description</div>
                <div className="cl-card">
                  <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)", lineHeight: 1.8 }}>
                    {request.description ?? <span style={{ color: "var(--tm)" }}>No description provided.</span>}
                  </p>
                </div>
              </div>
              <div>
                <div className="cl-section-label">Selected services</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  {request.services.length === 0 ? (
                    <div className="cl-card" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tm)" }}>No services attached to this request.</div>
                  ) : (
                    request.services.map(s => {
                      const c = TYPE_COLORS[s.type ?? ""] ?? { bg: "rgba(255,255,255,0.04)", color: "var(--ts)" };
                      return (
                        <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                              {s.type && <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.color, letterSpacing: "0.05em" }}>{s.type}</span>}
                              <span style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>{s.nom}</span>
                            </div>
                            {s.description && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", lineHeight: 1.6 }}>{s.description}</div>}
                          </div>
                          <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>€{s.prix.toLocaleString("en", { minimumFractionDigits: 2 })}</div>
                        </div>
                      );
                    })
                  )}
                </div>
                {request.services.length > 0 && (
                  <div style={{ marginTop: 10, padding: "14px 20px", background: "rgba(0,255,210,0.06)", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Total estimate</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>€{totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              <ReportsSection requestId={id!} request={request} />
            </div>

            {/* RIGHT COLUMN — UNCHANGED */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
              <div>
                <div className="cl-section-label">Details</div>
                <div className="cl-card" style={{ padding: "4px 20px" }}>
                  <InfoRow label="Status"    value={status ? `${status.icon} ${status.label}` : "—"}   valueColor={status?.color} />
                  <InfoRow label="Priority"  value={priority ? `${priority.icon} ${priority.label}` : "—"} valueColor={priority?.color} />
                  <InfoRow label="Submitted" value={request.dateSoumission ? new Date(request.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
                  <InfoRow label="Deadline"  value={request.dateLimite ? new Date(request.dateLimite).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "No deadline"} valueColor={request.dateLimite ? undefined : "var(--tm)"} />
                  <InfoRow label="Services"  value={`${request.services.length} service${request.services.length !== 1 ? "s" : ""}`} />
                  <div style={{ padding: "12px 0" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Total estimate</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>€{totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="cl-section-label">What's next</div>
                <div className="cl-card">
                  {[
                    { icon: "👁️", title: "Review",    desc: "Our admin team reviews your request"   },
                    { icon: "👥", title: "Assignment", desc: "Specialists are assigned to your case" },
                    { icon: "🔍", title: "Execution",  desc: "Work begins on your security tasks"    },
                    { icon: "📄", title: "Report",     desc: "You receive a full security report"    },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--aglow)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--tp)", marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cl-card" style={{ textAlign: "center" as const, padding: "20px" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>💬</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>Need help?</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", lineHeight: 1.6, marginBottom: 14 }}>If you have questions about this request, our team is here to help.</div>
                <Link to="/client/create-request" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--aglow)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", textDecoration: "none", transition: "all 0.2s" }}>
                  Submit another request →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: Cancel modal ── */}
      {showCancelModal && request && (
        <CancelModal
          requestId={request.idDemande}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelModal(false)}
          loading={cancelLoading}
        />
      )}
    </ClientLayout>
  );
}