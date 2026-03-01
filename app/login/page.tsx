"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [tab, setTab] = useState<"user" | "admin">("user");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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

  /* ── Admin secret login ────────────────────────────────────────── */
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      // Verify secret by hitting admin API
      const res = await fetch(
        `/api/admin/subscribers?secret=${encodeURIComponent(adminSecret)}`
      );
      if (!res.ok) {
        setStatus("error");
        setMessage("Invalid admin secret.");
        return;
      }
      // Valid — store in sessionStorage and redirect
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
              onClick={() => { setTab(t); setStatus("idle"); setMessage(""); }}
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
            /* ── User magic link ─────────────────────────────────── */
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
                    No password needed. We'll email you a secure link.
                  </p>
                </form>
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
          Not subscribed yet?{" "}
          <Link href="/" className="text-blue-400 hover:underline">
            Subscribe for free
          </Link>
        </p>
      </div>
    </div>
  );
}
