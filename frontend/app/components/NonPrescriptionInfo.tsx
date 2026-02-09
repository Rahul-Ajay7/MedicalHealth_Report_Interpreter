"use client";
import { Leaf } from 'lucide-react';

export default function NonPrescriptionInfo() {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Non-Prescription Information</h2>
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Leaf size={20} className="text-[#34a853] fill-[#34a853]/10" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            For high blood sugar (mild cases): <br />
            <span className="text-slate-800 font-medium">Psyllium Husk (fiber supplement)</span>
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Leaf size={20} className="text-[#34a853] fill-[#34a853]/10" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-700">Purpose:</span> Helps manage glucose. <br />
            <span className="font-bold text-slate-700">Side effects:</span> Bloating, gas
          </p>
        </div>
      </div>
    </section>
  );
}