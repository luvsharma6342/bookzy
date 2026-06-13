import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: June 13, 2026
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200/50 space-y-8">
          <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-sm">
            <Shield className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500" />
            <p>
              Please read these Terms & Conditions carefully before using the Bookze SaaS booking platform. By accessing or using the platform, you agree to be bound by these terms.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">1. Operating Structure</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Bookze (referred to as "we", "us", or "our") is owned and operated by <strong>Luv Sharma</strong> as a Sole Proprietorship business in India. These Terms & Conditions constitute a legally binding agreement between you (as a merchant, salon owner, tutor, or individual business operator) and the Proprietor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">2. Subscription Terms</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Bookze offers modular subscription tiers (Free, Growth, Pro) for our digital booking storefront services. 
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
              <li>Subscriptions are billed in advance on a recurring monthly or annual basis.</li>
              <li>You agree to provide accurate billing details and keep your payment method updated.</li>
              <li>Failure to settle subscription dues may lead to account downgrades or suspension.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">3. Payment & Billing Terms</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Online payments for Bookze subscriptions are processed securely through <strong>Razorpay Software Private Limited</strong>. By subscribing, you agree to Razorpay's terms of service and consent to the payment processing mechanisms. Dues are collected in Indian Rupees (INR) unless stated otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">4. Cancellations & Refund Policy Reference</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              All billing transactions are governed by our **Refund & Cancellation Policy**. Monthly subscription charges are non-refundable after activation. You may cancel your subscription renewal at any time directly through your dashboard settings. No partial refunds or pro-rated credits are provided for unused billing cycles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">5. User Responsibilities & Conduct</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              As a merchant on Bookze, you are fully responsible for:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
              <li>Securing your account credentials and password details.</li>
              <li>All content (services, prices, listings, timings) published on your public booking page.</li>
              <li>Fulfilling the bookings made by clients and ensuring appropriate communications.</li>
              <li>Compliance with local laws and regulations regarding the services you advertise.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">6. Account Suspension & Termination</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We reserve the right to suspend or terminate your account access immediately, without prior notice or liability, under our sole discretion, including if you breach these Terms. You may terminate your account at any time by stopping payment and contacting support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">7. Limitation of Liability</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              In no event shall Bookze, its proprietor, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the platform.
            </p>
          </section>

          <section className="space-y-3 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-xs">
              If you have any questions regarding these Terms & Conditions, please contact us at{" "}
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
