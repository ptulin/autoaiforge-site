/**
 * Fetches AutoAIForge tool data from the public GitHub repo.
 * Data lives in generated_tools/tools_index.json (updated nightly by the pipeline).
 */

export interface Tool {
  tool_name: string;
  display_name: string;
  description: string;
  topic: string;
  date: string;
  generated: string;
  tests_passed: boolean;
  loops_needed: number;
  github_url: string;
  readme_url: string;
}

export interface ToolsIndex {
  last_updated: string;
  total_tools: number;
  tools: Tool[];
}

const INDEX_URL =
  "https://raw.githubusercontent.com/ptulin/autoaiforge/main/generated_tools/tools_index.json";

export async function getAllTools(): Promise<ToolsIndex> {
  try {
    const res = await fetch(INDEX_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
    return await res.json();
  } catch {
    // Return empty data gracefully if fetch fails
    return { last_updated: new Date().toISOString(), total_tools: 0, tools: [] };
  }
}

export function getUniqueTopics(tools: Tool[]): string[] {
  const topics = new Set(tools.map((t) => t.topic));
  return Array.from(topics).sort();
}

export function getUniqueDates(tools: Tool[]): string[] {
  const dates = new Set(tools.map((t) => t.date));
  return Array.from(dates).sort().reverse();
}

/** Map topic names to emoji for display */
export function topicEmoji(topic: string): string {
  const map: Record<string, string> = {
    "AI Coding Assistants": "💻",
    "AI-Driven UI/UX Design": "🎨",
    "AI Hallucination Mitigation": "🛡️",
    "Open-Source AI Coding Models": "🔓",
    "AI Automation Frameworks": "⚙️",
    "AI-Powered Email Automation": "📧",
    "AI Agents for Multi-Platform Control": "🤖",
    "AI-Powered Video Generation": "🎬",
    "AI in Real-Time Code Debugging": "🐛",
    "Programmable Photonic AI Hardware": "⚡",
    "Machine Learning": "🧠",
    "LLM": "💬",
    "RAG": "📚",
  };
  for (const [key, val] of Object.entries(map)) {
    if (topic.includes(key) || key.includes(topic)) return val;
  }
  return "🔧";
}

export function topicColor(topic: string): string {
  const colors = [
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-green-500/10 text-green-400 border-green-500/20",
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "bg-red-500/10 text-red-400 border-red-500/20",
  ];
  // Deterministic color based on topic string
  const idx =
    topic.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
