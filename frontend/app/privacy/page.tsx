import { ShieldCheck, Lock, Database, Info, Scale, FileCheck } from "lucide-react";

const policies = [
  {
    icon: Database,
    title: "No Raw Health Data Storage",
    body: "HealthAI does not store raw blood report images or PDFs beyond the duration necessary to generate your analysis. Extracted parameter values are stored in an anonymized, de-identified format. You may delete your reports at any time, which permanently removes all associated data from our systems.",
  },
  {
    icon: Lock,
    title: "Data Security & Supabase",
    body: "All data is encrypted in transit (TLS 1.3) and at rest using AES-256. We use Supabase as our backend, which provides Row-Level Security ensuring each user can only access their own data. Authentication is handled via Supabase Auth with JWT tokens — we never store passwords on our servers.",
  },
  {
    icon: Info,
    title: "Informational Use Only",
    body: "HealthAI is a informational-assistance tool only. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions. The insights generated are based on general population reference ranges and may not be accurate for your individual health condition.",
  },
  {
    icon: Scale,
    title: "DPDP Act 2023 Compliance",
    body: "We comply with the Digital Personal Data Protection Act, 2023 (DPDP Act 2023). Your personal data is processed only for the specific purpose of blood report analysis with your explicit consent. You have the right to access, correct, and erase your data. Data retention is limited to what is necessary for the stated purpose, and we maintain transparent records of all data processing activities.",
  },
  {
    icon: FileCheck,
    title: "Your Rights & Choices",
    body: "You may request a copy of your data, withdraw consent at any time, or request permanent deletion by contacting our Data Protection Officer. We do not sell, rent, or share your personal data with third parties for advertising or marketing purposes. Data is never transferred outside India without adequate safeguards as required under the DPDP Act 2023.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F0F4F9] px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm text-slate-500 ml-[52px] mb-8">
          Last updated: May 22, 2026
        </p>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 text-sm text-slate-600 leading-relaxed">
          <p className="mb-3">
            At HealthAI, your privacy is a fundamental commitment. This policy describes how we collect, use, store, and protect your information when you use our blood report analysis platform.
          </p>
          <p>
            By using HealthAI, you consent to the practices described in this policy. We process your data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and applicable data protection laws.
          </p>
        </div>

        {/* Policy Cards */}
        <div className="space-y-4">
          {policies.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-blue-600" />
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
            <a href="mailto:privacy@healthai.com" className="text-blue-600 hover:underline">privacy@healthai.com</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
