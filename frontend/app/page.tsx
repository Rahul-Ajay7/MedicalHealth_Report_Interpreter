import UploadReport from "@/components/UploadReport";
import AnalysisResult from "@/components/AnalysisResult";
import ChatAssistant from "@/components/ChatAssistant";
import LifestyleTips from "@/components/LifestyleTips";
import NonPrescription from "@/components/NonPrescriptionInfo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-blue-150 px-6 py-6">

      {/* MAIN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Upload + Analysis */}
        <div className="flex flex-col gap-6">
          <UploadReport />
          <AnalysisResult />
        </div>

        {/* RIGHT: Chat */}
        <div className="flex">
          <ChatAssistant />
        </div>

      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LifestyleTips />
        <NonPrescription />
      </div>

    </div>
  );
}
