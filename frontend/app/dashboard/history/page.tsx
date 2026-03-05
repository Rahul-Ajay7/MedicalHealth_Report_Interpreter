"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, AlertCircle, Eye, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/superbaseClient";

type Report = {
  id: string;
  file_name: string;
  uploaded_at: string;
  analysis: {
    severity: "Normal" | "Medium" | "High";
  }[] | null;
};

type FlatReport = {
  id: string;
  name: string;
  date: string;
  status: "Normal" | "Medium" | "High";
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: FlatReport["status"] }) {
  const cfg = {
    Normal: { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle2 size={11} /> },
    Medium: { bg: "bg-amber-50", text: "text-amber-700", icon: <TriangleAlert size={11} /> },
    High:   { bg: "bg-red-50",   text: "text-red-600",   icon: <AlertCircle   size={11} /> },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {status}
    </span>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [reports, setReports] = useState<FlatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("reports")
        .select(`
          id,
          file_name,
          uploaded_at,
          analysis (
            severity
          )
        `)
        .order("uploaded_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const flat: FlatReport[] = (data as Report[]).map((r) => ({
        id:     r.id,
        name:   r.file_name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        date:   r.uploaded_at,
        status: r.analysis?.[0]?.severity ?? "Normal",
      }));

      setReports(flat);
      setLoading(false);
    }

    fetchReports();
  }, []);

  const total    = reports.length;
  const normal   = reports.filter((r) => r.status === "Normal").length;
  const abnormal = reports.filter((r) => r.status !== "Normal").length;

  return (
    <main className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Page Header */}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{loading ? "—" : total}</p>
            <p className="text-xs text-slate-400">Total Reports</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{loading ? "—" : normal}</p>
            <p className="text-xs text-slate-400">Normal</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{loading ? "—" : abnormal}</p>
            <p className="text-xs text-slate-400">Needs Attention</p>
          </div>
        </div>
      </div>

      {/* Table */}
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
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Clock size={32} className="opacity-30" />
            <p className="text-sm">No reports uploaded yet.</p>
          </div>
        )}

        {/* Desktop Table */}
        {!loading && !error && reports.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium">Report Name</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-center px-6 py-3 font-medium">Status</th>
                  <th className="text-center px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 capitalize">{report.name}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(report.date)}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={report.status} /></td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/history/${report.id}`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Cards */}
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
                  <button
                    onClick={() => router.push(`/dashboard/history/${report.id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    <Eye size={13} />
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