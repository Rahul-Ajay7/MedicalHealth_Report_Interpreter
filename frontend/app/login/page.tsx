'use client'

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Activity, Loader2, HeartPulse, FlaskConical, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/superbaseClient";

export default function Login() {
  const [username,      setUsername]      = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", username.trim())
      .single();

    if (profileError || !profile) {
      setError("Username not found. Please check and try again.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    profile.email,
      password,
    });

    if (signInError) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex overflow-hidden relative">

      {/* ══ DARK LEFT PANEL ══ */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%] bg-[#0B1F1A] z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full border border-teal-500/10" />
        <div className="absolute -top-8 -left-8 w-[280px] h-[280px] rounded-full border border-teal-500/15" />
        <div className="absolute bottom-[-80px] left-[30%] w-[360px] h-[360px] rounded-full border border-teal-400/8" />
        <div className="absolute top-1/2 right-[15%] w-[180px] h-[180px] rounded-full border border-teal-500/12" />
        <div className="absolute top-[25%] left-[20%] w-72 h-72 rounded-full bg-teal-500/10 blur-[90px]" />
        <div className="absolute bottom-[15%] left-[5%] w-48 h-48 rounded-full bg-teal-400/8 blur-[60px]" />

        <div className="relative z-10 h-full flex flex-col justify-between px-14 py-12 pr-28">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">HealthAI</span>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Medical Report Interpreter
              </span>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Your results,<br />
                <span className="text-teal-400">finally clear.</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
                AI-powered analysis of blood reports — get plain-language insights in seconds.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: HeartPulse,   label: "CBC & Metabolic Panels", sub: "Fully supported"     },
                { icon: FlaskConical, label: "40+ Blood Parameters",   sub: "Auto-analyzed"       },
                { icon: ShieldCheck,  label: "100% Private",           sub: "Secured by Supabase" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3.5 bg-white/5 border border-white/8 rounded-2xl px-4 py-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">{label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2026 HealthAI</p>
        </div>
      </div>

      {/* ══ DIAGONAL SLASH ══ */}
      <div
        className="hidden lg:block absolute inset-y-0 right-0 z-10 bg-[#F0F4F9]"
        style={{ left: "48%", clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      />

      {/* ══ FORM ══ */}
      <div className="relative z-20 flex flex-1 items-center justify-end pr-10 lg:pr-16 xl:pr-24">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Activity size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">HealthAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1.5">Enter your credentials to continue</p>
          </div>

          {/* ── Username + Password form ── */}
          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <Input
                type="text"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm pr-11 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3.5 py-2.5 rounded-xl overflow-hidden"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember"
                className="border-slate-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 rounded-md"
              />
              <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 transition-all duration-200"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>

          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* ── Google Button (below form) ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm text-slate-700 font-semibold text-sm rounded-xl transition-all duration-200 mt-4 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-slate-400" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-7 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <a href="/signup" className="text-teal-600 font-bold hover:text-teal-700 transition">
                Create one free
              </a>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}