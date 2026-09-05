# EchemAI Research Notes

Deployment-ready, English-only static website for selected 2026 electrochemistry + AI research.

## Included

- 18 Research Notes
- Reverse-chronological archive: newest note first
- Chronological note numbering: oldest = 1, newest = 18
- Adjustable article reading width: Narrow / Standard / Wide
- Source-verification notes for each article
- Google-focused SEO metadata, Article/Breadcrumb structured data, internal related-note links, sitemap, robots.txt, and 404 page
- Dependency-free local server and production build
- Vercel deployment configuration

## Local development

```powershell
npm run dev
```

Open `http://localhost:5173/`.

No `npm install` is required for development or building.

## Quality check

```powershell
npm run check
```

## Production build

```powershell
npm run build
```

The deployable static site is generated in `dist/`.

## Preview production output

```powershell
npm run preview
```

## Vercel

Import this folder or its Git repository into Vercel. The included `vercel.json` uses:

- Build command: `npm run build`
- Output directory: `dist`

Production URL expected by canonical metadata: `https://research.echemai.com/`.

## Google Search

After production deployment, follow `SEO_DEPLOY.md` to verify Search Console, submit the sitemap, request indexing, and test structured data.
