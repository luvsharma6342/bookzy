import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] py-12 px-4 relative overflow-hidden font-body">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto z-10 relative">
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-md mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-title">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: June 13, 2026
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200/50 space-y-8">
          <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-sm">
            <Eye className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500" />
            <p>
              Your privacy is of utmost importance to us. This Privacy Policy details how Bookze collects, stores, protects, and utilizes the data you share when using our SaaS platforms.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">1. Operating Entity</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Bookze is owned and operated by <strong>Luv Sharma</strong> as a Sole Proprietorship firm registered in India. The Proprietor is the primary data controller responsible for managing the security of your stored business and customer records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">2. What Data We Collect</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We collect information that helps deliver booking services:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 pl-2">
              <li><strong>Merchant Account Details:</strong> Name, business email, encrypted login password, and verification statuses.</li>
              <li><strong>Storefront Catalog details:</strong> Service descriptions, pricing catalog, timings, staff roster, and shop names.</li>
              <li><strong>Customer Booking Details:</strong> Customer name, contact phone number, chosen services, dates, and WhatsApp transaction timings (created when customers request appointments).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">3. How We Store & Protect Your Data</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              All databases and server endpoints are hosted with secure cloud provider environments using SSL encryption in transit. Password hashes are salted and encrypted client-side using industry-standard hashing before database insertion. We use standard web practices to prevent unauthorized entry or leaks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">4. Third-Party Services Used</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We integrate with trusted third-party providers to deliver essential billing, notification, and automation services:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 pl-2">
              <li><strong>Razorpay:</strong> Processes all recurring billing and subscription payments securely. We do not store credit card credentials on our servers.</li>
              <li><strong>OpenAI:</strong> Powers the AI booking chatbot flows on the Pro tier.</li>
              <li><strong>Twilio / Meta (WhatsApp Business APIs):</strong> Dispatches reservation reminders, notification triggers, and calendar sync updates.</li>
              <li><strong>Google:</strong> Handles OAuth authentication integrations and Google Calendar availability sync.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">5. User Rights</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              You retain full control over your personal and business data. You have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
              <li>Access and review all data stored in your merchant dashboard account.</li>
              <li>Request modification or permanent deletion of your account and related booking records.</li>
              <li>Opt-out of automation services or reminders at any time.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">6. Changes to this Policy</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to align with structural features or legal updates. Updates are published immediately on this route page.
            </p>
          </section>

          <section className="space-y-3 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-xs">
              If you have any questions or data request queries regarding this Privacy Policy, please contact us at{" "}
              <a href="mailto:luvsharma105@gmail.com" className="text-indigo-600 hover:underline">
                luvsharma105@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
