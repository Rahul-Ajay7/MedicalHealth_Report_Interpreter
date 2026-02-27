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

  // Protect route
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="min-h-screen bg-blue-150 px-6 py-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <UploadReport />
          <AnalysisResult />
        </div>

        <div className="flex">
          <ChatAssistant />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LifestyleTips />
        <NonPrescription />
      </div>

    </div>
  );
}