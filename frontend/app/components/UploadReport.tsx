"use client";

import { useState } from "react";
import { analyzeReport } from "@/services/api";
import { useReport } from "@/context/ReportContext";

export default function UploadReport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { setReport } = useReport();

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    const data = await analyzeReport(file);
    setReport(data);
    setLoading(false);
  };

  const fileBadge = () => {
    if (!file) return "FILE";
    if (file.type.includes("pdf")) return "PDF";
    if (file.type.startsWith("image/")) return "IMG";
    return "FILE";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-[420px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">
        Upload & Analyze Report
      </h3>

      {/* Upload Box */}
      <label
        className="
          flex-1
          flex
          flex-col
          items-center
          justify-center
          border-2
          border-dashed
          border-blue-200
          rounded-xl
          cursor-pointer
          hover:bg-blue-50
          transition
        "
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold mb-3">
            {fileBadge()}
          </div>

          <p className="text-sm text-gray-600 text-center">
            Drag & Drop or Click to Upload
            <br />
            <span className="text-xs text-gray-400">
              (PDF / JPG / PNG)
            </span>
          </p>
        </div>

        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {/* File Info + Preview (fixed space, no jump) */}
      <div className="mt-4 min-h-[80px] text-sm text-gray-600">
        {file && (
          <>
            <p>
              <span className="font-medium">File name:</span>{" "}
              {file.name}
            </p>
            <p className="text-green-600">Upload status: Uploaded</p>

            {file.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(file)}
                alt="Report preview"
                className="mt-2 max-h-24 mx-auto rounded-lg border"
              />
            )}
          </>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="
          mt-3
          bg-green-500
          hover:bg-green-600
          active:bg-green-700
          disabled:bg-gray-300
          text-white
          px-6
          py-2
          rounded-lg
          transition
          duration-150
        "
      >
        {loading ? "Analyzing..." : "Analyze Report"}
      </button>
    </div>
  );
}
