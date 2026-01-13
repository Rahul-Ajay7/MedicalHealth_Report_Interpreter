// app/history/page.tsx
"use client";

import React from "react";

type Report = {
  id: number;
  name: string;
  date: string;
  status: "Normal" | "Abnormal";
};

const mockHistory: Report[] = [
  { id: 1, name: "Blood Test - Jan 12", date: "2026-01-12", status: "Normal" },
  { id: 2, name: "Lipid Profile - Jan 10", date: "2026-01-10", status: "Abnormal" },
  { id: 3, name: "CBC - Jan 08", date: "2026-01-08", status: "Normal" },
];

const HistoryPage: React.FC = () => {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Report History</h1>

      <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              <th className="text-left p-2">Report Name</th>
              <th className="text-left p-2">Date</th>
              <th className="text-center p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((report) => (
              <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2">{report.name}</td>
                <td className="p-2">{report.date}</td>
                <td className={`p-2 text-center font-medium ${report.status === "Normal" ? "text-green-600" : "text-red-600"}`}>
                  {report.status}
                </td>
                <td className="p-2 text-center">
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default HistoryPage;
