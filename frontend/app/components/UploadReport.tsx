"use client";

import { useState } from "react";
import { Loader2, Plus, FileText } from "lucide-react";
import { uploadReport, analyzeReport } from "@/services/api";
import { useReport } from "@/context/ReportContext";

export default function UploadReport() {
  const [file, setFile] = useState<File | null>(null);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const { setReport } = useReport();

  const handleAnalyze = async () => {
    if (!file || loading) return;

    try {
      setLoading(true);

      // 1️⃣ Upload file
      const uploadRes = await uploadReport(file);

      // 2️⃣ Analyze report
      const analyzeRes = await analyzeReport(uploadRes.file_id, gender);

      // 3️⃣ Store FULL response (includes final_results + recommendations)
      setReport(analyzeRes);

      setAnalyzed(true);
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Analysis failed. Please check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setAnalyzed(false);
  };

  const fileBadge = () => {
    if (!file) return <FileText size={24} />;
    return (
      <span className="text-xs font-medium">
        {file.name.slice(0, 4)}…
      </span>
    );
  };

  /* ---------------- COLLAPSED STATE ---------------- */
  if (analyzed) {
    return (
      <div className="flex items-center justify-center">
        <button
          onClick={resetUpload}
          className="w-12 h-12 flex items-center justify-center rounded-full border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 transition"
          title="Upload another report"
        >
          <Plus size={22} />
        </button>
      </div>
    );
  }

  /* ---------------- FULL UPLOAD CARD ---------------- */
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-[460px] flex flex-col">
      <h3 className="text-lg font-semibold mb-3">Upload & Analyze Report</h3>

      {/* Gender Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender("male")}
            className={`py-2.5 rounded-lg border text-sm font-medium transition ${
              gender === "male"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            ♂ Male
          </button>

          <button
            type="button"
            onClick={() => setGender("female")}
            className={`py-2.5 rounded-lg border text-sm font-medium transition ${
              gender === "female"
                ? "bg-pink-600 text-white border-pink-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            ♀ Female
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <label className="flex-1 flex flex-col items-center justify-center py-5 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:bg-blue-50 transition">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold mb-3">
            {fileBadge()}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Drag & Drop or Click to Upload
            <br />
            <span className="text-xs text-gray-400">(PDF / JPG / PNG)</span>
          </p>
        </div>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {/* File Info */}
      <div className="mt-4 min-h-[48px] text-sm text-gray-600">
        {file && (
          <>
            <p>
              <span className="font-medium">File:</span> {file.name}
            </p>
            <p className="text-green-600">Ready for analysis</p>
          </>
        )}
      </div>

      {/* Analyze Button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="mt-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition"
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        {loading ? "Analyzing..." : "Analyze Report"}
      </button>
    </div>
  );
}