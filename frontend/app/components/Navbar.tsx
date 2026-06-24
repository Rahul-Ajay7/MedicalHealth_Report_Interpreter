"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Clock, LogOut, Shield } from "lucide-react";
import { supabase } from "../lib/superbaseClient";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/dashboard",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "History",   icon: Clock },
  { href: "/privacy",           label: "Privacy",   icon: Shield },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();   // ✅ Supabase logout instead of localStorage
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">HealthAI</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}