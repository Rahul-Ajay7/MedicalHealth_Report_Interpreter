'use client'

import { useReport } from "@/context/ReportContext";
import { ListChecks, Leaf, Plus, AlertTriangle, ChevronDown } from "lucide-react";
import UploadReport from "@/components/UploadReport";
import AnalysisResult from "@/components/AnalysisResult";
import ChatAssistant from "@/components/ChatAssistant";
import LifestyleTips from "@/components/LifestyleTips";
import NonPrescription from "@/components/NonPrescriptionInfo";

const SEVERITY_STYLE: Record<string, string> = {
  Normal:   "bg-emerald-50 text-emerald-700",
  Medium:   "bg-amber-50 text-amber-700",
  High:     "bg-red-50 text-red-700",
  Critical: "bg-red-600 text-white",
};

export default function Dashboard() {
  const { report, clearReport } = useReport();

  // ── No report yet → single, centered upload. ──
  if (!report) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] dark:bg-slate-900 px-4 py-10 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Analyze a Lab Report</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Upload a blood or urine report and pick your language — we'll explain
              every value in plain words.
            </p>
          </div>
          <UploadReport />
        </div>
      </div>
    );
  }

  // ── Report ready → chat-first. Conversation is the hero; the full table and
  //    recommendations live in collapsible sections below. Single column =
  //    works the same on mobile and desktop. ──
  const severity = report.severity || "Normal";
  return (
    <div className="min-h-screen bg-[#F0F4F9] dark:bg-slate-900 px-4 md:px-8 py-6">
      <div className="max-w-3xl mx-auto">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Your Results</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.Normal}`}>
              {severity === "Critical" && <AlertTriangle size={12} />}
              {severity}
            </span>
          </div>
          <button
            onClick={clearReport}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded-xl px-4 py-2 transition"
          >
            <Plus size={15} /> New report
          </button>
        </div>

        {/* Chat = hero */}
        <ChatAssistant />

        {/* Full detail, collapsed by default */}
        <details className="group mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <summary className="flex items-center gap-2 cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <ListChecks size={16} className="text-teal-500" />
            All extracted parameters
            <ChevronDown size={16} className="ml-auto text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <AnalysisResult />
          </div>
        </details>

        <details className="group mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <summary className="flex items-center gap-2 cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Leaf size={16} className="text-emerald-500" />
            Lifestyle & general guidance
            <ChevronDown size={16} className="ml-auto text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 space-y-6">
            <LifestyleTips />
            <NonPrescription />
          </div>
        </details>

      </div>
    </div>
  );
}
