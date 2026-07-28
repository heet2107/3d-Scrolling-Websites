import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heet Barot — AI Engineer & Full-Stack Builder",
  description:
    "Cinematic portfolio of Heet Barot — Software Engineer specializing in LLM integration, RAG pipelines, MCP servers, and full-stack AI product development.",
  keywords: [
    "Heet Barot", "AI Engineer", "Prompt Engineering", "RAG", "MCP",
    "Claude", "Full-Stack Developer", "Austin",
  ],
  openGraph: {
    title: "Heet Barot — AI Engineer & Full-Stack Builder",
    description:
      "Building AI systems that ship — autonomous agents, RAG pipelines, and full-stack products.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060806",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain font-body">{children}</body>
    </html>
  );
}
