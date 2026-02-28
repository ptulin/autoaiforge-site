import { getAllTools, topicEmoji, topicColor } from "@/lib/github";
import type { Tool } from "@/lib/github";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

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
  return {
    title: `${tool.display_name} — AI Tools by AutoAIForge`,
    description: tool.description,
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

  // Parse README sections
  const readmeSections = readme ? parseReadme(readme) : null;

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-[#1e2d4a] bg-[#050914]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Tools
          </Link>
          <span className="text-[#1e2d4a]">·</span>
          <span className="text-white text-sm font-medium truncate">{tool.display_name}</span>
        </div>
      </header>

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

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <a
              href={tool.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a
              href={`${tool.github_url}/archive/refs/heads/main.zip`}
              className="inline-flex items-center gap-2 bg-[#1e2d4a] hover:bg-[#263a5e] text-slate-300 font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download ZIP
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* What it does */}
            {readmeSections?.whatItDoes && (
              <Section title="What It Does">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.whatItDoes }} />
              </Section>
            )}

            {/* Install */}
            {readmeSections?.installation && (
              <Section title="Installation">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.installation }} />
              </Section>
            )}

            {/* Usage */}
            {readmeSections?.usage && (
              <Section title="Usage">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: readmeSections.usage }} />
              </Section>
            )}

            {/* Code preview */}
            {code && (
              <Section title="Source Code">
                <div className="relative">
                  <pre className="bg-[#060d1f] border border-[#1e2d4a] rounded-lg p-4 overflow-x-auto text-xs text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto">
                    <code>{code}</code>
                  </pre>
                </div>
              </Section>
            )}

            {/* Full README fallback */}
            {readme && !readmeSections?.whatItDoes && (
              <Section title="README">
                <div className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(readme) }} />
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick info */}
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

            {/* Quick install */}
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Quick Install</h3>
              <p className="text-slate-500 text-xs mb-3">Clone just this tool:</p>
              <pre className="bg-[#060d1f] rounded-lg p-3 text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap break-all">
{`git clone --depth 1 --filter=blob:none --sparse \\
  https://github.com/ptulin/autoaiforge.git
cd autoaiforge
git sparse-checkout set generated_tools/${tool.date}/${tool.tool_name}
cd generated_tools/${tool.date}/${tool.tool_name}
pip install -r requirements.txt 2>/dev/null || true
python ${tool.tool_name}.py`}
              </pre>
            </div>

            {/* Links */}
            <div className="bg-[#0d1424] border border-[#1e2d4a] rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Links</h3>
              <div className="space-y-2">
                <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
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

/* ── Minimal markdown → HTML (no external deps) ──────────────────────────── */
function markdownToHtml(md: string): string {
  return md
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_: string, c: string) =>
      `<pre class="bg-[#060d1f] border border-[#1e2d4a] rounded-lg p-4 overflow-x-auto text-xs text-slate-300 my-3"><code>${escHtml(c.trim())}</code></pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[#060d1f] px-1.5 py-0.5 rounded text-blue-300 text-xs font-mono">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-white font-semibold text-base mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-white font-bold text-xl mt-6 mb-3">$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="text-slate-400 text-sm ml-4 list-disc mb-1">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-3">$&</ul>')
    // Paragraphs
    .replace(/^(?!<[h|u|p|pre|li])(.+)$/gm, '<p class="text-slate-400 text-sm leading-relaxed mb-2">$1</p>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── Split README into named sections ────────────────────────────────────── */
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
