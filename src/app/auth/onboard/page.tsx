"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // checking whether they already have a business

  // Once session is ready, check if user already has a business
  useEffect(() => {
    if (isPending) return;

    // Not logged in → send to auth page
    if (!session?.user) {
      router.replace("/auth");
      return;
    }

    // Check if they already have a business set up
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Already onboarded — skip straight to dashboard
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = phone.trim();
    if (!cleaned) {
      setError("Please enter your WhatsApp phone number.");
      return;
    }

    setLoading(true);
    try {
      // Create a minimal business profile so the merchant can finish setup in the dashboard
      const name = session?.user?.name || "My Business";
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "my-store";

      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          phone: cleaned,
          category: "Salons & Beauty Parlours",
          city: "",
          description: "",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // If slug collision, try with a random suffix
        if (body?.error?.includes("slug") || res.status === 409) {
          const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
          const retry = await fetch("/api/businesses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              slug: retrySlug,
              phone: cleaned,
              category: "Salons & Beauty Parlours",
              city: "",
              description: "",
            }),
          });
          if (!retry.ok) throw new Error("Failed to create your business profile.");
        } else {
          throw new Error(body?.error || "Failed to create your business profile.");
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // While checking session or business existence
  if (isPending || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md animate-pulse">
            B
          </div>
          <p className="text-sm text-slate-500 font-medium">Setting up your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative bg-[#f8fafc] text-[#0f172a] overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              B
            </span>
            <span className="text-2xl font-extrabold tracking-tight font-title">Bookze</span>
          </Link>

          {/* Welcome badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <CheckCircle2 size={14} />
            Google account connected
          </div>

          <h2 className="text-2xl font-bold font-title mt-1">One last step</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your WhatsApp number so customers can reach you &amp; book appointments.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-slate-200/50">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                WhatsApp Business Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Customers will send booking requests to this number via WhatsApp.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Setting up…</span>
                </>
              ) : (
                <>
                  <span>Go to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            You can update this number anytime from your dashboard settings.
          </p>
        </div>
      </div>
    </div>
  );
}
