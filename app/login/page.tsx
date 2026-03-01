"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import Link from "next/link";

type Tab = "user" | "admin";
type AuthMode = "magic" | "password";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [tab, setTab] = useState<Tab>("user");
  const [authMode, setAuthMode] = useState<AuthMode>("magic");
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function resetState() {
    setStatus("idle");
    setMessage("");
    setPassword("");
  }

  /* ── Magic-link login ──────────────────────────────────────────── */
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://aitools.disruptiveexperience.com";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteUrl}/api/auth/callback?next=/profile`,
        },
      });
      if (error) throw error;
      setStatus("success");
      setMessage("Check your inbox — we sent you a magic link!");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to send link.");
    }
  }

  /* ── Email + Password ──────────────────────────────────────────── */
  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("loading");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus("success");
        setMessage("Account created! Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If not found, suggest signing up
          if (error.message.toLowerCase().includes("invalid login")) {
            setStatus("error");
            setMessage("Wrong email or password. New here? Switch to Sign Up below.");
          } else {
            throw error;
          }
          return;
        }
        window.location.href = "/profile";
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  /* ── Admin secret login ────────────────────────────────────────── */
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/subscribers?secret=${encodeURIComponent(adminSecret)}`
      );
      if (!res.ok) {
        setStatus("error");
        setMessage("Invalid admin secret.");
        return;
      }
      sessionStorage.setItem("adminSecret", adminSecret);
      window.location.href = "/admin";
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6">
            ← Back to tools
          </Link>
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-white font-bold text-2xl">Sign In</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your subscription or access admin
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-[#1e2d4a] p-1 mb-6 bg-[#0d1424]">
          {(["user", "admin"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); resetState(); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "user" ? "👤 Subscriber" : "🔧 Admin"}
            </button>
          ))}
        </div>

        <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-2xl p-6">
          {tab === "user" ? (
            /* ── User: Magic Link or Password ───────────────────── */
            <>
              {/* Auth mode toggle */}
              <div className="flex gap-2 mb-5">
                {([
                  { value: "magic" as const, label: "🔗 Magic Link" },
                  { value: "password" as const, label: "🔑 Password" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAuthMode(opt.value); resetState(); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      authMode === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-transparent border-[#1e2d4a] text-slate-400 hover:border-blue-500/40 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* ── Magic link form ─────────────────────────────── */}
              {authMode === "magic" && (
                <>
                  {status === "success" ? (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-3">📬</div>
                      <p className="text-green-400 font-semibold">{message}</p>
                      <p className="text-slate-500 text-sm mt-2">
                        Click the link in your email to access your profile.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div>
                        <label className="block text-slate-400 text-sm mb-1.5">
                          Your email address
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                        />
                      </div>
                      {status === "error" && (
                        <p className="text-red-400 text-xs">{message}</p>
                      )}
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                      >
                        {status === "loading" ? "Sending…" : "Send Magic Link →"}
                      </button>
                      <p className="text-slate-600 text-xs text-center">
                        No password needed — we&apos;ll email you a secure one-click link.
                      </p>
                    </form>
                  )}
                </>
              )}

              {/* ── Password form ───────────────────────────────── */}
              {authMode === "password" && (
                <>
                  {status === "success" ? (
                    <div className="text-center py-4">
                      <div className="text-4xl mb-3">✅</div>
                      <p className="text-green-400 font-semibold">{message}</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePassword} className="space-y-4">
                      <div>
                        <label className="block text-slate-400 text-sm mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-sm mb-1.5">
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                        />
                      </div>
                      {status === "error" && (
                        <p className="text-red-400 text-xs">{message}</p>
                      )}
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                      >
                        {status === "loading"
                          ? "Please wait…"
                          : isSignUp
                          ? "Create Account →"
                          : "Sign In →"}
                      </button>
                      <p className="text-center text-xs text-slate-500">
                        {isSignUp ? "Already have an account? " : "New here? "}
                        <button
                          type="button"
                          onClick={() => { setIsSignUp(!isSignUp); resetState(); }}
                          className="text-blue-400 hover:underline"
                        >
                          {isSignUp ? "Sign In" : "Create Account"}
                        </button>
                      </p>
                    </form>
                  )}
                </>
              )}
            </>
          ) : (
            /* ── Admin secret ────────────────────────────────────── */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Admin secret
                </label>
                <input
                  type="password"
                  placeholder="Enter admin secret"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  required
                  className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                />
                <p className="text-slate-600 text-xs mt-2">
                  This is the <code className="text-slate-400">ADMIN_SECRET</code> value
                  set in Vercel → Settings → Environment Variables.
                </p>
              </div>
              {status === "error" && (
                <p className="text-red-400 text-xs">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {status === "loading" ? "Checking…" : "Access Admin →"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to tools
          </Link>
        </p>
      </div>
    </div>
  );
}
