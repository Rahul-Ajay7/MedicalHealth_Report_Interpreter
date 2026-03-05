'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/superbaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, []);

  return <>{children}</>;
}