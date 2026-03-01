"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

interface Props {
  toolSlug: string; // "date/tool_name"
}

export default function WatchToolButton({ toolSlug }: Props) {
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setAuthed(true);

        // Check if already watching
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const tools: string[] = data.subscriber?.subscribed_tools ?? [];
          setWatching(tools.includes(toolSlug));
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    init();
  }, [toolSlug]);

  async function toggle() {
    if (!authed) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      const method = watching ? "DELETE" : "POST";
      const res = await fetch("/api/profile/watch-tool", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      if (res.ok) setWatching(!watching);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  if (!authed && !loading) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-2 bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Watch Tool
      </a>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 ${
        watching
          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-red-900/20 hover:border-red-500/40 hover:text-red-300"
          : "bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300"
      }`}
    >
      {watching ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Watching
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Watch Tool
        </>
      )}
    </button>
  );
}
