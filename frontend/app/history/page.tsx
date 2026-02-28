// app/history/page.tsx
"use client";

import React from "react";
import { Clock, CheckCircle2, AlertCircle, Eye } from "lucide-react";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const HistoryPage: React.FC = () => {
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
        <p className="text-sm text-slate-500 mt-1 ml-10.5">
          {mockHistory.length} report{mockHistory.length !== 1 ? "s" : ""} on record
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{mockHistory.length}</p>
            <p className="text-xs text-slate-400">Total Reports</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {mockHistory.filter((r) => r.status === "Normal").length}
            </p>
            <p className="text-xs text-slate-400">Normal</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              {mockHistory.filter((r) => r.status === "Abnormal").length}
            </p>
            <p className="text-xs text-slate-400">Abnormal</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">All Reports</h2>
        </div>

        {/* Desktop Table */}
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
              {mockHistory.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{report.name}</td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(report.date)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                        report.status === "Normal"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {report.status === "Normal"
                        ? <CheckCircle2 size={11} />
                        : <AlertCircle size={11} />
                      }
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {mockHistory.map((report) => (
            <div key={report.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{report.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(report.date)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                    report.status === "Normal"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {report.status}
                </span>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                  <Eye size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default HistoryPage;