# Required SEO Assets

This document lists all image and asset files needed for complete SEO implementation.

## Required Files

### Favicons

Place these in the `public/` directory:

- `favicon.ico` (32x32px, multi-resolution .ico file)
- `icon-16x16.png` (16x16px PNG)
- `icon-32x32.png` (32x32px PNG)
- `apple-touch-icon.png` (180x180px PNG)

### PWA Icons

Place these in the `public/` directory:

- `icon-72x72.png` (72x72px PNG)
- `icon-96x96.png` (96x96px PNG)
- `icon-128x128.png` (128x128px PNG)
- `icon-144x144.png` (144x144px PNG)
- `icon-152x152.png` (152x152px PNG)
- `icon-192x192.png` (192x192px PNG, maskable)
- `icon-384x384.png` (384x384px PNG)
- `icon-512x512.png` (512x512px PNG, maskable)

### Social Media Images

Place these in the `public/` directory:

- `og-image.png` (1200x630px PNG for Open Graph)
- `twitter-image.png` (1200x675px PNG for Twitter Cards)
- `logo.png` (Square logo, at least 400x400px)

### PWA Screenshots

Place these in the `public/` directory:

- `screenshot-mobile.png` (540x720px, portrait)
- `screenshot-desktop.png` (1920x1080px, landscape)

## Design Guidelines

### Brand Colors

- Primary Purple: `#a855f7`
- Primary Pink: `#ec4899`
- Dark Background: `#0f172a`
- Cyan Accent: `#06b6d4`

### Icon Design

- Use the UvoCollab music wave logo
- Ensure good contrast on both light and dark backgrounds
- For maskable icons, keep important content within the safe area (80% of canvas)
- Use transparency for non-maskable icons

### Social Images

- Include the UvoCollab logo and tagline
- Use gradient backgrounds matching brand colors
- Ensure text is readable at small sizes
- Test on both desktop and mobile previews

## Quick Generation Tools

### Online Tools

1. **Favicon Generator**: https://realfavicongenerator.net/

   - Upload a 512x512 PNG
   - Download full favicon package

2. **PWA Icon Generator**: https://www.pwabuilder.com/imageGenerator

   - Upload a 512x512 PNG
   - Download all required sizes

3. **Social Media Image Creator**: https://www.canva.com/
   - Use "Open Graph" template (1200x630)
   - Use "Twitter Post" template (1200x675)

### Using ImageMagick (Command Line)

```bash
# Install ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS

# Generate all icon sizes from a master 512x512 image
convert master-icon.png -resize 72x72 public/icon-72x72.png
convert master-icon.png -resize 96x96 public/icon-96x96.png
convert master-icon.png -resize 128x128 public/icon-128x128.png
convert master-icon.png -resize 144x144 public/icon-144x144.png
convert master-icon.png -resize 152x152 public/icon-152x152.png
convert master-icon.png -resize 192x192 public/icon-192x192.png
convert master-icon.png -resize 384x384 public/icon-384x384.png
convert master-icon.png -resize 512x512 public/icon-512x512.png

# Generate favicon
convert master-icon.png -resize 32x32 public/favicon.ico
convert master-icon.png -resize 16x16 public/icon-16x16.png
convert master-icon.png -resize 32x32 public/icon-32x32.png
convert master-icon.png -resize 180x180 public/apple-touch-icon.png
```

## Verification Checklist

After generating all assets, verify:

- [ ] All files are in correct dimensions
- [ ] Files are optimized (compressed but good quality)
- [ ] Icons display correctly on dark and light backgrounds
- [ ] Social media cards preview correctly
- [ ] Favicon appears in browser tabs
- [ ] PWA installable on mobile devices
- [ ] No 404 errors in browser console for missing assets

## Notes

- Keep file sizes small (icons < 50KB each, social images < 300KB)
- Use PNG format for transparency support
- Test social media previews with actual sharing
- Update manifest.json if you change icon file names
