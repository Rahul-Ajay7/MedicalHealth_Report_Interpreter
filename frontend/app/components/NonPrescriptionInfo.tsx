"use client";
import { useReport } from "@/context/ReportContext";
import { Leaf, Info } from "lucide-react";

export default function NonPrescriptionInfo() {
  const { report } = useReport();
  const nonPrescription = report?.recommendations?.non_prescription || [];
  const disclaimer = report?.recommendations?.otc_disclaimer;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Leaf size={16} className="text-emerald-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          To Discuss With Your Doctor or Pharmacist
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-5 ml-[42px]">
        General information — not a recommendation to take anything.
      </p>

      {!nonPrescription.length ? (
        <div className="flex items-center justify-center h-28 text-sm text-slate-400 italic">
          Upload and analyze a report to see general information
        </div>
      ) : (
        <>
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
                  commonly discussed — {item.options.join(", ")}.{" "}
                  <span className="text-slate-400">Ask your doctor or pharmacist before starting.</span>
                </div>
              </div>
            ))}
          </div>

          {disclaimer && (
            <div className="flex items-start gap-2 mt-4 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{disclaimer}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
