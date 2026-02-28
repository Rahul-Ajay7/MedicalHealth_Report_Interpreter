'use client'

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Activity, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface User { username: string; password: string; }

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score =
    password.length < 6 ? 1 :
    password.length < 9 ? 2 :
    /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  const cfg = [
    { label: "Too short", bar: "bg-red-400",    text: "text-red-500"    },
    { label: "Weak",      bar: "bg-orange-400", text: "text-orange-500" },
    { label: "Good",      bar: "bg-teal-400",   text: "text-teal-600"   },
    { label: "Strong",    bar: "bg-teal-600",   text: "text-teal-700"   },
  ][score - 1];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 pt-0.5">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? cfg.bar : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
    </motion.div>
  );
}

export default function Signup() {
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [confirm,  setConfirm]          = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [error,  setError]              = useState('');
  const [loading, setLoading]           = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    if (password !== confirm)  return setError("Passwords do not match.");
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.username === username)) return setError("Username already taken.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));
    router.push("/login");
  };

  const confirmMatch    = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex overflow-hidden relative">

      {/* ══ DARK LEFT PANEL ══ */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%] bg-[#0B1F1A] z-0 overflow-hidden">

        <div className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full border border-teal-500/10" />
        <div className="absolute -top-8  -left-8  w-[280px] h-[280px] rounded-full border border-teal-500/15" />
        <div className="absolute bottom-[-80px] left-[30%] w-[360px] h-[360px] rounded-full border border-teal-400/8" />
        <div className="absolute top-1/2 right-[15%] w-[180px] h-[180px] rounded-full border border-teal-500/12" />
        <div className="absolute top-[25%] left-[20%] w-72 h-72 rounded-full bg-teal-500/10 blur-[90px]" />
        <div className="absolute bottom-[15%] left-[5%]  w-48 h-48 rounded-full bg-teal-400/8  blur-[60px]" />

        <div className="relative z-10 h-full flex flex-col justify-between px-14 py-12 pr-28">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">HealthAI</span>
          </div>

          {/* Hero */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Get started free
              </span>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Know what your<br />
                <span className="text-teal-400">numbers mean.</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
                Create your account and start decoding your health reports with AI — under a minute.
              </p>
            </div>

            {/* Perk list */}
            <div className="space-y-3.5">
              {[
                "Instant CBC & metabolic panel analysis",
                "Plain-language health explanations",
                "Lifestyle & supplement recommendations",
                "100% private — data stays on your device",
              ].map((perk) => (
                <div key={perk} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={13} className="text-teal-400" />
                  </div>
                  <p className="text-slate-300 text-sm">{perk}</p>
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
        style={{
          left: "48%",
          clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)",
        }}
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

          <div className="mb-7">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Create account</h1>
            <p className="text-slate-500 text-sm mt-1.5">Set up your free HealthAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <Input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
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
              <PasswordStrength password={password} />
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={`h-12 bg-white text-slate-800 placeholder:text-slate-400 rounded-xl shadow-sm pr-11 transition-all focus:ring-2 ${
                    confirmMismatch ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                    : confirmMatch  ? "border-teal-400 focus:border-teal-500 focus:ring-teal-500/20"
                    : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
                <AnimatePresence>
                  {confirmMatch && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-10 top-1/2 -translate-y-1/2"
                    >
                      <CheckCircle2 size={15} className="text-teal-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3.5 py-2.5 rounded-xl overflow-hidden"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 transition-all duration-200"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
            </button>

          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <a href="/login" className="text-teal-600 font-bold hover:text-teal-700 transition">
                Sign in
              </a>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}