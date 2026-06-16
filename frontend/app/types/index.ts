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
  value:        number | string;
  unit:         string;
  status:       ParameterStatus;
  normal_range: NormalRange | null;
  /** True when value crosses an absolute panic threshold (needs urgent attention) */
  critical?:     boolean;
  /** Where normal_range came from: the lab's printed range or our hardcoded reference */
  range_source?: "report" | "reference";
}

export type AnalysisResults = Record<string, ReportParameter>;

/* ---------------- NLP OUTPUT ---------------- */
export type NLPExplanation = string[];

/* ---------------- RECOMMENDATIONS ---------------- */
export interface LifestyleTip {
  parameter: string;
  status:    "low" | "high";
  tips:      string[];
}

export interface NonPrescriptionSupport {
  parameter: string;
  options:   string[];
  note?:     string;
}

export interface DoctorConsultation {
  parameter:    string;
  instruction?: string;
}

export interface Recommendations {
  lifestyle_tips:      LifestyleTip[];
  non_prescription:    NonPrescriptionSupport[];
  doctor_consultation: DoctorConsultation[];
  otc_disclaimer?:     string;
}

/* ---------------- PARAMETERS FOR TABLE ---------------- */
export interface ReportParameterWithName extends ReportParameter {
  name: string;
}

/* ---------------- FULL REPORT RESPONSE ---------------- */
export interface ReportResponse {
  file_id:   string;
  report_id: string;          // ✅ added — Supabase report UUID

  gender: "male" | "female";

  /** Raw analyzer output */
  analysis: AnalysisResults;

  /** NLP explanations (abnormal parameters only) */
  nlp_explanation: NLPExplanation;

  /** Rule-based recommendations */
  recommendations: Recommendations;

  /** Flattened parameters for UI table */
  parameters: ReportParameterWithName[];

  /** Overall severity from analysis */
  severity: "Normal" | "Medium" | "High" | "Critical";

  /** Output language chosen at analyze time (chat answers default to this) */
  language?: string;
}