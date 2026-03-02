"use client";

import { createContext, useContext, useState } from "react";
import type { ReportResponse } from "@/types";

/**
 * ReportResponse should look like:
 * {
 *   file_id: string;
 *   gender: string;
 *   analysis: {...}
 *   recommendations: {
 *     lifestyle_tips: [...]
 *     non_prescription: [...]
 *     doctor_consultation: [...]
 *   }
 * }
 */

type ReportContextType = {
  report: ReportResponse | null;
  setReport: (r: ReportResponse | null) => void;
  clearReport: () => void;
};

const ReportContext = createContext<ReportContextType | null>(null);

export const ReportProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [report, setReport] = useState<ReportResponse | null>(null);

  const clearReport = () => setReport(null);

  return (
    <ReportContext.Provider
      value={{
        report,
        setReport,
        clearReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) {
    throw new Error("useReport must be used inside ReportProvider");
  }
  return ctx;
};