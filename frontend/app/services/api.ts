/*import { ReportResponse } from "@/types";

export async function analyzeReport(file: File): Promise<ReportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}Main Program*/

import type { ReportResponse } from "@/types";

/**
 * MOCK analyzeReport API
 * Later replace this with real backend call
 */
export async function analyzeReport(
  file: File
): Promise<ReportResponse> {
  console.log("Uploaded file:", file.name);

  // simulate network + AI processing delay
  await new Promise((res) => setTimeout(res, 1500));

  return {
    summary: "Your glucose and cholesterol levels are above normal.",
    parameters: [
      {
        name: "Glucose",
        value: 180,
        unit: "mg/dL",
        min: 70,
        max: 140,
      },
      {
        name: "Hemoglobin",
        value: 14.5,
        unit: "g/dL",
        min: 13,
        max: 17,
      },
      {
        name: "Cholesterol",
        value: 240,
        unit: "mg/dL",
        min: 125,
        max: 200,
      },
    ],
    lifestyle: [
      {
        title: "Diet Control",
        description: "Avoid sugar, fried foods, and refined carbs.",
      },
      {
        title: "Exercise",
        description: "30 minutes of brisk walking daily.",
      },
      {
        title: "Hydration",
        description: "Drink 2–3 liters of water per day.",
      },
    ],
  };
}

