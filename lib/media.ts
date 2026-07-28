// Media assets resolve locally by default; NEXT_PUBLIC_MEDIA_BASE lets a
// no-repo deploy (e.g. Vercel file upload) serve them from a CDN instead.
export const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE ?? "";

export const mediaUrl = (path: string) => `${MEDIA_BASE}${path}`;
