"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, Clock, LogOut } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: Clock },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">HealthAI</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 transition ml-auto px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}