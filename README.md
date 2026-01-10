# Weather PWA - Progressive Web Application

A fully-featured Progressive Web App (PWA) for weather forecasts with offline support, geolocation, and push notifications.

## 🌟 Features

### ✅ PWA Requirements Met

- **✅ Installable**: Includes manifest.json with all required metadata for home screen installation
- **✅ Native Device Features**: 
  - **Geolocation API**: Automatically detects user's current location for weather data
  - **Push Notifications**: Sends weather alerts for severe conditions, freezing temperatures, and extreme heat
- **✅ Offline Functionality**: 
  - Service Worker with intelligent caching strategies
  - Cache API for storing resources locally
  - Offline detection with user notifications
  - Cached weather data available when offline
- **✅ Multiple Views**: 
  - **Current Weather**: Real-time weather conditions for current or selected location
  - **5-Day Forecast**: Extended weather forecast with daily predictions
  - **Locations**: Manage and save multiple locations for quick access
- **✅ Responsive Design**: Fully responsive layout that adapts to mobile, tablet, and desktop screens
- **✅ Performance Optimized**: 
  - Efficient caching strategies
  - Lazy loading of resources
  - Optimized asset delivery
- **✅ HTTPS Ready**: Designed to run on secure HTTPS connections

## 🚀 Getting Started

### Prerequisites

- A web server (for local development, you can use Python's HTTP server, Node.js http-server, or any local server)
- An OpenWeatherMap API key (free tier available at [openweathermap.org](https://openweathermap.org/api))

### Installation

1. **Clone or download this repository**

2. **Get your OpenWeatherMap API Key**:
   - Sign up at [openweathermap.org](https://openweathermap.org/api)
   - Get your free API key
   - Replace `YOUR_API_KEY_HERE` in the following files:
     - `app.js` (line 6)
     - `forecast.js` (line 6)
     - `locations.js` (lines 60 and 88)

3. **Generate Icons**:
   - Run the icon generator script (see Icons section below)
   - Or create your own icons in the `icons/` directory with sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

4. **Start a Local Server**:
   
   **Using Python 3:**
   ```bash
   python -m http.server 8000
   ```
   
   **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```
   
   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

5. **Open in Browser**:
   - Navigate to `http://localhost:8000`
   - For PWA features to work fully, use HTTPS (or localhost which is treated as secure)

## 📱 Installation as PWA

### Desktop (Chrome/Edge):
1. Visit the app in your browser
2. Click the install icon in the address bar
3. Or go to Menu → Install Weather PWA

### Mobile (Android):
1. Visit the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen" or "Install App"

### Mobile (iOS):
1. Visit the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## 🎯 Application Views

### 1. Current Weather View (`index.html`)
- Displays current weather conditions
- Shows temperature, humidity, wind speed, pressure
- Uses geolocation to detect current location
- Displays weather icon and description
- Last updated timestamp

### 2. Forecast View (`forecast.html`)
- 5-day weather forecast
- Daily high/low temperatures
- Weather icons for each day
- Grouped by day for easy reading

### 3. Locations View (`locations.html`)
- Manage saved locations
- Add locations by city name
- Add current location using geolocation
- View weather for saved locations
- Delete locations

## 🔧 Native Device Features

### 1. Geolocation API
**Implementation**: Used in `app.js`, `forecast.js`, and `locations.js`

- **Purpose**: Automatically detects user's current location for weather data
- **How it works**: 
  - Uses `navigator.geolocation.getCurrentPosition()` API
  - Requests high-accuracy location data
  - Falls back to default location (London) if permission denied
  - Stores location in localStorage for future use
- **User Experience**: 
  - Button to request current location
  - Automatic location detection on first load
  - Location stored for offline use

### 2. Push Notifications API
**Implementation**: Used in `app.js`

- **Purpose**: Send weather alerts for severe conditions
- **How it works**: 
  - Requests notification permission from user
  - Checks weather conditions periodically (every hour)
  - Sends notifications for:
    - Severe weather (thunderstorms, extreme conditions)
    - Freezing temperatures (< 0°C)
    - Extreme heat (> 35°C)
- **User Experience**: 
  - Permission prompt on first visit
  - Non-intrusive notifications
  - Click notification to open app

## 💾 Offline Functionality

### Service Worker Caching Strategies

1. **Cache First** (Static Assets):
   - HTML, CSS, JavaScript files
   - Icons and images
   - Manifest file
   - Strategy: Check cache first, fetch from network if not cached

2. **Network First** (API Calls):
   - Weather API requests
   - Strategy: Try network first, fall back to cache if offline
   - Ensures fresh data when online, cached data when offline

3. **Stale While Revalidate** (Other Resources):
   - Strategy: Return cached version immediately, update in background
   - Provides instant response while updating cache

### Offline Detection

- Visual banner appears when offline
- Automatically switches to cached data
- User is informed of offline status
- Data refreshes when connection is restored

## 📂 Project Structure

```
weather-pwa/
│
├── index.html              # Current weather view
├── forecast.html           # 5-day forecast view
├── locations.html          # Saved locations view
│
├── styles.css             # Main stylesheet (responsive)
├── app.js                 # Current weather logic
├── forecast.js            # Forecast logic
├── locations.js           # Locations management logic
│
├── service-worker.js      # Service worker for offline support
├── service-worker-register.js  # Service worker registration
│
├── manifest.json          # PWA manifest file
│
├── icons/                 # App icons (various sizes)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
│
└── README.md              # This file
```

## 🎨 Design Features

- **Modern UI**: Clean, minimalist design with gradient navigation
- **Responsive**: Mobile-first approach, adapts to all screen sizes
- **Accessible**: Semantic HTML, proper ARIA labels
- **Performance**: Optimized assets, efficient rendering
- **User Experience**: 
  - Loading states
  - Error handling with retry options
  - Smooth transitions
  - Intuitive navigation

## 🔒 Security & Best Practices

- HTTPS required for full PWA functionality
- Secure API key handling (should be moved to backend in production)
- CORS-aware API requests
- Input validation
- Error handling throughout

## 🚀 Deployment

### For Production:

1. **Get HTTPS Certificate**:
   - Use services like Netlify, Vercel, GitHub Pages, or Firebase Hosting
   - All these platforms provide HTTPS by default

2. **Update API Key**:
   - For production, move API key to backend
   - Create a proxy server to hide API key from client

3. **Optimize Assets**:
   - Minify CSS and JavaScript
   - Optimize images
   - Enable compression

4. **Test PWA Features**:
   - Test installation on various devices
   - Verify offline functionality
   - Test push notifications
   - Check Lighthouse scores

## 📊 Performance

- **Lighthouse Scores** (target):
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+
  - PWA: 100

## 🐛 Troubleshooting

### Service Worker not registering:
- Ensure you're using HTTPS or localhost
- Check browser console for errors
- Clear browser cache and try again

### Geolocation not working:
- Check browser permissions
- Ensure HTTPS is used (required for geolocation)
- Check browser console for errors

### Notifications not working:
- Check browser permissions
- Ensure HTTPS is used
- Some browsers require user interaction before showing notifications

### API errors:
- Verify API key is correct
- Check API quota/limits
- Ensure network connection is active

## 📝 Code Quality

- **Well-commented**: All functions have JSDoc-style comments
- **Organized**: Logical file structure, separation of concerns
- **Best Practices**: 
  - ES6+ JavaScript
  - Modern CSS (variables, flexbox, grid)
  - Semantic HTML
  - Error handling
  - Async/await for promises

## 🔄 Updates & Maintenance

- Service Worker automatically updates when new version is deployed
- Cache versioning ensures old caches are cleared
- Users are prompted to refresh when new version is available

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Credits

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons from OpenWeatherMap API
- Built following PWA best practices

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify all prerequisites are met
4. Ensure API key is correctly configured

---

**Note**: Remember to replace `YOUR_API_KEY_HERE` with your actual OpenWeatherMap API key in `app.js`, `forecast.js`, and `locations.js` before running the application.

