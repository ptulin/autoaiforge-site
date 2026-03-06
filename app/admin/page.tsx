"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Subscriber {
  id: string;
  email: string;
  confirmed: boolean;
  subscribe_all: boolean;
  topics: string[] | null;
  frequency: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
  subscriber: {
    confirmed: boolean;
    frequency: string;
    subscribe_all: boolean;
  } | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

type Tab = "subscribers" | "users" | "messages";

/* ── Admin Page ─────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("subscribers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending">("all");
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    setAuthed(false);
    setError("Admin session expired. Please sign in again.");
  }, []);

  /* ── Login ────────────────────────────────────────────────────────── */
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const authRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!authRes.ok) {
        setError("Invalid secret");
        return;
      }
      await fetchSubscribers();
      setAuthed(true);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  /* ── Data fetchers ────────────────────────────────────────────────── */
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
    } finally { setLoading(false); }
  }, [handleUnauthorized]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally { setLoading(false); }
  }, [handleUnauthorized]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally { setLoading(false); }
  }, [handleUnauthorized]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/subscribers")
      .then(async (res) => {
        if (!mounted) return;
        if (res.status === 401) {
          setAuthed(false);
          return;
        }
        const data = await res.json();
        setSubscribers(data.subscribers ?? []);
        setAuthed(true);
      })
      .catch(() => {
        if (mounted) setAuthed(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchSubscribers]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "subscribers") fetchSubscribers();
    else if (tab === "users") fetchUsers();
    else if (tab === "messages") fetchMessages();
  }, [authed, tab, fetchSubscribers, fetchUsers, fetchMessages]);

  /* ── Actions ──────────────────────────────────────────────────────── */
  async function deleteSubscriber(id: string, email: string) {
    if (!confirm(`Delete subscriber ${email}?`)) return;
    const res = await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) setSubscribers((prev) => prev.filter((x) => x.id !== id));
  }

  async function deleteUser(id: string, email: string | undefined) {
    if (!confirm(`Delete auth user ${email ?? id}?`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) setUsers((prev) => prev.filter((x) => x.id !== id));
  }

  async function markMessageRead(id: string) {
    const res = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read: true } : m))
      );
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setError("");
    setSecret("");
  }

  /* ── Login Screen ─────────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-white font-bold text-xl">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">AutoAIForge</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="password"
              placeholder="Admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              className="w-full bg-[#050914] border border-[#1e2d4a] focus:border-blue-500 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "Checking…" : "Login →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Summary counters ─────────────────────────────────────────────── */
  const confirmedCount = subscribers.filter((s) => s.confirmed).length;
  const unreadCount = messages.filter((m) => !m.read).length;

  const filteredSubs = subscribers.filter((s) => {
    if (filter === "confirmed") return s.confirmed;
    if (filter === "pending") return !s.confirmed;
    return true;
  });

  /* ── Authenticated View ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen grid-bg">
      {/* Admin header */}
      <div className="border-b border-[#1e2d4a] bg-[#050914]/80 backdrop-blur sticky top-[57px] z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="text-white font-bold">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="text-xs bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={() => {
                if (tab === "subscribers") fetchSubscribers();
                else if (tab === "users") fetchUsers();
                else fetchMessages();
              }}
              disabled={loading}
              className="text-xs bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loading ? "…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 pb-0">
          {(
            [
              { id: "subscribers", label: "Subscribers", count: `${confirmedCount}/${subscribers.length}` },
              { id: "users", label: "Users", count: String(users.length) },
              { id: "messages", label: "Messages", count: unreadCount > 0 ? `${unreadCount} new` : String(messages.length) },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? "bg-blue-600/40 text-blue-300" : "bg-[#1e2d4a] text-slate-500"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Subscribers Tab ─────────────────────────────────────────── */}
        {tab === "subscribers" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total", value: subscribers.length, color: "text-white" },
                { label: "Confirmed", value: confirmedCount, color: "text-green-400" },
                { label: "Pending", value: subscribers.length - confirmedCount, color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-4 text-center">
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {(["all", "confirmed", "pending"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    filter === f
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-[#0d1424] border-[#1e2d4a] text-slate-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2d4a]">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Frequency</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Topics</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-12">No subscribers</td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr key={sub.id} className="border-b border-[#1e2d4a] last:border-0 hover:bg-[#131d30] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{sub.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.confirmed
                              ? "bg-green-900/40 text-green-400 border border-green-800/40"
                              : "bg-yellow-900/40 text-yellow-400 border border-yellow-800/40"
                          }`}>
                            {sub.confirmed ? "✓ Confirmed" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-400 text-xs capitalize">{sub.frequency || "daily"}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {sub.subscribe_all ? "All topics" : sub.topics?.join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteSubscriber(sub.id, sub.email)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                          >✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Users Tab ───────────────────────────────────────────────── */}
        {tab === "users" && (
          <>
            <p className="text-slate-500 text-sm mb-4">
              All Supabase Auth accounts. Deleting removes both auth user and subscriber row.
            </p>
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2d4a]">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Verified</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Subscriber</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Last Sign In</th>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-12">No users</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-[#1e2d4a] last:border-0 hover:bg-[#131d30] transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-xs">{u.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${u.confirmed_at ? "text-green-400" : "text-yellow-400"}`}>
                            {u.confirmed_at ? "✓ Yes" : "⏳ No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.subscriber ? (
                            <span className="text-xs text-blue-400">
                              {u.subscriber.confirmed ? "✓" : "⏳"} {u.subscriber.frequency}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {u.last_sign_in_at
                            ? new Date(u.last_sign_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "Never"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                          >✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Messages Tab ────────────────────────────────────────────── */}
        {tab === "messages" && (
          <>
            {unreadCount > 0 && (
              <p className="text-blue-400 text-sm mb-4">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
            {messages.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`bg-[#0d1424] border rounded-xl overflow-hidden transition-colors ${
                      msg.read ? "border-[#1e2d4a]" : "border-blue-500/40"
                    }`}
                  >
                    {/* Header row */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#131d30] transition-colors"
                      onClick={() => {
                        setExpandedMsg(expandedMsg === msg.id ? null : msg.id);
                        if (!msg.read) markMessageRead(msg.id);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {!msg.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {msg.name}
                            <span className="text-slate-500 font-normal ml-2 font-mono text-xs">
                              &lt;{msg.email}&gt;
                            </span>
                          </p>
                          {msg.subject && (
                            <p className="text-slate-400 text-xs truncate mt-0.5">{msg.subject}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-slate-600 text-xs">
                          {new Date(msg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {expandedMsg === msg.id ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded body */}
                    {expandedMsg === msg.id && (
                      <div className="px-5 pb-5 border-t border-[#1e2d4a]">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mt-4">
                          {msg.message}
                        </p>
                        {!msg.read && (
                          <button
                            onClick={() => markMessageRead(msg.id)}
                            className="mt-3 text-xs text-blue-400 hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
