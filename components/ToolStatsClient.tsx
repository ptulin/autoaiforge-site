"use client";

import { useEffect, useState } from "react";
import StarRating from "@/components/StarRating";
import type { ToolStatEntry } from "@/app/api/tools/stats/route";

interface Props {
  toolName: string;
  toolDate: string;
}

export default function ToolStatsClient({ toolName, toolDate }: Props) {
  const [stats, setStats] = useState<ToolStatEntry | null>(null);

  useEffect(() => {
    fetch("/api/tools/stats")
      .then((r) => r.json())
      .then((data) => {
        const key = `${toolName}|${toolDate}`;
        if (data.stats?.[key]) {
          setStats(data.stats[key]);
        } else {
          // Tool has no stats yet — show empty state
          setStats({ download_count: 0, rating_avg: 0, rating_count: 0 });
        }
      })
      .catch(() => {
        setStats({ download_count: 0, rating_avg: 0, rating_count: 0 });
      });
  }, [toolName, toolDate]);

  return (
    <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Community</h3>

      <div className="space-y-4">
        {/* Downloads */}
        <div>
          <p className="text-slate-500 text-xs mb-1">Downloads</p>
          <p className="text-white font-semibold text-lg">
            {stats ? (
              stats.download_count > 0 ? (
                stats.download_count.toLocaleString()
              ) : (
                <span className="text-slate-600 text-sm font-normal">
                  No downloads yet
                </span>
              )
            ) : (
              <span className="text-slate-700 animate-pulse">···</span>
            )}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1e2d4a]" />

        {/* Star rating */}
        <div>
          <p className="text-slate-500 text-xs mb-2">Rate this tool</p>
          <StarRating
            toolName={toolName}
            toolDate={toolDate}
            initialAvg={stats?.rating_avg ?? 0}
            initialCount={stats?.rating_count ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
