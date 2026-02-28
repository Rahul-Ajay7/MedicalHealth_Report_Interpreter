'use client'

import UploadReport from "@/components/UploadReport";
import AnalysisResult from "@/components/AnalysisResult";
import ChatAssistant from "@/components/ChatAssistant";
import LifestyleTips from "@/components/LifestyleTips";
import NonPrescription from "@/components/NonPrescriptionInfo";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-8">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Health Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Upload a blood report to get instant AI-powered insights</p>
      </div>

      {/* Top Grid: Upload + Analysis + Chat */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Left: Upload */}
        <div className="xl:col-span-1">
          <UploadReport />
        </div>

        {/* Middle: Analysis Table */}
        <div className="xl:col-span-1">
          <AnalysisResult />
        </div>

        {/* Right: Chat */}
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