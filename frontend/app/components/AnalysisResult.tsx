"use client";
import { useReport } from "@/context/ReportContext";

export default function AnalysisResult() {
  const { report } = useReport();

  const getStatus = (v: number, min: number, max: number) =>
    v < min || v > max ? "Abnormal" : "Normal";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm min-h-[260px]">
      <h3 className="font-semibold mb-4">Extracted Parameters</h3>

      {/* EMPTY STATE */}
      {!report && (
        <div className="flex items-center justify-center h-[180px] text-sm text-gray-400">
          Upload and analyze a report to view extracted parameters
        </div>
      )}

      {/* TABLE */}
      {report && (
        <table className="w-full text-sm border-separate border-spacing-y-3">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left px-2">Parameter</th>
              <th className="px-2">Value</th>
              <th className="px-2">Unit</th>
              <th className="px-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {report.parameters.map((p, i) => {
              const status = getStatus(p.value, p.min, p.max);
              return (
                <tr key={i} className="bg-slate-50 rounded-lg">
                  <td className="px-2 py-3 font-medium rounded-l-lg">
                    {p.name}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {p.value}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {p.unit}
                  </td>
                  <td className="px-2 py-3 text-center rounded-r-lg">
                    <span
                      className={`px-3 py-1 text-xs rounded-full text-white ${
                        status === "Abnormal"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
