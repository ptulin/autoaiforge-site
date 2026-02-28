import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tools by AutoAIForge — Daily AI Developer Tools",
  description:
    "Fresh AI developer tools generated every night from trending AI news. Browse, filter, and download Python tools for coding, automation, design, and more.",
  openGraph: {
    title: "AI Tools by AutoAIForge",
    description: "Fresh AI developer tools generated nightly from trending news.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
