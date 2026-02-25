"use client";
import { useReport } from "@/context/ReportContext";

export default function LifestyleTips() {
  const { report } = useReport();
  const lifestyleTips = report?.recommendations?.lifestyle_tips || [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm min-h-[220px]">
      <h3 className="font-semibold mb-4">Lifestyle Suggestions</h3>

      {!lifestyleTips.length ? (
        <div className="flex items-center justify-center h-[140px] text-sm text-gray-400 italic">
          Upload and analyze a report to see lifestyle suggestions
        </div>
      ) : (
        <ul className="space-y-4">
          {lifestyleTips.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-green-500 mt-1">✔</span>
              <div>
                <p className="font-medium text-slate-800">
                  {item.parameter}
                  <span className="ml-2 text-xs uppercase text-green-600">
                    ({item.status})
                  </span>
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 mt-1 space-y-1">
                  {item.tips.map((tip, j) => (
                    <li key={j}>{tip}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}