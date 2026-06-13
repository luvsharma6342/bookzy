import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function RefundPage() {
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
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last Updated: June 13, 2026
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200/50 space-y-8">
          <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-sm">
            <RefreshCw className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500 animate-spin-slow" />
            <p>
              Please read our cancellation and billing policies details below. By subscribing to any growth or pro packages on Bookzy, you agree to these refund terms.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">1. Operating Entity</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Bookzy is owned and operated by <strong>Luv Sharma</strong> as a Sole Proprietorship firm registered in India. All subscription fees are processed under the Proprietor's accounts via Razorpay secure gateways.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">2. Subscription Cancellation</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              You retain the freedom to cancel your Bookzy subscription plan at any time:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
              <li>Cancellations must be requested or executed directly in your merchant panel settings before the next renewal invoice date.</li>
              <li>When you cancel, your subscription will remain active until the end of your current billing cycle.</li>
              <li>You will not be charged for subsequent renewals once the cancellation is registered.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">3. Refund Terms</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Bookzy operates on a strict **No Refund** framework:
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 pl-2">
              <li><strong>Monthly Packages:</strong> Monthly plans are non-refundable after activation or auto-renewal charge. We do not provide pro-rated or partial refunds for unused days inside the active billing period.</li>
              <li><strong>Annual Packages:</strong> Annual plans are non-refundable after 3 days of activation. If you experience technical errors preventing the use of the platform within the first 3 days of registration, please contact support for details.</li>
              <li><strong>No-Shows & Client Bookings:</strong> Bookzy is a booking facilitator software. We do not handle payment collection or disputes arising between you (the merchant) and your clients/customers. Refund terms for physical services belong strictly to your own business policies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold font-title border-b border-slate-100 pb-2">4. Disputed Billings & Processing Errors</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              If you believe you have been charged incorrectly due to gateway processing double-debits, please contact our billing desk immediately at <a href="mailto:support@bookzy.in" className="text-indigo-600 hover:underline">support@bookzy.in</a>. Any confirmed billing anomalies are investigated, and if valid, resolved by triggering refunds directly through the Razorpay panel to the original payment source.
            </p>
          </section>

          <section className="space-y-3 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-xs">
              If you have any cancellation queries or billing issues regarding our Refund Policy, please contact us at{" "}
              <a href="mailto:support@bookzy.in" className="text-indigo-600 hover:underline">
                support@bookzy.in
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
