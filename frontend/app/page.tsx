"use client";
import UploadReport from "./components/UploadReport";
import AnalysisResult from "./components/AnalysisResult";
import LifestyleTips from "./components/LifestyleTips";
import Navbar from "./components/Navbar";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <UploadReport/>
      <AnalysisResult/>
      <LifestyleTips/>
    </main>
  );
}
