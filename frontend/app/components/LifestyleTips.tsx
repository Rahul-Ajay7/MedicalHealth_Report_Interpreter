"use client";
import { useReport } from "@/context/ReportContext";

export default function LifestyleTips() {
  const { report } = useReport();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm min-h-[220px]">
      <h3 className="font-semibold mb-4">Lifestyle Suggestions</h3>

      {!report ? (
        /* EMPTY STATE */
        <div className="flex items-center justify-center h-[140px] text-sm text-gray-400 italic">
          Upload and analyze a report to see lifestyle suggestions
        </div>
      ) : (
        /* DATA STATE */
        <ul className="space-y-3">
          {report.lifestyle.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-500">✔</span>
              <div>
                <p className="font-medium">{tip.title}</p>
                <p className="text-sm text-gray-500">
                  {tip.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
