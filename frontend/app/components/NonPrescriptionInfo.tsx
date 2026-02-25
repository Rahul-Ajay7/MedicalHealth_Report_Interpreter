"use client";
import { useReport } from "@/context/ReportContext";
import { Leaf } from "lucide-react";

export default function NonPrescriptionInfo() {
  const { report } = useReport();
  const nonPrescription = report?.recommendations?.non_prescription || [];

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        Non-Prescription Information
      </h2>

      {!nonPrescription.length ? (
        <div className="text-sm text-gray-400 italic">
          Upload and analyze a report to see non-prescription recommendations
        </div>
      ) : (
        <div className="space-y-5">
          {nonPrescription.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1">
                <Leaf size={20} className="text-[#34a853] fill-[#34a853]/10" />
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">
                <p>
                  <span className="font-medium text-slate-800">
                    {item.parameter}:
                  </span>{" "}
                  {item.options.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}