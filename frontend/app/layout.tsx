import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReportProvider } from "@/context/ReportContext";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HealthAI",
  description: "Analyze blood reports and chat with an AI health assistant",
  icons: {
    icon:  "/healthai-logo.svg",   
    apple: "/healthai-logo.svg",   
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme before paint to avoid a flash of the wrong mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased text-slate-700 dark:text-slate-200 dark:bg-slate-900`}>
        <ReportProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ReportProvider>
      </body>
    </html>
  );
}