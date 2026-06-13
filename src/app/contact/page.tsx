"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowLeft, Send } from "lucide-react";

export default function ContactPage() {
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
        <div className="text-center mb-12">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-md mx-auto mb-4">
            B
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-title">
            Contact Us
          </h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">
            Have questions about billing, API configurations, or custom solutions? Reach out to us directly.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="md:col-span-5 bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/50 space-y-6">
            <h2 className="text-xl font-bold font-title">Company Info</h2>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Office Address</h4>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    Sector 18, Noida,<br />
                    Uttar Pradesh, 201301, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Support Email</h4>
                  <a href="mailto:support@bookzy.in" className="text-sm text-indigo-600 hover:underline mt-1 block font-medium">
                    support@bookzy.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Support</h4>
                  <a href="tel:+917668861953" className="text-sm text-slate-700 hover:text-indigo-600 transition mt-1 block font-medium">
                    +91 7668861953
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
              <strong>Sole Proprietorship Details:</strong><br />
              Bookzy Platform is owned and operated by Luv Sharma as a registered Sole Proprietor in Uttar Pradesh, India.
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="md:col-span-7 bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/50">
            <h2 className="text-xl font-bold font-title mb-6">Send Us a Message</h2>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                alert("Thank you! Your message has been sent successfully. We will get back to you shortly.");
                (e.target as HTMLFormElement).reset();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="john@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Subject</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Billing Inquiry, Help, custom quote..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Message Text</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Briefly describe your request..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Send Query</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
