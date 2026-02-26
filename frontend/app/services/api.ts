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

    // raw analyzer output
    analysis: data.analysis,

    // ✅ NLP explanations (array of strings)
    nlp_explanation: data.nlp_explanation ?? [],

    // recommendations
    recommendations: data.recommendations || {
      lifestyle_tips: [],
      non_prescription: [],
      doctor_consultation: [],
    },

    // table-ready params
    parameters,
  };

  return report;
}

// src/services/api.ts

export async function askLLMChat(payload: {
  file_id: string;
  question: string;
}) {
  const res = await fetch("http://localhost:8000/chat/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json(); // { answer: string }
}