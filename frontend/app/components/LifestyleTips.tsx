"use client";
import { useReport } from "@/context/ReportContext";
import { Dumbbell } from "lucide-react";

export default function LifestyleTips() {
  const { report } = useReport();
  const lifestyleTips = report?.recommendations?.lifestyle_tips || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Dumbbell size={16} className="text-amber-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Lifestyle Suggestions</h3>
      </div>

      {!lifestyleTips.length ? (
        <div className="flex items-center justify-center h-28 text-sm text-slate-400 italic">
          Upload and analyze a report to see suggestions
        </div>
      ) : (
        <div className="space-y-5">
          {lifestyleTips.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{item.parameter}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === "low" || item.status === "high"
                      ? item.status === "low"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-700"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {item.tips.map((tip, j) => (
                    <li key={j} className="text-sm text-slate-500 flex gap-2">
                      <span className="text-slate-300 mt-0.5">–</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}