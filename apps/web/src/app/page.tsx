export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <p className="text-sm font-medium tracking-widest text-neutral-500 uppercase">WebHeroAI</p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        The concierge that navigates your site for your visitors.
      </h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        Answers grounded in your pages. Actions executed on them — scroll, highlight, open, prefill
        — until the visitor becomes a lead.
      </p>
      <p className="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-700">
        Phase 0 shell. Marketing pages, auth and tenancy land in Phase 1.
      </p>
    </main>
  )
}
