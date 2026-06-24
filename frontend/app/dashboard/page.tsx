'use client'

import { useState } from "react";
import { useReport } from "@/context/ReportContext";
import { ListChecks, Leaf, Plus, AlertTriangle } from "lucide-react";
import UploadReport from "@/components/UploadReport";
import AnalysisResult from "@/components/AnalysisResult";
import ChatAssistant from "@/components/ChatAssistant";
import LifestyleTips from "@/components/LifestyleTips";
import NonPrescription from "@/components/NonPrescriptionInfo";

type Tab = "parameters" | "recommendations";

const SEVERITY_STYLE: Record<string, string> = {
  Normal:   "bg-emerald-50 text-emerald-700",
  Medium:   "bg-amber-50 text-amber-700",
  High:     "bg-red-50 text-red-700",
  Critical: "bg-red-600 text-white",
};

export default function Dashboard() {
  const { report, clearReport } = useReport();
  const [tab, setTab] = useState<Tab>("parameters");

  // ── State 1: no report yet → single, centered upload. No empty clutter. ──
  if (!report) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] px-4 py-10 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analyze a Lab Report</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Upload a blood or urine report and pick your language — we'll explain
              every value in plain words.
            </p>
          </div>
          <UploadReport />
        </div>
      </div>
    );
  }

  // ── State 2: report ready → focused results + sticky chat. ──
  const severity = report.severity || "Normal";
  return (
    <div className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Your Results</h1>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.Normal}`}>
            {severity === "Critical" && <AlertTriangle size={12} />}
            {severity}
          </span>
        </div>
        <button
          onClick={clearReport}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 bg-white border border-slate-200 hover:border-teal-300 rounded-xl px-4 py-2 transition"
        >
          <Plus size={15} /> New report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main — tabbed results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
            <button
              onClick={() => setTab("parameters")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === "parameters" ? "bg-teal-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ListChecks size={15} /> Parameters
            </button>
            <button
              onClick={() => setTab("recommendations")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === "recommendations" ? "bg-teal-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Leaf size={15} /> Recommendations
            </button>
          </div>

          {tab === "parameters" ? (
            <AnalysisResult />
          ) : (
            <div className="space-y-6">
              <LifestyleTips />
              <NonPrescription />
            </div>
          )}
        </div>

        {/* Sticky chat */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <ChatAssistant />
          </div>
        </div>
      </div>
    </div>
  );
}
