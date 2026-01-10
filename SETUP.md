# Quick Setup Guide

## Step 1: Get API Key
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Get your API key from the dashboard
4. Replace `YOUR_API_KEY_HERE` in these files:
   - `app.js` (line 6)
   - `forecast.js` (line 6)  
   - `locations.js` (lines 60 and 88)

## Step 2: Generate Icons
1. Open `generate-icons.html` in your browser
2. Click "Download All Icons"
3. Save all icons to the `icons/` folder

## Step 3: Start Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

## Step 4: Open App
- Navigate to `http://localhost:8000`
- Allow location permissions when prompted
- Enable notifications if desired

## Testing Offline Mode
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Refresh page - app should work with cached data

## Testing PWA Installation
1. Look for install icon in address bar (Chrome/Edge)
2. Or go to Menu → Install Weather PWA
3. App should appear as standalone app

