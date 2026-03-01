import { getAllTools, topicEmoji, topicColor } from "@/lib/github";
import type { Tool } from "@/lib/github";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButtons from "@/components/ShareButtons";
import WatchToolButton from "@/components/WatchToolButton";
import ToolActions from "@/components/ToolActions";
import ToolStatsClient from "@/components/ToolStatsClient";
import { getSupabaseAdmin } from "@/lib/supabase";

export const revalidate = 3600;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aitools.disruptiveexperience.com";

interface Props {
  params: Promise<{ date: string; name: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { date, name } = await params;
  const data = await getAllTools();
  const tool = data.tools.find(
    (t) => t.date === date && t.tool_name === name
  );
  if (!tool) return { title: "Tool Not Found" };

  // Fetch stats server-side for richer OG image
  let ogRating = 0;
  let ogDownloads = 0;
  try {
    const supabase = getSupabaseAdmin();
    const { data: stats } = await supabase
      .from("tool_stats")
      .select("rating_avg, download_count")
      .eq("tool_name", name)
      .eq("tool_date", date)
      .single();
    if (stats) {
      ogRating = Math.round((stats.rating_avg ?? 0) * 10) / 10;
      ogDownloads = stats.download_count ?? 0;
    }
  } catch {
    // stats unavailable — OG image will render without them
  }

  const toolUrl = `${SITE_URL}/tool/${date}/${name}`;
  const descSnippet = tool.description ? tool.description.slice(0, 120) : "";
  const ogImage =
    `${SITE_URL}/api/og` +
    `?title=${encodeURIComponent(tool.display_name)}` +
    `&topic=${encodeURIComponent(tool.topic)}` +
    `&rating=${ogRating}` +
    `&downloads=${ogDownloads}` +
    `&desc=${encodeURIComponent(descSnippet)}`;

  return {
    title: `${tool.display_name} — AI Tools by AutoAIForge`,
    description: tool.description,
    openGraph: {
      title: tool.display_name,
      description: tool.description,
      type: "article",
      url: toolUrl,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: tool.display_name,
      description: tool.description,
      images: [ogImage],
    },
  };
}

async function getReadme(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function getCode(tool: Tool): Promise<string | null> {
  try {
    const codeUrl = tool.github_url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/tree/", "/")
      + `/${tool.tool_name}.py`;
    const res = await fetch(codeUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export default async function ToolDetailPage({ params }: Props) {
  const { date, name } = await params;
  const data = await getAllTools();
  const tool = data.tools.find(
    (t) => t.date === date && t.tool_name === name
  );

  if (!tool) notFound();

  const [readme, code] = await Promise.all([
    getReadme(tool.readme_url),
    getCode(tool),
  ]);

  const color = topicColor(tool.topic);
  const emoji = topicEmoji(tool.topic);
  const dateStr = new Date(tool.generated).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const toolUrl = `${SITE_URL}/tool/${date}/${name}`;
  const toolSlug = `${date}/${name}`;

  const readmeSections = readme ? parseReadme(readme) : null;

  const installSnippet = [
    "git clone --depth 1 --filter=blob:none --sparse \\",
    "  https://github.com/ptulin/autoaiforge.git",
    "cd autoaiforge",
    `git sparse-checkout set generated_tools/${tool.date}/${tool.tool_name}`,
    `cd generated_tools/${tool.date}/${tool.tool_name}`,
    "pip install -r requirements.txt 2>/dev/null || true",
    `python ${tool.tool_name}.py`,
  ].join("\n");

  return (
    <div className="min-h-screen grid-bg">
      {/* Breadcrumb nav */}
      <div className="border-b border-[#1e2d4a] bg-[#050914]/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Tools
          </Link>
          <span className="text-[#1e2d4a]">›</span>
          <span className="text-slate-400 truncate">{tool.display_name}</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Title block */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
              {emoji} {tool.topic}
            </span>
            <span className="text-sm text-slate-500">{dateStr}</span>
            {tool.tests_passed ? (
              <span className="text-sm text-green-400">✅ Tests passing</span>
            ) : (
              <span className="text-sm text-yellow-500">⚠️ Tests skipped</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {tool.display_name}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
            {tool.description}
          </p>

          {/* CTA buttons — ToolActions tracks download clicks */}
          <ToolActions
            toolName={tool.tool_name}
            toolDate={tool.date}
            githubUrl={tool.github_url}
          />
          <div className="mt-3">
            <WatchToolButton toolSlug={toolSlug} />
          </div>

          {/* Share */}
          <div className="mt-4">
            <ShareButtons url={toolUrl} title={tool.display_name} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {readmeSections?.whatItDoes && (
              <Section title="What It Does">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.whatItDoes }} />
              </Section>
            )}
            {readmeSections?.installation && (
              <Section title="Installation">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.installation }} />
              </Section>
            )}
            {readmeSections?.usage && (
              <Section title="Usage">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.usage }} />
              </Section>
            )}
            {code && (
              <Section title="Source Code">
                <pre className="bg-[#060d1f] border border-[#1e2d4a] rounded-lg p-4 overflow-x-auto text-xs text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto">
                  <code>{code}</code>
                </pre>
              </Section>
            )}
            {readme && !readmeSections?.whatItDoes && (
              <Section title="README">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(readme) }} />
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Community: ratings + downloads */}
            <ToolStatsClient toolName={tool.tool_name} toolDate={tool.date} />

            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 mb-0.5">Tool Name</dt>
                  <dd className="text-slate-300 font-mono">{tool.tool_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Category</dt>
                  <dd className="text-slate-300">{tool.topic}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Generated</dt>
                  <dd className="text-slate-300">{dateStr}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-0.5">Tests</dt>
                  <dd className={tool.tests_passed ? "text-green-400" : "text-yellow-500"}>
                    {tool.tests_passed ? "Passing ✅" : "Skipped ⚠️"}
                  </dd>
                </div>
                {tool.loops_needed > 1 && (
                  <div>
                    <dt className="text-slate-500 mb-0.5">Fix Loops</dt>
                    <dd className="text-slate-300">{tool.loops_needed}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Quick Install</h3>
              <p className="text-slate-500 text-xs mb-3">Clone just this tool:</p>
              <pre className="bg-[#060d1f] rounded-lg p-3 text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap break-all">
                {installSnippet}
              </pre>
            </div>

            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Links</h3>
              <div className="space-y-2">
                <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  View source on GitHub
                </a>
                <a href={tool.readme_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Raw README.md
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1e2d4a] mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>🤖</span>
            <span>
              Built by{" "}
              <a href="https://disruptiveexperience.com" className="text-blue-400 hover:underline">
                Disruptive Experience
              </a>
            </span>
          </div>
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to all tools
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_: string, c: string) =>
      `<pre class="bg-[#060d1f] border border-[#1e2d4a] rounded-lg p-4 overflow-x-auto text-xs text-slate-300 my-3"><code>${escHtml(c.trim())}</code></pre>`
    )
    .replace(/`([^`]+)`/g, '<code class="bg-[#060d1f] px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-white font-semibold text-base mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-white font-bold text-xl mt-6 mb-3">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-slate-400 text-sm ml-4 list-disc mb-1">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-3">$&</ul>')
    .replace(/^(?!<[h|u|p|pre|li])(.+)$/gm, '<p class="text-slate-400 text-sm leading-relaxed mb-2">$1</p>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface ReadmeSections {
  whatItDoes?: string;
  installation?: string;
  usage?: string;
}

function parseReadme(md: string): ReadmeSections {
  const sections: ReadmeSections = {};
  const sectionRegex = /^##\s+(.+)$/gm;
  const matches: Array<{ title: string; start: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = sectionRegex.exec(md)) !== null) {
    matches.push({ title: m[1].toLowerCase(), start: m.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const { title, start } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].start : md.length;
    const body = md.slice(start, end).replace(/^##\s+.+\n/, "").trim();
    const html = markdownToHtml(body);

    if (title.includes("what") || title.includes("overview") || title.includes("description") || title.includes("feature")) {
      sections.whatItDoes = html;
    } else if (title.includes("install") || title.includes("setup") || title.includes("require")) {
      sections.installation = html;
    } else if (title.includes("usage") || title.includes("use") || title.includes("run") || title.includes("example")) {
      sections.usage = html;
    }
  }

  return sections;
}
