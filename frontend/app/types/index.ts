// src/types/index.ts

/* ---------------- BASIC TYPES ---------------- */
export type NormalRange = {
  min: number;
  max: number;
};

export type ParameterStatus =
  | "normal"
  | "low"
  | "high"
  | "abnormal"
  | "unknown";

/* ---------------- ANALYZER OUTPUT ---------------- */
export interface ReportParameter {
  value: number | string;
  unit: string;
  status: ParameterStatus;
  normal_range: NormalRange | null;
}

export type AnalysisResults = Record<string, ReportParameter>;

/* ---------------- NLP OUTPUT ---------------- */
/**
 * Each string is a generated explanation
 * for an abnormal parameter.
 */
export type NLPExplanation = string[];

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

  /** Raw analyzer output */
  analysis: AnalysisResults;

  /** NLP explanations (abnormal parameters only) */
  nlp_explanation: NLPExplanation;

  /** Rule-based recommendations */
  recommendations: Recommendations;

  /** Flattened parameters for UI table */
  parameters: ReportParameterWithName[];
}