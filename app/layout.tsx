import type { Metadata } from "next";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Tools by AutoAIForge — Daily AI Developer Tools",
  description:
    "Fresh AI developer tools generated every night from trending AI news. Browse, filter, and download Python tools for coding, automation, design, and more.",
  openGraph: {
    title: "AI Tools by AutoAIForge",
    description: "Fresh AI developer tools generated nightly from trending news.",
    type: "website",
    url: "https://aitools.disruptiveexperience.com",
    images: [
      {
        url: "https://aitools.disruptiveexperience.com/api/og?title=AI+Tools+by+AutoAIForge&topic=All+Topics",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read current session server-side so header shows correct Login/Profile state
  let userEmail: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Silently ignore auth errors (e.g., missing anon key in dev)
  }

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {/* ── Global Navigation ──────────────────────────────────────── */}
        <nav className="border-b border-[#1e2d4a] bg-[#050914]/90 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl">🤖</span>
              <div>
                <span className="text-white font-bold text-base leading-tight group-hover:text-blue-300 transition-colors">
                  AI Tools
                </span>
                <p className="text-xs text-blue-400/70">by AutoAIForge</p>
              </div>
            </Link>

            {/* Right: Nav links */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/contact"
                className="text-slate-400 hover:text-white transition-colors text-sm px-2 py-1.5 rounded-lg hover:bg-white/5"
              >
                Contact
              </Link>
              <Link
                href={userEmail ? "/profile" : "/login"}
                className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {userEmail ? "My Profile" : "Login"}
              </Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
