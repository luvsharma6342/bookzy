"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Lock, Mail, User, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bizName = searchParams.get("bizName");
  const category = searchParams.get("category");

  const [isLogin, setIsLogin] = useState(!bizName);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message || "Invalid email or password");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        // Sign Up
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (signUpError) {
          setError(signUpError.message || "Failed to create account");
        } else {
          // If a business was requested on landing page, create it now
          if (bizName) {
            try {
              const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              await fetch("/api/businesses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: bizName,
                  slug: slug || "my-store",
                  category: category || "Salons & Beauty Parlours",
                }),
              });
            } catch (err) {
              console.error("Auto-creation of business failed:", err);
            }
          }
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative bg-[#f8fafc] text-[#0f172a] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              B
            </span>
            <span className="text-2xl font-extrabold tracking-tight font-title">
              Bookzy
            </span>
          </Link>
          <h2 className="text-2xl font-bold font-title">
            {isLogin ? "Welcome Back" : "Grow Your Business"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin
              ? "Access your WhatsApp bookings dashboard"
              : "Create an owner account and set up your booking link"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-slate-200/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Register Business"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center mt-6 pt-5 border-t border-slate-100 text-sm text-slate-500">
            {isLogin ? (
              <>
                New to Bookzy?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
            ← Back to Platform Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-[#0f172a]">
        <div className="text-center">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md mx-auto mb-4 animate-bounce">
            B
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading auth details...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
