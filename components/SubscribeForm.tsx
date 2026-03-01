"use client";

import { useState } from "react";

interface Props {
  topics: string[];
}

export default function SubscribeForm({ topics }: Props) {
  const [email, setEmail] = useState("");
  const [subscribeAll, setSubscribeAll] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          topics: subscribeAll ? [] : selectedTopics,
          subscribeAll,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Check your email to confirm!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-3">📬</div>
        <h3 className="text-white font-bold text-lg mb-2">Get Daily AI Tool Digests</h3>
        <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
          New AI tools every morning — curated by AutoAIForge. Free, no spam, unsubscribe anytime.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          Subscribe Free →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">📬 Subscribe to Daily Digest</h3>
          <p className="text-slate-400 text-sm">Fresh AI tools every morning, free</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {status === "success" ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-green-400 font-semibold">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#0d1424] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
          />

          {/* Topic selection */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => { setSubscribeAll(true); setSelectedTopics([]); }}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                    subscribeAll
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {subscribeAll && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-slate-300 text-sm">All topics (recommended)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setSubscribeAll(false)}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                    !subscribeAll
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-600 bg-transparent"
                  }`}
                >
                  {!subscribeAll && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-slate-300 text-sm">Choose topics</span>
              </label>
            </div>

            {!subscribeAll && topics.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-[#0d1424] border border-[#1e2d4a] rounded-lg">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      selectedTopics.includes(topic)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-transparent border-[#1e2d4a] text-slate-400 hover:border-blue-500/40 hover:text-white"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
                {selectedTopics.length === 0 && (
                  <p className="text-xs text-slate-600 w-full">Select at least one topic</p>
                )}
              </div>
            )}
          </div>

          {status === "error" && (
            <p className="text-red-400 text-xs">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || (!subscribeAll && selectedTopics.length === 0)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe Free →"}
          </button>

          <p className="text-slate-600 text-xs text-center">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  );
}
