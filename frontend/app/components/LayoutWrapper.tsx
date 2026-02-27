'use client'

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar =
    pathname === "/login" || pathname === "/signup";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div className="bg-slate-50 min-h-screen">
        {children}
      </div>
    </>
  );
}