"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Eye, Loader2, TriangleAlert, Trash2, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/superbaseClient";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer,
} from "recharts";

type Report = {
  id: string;
  file_name: string;
  uploaded_at: string;
  analysis: { severity: "Normal" | "Medium" | "High" | "Critical" }[] | null;
};

type FlatReport = {
  id: string;
  name: string;
  date: string;
  status: "Normal" | "Medium" | "High" | "Critical";
};

type AnalysisRow = {
  report_id: string;
  analysis_map: Record<string, { value: number; unit: string; status: string; normal_range?: { min: number; max: number } | string }>;
  parameters: { name: string; value: number; unit: string; status: string; normal_range?: { min: number; max: number } | string }[];
};

type TrendPoint = {
  date: string;
  value: number;
  status: string;
  reportName: string;
  unit: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Hybrid Predictor ──────────────────────────────────────────────────────────
function hybridPredictor(data: TrendPoint[], futurePoints = 2): TrendPoint[] {
  if (data.length < 3) return [];
  const values = data.map((d) => d.value);
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    num  += (x[i] - meanX) * (values[i] - meanY);
    denX += (x[i] - meanX) ** 2;
    denY += (values[i] - meanY) ** 2;
  }
  const correlation = num / Math.sqrt(denX * denY);
  const variance = values.reduce((s, v) => s + (v - meanY) ** 2, 0) / n;
  const useRegression = Math.abs(correlation) > 0.65 && Math.sqrt(variance) < meanY * 0.4;
  const lastDate = new Date(data[data.length - 1].date);
  const predictions: TrendPoint[] = [];

  if (useRegression) {
    const sumX  = x.reduce((a, b) => a + b, 0);
    const sumY  = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    for (let i = 1; i <= futurePoints; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      predictions.push({ date: d.toISOString(), value: Number((m * (n - 1 + i) + b).toFixed(2)), status: "predicted", reportName: "Prediction (Regression)", unit: data[0]?.unit || "" });
    }
  } else {
    const avg = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    for (let i = 1; i <= futurePoints; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      predictions.push({ date: d.toISOString(), value: Number(avg.toFixed(2)), status: "predicted", reportName: "Prediction (Moving Avg)", unit: data[0]?.unit || "" });
    }
  }
  return predictions;
}

function StatusBadge({ status }: { status: FlatReport["status"] }) {
  const cfg = {
    Normal:   { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle2  size={11} /> },
    Medium:   { bg: "bg-amber-50", text: "text-amber-700", icon: <TriangleAlert size={11} /> },
    High:     { bg: "bg-red-50",   text: "text-red-600",   icon: <AlertCircle   size={11} /> },
    Critical: { bg: "bg-red-600",  text: "text-white",     icon: <AlertCircle   size={11} /> },
  }[status] ?? { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle2 size={11} /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {status}
    </span>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload.find((p: any) => p.value != null);
  if (!entry) return null;
  const d = entry.payload;
  const isPrediction = d.isPrediction;
  const val = isPrediction ? d.predictedValue : d.realValue;
  const color = isPrediction ? "#9333ea" : d.status === "high" ? "#ef4444" : d.status === "low" ? "#f59e0b" : "#10b981";
  return (
    <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-1">{d.reportName}</p>
      <p className="text-slate-400 text-xs mb-2">{formatDate(d.date)}</p>
      <p className="font-bold" style={{ color }}>{val} <span className="text-slate-400 font-normal text-xs">{d.unit}</span></p>
      <p className="text-xs mt-1 capitalize" style={{ color }}>{isPrediction ? "predicted" : d.status}</p>
    </div>
  );
}

function TrendChart({ trendData, predictedData, normalRange, unit }: {
  trendData: TrendPoint[];
  predictedData: TrendPoint[];
  normalRange: { min: number; max: number } | null;
  unit: string;
}) {
  if (trendData.length === 0) return <div className="flex items-center justify-center h-52 text-slate-400 text-sm">No data found for this parameter.</div>;
  if (trendData.length === 1) return <div className="flex items-center justify-center h-52 text-slate-400 text-sm">Only 1 report has this parameter. Upload more to see a trend.</div>;

  const chartData = [
    ...trendData.map((d, i) => ({
      ...d,
      realValue:      d.value,
      predictedValue: i === trendData.length - 1 ? d.value : null as number | null,
      isPrediction:   false,
    })),
    ...predictedData.map((d) => ({
      ...d,
      realValue:      null as number | null,
      predictedValue: d.value,
      isPrediction:   true,
    })),
  ];

  const allValues = [
    ...trendData.map((d) => d.value),
    ...predictedData.map((d) => d.value),
    ...(normalRange ? [normalRange.min, normalRange.max] : []),
  ];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const pad    = (maxVal - minVal) * 0.2 || 1;
  const yMin   = Math.max(0, Math.floor(minVal - pad));
  const yMax   = Math.ceil(maxVal + pad);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
        <Tooltip content={<CustomTooltip />} />

        {normalRange && (
          <ReferenceArea y1={normalRange.min} y2={normalRange.max} fill="#10b981" fillOpacity={0.12} strokeOpacity={0} />
        )}
        {normalRange && (
          <>
            <ReferenceLine y={normalRange.min} stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 4"
              label={{ value: `Min ${normalRange.min}`, position: "insideBottomRight", fontSize: 10, fill: "#10b981" }} />
            <ReferenceLine y={normalRange.max} stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 4"
              label={{ value: `Max ${normalRange.max}`, position: "insideTopRight", fontSize: 10, fill: "#10b981" }} />
          </>
        )}

        <Line type="monotone" dataKey="realValue" stroke="#3b82f6" strokeWidth={2.5}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            if (payload.realValue == null) return <g />;
            const s = payload.status?.toLowerCase();
            const fill = s === "high" ? "#ef4444" : s === "low" ? "#f59e0b" : "#10b981";
            return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="white" strokeWidth={2} />;
          }}
          activeDot={{ r: 7 }} connectNulls={false} name="Actual" />

        <Line type="monotone" dataKey="predictedValue" stroke="#9333ea" strokeWidth={2} strokeDasharray="7 4"
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            if (payload.predictedValue == null) return <g />;
            return <circle cx={cx} cy={cy} r={4} fill="#9333ea" stroke="white" strokeWidth={2} />;
          }}
          connectNulls name="Prediction" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const [reports,         setReports]         = useState<FlatReport[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);
  const [confirmId,       setConfirmId]       = useState<string | null>(null);
  const [allAnalysis,     setAllAnalysis]     = useState<AnalysisRow[]>([]);
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [selectedParam,   setSelectedParam]   = useState<string>("");
  const [trendData,       setTrendData]       = useState<TrendPoint[]>([]);
  const [predictedData,   setPredictedData]   = useState<TrendPoint[]>([]);
  const [normalRange,     setNormalRange]     = useState<{ min: number; max: number } | null>(null);
  const [trendUnit,       setTrendUnit]       = useState("");

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    setError(null);

    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select(`id, file_name, uploaded_at, analysis (severity)`)
      .order("uploaded_at", { ascending: false });

    if (reportError) { setError(reportError.message); setLoading(false); return; }

    const flat: FlatReport[] = (reportData as Report[]).map((r) => ({
      id:     r.id,
      name:   (r.file_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")) + " · " + formatDate(r.uploaded_at),
      date:   r.uploaded_at,
      status: r.analysis?.[0]?.severity ?? "Normal",
    }));
    setReports(flat);

    const { data: analysisData, error: analysisError } = await supabase
      .from("analysis")
      .select("report_id, analysis_map, parameters")
      .order("analyzed_at", { ascending: true });

    if (analysisError) { console.error("Analysis fetch error:", analysisError); setLoading(false); return; }

    if (analysisData && analysisData.length > 0) {
      setAllAnalysis(analysisData as AnalysisRow[]);
      const paramSet = new Set<string>();
      (analysisData as AnalysisRow[]).forEach((row) => {
        if (row.analysis_map) Object.keys(row.analysis_map).forEach((k) => paramSet.add(k));
        if (row.parameters)   row.parameters.forEach((p) => p.name && paramSet.add(p.name));
      });
      const sorted = Array.from(paramSet).sort();
      setAvailableParams(sorted);
      if (sorted.length > 0) setSelectedParam(sorted[0]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!selectedParam || allAnalysis.length === 0) return;
    const reportMap = new Map(reports.map((r) => [r.id, { date: r.date, name: r.name }]));
    const points: TrendPoint[] = [];
    let foundRange: { min: number; max: number } | null = null;
    let foundUnit = "";

    allAnalysis.forEach((row) => {
      const meta = reportMap.get(row.report_id);
      if (!meta) return;
      let paramData: any = null;
      if (row.analysis_map?.[selectedParam]) paramData = row.analysis_map[selectedParam];
      else if (row.parameters) paramData = row.parameters.find((p) => p.name === selectedParam);
      if (!paramData) return;

      const val = parseFloat(String(paramData.value));
      if (isNaN(val)) return;
      points.push({ date: meta.date, value: val, status: paramData.status || "normal", reportName: meta.name, unit: paramData.unit || "" });

      if (!foundRange && paramData.normal_range) {
        const r = paramData.normal_range;
        if (typeof r === "object" && r !== null && "min" in r && "max" in r) {
          foundRange = { min: Number(r.min), max: Number(r.max) };
        } else if (typeof r === "string") {
          const parts = r.split("-").map((v: string) => parseFloat(v.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) foundRange = { min: parts[0], max: parts[1] };
        }
      }
      if (!foundUnit && paramData.unit) foundUnit = paramData.unit;
    });

    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTrendData(points);
    setNormalRange(foundRange);
    setTrendUnit(foundUnit);
    setPredictedData(hybridPredictor(points, 2));
  }, [selectedParam, allAnalysis, reports]);

  // ── Delete — calls backend which deletes from Supabase ───────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert("Not logged in."); setDeletingId(null); return; }

      const res = await fetch(`${API_BASE}/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Delete failed" }));
        alert("Failed to delete: " + (err.detail || "Unknown error"));
      } else {
        // Remove from frontend state only after backend confirms deletion
        setReports((prev) => prev.filter((r) => r.id !== id));
        setAllAnalysis((prev) => prev.filter((a) => a.report_id !== id));
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const total    = reports.length;
  const normal   = reports.filter((r) => r.status === "Normal").length;
  const abnormal = reports.filter((r) => r.status !== "Normal").length;

  return (
    <main className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Delete Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">Delete Report?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will permanently delete the report and all its analysis data from the database.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={() => handleDelete(confirmId)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Report History</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 ml-[42px]">
          {loading ? "Loading…" : `${total} report${total !== 1 ? "s" : ""} on record`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Clock,        bg: "bg-blue-50",  ic: "text-blue-500",  val: total,    label: "Total Reports"   },
          { icon: CheckCircle2, bg: "bg-green-50", ic: "text-green-500", val: normal,   label: "Normal"          },
          { icon: AlertCircle,  bg: "bg-red-50",   ic: "text-red-400",   val: abnormal, label: "Needs Attention" },
        ].map(({ icon: Icon, bg, ic, val, label }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon size={18} className={ic} /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{loading ? "—" : val}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {!loading && availableParams.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-700">Parameter Trend</h2>
                <p className="text-xs text-slate-400">Track how a value changes across reports</p>
              </div>
            </div>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white capitalize"
            >
              {availableParams.map((p) => (
                <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Normal value</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> High value</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Low value</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-8 h-0.5 bg-blue-500" /> Actual</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-8 border-t-2 border-dashed border-purple-500" /> Prediction</span>
            {normalRange && (
              <span className="flex items-center gap-1.5">
                <span className="w-8 h-3 rounded inline-block bg-emerald-100 border border-emerald-400" />
                Normal range ({normalRange.min}–{normalRange.max} {trendUnit})
              </span>
            )}
            {trendUnit && <span className="ml-auto text-slate-400">Unit: {trendUnit}</span>}
          </div>

          {/* Normal range info box */}
          {normalRange && (
            <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span>
                Normal range for <span className="font-semibold capitalize">{selectedParam.replace(/_/g, " ")}</span>:
                <span className="font-bold ml-1">{normalRange.min} – {normalRange.max} {trendUnit}</span>
              </span>
            </div>
          )}

          <TrendChart trendData={trendData} predictedData={predictedData} normalRange={normalRange} unit={trendUnit} />
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">All Reports</h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2.5 py-16 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Fetching your reports…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center gap-2 py-16 text-red-500 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Clock size={32} className="opacity-30" />
            <p className="text-sm">No reports uploaded yet.</p>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium">Report Name</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-center px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 capitalize">{report.name}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(report.date)}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => router.push(`/dashboard/history/${report.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => setConfirmId(report.id)} disabled={deletingId === report.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50">
                          {deletingId === report.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="md:hidden divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate capitalize">{report.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(report.date)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={report.status} />
                  <button onClick={() => router.push(`/dashboard/history/${report.id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => setConfirmId(report.id)} disabled={deletingId === report.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition disabled:opacity-50">
                    {deletingId === report.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}