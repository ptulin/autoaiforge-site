"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import Link from "next/link";

type Frequency = "daily" | "weekly" | "monthly";

interface SubscriberProfile {
  email: string;
  confirmed: boolean;
  subscribe_all: boolean;
  topics: string[] | null;
  subscribed_tools: string[] | null;
  frequency: Frequency;
  created_at: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<SubscriberProfile | null>(null);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  // Editable state
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [subscribeAll, setSubscribeAll] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUserEmail(user.email ?? null);

      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.subscriber);
        if (data.subscriber) {
          setFrequency(data.subscriber.frequency || "daily");
          setSubscribeAll(data.subscriber.subscribe_all ?? true);
          setSelectedTopics(data.subscriber.topics ?? []);
        }
        setAllTopics(data.allTopics ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function savePreferences() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency,
          subscribe_all: subscribeAll,
          topics: subscribeAll ? [] : selectedTopics,
        }),
      });
      if (res.ok) {
        setMessage("✅ Preferences saved!");
        loadProfile();
      } else {
        const d = await res.json();
        setMessage(`❌ ${d.error || "Failed to save"}`);
      }
    } catch {
      setMessage("❌ Network error");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function removeWatchedTool(slug: string) {
    await fetch("/api/profile/watch-tool", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug: slug }),
    });
    loadProfile();
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const freqOptions: { value: Frequency; label: string; desc: string }[] = [
    { value: "daily", label: "Daily", desc: "Every morning" },
    { value: "weekly", label: "Weekly", desc: "Monday digest" },
    { value: "monthly", label: "Monthly", desc: "1st of month" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-bold text-2xl">My Profile</h1>
            <p className="text-slate-400 text-sm mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-slate-400 hover:text-white border border-[#1e2d4a] hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* No subscriber row */}
        {!profile && (
          <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-6 mb-6 text-center">
            <div className="text-3xl mb-3">📬</div>
            <h2 className="text-white font-semibold mb-2">Not subscribed yet</h2>
            <p className="text-slate-400 text-sm mb-4">
              Subscribe to get AI tool digests in your inbox.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Subscribe on Home Page
            </Link>
          </div>
        )}

        {/* Subscription preferences */}
        {profile && (
          <div className="space-y-5">
            {/* Status card */}
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Subscription Status</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  profile.confirmed
                    ? "bg-green-900/30 border-green-800/40 text-green-400"
                    : "bg-yellow-900/30 border-yellow-800/40 text-yellow-400"
                }`}
              >
                {profile.confirmed ? "✓ Confirmed" : "⏳ Pending"}
              </span>
            </div>

            {/* Email frequency */}
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3">Email Frequency</h2>
              <div className="grid grid-cols-3 gap-2">
                {freqOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFrequency(opt.value)}
                    className={`p-3 rounded-lg text-sm border transition-colors text-left ${
                      frequency === opt.value
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-[#050914] border-[#1e2d4a] text-slate-400 hover:border-blue-500/40 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3">Topics</h2>
              <div className="flex gap-3 mb-3">
                {[
                  { id: true, label: "All topics" },
                  { id: false, label: "Custom selection" },
                ].map((opt) => (
                  <label key={String(opt.id)} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => {
                        setSubscribeAll(opt.id);
                        if (opt.id) setSelectedTopics([]);
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                        subscribeAll === opt.id
                          ? "bg-blue-600 border-blue-600"
                          : "border-slate-600 bg-transparent"
                      }`}
                    >
                      {subscribeAll === opt.id && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-slate-300 text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>

              {!subscribeAll && allTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[#050914] border border-[#1e2d4a] rounded-lg">
                  {allTopics.map((topic) => (
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
                </div>
              )}
            </div>

            {/* Watched tools */}
            {profile.subscribed_tools && profile.subscribed_tools.length > 0 && (
              <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
                <h2 className="text-white font-semibold mb-3">Watched Tools</h2>
                <div className="space-y-2">
                  {profile.subscribed_tools.map((slug) => {
                    const [date, name] = slug.split("/");
                    return (
                      <div
                        key={slug}
                        className="flex items-center justify-between py-2 border-b border-[#1e2d4a] last:border-0"
                      >
                        <Link
                          href={`/tool/${date}/${name}`}
                          className="text-blue-400 hover:underline text-sm font-mono"
                        >
                          {name}
                        </Link>
                        <button
                          onClick={() => removeWatchedTool(slug)}
                          className="text-slate-600 hover:text-red-400 text-xs transition-colors"
                        >
                          ✕ Unwatch
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save */}
            {message && (
              <p
                className={`text-sm text-center ${
                  message.startsWith("✅") ? "text-green-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
            <button
              onClick={savePreferences}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving…" : "Save Preferences"}
            </button>

            {/* Unsubscribe */}
            <div className="text-center pt-2">
              <a
                href={`/api/unsubscribe?email=${encodeURIComponent(profile.email)}`}
                className="text-slate-600 hover:text-red-400 text-xs transition-colors"
              >
                Unsubscribe from all emails
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
