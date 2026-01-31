"use client";

import React from "react";
import { Leaf } from "lucide-react";

const LifestyleTips: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="font-semibold mb-3">Lifestyle Suggestions</h3>
      <ul className="space-y-2 text-sm">
        <li className="flex gap-2">
          <Leaf className="text-green-500" /> Reduce sugar intake, increase vegetables
        </li>
        <li className="flex gap-2">
          <Leaf className="text-green-500" /> 20–30 minutes daily exercise
        </li>
        <li className="flex gap-2">
          <Leaf className="text-green-500" /> Sleep 7–9 hours daily
        </li>
      </ul>
    </div>
  );
};

export default LifestyleTips; 
