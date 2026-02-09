"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      pathname === path
        ? "bg-blue-500 text-white"
        : "text-slate-600 hover:bg-blue-100"
    }`;

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <h1 className="font-bold text-lg text-blue-600">
        HealthAI
      </h1>

      {/* Links */}
      <div className="flex gap-3">
        <Link href="/" className={linkClass("/")}>
          Home
        </Link>
        <Link href="/history" className={linkClass("/history")}>
          History
        </Link>
      </div>
    </nav>
  );
}
