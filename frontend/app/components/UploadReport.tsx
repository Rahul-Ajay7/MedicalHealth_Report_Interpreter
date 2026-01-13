"use client";
import React from "react";
import { UploadCloud } from "lucide-react";

const UploadReport: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow w-full">
      <h3 className="font-semibold mb-3">Extracted Parameters</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left">Parameter</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hemoglobin</td>
                <td className="text-center">16.5 g/dL</td>
                <td className="text-green-600">Normal</td>
              </tr>
              <tr>
                <td>Glucose</td>
                <td className="text-center">180 mg/dL</td>
                <td className="text-red-600">Abnormal</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4">
          <UploadCloud className="w-10 h-10 text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">
            Drag & Drop or Click to Upload
          </p>
          <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
            Analyze Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadReport;
