import { ShieldCheck, Lock, Database, Info, Scale, FileCheck, Globe } from "lucide-react";

const policies = [
  {
    icon: Database,
    title: "We Don't Keep Your Original Report",
    body: "Your uploaded file (PDF or image) is used only to read the values, then deleted from our storage as soon as the analysis succeeds — we do not retain the original report. What we keep is the summarized result: the extracted parameter values and analysis, stored securely in our backend (Supabase) and linked to your account so you can see your history and trends. You can permanently delete this summary at any time, which removes all associated data from our systems.",
  },
  {
    icon: Globe,
    title: "AI Processing Outside India",
    body: "To explain your results and power the chat assistant, we send de-identified clinical data — your extracted lab values and the gender you selected — along with the questions you type, to third-party AI providers (Groq and Google Gemini) whose servers may be located outside India. We never send your name, email, account ID, or the original report file to these providers. We do not send your age. These transfers rely on the providers' contractual and security commitments.",
  },
  {
    icon: Lock,
    title: "Data Security & Access Control",
    body: "Data is encrypted in transit (TLS) and at rest (AES-256) by our backend provider, Supabase. Row-Level Security ensures each user can access only their own data. Authentication uses Supabase Auth with JWT tokens — we never store your password on our servers.",
  },
  {
    icon: Info,
    title: "Informational Use Only",
    body: "HealthAI is an informational-assistance tool only. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions. Insights are based on general population reference ranges and on values auto-extracted by OCR, which can contain errors — always confirm against your original printed report.",
  },
  {
    icon: Scale,
    title: "DPDP Act 2023 Compliance",
    body: "We process your personal data only for the specific purpose of lab report analysis, and only with your explicit consent. You have the right to access, correct, and erase your data. Data retention is limited to what is necessary for this purpose, and we keep records of our processing activities. Cross-border processing is limited to the AI explanation described above.",
  },
  {
    icon: FileCheck,
    title: "Your Rights & Choices",
    body: "You can permanently delete any report (and all its data) yourself from your History page at any time. You may also request a copy of your data or withdraw your consent by contacting our Data Protection Officer. We do not sell, rent, or share your personal data with third parties for advertising or marketing.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm text-slate-500 ml-[52px] mb-8">
          Last updated: June 17, 2026
        </p>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 text-sm text-slate-600 leading-relaxed">
          <p className="mb-3">
            At HealthAI, your privacy is a fundamental commitment. This policy describes how we collect, use, store, and protect your information when you use our blood report analysis platform.
          </p>
          <p>
            By using HealthAI, you consent to the practices described in this policy — including the processing of your lab values by AI providers located outside India, as explained below. We process your data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and applicable data protection laws.
          </p>
        </div>

        {/* Policy Cards */}
        <div className="space-y-4">
          {policies.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6 text-sm text-slate-600 leading-relaxed">
          <h2 className="font-bold text-slate-800 mb-2">Contact</h2>
          <p>
            For privacy-related inquiries, data requests, or grievances under the DPDP Act 2023, please contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@healthai.com" className="text-teal-600 hover:underline">privacy@healthai.com</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
