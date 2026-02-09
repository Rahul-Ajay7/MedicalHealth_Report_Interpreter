export interface ReportValue {
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
}

export interface LifestyleSuggestion {
  title: string;
  description: string;
}

export interface ReportResponse {
  parameters: ReportValue[];
  lifestyle: LifestyleSuggestion[];
  summary: string;
}
