// src/services/api.ts
import type { ReportResponse, ReportParameterWithName } from "@/types";
import { supabase } from "../lib/superbaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ---------------- GET JWT TOKEN ---------------- */
async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in. Please sign in again.");
  return session.access_token;
}

/* ---------------- UPLOAD REPORT ---------------- */
export async function uploadReport(file: File): Promise<{ report_id: string }> {
  const token = await getToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,   // ✅ JWT
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }

  return res.json(); // { report_id: string, file_url: string, status: string }
}

/* ---------------- ANALYZE REPORT ---------------- */
export async function analyzeReport(
  reportId: string,
  gender: "male" | "female"
): Promise<ReportResponse> {
  const token = await getToken();

  const res = await fetch(
    `${API_BASE}/analyze/?file_id=${encodeURIComponent(reportId)}&gender=${gender}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,  // ✅ JWT
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Analysis failed");
  }

  const data = await res.json();

  // ✅ Convert analysis object to array for table
  const parameters: ReportParameterWithName[] = Object.entries(data.analysis).map(
    ([name, p]: [string, any]) => ({
      name,
      value:        p.value,
      unit:         p.unit,
      status:       p.status,
      normal_range: p.normal_range ?? { min: 0, max: 0 },
    })
  );

  const report: ReportResponse = {
    file_id:         data.file_id,
    report_id:       data.report_id,    // ✅ new — needed for history/[id] page
    gender:          data.gender,
    analysis:        data.analysis,
    nlp_explanation: data.nlp_explanation ?? [],
    recommendations: data.recommendations || {
      lifestyle_tips:       [],
      non_prescription:     [],
      doctor_consultation:  [],
    },
    parameters,
    severity:        data.severity,     // ✅ new
  };

  return report;
}

/* ---------------- CHAT ---------------- */
export type ChatResponse = {
  answer:        string;
  flagged:       boolean;
  question_type: string;
  response_time: number;
};

export async function askLLMChat(payload: {
  file_id:  string;
  question: string;
}): Promise<ChatResponse> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // ✅ JWT
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return res.json();
}