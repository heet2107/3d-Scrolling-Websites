import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://heet-cinematic-portfolio.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Heet Barot | AI Engineer & Full-Stack Developer",
  description:
    "Portfolio of Heet Barot — Software Engineer specializing in LLM integration, prompt engineering, RAG pipelines, MCP servers, and full-stack AI product development with React, Next.js, Node.js, and Python.",
  keywords: [
    "Heet Barot",
    "AI Engineer",
    "Prompt Engineering",
    "RAG Pipelines",
    "MCP Servers",
    "Claude",
    "Next.js Developer",
    "React Developer",
    "Full Stack Developer",
    "Software Engineer Austin",
  ],
  openGraph: {
    title: "Heet Barot Portfolio",
    description:
      "Cinematic portfolio showcasing AI systems, autonomous agents, RAG pipelines, and full-stack products.",
    type: "website",
    url: SITE_URL,
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Heet Barot | AI Engineer & Full-Stack Developer",
    description:
      "Cinematic portfolio showcasing AI systems, autonomous agents, RAG pipelines, and full-stack products.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#060806",
  width: "device-width",
  initialScale: 1,
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Heet Barot",
  jobTitle: "Software Engineer — AI/ML",
  email: "mailto:heetbarot21@gmail.com",
  url: SITE_URL,
  sameAs: ["https://github.com/heet2107", "https://www.linkedin.com/in/heet-barot"],
  knowsAbout: [
    "LLM Integration",
    "Prompt Engineering",
    "RAG Pipelines",
    "MCP Servers",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "AWS",
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Heet Barot Portfolio",
  url: SITE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="grain font-body">{children}</body>
    </html>
  );
}
