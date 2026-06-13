import Link from "next/link";
import { Sparkles, Users, Target, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] py-12 px-4 relative overflow-hidden font-body">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-md mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-title">
            About Bookze
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto text-base">
            Empowering service entrepreneurs and local business owners across India with frictionless, WhatsApp-first booking technology.
          </p>
        </div>

        {/* Brand Mission & Story */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-10 shadow-xl border border-slate-200/50 space-y-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="badge badge-primary">Our Story</span>
              <h2 className="text-2xl font-bold font-title">Simplifying Local Commerce</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Bookze was born out of a simple observation: millions of barbers, trainers, doctors, and tutors in India schedule appointments manually over messy calls and WhatsApp chats. Traditional booking apps are heavy, require app installs, and drop client conversions.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                We designed a lightweight web storefront creator that takes under 5 minutes to set up, requires zero client app downloads, and redirects the booking details directly to WhatsApp—where Indian customers spend most of their digital time.
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-6 border border-indigo-100/50 flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <Target className="text-indigo-600 w-6 h-6" />
                <h4 className="font-bold font-title text-slate-800">Our Mission</h4>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                To build high-speed, SEO-optimized, and beautiful digital storefront links for local merchants, lowering customer dropoffs and automating no-shows via WhatsApp notification workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-md border border-slate-200/50 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-bold font-title">Vibrant Aesthetics</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              We believe local store booking pages should look just as premium and stunning as top-tier global software tools.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-md border border-slate-200/50 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="text-base font-bold font-title">Proprietorship Focus</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Built, designed, and operated dynamically as a Sole Proprietorship business in India to support local growth.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-md border border-slate-200/50 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-base font-bold font-title">Secure Billing</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Partnering directly with leading payment systems like Razorpay to assure safe, immediate, and fully compliant billing structures.
            </p>
          </div>
        </div>

        {/* Developer & Legal Details */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-lg font-bold font-title">Founder Details & Operating Registration</h3>
            <p className="text-slate-400 text-xs mt-1">
              Bookze Platform is a Sole Proprietorship founded by <strong>Luv Sharma</strong>.
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Primary Office: Noida, Sector 18, Uttar Pradesh, 201301, India.
            </p>
          </div>
          <Link href="/contact" className="btn btn-primary btn-sm shrink-0">
            Contact Founder
          </Link>
        </div>
      </div>
    </div>
  );
}
