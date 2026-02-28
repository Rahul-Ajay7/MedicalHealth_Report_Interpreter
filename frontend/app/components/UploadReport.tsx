"use client";

import { useState } from "react";
import { Loader2, Plus, FileText, UploadCloud, CheckCircle2 } from "lucide-react";
import { uploadReport, analyzeReport } from "@/services/api";
import { useReport } from "@/context/ReportContext";

export default function UploadReport() {
  const [file, setFile] = useState<File | null>(null);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { setReport } = useReport();

  const handleAnalyze = async () => {
    if (!file || loading) return;
    try {
      setLoading(true);
      const uploadRes = await uploadReport(file);
      const analyzeRes = await analyzeReport(uploadRes.file_id, gender);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  /* ---- COLLAPSED ---- */
  if (analyzed) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={24} className="text-green-500" />
        </div>
        <p className="text-sm font-medium text-slate-700">Report Analyzed</p>
        <button
          onClick={resetUpload}
          className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
        >
          <Plus size={16} /> Upload Another
        </button>
      </div>
    );
  }

  /* ---- FULL CARD ---- */
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Upload Report</h3>
        <p className="text-xs text-slate-400 mt-0.5">PDF, JPG or PNG · Max 10MB</p>
      </div>

      {/* Gender Toggle */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Patient Gender</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGender("male")}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              gender === "male"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            ♂ Male
          </button>
          <button
            onClick={() => setGender("female")}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              gender === "female"
                ? "bg-pink-500 text-white border-pink-500 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-pink-300"
            }`}
          >
            ♀ Female
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-green-300 bg-green-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
        }`}
      >
        {file ? (
          <>
            <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText size={22} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{file.name}</p>
              <p className="text-xs text-green-600 mt-0.5">Ready for analysis</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
              <UploadCloud size={22} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Drag & drop or <span className="text-blue-600">browse</span></p>
              <p className="text-xs text-slate-400 mt-0.5">Supported: PDF, JPG, PNG</p>
            </div>
          </>
        )}
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-all shadow-sm"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Analyzing..." : "Analyze Report"}
      </button>
    </div>
  );
}