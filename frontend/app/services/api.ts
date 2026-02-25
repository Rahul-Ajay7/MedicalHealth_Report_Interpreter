// src/services/api.ts
import type { ReportResponse, ReportParameterWithName } from "@/types";

const API_BASE = "http://localhost:8000";

/* ---------------- UPLOAD REPORT ---------------- */
export async function uploadReport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");

  return res.json(); // { file_id: string }
}

/* ---------------- ANALYZE REPORT ---------------- */
export async function analyzeReport(
  fileId: string,
  gender: "male" | "female"
): Promise<ReportResponse> {
  const res = await fetch(
    `${API_BASE}/analyze/?file_id=${encodeURIComponent(fileId)}&gender=${gender}`,
    { method: "POST" }
  );

  if (!res.ok) throw new Error("Analysis failed");

  const data = await res.json();

  // ✅ Convert analysis object to array for table
  const parameters: ReportParameterWithName[] = Object.entries(data.analysis).map(
    ([name, p]: [string, any]) => ({
      name,
      value: p.value,
      unit: p.unit,
      status: p.status,
      normal_range: p.normal_range ?? { min: 0, max: 0 },
    })
  );

  const report: ReportResponse = {
    file_id: data.file_id,
    gender: data.gender,
    analysis: data.analysis,
    recommendations: data.recommendations || {
      lifestyle_tips: [],
      non_prescription: [],
      doctor_consultation: [],
    },
    parameters, // attach for frontend table
  };

  return report;
}