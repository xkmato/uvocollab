#!/bin/bash

# UvoCollab SEO Assets Generator
# This script creates placeholder icons if you don't have the actual assets yet

echo "🎨 UvoCollab SEO Assets Generator"
echo "=================================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo "Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Create public directory if it doesn't exist
mkdir -p public

echo "📁 Creating placeholder icon files..."
echo ""

# Generate a simple placeholder icon with gradient
# This creates a purple-to-pink gradient circle with text

sizes=(16 32 72 96 128 144 152 180 192 384 512)

for size in "${sizes[@]}"; do
    output_file="public/icon-${size}x${size}.png"
    
    # Create gradient background with text
    convert -size ${size}x${size} \
        -define gradient:angle=135 \
        gradient:'#a855f7-#ec4899' \
        -gravity center \
        -pointsize $((size/4)) \
        -fill white \
        -font "DejaVu-Sans-Bold" \
        -annotate +0+0 "UV" \
        "$output_file"
    
    echo "✅ Created $output_file"
done

# Create apple touch icon
cp public/icon-180x180.png public/apple-touch-icon.png
echo "✅ Created public/apple-touch-icon.png"

# Create favicon.ico (multi-resolution)
convert public/icon-32x32.png public/icon-16x16.png public/favicon.ico
echo "✅ Created public/favicon.ico"

# Create logo.png (square)
convert -size 400x400 \
    -define gradient:angle=135 \
    gradient:'#a855f7-#ec4899' \
    -gravity center \
    -pointsize 120 \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -annotate +0-20 "UV" \
    -pointsize 40 \
    -annotate +0+60 "COLLAB" \
    public/logo.png
echo "✅ Created public/logo.png"

# Create Open Graph image
convert -size 1200x630 \
    -define gradient:angle=135 \
    gradient:'#a855f7-#ec4899' \
    -gravity center \
    -pointsize 80 \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -annotate +0-80 "UvoCollab" \
    -pointsize 40 \
    -annotate +0+20 "Connect Rising Artists with" \
    -annotate +0+80 "Music Industry Legends" \
    public/og-image.png
echo "✅ Created public/og-image.png"

# Create Twitter image
convert -size 1200x675 \
    -define gradient:angle=135 \
    gradient:'#a855f7-#ec4899' \
    -gravity center \
    -pointsize 80 \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -annotate +0-60 "UvoCollab" \
    -pointsize 35 \
    -annotate +0+30 "Connect Rising Artists with" \
    -annotate +0+80 "Music Industry Legends" \
    public/twitter-image.png
echo "✅ Created public/twitter-image.png"

# Create placeholder screenshots
convert -size 540x720 \
    -define gradient:angle=135 \
    gradient:'#a855f7-#ec4899' \
    -gravity center \
    -pointsize 40 \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -annotate +0-100 "UvoCollab" \
    -pointsize 25 \
    -annotate +0-50 "Mobile Experience" \
    -pointsize 18 \
    -annotate +0+0 "• Browse Legends" \
    -annotate +0+30 "• Secure Payments" \
    -annotate +0+60 "• Collaborate Safely" \
    public/screenshot-mobile.png
echo "✅ Created public/screenshot-mobile.png"

convert -size 1920x1080 \
    -define gradient:angle=135 \
    gradient:'#a855f7-#ec4899' \
    -gravity center \
    -pointsize 80 \
    -fill white \
    -font "DejaVu-Sans-Bold" \
    -annotate +0-120 "UvoCollab" \
    -pointsize 45 \
    -annotate +0-40 "Desktop Experience" \
    -pointsize 30 \
    -annotate +0+30 "Browse verified music industry professionals" \
    -annotate +0+75 "Secure collaborations with escrow payments" \
    -annotate +0+120 "Manage projects with integrated tools" \
    public/screenshot-desktop.png
echo "✅ Created public/screenshot-desktop.png"

echo ""
echo "🎉 All placeholder assets created successfully!"
echo ""
echo "📝 Note: These are placeholder images with gradients."
echo "   Replace them with your actual brand assets when ready."
echo ""
echo "Next steps:"
echo "1. Review all generated files in the public/ directory"
echo "2. Replace placeholders with actual brand designs"
echo "3. Optimize images for web (compress without losing quality)"
echo "4. Test social media previews with actual sharing"
echo ""
