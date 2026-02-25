// src/types/index.ts

/* ---------------- BASIC TYPES ---------------- */
export type NormalRange = {
  min: number;
  max: number;
};

export type ParameterStatus = "normal" | "low" | "high" | "unknown";

/* ---------------- ANALYZER OUTPUT ---------------- */
export interface ReportParameter {
  value: number | string;
  unit: string;
  status: ParameterStatus;
  normal_range: NormalRange;
}

export type AnalysisResults = Record<string, ReportParameter>;

/* ---------------- RECOMMENDATIONS ---------------- */
export interface LifestyleTip {
  parameter: string;
  status: "low" | "high";
  tips: string[];
}

export interface NonPrescriptionSupport {
  parameter: string;
  options: string[];
}

export interface DoctorConsultation {
  parameter: string;
  instruction?: string;
}

export interface Recommendations {
  lifestyle_tips: LifestyleTip[];
  non_prescription: NonPrescriptionSupport[];
  doctor_consultation: DoctorConsultation[];
}

/* ---------------- PARAMETERS FOR TABLE ---------------- */
export interface ReportParameterWithName extends ReportParameter {
  name: string;
}

/* ---------------- FULL REPORT RESPONSE ---------------- */
export interface ReportResponse {
  file_id: string;
  gender: "male" | "female";
  analysis: AnalysisResults; // matches your backend output
  recommendations: Recommendations;
  parameters?: ReportParameterWithName[]; // for frontend table rendering
}