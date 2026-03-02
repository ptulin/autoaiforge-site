"use client";

import { useState, useMemo, useEffect } from "react";
import type { Tool } from "@/lib/github";
import { getUniqueTopics, topicEmoji, topicColor } from "@/lib/github";
import Link from "next/link";
import SubscribeModal from "@/components/SubscribeModal";
import ShareButtons from "@/components/ShareButtons";
import type { ToolStatEntry } from "@/app/api/tools/stats/route";

type SortBy = "newest" | "top_rated" | "most_downloaded";

interface Props {
  tools: Tool[];
  lastUpdated: string;
  totalTools: number;
}

export default function ToolsClient({ tools, lastUpdated, totalTools }: Props) {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>("All");
  const [activeDate, setActiveDate] = useState<string>("All");
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [statsMap, setStatsMap] = useState<Record<string, ToolStatEntry>>({});

  // Fetch community stats client-side so ISR cache doesn't go stale
  useEffect(() => {
    fetch("/api/tools/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStatsMap(data.stats);
      })
      .catch(() => {}); // fail silently — stats are decorative
  }, []);

  const topics = useMemo(() => getUniqueTopics(tools), [tools]);
  const dates = useMemo(() => {
    const d = new Set(tools.map((t) => t.date));
    return Array.from(d).sort().reverse();
  }, [tools]);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchesTopic = activeTopic === "All" || t.topic === activeTopic;
      const matchesDate = activeDate === "All" || t.date === activeDate;
      const matchesSearch =
        !search ||
        t.display_name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.topic.toLowerCase().includes(search.toLowerCase());
      return matchesTopic && matchesDate && matchesSearch;
    });
  }, [tools, activeTopic, activeDate, search]);

  // Apply sort on top of the filtered list
  const sorted = useMemo(() => {
    if (sortBy === "newest") return filtered;

    return [...filtered].sort((a, b) => {
      const sa = statsMap[`${a.tool_name}|${a.date}`];
      const sb = statsMap[`${b.tool_name}|${b.date}`];

      if (sortBy === "top_rated") {
        const ra = sa ? sa.rating_avg : 0;
        const rb = sb ? sb.rating_avg : 0;
        if (rb !== ra) return rb - ra;
        // tie-break by vote count
        return (sb ? sb.rating_count : 0) - (sa ? sa.rating_count : 0);
      }

      if (sortBy === "most_downloaded") {
        return (sb ? sb.download_count : 0) - (sa ? sa.download_count : 0);
      }

      return 0;
    });
  }, [filtered, sortBy, statsMap]);

  const updatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen grid-bg">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        {/* Two-column hero: copy left, 2×2 stats right */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-4">

          {/* Left — copy */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
                Updated daily · Last run {updatedStr}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              AI Developer Tools,{" "}
              <span className="text-blue-400">Generated Nightly</span>
            </h1>
            <p className="text-slate-400 text-base max-w-xl mb-4">
              Every night, AutoAIForge scrapes trending AI news, identifies hot
              topics, and builds open-source Python tools — automatically tested
              and published. Free to use, fork, and contribute.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs">Share:</span>
              <ShareButtons
                url="https://aitools.disruptiveexperience.com"
                title="AI Developer Tools, Generated Nightly — AutoAIForge"
                compact
              />
            </div>
          </div>

          {/* Right — 2×2 stat tiles */}
          <div className="grid grid-cols-2 gap-3 lg:w-80 shrink-0">
            {[
              { label: "Total Tools", value: totalTools, icon: "🔧" },
              { label: "Topics Covered", value: topics.length, icon: "🔥" },
              { label: "Run Dates", value: dates.length, icon: "📅" },
              { label: "All Free", value: "100%", icon: "✅" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl shrink-0">{s.icon}</span>
                <div>
                  <div className="text-xl font-bold text-white leading-tight">{s.value}</div>
                  <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Subscribe CTA — full-width banner */}
        <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Subtle glow orb */}
          <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📬</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Free Daily Digest</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Get New AI Tools in Your Inbox
            </h2>
            <p className="text-slate-400 text-sm">
              Every morning — fresh Python tools built from last night&apos;s AI news. No spam, unsubscribe anytime.
            </p>
          </div>

          <button
            onClick={() => setShowSubscribeModal(true)}
            className="relative shrink-0 px-8 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-lg transition-colors shadow-lg shadow-blue-900/40 whitespace-nowrap"
          >
            Subscribe Free →
          </button>
        </div>

        {/* ── Search ────────────────────────────────────────────────── */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tools by name, description, or topic…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1424] border border-[#1e2d4a] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* ── Topic Filters ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveTopic("All")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTopic === "All"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[#0d1424] border-[#1e2d4a] text-slate-400 hover:border-blue-500/40 hover:text-white"
            }`}
          >
            All Topics
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTopic(activeTopic === topic ? "All" : topic)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeTopic === topic
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#0d1424] border-[#1e2d4a] text-slate-400 hover:border-blue-500/40 hover:text-white"
              }`}
            >
              {topicEmoji(topic)} {topic}
            </button>
          ))}
        </div>

        {/* Date filter */}
        {dates.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveDate("All")}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                activeDate === "All"
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-transparent border-[#1e2d4a] text-slate-500 hover:text-white"
              }`}
            >
              All dates
            </button>
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDate(activeDate === d ? "All" : d)}
                className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                  activeDate === d
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-transparent border-[#1e2d4a] text-slate-500 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* ── Sort ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-slate-500 text-xs font-medium">Sort:</span>
          {(
            [
              { value: "newest", label: "🕒 Newest" },
              { value: "top_rated", label: "⭐ Top Rated" },
              { value: "most_downloaded", label: "⬇️ Most Downloaded" },
            ] as { value: SortBy; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                sortBy === opt.value
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-transparent border-[#1e2d4a] text-slate-500 hover:text-white hover:border-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-6">
          Showing{" "}
          <span className="text-white font-medium">{sorted.length}</span> of{" "}
          {tools.length} tools
          {search && (
            <span>
              {" "}
              for &ldquo;<span className="text-blue-400">{search}</span>&rdquo;
            </span>
          )}
        </p>

        {/* ── Tool Grid ─────────────────────────────────────────────── */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No tools match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveTopic("All");
                setActiveDate("All");
              }}
              className="mt-3 text-blue-400 text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((tool, i) => (
              <ToolCard
                key={`${tool.date}-${tool.tool_name}`}
                tool={tool}
                index={i}
                stats={statsMap[`${tool.tool_name}|${tool.date}`]}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Subscribe Modal ──────────────────────────────────────── */}
      {showSubscribeModal && (
        <SubscribeModal
          topics={topics}
          onClose={() => setShowSubscribeModal(false)}
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e2d4a] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>🤖</span>
            <span>
              Built by{" "}
              <a
                href="https://disruptiveexperience.com"
                className="text-blue-400 hover:underline"
              >
                Disruptive Experience
              </a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/ptulin/autoaiforge"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <a href="/contact" className="hover:text-white transition-colors">
              Contact
            </a>
            <span>·</span>
            <a href="/rss.xml" className="hover:text-white transition-colors">
              RSS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── ToolCard ────────────────────────────────────────────────────────────── */
function ToolCard({
  tool,
  index,
  stats,
}: {
  tool: Tool;
  index: number;
  stats?: ToolStatEntry;
}) {
  const color = topicColor(tool.topic);
  const emoji = topicEmoji(tool.topic);
  const dateStr = new Date(tool.generated).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="card-glow bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5 flex flex-col gap-3 slide-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Topic badge + date */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
        >
          {emoji} {tool.topic}
        </span>
        <span className="text-xs text-slate-600">{dateStr}</span>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <h3 className="text-white font-semibold text-base mb-2 leading-tight">
          {tool.display_name}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
          {tool.description}
        </p>
      </div>

      {/* Test status */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={tool.tests_passed ? "text-green-400" : "text-yellow-500"}>
          {tool.tests_passed ? "✅ Tests passing" : "⚠️ Tests skipped"}
        </span>
        {tool.loops_needed > 1 && (
          <span className="text-slate-600">· {tool.loops_needed} fix loops</span>
        )}
      </div>

      {/* Community stats — always visible */}
      <div className="flex items-center gap-4 text-xs border-t border-[#1e2d4a] pt-2">
        {/* Star rating */}
        <span className="flex items-center gap-1">
          <span className={stats && stats.rating_count > 0 ? "text-yellow-400" : "text-slate-700"}>★</span>
          {stats ? (
            stats.rating_count > 0 ? (
              <>
                <span className="text-slate-300 font-medium">{stats.rating_avg.toFixed(1)}</span>
                <span className="text-slate-600">({stats.rating_count})</span>
              </>
            ) : (
              <span className="text-slate-600">No ratings</span>
            )
          ) : (
            <span className="text-slate-700 animate-pulse">···</span>
          )}
        </span>
        {/* Downloads */}
        <span className="flex items-center gap-1">
          <span className={stats && stats.download_count > 0 ? "text-blue-400" : "text-slate-700"}>⬇</span>
          {stats ? (
            <span className={stats.download_count > 0 ? "text-slate-300 font-medium" : "text-slate-600"}>
              {stats.download_count > 0 ? stats.download_count.toLocaleString() : "0"}
            </span>
          ) : (
            <span className="text-slate-700 animate-pulse">···</span>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/tool/${tool.date}/${tool.tool_name}`}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg text-center transition-colors"
        >
          View Details
        </Link>
        <a
          href={tool.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300 rounded-lg text-sm transition-colors flex items-center"
          title="View on GitHub"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
