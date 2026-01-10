# How to Generate Icons

The app needs icon files for PWA installation. Here's how to create them:

## Quick Method (Recommended):

1. **Open the icon generator:**
   - Start your local server (if not already running)
   - Navigate to: `http://localhost:8000/generate-icons.html`
   - Or open `generate-icons.html` directly in your browser

2. **Download the icons:**
   - Click the "Download All Icons" button
   - Or download each icon individually using the download links

3. **Save to icons folder:**
   - Save all downloaded icons to the `icons/` folder in your project
   - Make sure the filenames match:
     - `icon-72x72.png`
     - `icon-96x96.png`
     - `icon-128x128.png`
     - `icon-144x144.png`
     - `icon-152x152.png`
     - `icon-192x192.png`
     - `icon-384x384.png`
     - `icon-512x512.png`

4. **Refresh your app:**
   - The 404 errors should disappear
   - The PWA will be fully installable

## Alternative: Create Simple Placeholder Icons

If you just want to test without proper icons, you can create simple colored squares:

1. Use any image editor
2. Create PNG files with the required sizes
3. Use a blue background (#3b82f6) with a white cloud emoji or text "🌤️"
4. Save them with the correct filenames in the `icons/` folder

## Current Status:

The `icons/` folder exists but is empty. Once you add the icon files, the errors will be resolved.

