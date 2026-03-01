"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to tools
        </Link>

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✉️</div>
          <h1 className="text-white font-bold text-2xl mb-2">Contact Us</h1>
          <p className="text-slate-400 text-sm">
            Have a question, idea, or bug report? Send us a message.
          </p>
        </div>

        <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-2xl p-6">
          {status === "success" ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-white font-bold text-lg mb-2">Message Sent!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Thanks for reaching out. We'll get back to you soon.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="text-blue-400 hover:underline text-sm"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    placeholder="Your name"
                    className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  placeholder="What's this about?"
                  className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  required
                  rows={5}
                  placeholder="Your message…"
                  className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {status === "loading" ? "Sending…" : "Send Message →"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Built by{" "}
          <a
            href="https://disruptiveexperience.com"
            className="text-blue-400 hover:underline"
          >
            Disruptive Experience
          </a>
          {" · "}
          <a
            href="https://github.com/ptulin/autoaiforge"
            className="hover:text-slate-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
