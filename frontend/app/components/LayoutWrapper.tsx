'use client'

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Landing page has its own header; auth pages show no nav.
  const hideNavbar =
    pathname === "/" || pathname === "/login" || pathname === "/signup";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div className="bg-slate-50 min-h-screen">
        {children}
      </div>
    </>
  );
}