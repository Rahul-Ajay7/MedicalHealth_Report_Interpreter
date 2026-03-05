'use client'

import UploadReport from "@/components/UploadReport";
import AnalysisResult from "@/components/AnalysisResult";
import ChatAssistant from "@/components/ChatAssistant";
import LifestyleTips from "@/components/LifestyleTips";
import NonPrescription from "@/components/NonPrescriptionInfo";

// ✅ No auth logic here — handled by dashboard/layout.tsx
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Health Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Upload a blood report to get instant AI-powered insights</p>
      </div>

      {/* Top Grid: Upload + Analysis + Chat */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-1">
          <UploadReport />
        </div>
        <div className="xl:col-span-1">
          <AnalysisResult />
        </div>
        <div className="xl:col-span-1">
          <ChatAssistant />
        </div>
      </div>

      {/* Bottom Grid: Lifestyle + Non-Prescription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LifestyleTips />
        <NonPrescription />
      </div>

    </div>
  );
}
