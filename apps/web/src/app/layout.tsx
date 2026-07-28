import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'WebHeroAI — the concierge that navigates your site for your visitors',
    template: '%s · WebHeroAI',
  },
  description:
    'An embeddable AI concierge that answers visitor questions and then scrolls, highlights and prefills its way to a captured lead.',
  openGraph: {
    type: 'website',
    siteName: 'WebHeroAI',
    url: siteUrl,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  )
}
