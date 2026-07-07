'use client';

import React, { useState } from 'react';
import { Business } from '@/lib/db';
import { Copy, QrCode, CheckCircle, Share2, Smartphone, Link as LinkIcon, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import copy from 'copy-to-clipboard';

interface ShareViewProps {
  business: Business;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ShareView({ business, showToast }: ShareViewProps) {
  const [copied, setCopied] = useState(false);

  const storefrontUrl = `https://bookze.vercel.app/book/${business.slug}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(storefrontUrl)}`;

  const handleCopyLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent parent clicks or form submissions from interrupting the action
    e.preventDefault();
    e.stopPropagation();

    // MUST NOT BE ASYNC. Async event handlers lose the "user gesture" context 
    // required by browsers for execCommand('copy') to work on mobile/non-secure IPs.

    let isCopied: any = false;
    try {
      // 1. Synchronous fallback for HTTP/LAN testing or older browsers
      isCopied = copy(storefrontUrl) as any; // Bypass incorrect TS inference
    } catch (err) {
      console.error("copy-to-clipboard error:", err);
    }

    if (isCopied) {
      setCopied(true);
      if (showToast) showToast("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 3000);
      return; // Exit function immediately on success
    }

    // 2. If the library fails, try modern clipboard API as a last resort
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(storefrontUrl)
        .then(() => {
          setCopied(true);
          if (showToast) showToast("Copied to clipboard", "success");
          setTimeout(() => setCopied(false), 3000);
        })
        .catch((err) => {
          console.error("Clipboard failure:", err);
          if (showToast) showToast("Failed to copy link. Please select and copy manually.", "error");
        });
    } else {
      if (showToast) showToast("Failed to copy link. Please select and copy manually.", "error");
    }
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${business.slug}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("QR Code downloaded!", "success");
    } catch (error) {
      showToast("Failed to download QR code", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 relative">
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-3xl font-extrabold font-title tracking-tight text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-lg shadow-pink-500/20">
            <Share2 size={24} className="text-white" />
          </div>
          Share Storefront
        </h1>
        <p className="text-slate-400 max-w-xl">
          Get more bookings by putting your beautiful mini-storefront in front of your customers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Left Column: Link & Socials */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border border-slate-800 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Smartphone size={20} className="text-pink-500" />
              Link in Bio
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Paste this link in your Instagram, TikTok, and Facebook bio to convert followers into paying customers instantly.
            </p>

            <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 mb-6 relative">
              <LinkIcon size={16} className="text-slate-500 shrink-0" />
              <span className="text-sm font-medium text-slate-300 truncate select-all">{storefrontUrl}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyLink}
              className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${copied
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
                }`}
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Storefront Link'}
            </motion.button>
          </div>

          <div className="glass-panel p-6 border border-slate-800 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Pro Tips for Growth 🚀</h3>
            <ul className="text-sm text-slate-400 space-y-3 mt-4">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>Add <strong>"Book Here 👇"</strong> right above the link in your Instagram bio.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <span>Print the QR Code and put it on your front desk so walk-ins can book their next appointment before leaving.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                <span>Share your link directly in WhatsApp groups or Facebook community posts.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: QR Code */}
        <div className="flex flex-col h-full">
          <div className="glass-panel p-8 border border-slate-800 rounded-2xl flex flex-col items-center text-center h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />

            <div className="mb-6 inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full">
              <QrCode size={28} className="text-indigo-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Storefront QR Code</h3>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
              Patients and customers can scan this with their phone camera to instantly open your booking page.
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/50 mb-8 relative z-10 group-hover:scale-105 transition-transform duration-500">
              {/* Using a standard img tag with an external QR API */}
              <img
                src={qrCodeUrl}
                alt="Storefront QR Code"
                className="w-48 h-48 md:w-56 md:h-56 object-contain"
                crossOrigin="anonymous"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadQR}
              className="mt-auto py-2.5 px-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all w-full sm:w-auto"
            >
              <Download size={18} />
              Download QR Code Image
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
