"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Activity, FlaskConical,
  Brain, Leaf, Pill, AlertTriangle, Download,
  CheckCircle2, TrendingUp, TrendingDown, Minus, Loader2
} from "lucide-react";
import { supabase } from "../../../lib/superbaseClient";

type NormalRange = { min: number; max: number } | string | null;

type Parameter = {
  name:         string;
  value:        number | string;
  unit:         string;
  status:       string;
  normal_range?: NormalRange;
};

type ReportData = {
  report: { name: string; date: string; status: "Normal" | "Medium" | "High" };
  parameters:      Parameter[];
  nlp_explanation: string[];
  recommendations: { lifestyle: string[]; non_prescription: string[] };
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatNormalRange(range: NormalRange): string {
  if (!range) return "—";
  if (typeof range === "string") return range;
  if (typeof range === "object" && "min" in range && "max" in range) return `${range.min} – ${range.max}`;
  return "—";
}

function SeverityBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    Normal: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    Medium: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
    High:   { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500"     },
  };
  const s = cfg[status] ?? cfg.Normal;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {status}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "high") return <TrendingUp   size={14} className="text-red-500" />;
  if (s === "low")  return <TrendingDown size={14} className="text-amber-500" />;
  return                    <Minus       size={14} className="text-emerald-500" />;
}

function StatusCell({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cfg = s === "high" ? "bg-red-50 text-red-700" : s === "low" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg}`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [data,       setData]       = useState<ReportData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/login"); return; }
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API_BASE}/report/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to load report"); }
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  // ── Proper text-based PDF ───────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!data) return;
    setPdfLoading(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W        = 210;
      const margin   = 18;
      const contentW = W - margin * 2;
      let   y        = 0;

      // ── Helpers ──────────────────────────────────────────────────────
      const newPage = () => { doc.addPage(); y = margin; };
      const checkY  = (needed = 10) => { if (y + needed > 275) newPage(); };

      const sectionTitle = (title: string) => {
        checkY(14);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(margin, y, contentW, 9, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.text(title, margin + 4, y + 6);
        y += 13;
      };

      const bodyText = (text: string, indent = 0, color: [number,number,number] = [51,65,85]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentW - indent);
        lines.forEach((line: string) => {
          checkY(6);
          doc.text(line, margin + indent, y);
          y += 5.5;
        });
      };

      const pill = (text: string, x: number, py: number, bg: [number,number,number], fg: [number,number,number]) => {
        const w = doc.getTextWidth(text) + 6;
        doc.setFillColor(...bg);
        doc.roundedRect(x, py - 3.5, w, 5.5, 1.5, 1.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...fg);
        doc.text(text, x + 3, py);
        return w;
      };

      // ── HEADER ────────────────────────────────────────────────────────
      y = margin;

      // Top bar
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, W, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("HealthAI", margin, 9.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Medical Report Analysis", margin + 30, 9.5);
      y = 22;

      // Report name
      const cleanName = data.report.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanName.toUpperCase(), margin, y);
      y += 7;

      // Date + severity on same line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${formatDate(data.report.date)}`, margin, y);

      const sev = data.report.status;
      const sevColor: [number,number,number] =
        sev === "High"   ? [220, 38, 38]  :
        sev === "Medium" ? [217, 119, 6]  : [5, 150, 105];
      const sevBg: [number,number,number] =
        sev === "High"   ? [254, 226, 226] :
        sev === "Medium" ? [254, 243, 199] : [209, 250, 229];
      pill(`Severity: ${sev}`, W - margin - 35, y, sevBg, sevColor);
      y += 8;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, W - margin, y);
      y += 8;

      // ── PARAMETERS TABLE ─────────────────────────────────────────────
      sectionTitle("EXTRACTED PARAMETERS");

      // Table header
      const cols = [60, 30, 45, 37];
      const headers = ["Parameter", "Value", "Normal Range", "Status"];
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let cx = margin + 3;
      headers.forEach((h, i) => { doc.text(h, cx, y + 5); cx += cols[i]; });
      y += 8;

      // Table rows
      data.parameters.forEach((p, idx) => {
        checkY(8);
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 1, contentW, 7.5, "F");
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        cx = margin + 3;
        doc.text(p.name.replace(/_/g, " "), cx, y + 4.5); cx += cols[0];

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`${p.value} ${p.unit}`, cx, y + 4.5); cx += cols[1];
        doc.text(formatNormalRange(p.normal_range ?? null), cx, y + 4.5); cx += cols[2];

        // Status pill
        const st = p.status.toLowerCase();
        const stBg: [number,number,number]  = st === "high" ? [254,226,226] : st === "low" ? [254,243,199] : [209,250,229];
        const stFg: [number,number,number]  = st === "high" ? [185,28,28]   : st === "low" ? [180,83,9]    : [6,95,70];
        pill(p.status.charAt(0).toUpperCase() + p.status.slice(1), cx, y + 4.5, stBg, stFg);
        y += 7.5;
      });

      // Border around table
      doc.setDrawColor(226, 232, 240);
      y += 4;

      // ── NLP EXPLANATION ───────────────────────────────────────────────
      sectionTitle("AI EXPLANATION");
      data.nlp_explanation.forEach((line, i) => {
        checkY(8);
        doc.setFillColor(245, 243, 255);
        doc.circle(margin + 2.5, y + 1.5, 1.5, "F");
        bodyText(`${line}`, 7);
      });
      y += 4;

      // ── LIFESTYLE TIPS ────────────────────────────────────────────────
      sectionTitle("LIFESTYLE RECOMMENDATIONS");
      data.recommendations.lifestyle.forEach((tip) => {
        checkY(8);
        doc.setFillColor(16, 185, 129);
        doc.circle(margin + 2.5, y + 1.5, 1.5, "F");
        bodyText(tip, 7, [15, 23, 42]);
      });
      y += 4;

      // ── NON-PRESCRIPTION ──────────────────────────────────────────────
      sectionTitle("NON-PRESCRIPTION SUGGESTIONS");
      const items = data.recommendations.non_prescription;
      let px = margin;
      items.forEach((item) => {
        checkY(10);
        const w = doc.getTextWidth(item) + 8;
        if (px + w > W - margin) { px = margin; y += 8; }
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(px, y - 3, w, 6, 1.5, 1.5, "F");
        doc.setDrawColor(252, 211, 77);
        doc.roundedRect(px, y - 3, w, 6, 1.5, 1.5, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text(item, px + 4, y + 1.5);
        px += w + 4;
      });
      y += 12;

      // ── DISCLAIMER ────────────────────────────────────────────────────
      checkY(18);
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(margin, y, contentW, 16, 2, 2, "F");
      doc.setDrawColor(252, 211, 77);
      doc.roundedRect(margin, y, contentW, 16, 2, 2, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text("! Medical Disclaimer", margin + 4, y + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 53, 15);
      const disclaimer = "These suggestions are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional before starting any supplement or making changes to your health routine.";
      const dLines = doc.splitTextToSize(disclaimer, contentW - 8);
      dLines.forEach((dl: string, i: number) => { doc.text(dl, margin + 4, y + 10.5 + i * 4); });
      y += 20;

      // ── FOOTER ────────────────────────────────────────────────────────
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 287, W - margin, 287);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("Generated by HealthAI · For informational purposes only", margin, 292);
        doc.text(`Page ${i} of ${pageCount}`, W - margin - 18, 292);
      }

      const fileName = cleanName.replace(/\s+/g, "_");
      doc.save(`${fileName}_HealthAI_Report.pdf`);

    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading report…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md text-center">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold mb-1">Failed to load report</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 font-semibold hover:text-blue-700">← Go back</button>
      </div>
    </div>
  );

  if (!data) return null;
  const { report, parameters, nlp_explanation, recommendations } = data;

  return (
    <div className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Back + Download */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition">
          <ArrowLeft size={16} /> Back to History
        </button>
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition">
          {pdfLoading ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Download size={15} /> Download PDF</>}
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* 1. HEADER */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={22} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 capitalize">
                  {report.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-slate-400 text-sm">
                  <Calendar size={13} /> {formatDate(report.date)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Overall Severity</span>
              <SeverityBadge status={report.status} />
            </div>
          </div>
        </motion.div>

        {/* 2. PARAMETERS TABLE */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <Activity size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">Extracted Parameters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 font-semibold">Parameter</th>
                  <th className="text-left px-6 py-3 font-semibold">Value</th>
                  <th className="text-left px-6 py-3 font-semibold">Normal Range</th>
                  <th className="text-center px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parameters.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-700 capitalize">{p.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{p.value} <span className="text-slate-400 text-xs">{p.unit}</span></td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs">{formatNormalRange(p.normal_range ?? null)}</td>
                    <td className="px-6 py-3.5 text-center"><StatusCell status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 3. NLP */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Brain size={16} className="text-purple-500" />
            <h2 className="text-sm font-bold text-slate-700">AI Explanation</h2>
          </div>
          <div className="space-y-3">
            {nlp_explanation.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={11} className="text-purple-400" />
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4. LIFESTYLE */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Leaf size={16} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-700">Lifestyle Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.lifestyle.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-emerald-50/60 rounded-xl px-4 py-3 border border-emerald-100">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 5. NON-PRESCRIPTION */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Pill size={16} className="text-amber-600" />
            <h2 className="text-sm font-bold text-amber-800">Non-Prescription Suggestions</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {recommendations.non_prescription.map((item, i) => (
              <span key={i} className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg shadow-sm">
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-start gap-2.5 bg-white/70 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Medical Disclaimer: </span>
              These suggestions are for informational purposes only and do not constitute medical advice. Always consult a qualified healthcare professional before starting any supplement or making changes to your health routine.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}