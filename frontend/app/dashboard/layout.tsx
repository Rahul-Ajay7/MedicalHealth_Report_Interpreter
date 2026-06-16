'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/superbaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Navbar is rendered globally by LayoutWrapper — don't render it again here.
  return <>{children}</>;
}