"use client";
import { useReport } from "@/context/ReportContext";
import { Leaf } from "lucide-react";

export default function NonPrescriptionInfo() {
  const { report } = useReport();
  const nonPrescription = report?.recommendations?.non_prescription || [];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Leaf size={16} className="text-emerald-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Non-Prescription Recommendations</h3>
      </div>

      {!nonPrescription.length ? (
        <div className="flex items-center justify-center h-28 text-sm text-slate-400 italic">
          Upload and analyze a report to see recommendations
        </div>
      ) : (
        <div className="space-y-3">
          {nonPrescription.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100"
            >
              <div className="mt-0.5 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Leaf size={13} className="text-emerald-600" />
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">{item.parameter}: </span>
                {item.options.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}