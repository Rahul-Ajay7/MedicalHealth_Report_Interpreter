"use client";

import { createContext, useContext, useState } from "react";
import type { ReportResponse } from "@/types";

type ReportContextType = {
  report: ReportResponse | null;
  setReport: (r: ReportResponse) => void;
};

const ReportContext = createContext<ReportContextType | null>(null);

export const ReportProvider = ({ children }: { children: React.ReactNode }) => {
  const [report, setReport] = useState<ReportResponse | null>(null);

  return (
    <ReportContext.Provider value={{ report, setReport }}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport must be used inside ReportProvider");
  return ctx;
};
