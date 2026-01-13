// app/components/Navbar.tsx
import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-white shadow rounded-full px-8 py-3 flex justify-between items-center">
      <div className="flex gap-6 text-gray-700 font-medium">
        <span className="text-blue-600">Home</span>
        <span>Upload Report</span>
        <span>Report History</span>
        <span>Profile</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Welcome, User!</span>
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </nav>
  );
};

export default Navbar; // ✅ must be default
