# SEO Quick Reference Guide

Quick commands and snippets for SEO maintenance on UvoCollab.

## Testing URLs

### Production Testing

```bash
# Test homepage
curl -I https://uvocollab.com

# Test sitemap
curl https://uvocollab.com/sitemap.xml

# Test robots.txt
curl https://uvocollab.com/robots.txt

# Test manifest
curl https://uvocollab.com/manifest.json
```

### Local Testing (Development)

```bash
# Start development server
npm run dev

# Access in browser
http://localhost:3000

# Test local sitemap
http://localhost:3000/sitemap.xml

# Test local robots.txt
http://localhost:3000/robots.txt
```

## Useful Commands

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Generate SEO Assets

```bash
# Run the asset generation script
./scripts/generate-seo-assets.sh
```

### Check Build Output

```bash
# View build statistics
npm run build -- --profile

# Analyze bundle size
npx @next/bundle-analyzer
```

## Quick SEO Checks

### Lighthouse Audit (Chrome DevTools)

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select categories: Performance, SEO, Accessibility, Best Practices
4. Click "Analyze page load"
5. Review report and implement suggestions

### Test Structured Data

```bash
# Using curl and jq to extract JSON-LD
curl -s https://uvocollab.com | grep -o '<script type="application/ld+json">.*</script>' | sed 's/<[^>]*>//g' | jq '.'
```

### Check Meta Tags

```bash
# Extract all meta tags
curl -s https://uvocollab.com | grep -i '<meta'
```

## Common Meta Tag Patterns

### Page with Metadata

```typescript
export const metadata = {
  title: "Page Title - UvoCollab",
  description: "Page description between 150-160 characters",
  openGraph: {
    title: "Page Title",
    description: "Page description",
    type: "website",
    images: ["/og-image.png"],
  },
};
```

### No-Index Page (Private)

```typescript
export const metadata = {
  title: "Private Page",
  robots: { index: false, follow: true },
};
```

## Structured Data Examples

### Add Organization Schema

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "UvoCollab",
      url: "https://uvocollab.com",
      logo: "https://uvocollab.com/logo.png",
    }),
  }}
/>
```

### Add Person Schema (Legend Profile)

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Legend Name",
      url: "https://uvocollab.com/legend/[id]",
      image: "profile-image-url",
      jobTitle: "Music Producer",
    }),
  }}
/>
```

## Search Console Quick Links

### Submit URLs for Indexing

1. Go to Google Search Console
2. Use URL Inspection tool
3. Enter URL to test
4. Click "Request Indexing"

### View Performance

- Search Console > Performance
- Filter by: Pages, Queries, Countries, Devices
- Export data for analysis

## Performance Optimization Tips

### Image Optimization

```typescript
// Use Next.js Image component
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  priority={false} // Set to true for above-the-fold images
  loading="lazy"
/>;
```

### Font Optimization

```typescript
// Already implemented in layout.tsx
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

## Monitoring & Alerts

### Set Up Search Console Email Alerts

1. Search Console > Settings
2. Users and permissions
3. Add your email
4. Enable notifications for critical issues

### Core Web Vitals Monitoring

- Search Console > Core Web Vitals
- Review mobile and desktop separately
- Focus on fixing Poor and Needs Improvement URLs

## Emergency SEO Fixes

### Accidentally Blocked Crawlers

1. Check `app/robots.ts`
2. Ensure `allow: '/'` is present
3. Remove any incorrect disallow rules
4. Deploy changes
5. Request reindexing in Search Console

### Missing Meta Descriptions

1. Locate page file (e.g., `app/page/page.tsx`)
2. Add metadata export
3. Deploy changes

### Broken Sitemap

1. Check `app/sitemap.ts` for errors
2. Build locally: `npm run build`
3. Test: `curl http://localhost:3000/sitemap.xml`
4. Deploy fixes

## Regular Maintenance Schedule

### Daily (Automated)

- Monitor uptime
- Check for 500 errors
- Review analytics dashboard

### Weekly (Manual)

- Review Search Console errors
- Check new indexed pages
- Monitor Core Web Vitals

### Monthly (Strategic)

- Analyze ranking changes
- Review top-performing content
- Update meta descriptions for low-CTR pages
- Check competitor activity

## Contact & Support

For SEO questions or issues:

- Email: dev@uvocollab.com
- Internal docs: `/docs/SEO_IMPLEMENTATION.md`
- Testing checklist: `/docs/SEO_TESTING_CHECKLIST.md`

---

**Quick Tip:** Bookmark this page for easy reference during SEO maintenance!
