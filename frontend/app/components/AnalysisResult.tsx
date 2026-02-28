"use client";
import { useReport } from "@/context/ReportContext";
import { ReportParameterWithName } from "@/types";
import { Activity } from "lucide-react";

export default function AnalysisResult() {
  const { report } = useReport();
  const parameters: ReportParameterWithName[] = report?.parameters || [];

  const normalCount = parameters.filter((p) => p.status === "normal").length;
  const abnormalCount = parameters.filter((p) => p.status !== "normal").length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Extracted Parameters</h3>
          {parameters.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">{parameters.length} parameters detected</p>
          )}
        </div>
        {parameters.length > 0 && (
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {normalCount} Normal
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {abnormalCount} Abnormal
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!report && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Activity size={22} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-400 text-center">
              Upload and analyze a report<br />to view extracted parameters
            </p>
          </div>
        )}

        {parameters.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="text-left pb-3 font-medium">Parameter</th>
                <th className="pb-3 text-center font-medium">Value</th>
                <th className="pb-3 text-center font-medium">Unit</th>
                <th className="pb-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {parameters.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pr-2 font-medium text-slate-700">{formatName(p.name)}</td>
                  <td className="py-3 text-center text-slate-600">{p.value}</td>
                  <td className="py-3 text-center text-slate-400 text-xs">{p.unit}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        p.status === "normal"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {p.status === "normal" ? "Normal" : "Abnormal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {report && parameters.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-10">
            No parameters were extracted from this report.
          </p>
        )}
      </div>
    </div>
  );
}

function formatName(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}