import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReportProvider } from "@/context/ReportContext";
import Navbar from "@/components/Navbar"; // ✅ ADD

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Health Report Interpreter",
  description: "Analyze blood reports and chat with an AI health assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-slate-700`}>
        <ReportProvider>
          
          <Navbar />

          {/* Page Content */}
          <div className="bg-slate-50 min-h-screen">
            {children}
          </div>
        </ReportProvider>
      </body>
    </html>
  );
}
