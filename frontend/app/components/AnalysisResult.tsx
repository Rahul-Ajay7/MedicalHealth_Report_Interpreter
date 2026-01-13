"use client";
import React from "react";
import { Loader2 } from "lucide-react";

const AnalysisResult: React.FC = () => {
  // Mock data for demonstration
  const results = [
    {
      name: "Glucose",
      status: "Abnormal",
      severity: "High",
      recommendation: "May indicate pre-diabetes",
      color: "red",
      percentage: 80, // for a visual bar
    },
    {
      name: "Hemoglobin",
      status: "Normal",
      severity: "Low",
      recommendation: "Healthy level",
      color: "green",
      percentage: 50,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-800">
        Health Impact & Severity
      </h3>

      {/* Loading indicator */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <Loader2 className="animate-spin text-green-500 w-12 h-12" />
        <p className="mt-3 text-gray-500">Analyzing your report. Please wait...</p>
      </div>

      {/* Analysis results */}
      <div className="space-y-4">
        {results.map((item) => (
          <div
            key={item.name}
            className="p-4 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">{item.name}</h4>
              <span
                className={`text-sm font-medium ${
                  item.color === "red"
                    ? "text-red-600"
                    : item.color === "green"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  item.color === "red"
                    ? "bg-red-500"
                    : item.color === "green"
                    ? "bg-green-500"
                    : "bg-yellow-400"
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>

            <p className="text-sm text-gray-500">
              <strong>Recommendation:</strong> {item.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResult;
