import Link from "next/link";
import {
  Activity, FileText, Languages, ShieldCheck, AlertTriangle,
  LineChart, ArrowRight, CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Instant report analysis",
    body: "Upload a blood or urine report. We read it, flag every abnormal value, and explain the likely cause and consequence in plain words.",
  },
  {
    icon: Languages,
    title: "Your language, 22 of them",
    body: "Explanations and chat in Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Punjabi, Urdu and more — not just English.",
  },
  {
    icon: AlertTriangle,
    title: "Critical-value alerts",
    body: "Dangerous (panic) values are flagged clearly with a prompt to seek urgent care — so nothing important is missed.",
  },
  {
    icon: LineChart,
    title: "History & trends",
    body: "Every report is saved. Track each parameter over time and see where your health is heading.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    body: "Your data is encrypted, access-controlled, and yours to delete anytime. Built to India's DPDP Act 2023.",
  },
  {
    icon: Activity,
    title: "Understand, don't self-diagnose",
    body: "We help you understand your report and what to ask your doctor — never a diagnosis or a prescription.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1F1A] text-white overflow-hidden relative">

      {/* Ambient glow */}
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-[-10%] w-[420px] h-[420px] rounded-full bg-teal-400/8 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-screen-xl mx-auto px-5 md:px-8 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold tracking-tight">HealthAI</span>
        </div>
        <nav className="ml-auto flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-[#0B1F1A] rounded-lg px-4 py-1.5 transition"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-screen-xl mx-auto px-5 md:px-8 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-[0.2em] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Made for India
        </span>
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] max-w-3xl mx-auto">
          Understand your lab report<br />
          <span className="text-teal-400">in your own language.</span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed">
          Upload a blood or urine report. Get a clear, plain-language explanation of
          what every value means — in the Indian language you speak.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-[#0B1F1A] font-bold rounded-xl px-6 py-3 transition shadow-lg shadow-teal-500/20"
          >
            Analyze my report
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold rounded-xl px-6 py-3 border border-white/10 hover:border-white/20 transition"
          >
            I already have an account
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-5">
          Free to start · No report stored without your consent
        </p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-screen-xl mx-auto px-5 md:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center mb-4">
                <Icon size={18} className="text-teal-400" />
              </div>
              <h3 className="font-semibold mb-1.5">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative z-10 max-w-screen-xl mx-auto px-5 md:px-8 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
          {[
            "Plain-language explanations",
            "22 Indian languages",
            "Critical-value alerts",
            "Encrypted & DPDP-aligned",
          ].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-400" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Footer + disclaimer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            <span className="font-semibold text-slate-400">Not medical advice.</span>{" "}
            HealthAI is an informational tool to help you understand your lab report. It
            does not diagnose, treat, or replace a doctor. Always consult a registered
            medical professional for health decisions.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy</Link>
            <span>© 2026 HealthAI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
