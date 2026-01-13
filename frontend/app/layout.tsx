// app/layout.tsx
import "./globals.css"; // must be relative to layout.tsx

import Navbar from "./components/Navbar";

export const metadata = {
  title: "Medical Report Interpreter",
  description: "Analyze your health reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
