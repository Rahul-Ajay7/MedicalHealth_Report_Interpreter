"use client";
import { useReport } from "@/context/ReportContext";
import { ReportParameterWithName } from "@/types";

export default function AnalysisResult() {
  const { report } = useReport();

  // ✅ Use parameters array for table
  const parameters: ReportParameterWithName[] = report?.parameters || [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col">
      <h3 className="font-semibold mb-4">Extracted Parameters</h3>

      <div className="flex-1 overflow-y-auto">
        {!report && (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Upload and analyze a report to view extracted parameters
          </div>
        )}

        {parameters.length > 0 && (
          <table className="w-full text-sm border-separate border-spacing-y-3">
            <thead className="text-gray-400 sticky top-0 bg-white">
              <tr>
                <th className="text-left px-2">Parameter</th>
                <th className="px-2 text-center">Value</th>
                <th className="px-2 text-center">Unit</th>
                <th className="px-2 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {parameters.map((p, i) => (
                <tr key={i} className="bg-slate-50 rounded-lg">
                  <td className="px-2 py-3 font-medium rounded-l-lg">{formatName(p.name)}</td>
                  <td className="px-2 py-3 text-center">{p.value}</td>
                  <td className="px-2 py-3 text-center">{p.unit}</td>
                  <td className="px-2 py-3 text-center rounded-r-lg">
                    <span
                      className={`px-3 py-1 text-xs rounded-full text-white ${
                        p.status === "normal" ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {report && parameters.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-8">
            No parameters were extracted from this report.
          </div>
        )}
      </div>
    </div>
  );
}

function formatName(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}