# Google Search deployment checklist

This package is prepared for `https://research.echemai.com/`.

## After deployment

1. Confirm these URLs return HTTP 200:
   - `https://research.echemai.com/`
   - `https://research.echemai.com/sitemap.xml`
   - `https://research.echemai.com/robots.txt`
   - one article URL, for example `https://research.echemai.com/article/015-eis-cnn-equivalent-circuits/`
2. Add or verify the site in Google Search Console. A Domain property for `echemai.com` covers the subdomain; otherwise add the URL-prefix property `https://research.echemai.com/`.
3. Submit `sitemap.xml` in Search Console → Sitemaps.
4. In URL Inspection, test the homepage and representative notes, then request indexing after confirming the live page is crawlable.
5. Run Google Rich Results Test on at least two articles. Each article should expose `BlogPosting` and `BreadcrumbList` JSON-LD.
6. Monitor Search Console → Page indexing and Search results. Fix crawl/canonical issues before changing content solely for ranking.

## SEO implementation in this package

- Unique, descriptive `<title>` values optimized for each research topic
- Unique meta descriptions
- Canonical URLs on every indexable page
- `index,follow` robots metadata with large-preview permission
- Open Graph and Twitter metadata
- Existing EchemAI favicon referenced from `https://echemai.com/images/favicon.ico`
- `BlogPosting` structured data on every Research Note
- `BreadcrumbList` structured data on every Research Note
- `WebSite`, `Organization`, `CollectionPage`, and `ItemList` structured data on the archive page
- Visible Research Note publication date and EchemAI editorial authorship
- Internal `Related Research Notes` links between semantically connected articles
- XML sitemap with significant-update `lastmod=2026-09-05`
- `robots.txt` pointing to the sitemap
- `404.html` marked `noindex,follow`

## Important date convention

The date in the paper citation is the source paper's publication date. The Research Note's own publication/modified date is `2026-09-05`. Sitemap `lastmod` follows the Research Note page update date, not the source paper date.
