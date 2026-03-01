"use client";

import { useState, useEffect } from "react";

interface Props {
  toolName: string;
  toolDate: string;
  initialAvg?: number;
  initialCount?: number;
}

export default function StarRating({
  toolName,
  toolDate,
  initialAvg = 0,
  initialCount = 0,
}: Props) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync when parent fetches stats asynchronously
  useEffect(() => {
    if (!submitted) {
      setAvg(initialAvg);
      setCount(initialCount);
    }
  }, [initialAvg, initialCount, submitted]);

  async function handleRate(rating: number) {
    if (loading || submitted) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_name: toolName,
          tool_date: toolDate,
          rating,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAvg(data.rating_avg);
      setCount(data.rating_count);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit rating.");
    } finally {
      setLoading(false);
    }
  }

  const displayFill = hovered || Math.round(avg);

  return (
    <div>
      {/* Interactive stars */}
      <div className="flex items-center gap-0.5 mb-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !submitted && !loading && setHovered(star)}
            onMouseLeave={() => !submitted && !loading && setHovered(0)}
            disabled={loading || submitted}
            title={
              submitted
                ? "You already rated this tool"
                : `Rate ${star} star${star !== 1 ? "s" : ""}`
            }
            className={`text-2xl leading-none transition-all ${
              star <= displayFill ? "text-yellow-400" : "text-slate-700"
            } ${
              submitted || loading
                ? "cursor-default"
                : "hover:scale-110 cursor-pointer"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-500">
        {count > 0 ? (
          <>
            <span className="text-yellow-400 font-medium">{avg.toFixed(1)}</span>
            {" avg · "}
            {count} {count === 1 ? "rating" : "ratings"}
          </>
        ) : (
          "No ratings yet — be the first!"
        )}
      </p>

      {submitted && (
        <p className="text-xs text-green-400 mt-1">Thanks for rating! ✓</p>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
