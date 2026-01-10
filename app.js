/**
 * Weather PWA - Main Application JavaScript
 * Handles current weather display, geolocation, and offline detection
 */

// API Configuration
const API_KEY = '79fa7767ac09d5fc8db2c7505cd7fea3'; // OpenWeatherMap API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache keys for offline storage
const CACHE_KEYS = {
    CURRENT_WEATHER: 'current_weather_cache',
    LOCATION: 'user_location_cache'
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkOnlineStatus();
    loadWeather();
    checkNotificationPermission();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
});

/**
 * Check if device is online and update UI accordingly
 */
function checkOnlineStatus() {
    const offlineBanner = document.getElementById('offline-banner');
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
    } else {
        offlineBanner.classList.add('hidden');
    }
}

/**
 * Handle online event
 */
function handleOnline() {
    const offlineBanner = document.getElementById('offline-banner');
    offlineBanner.classList.add('hidden');
    loadWeather(); // Refresh weather data when back online
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = document.getElementById('offline-banner');
    offlineBanner.classList.remove('hidden');
    // Load cached data
    loadCachedWeather();
}

/**
 * Load weather data for current or default location
 */
async function loadWeather() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const weatherContent = document.getElementById('weather-content');
    const errorMessage = document.getElementById('error-message');

    // Show loading state
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    weatherContent.classList.add('hidden');

    try {
        let location = getStoredLocation();
        
        // If no stored location, try to get current location
        if (!location) {
            location = await getCurrentLocation();
        }

        const weatherData = await fetchWeatherData(location.lat, location.lon);
        displayWeather(weatherData, location);
        
        // Cache the data
        cacheWeatherData(weatherData, location);
        
        // Update last updated time
        updateLastUpdated();
        
    } catch (err) {
        console.error('Error loading weather:', err);
        errorMessage.textContent = err.message || 'Failed to load weather data. Please check your connection.';
        error.classList.remove('hidden');
        
        // Try to load cached data as fallback
        loadCachedWeather();
    } finally {
        loading.classList.add('hidden');
    }
}

/**
 * Get city name from coordinates using reverse geocoding
 */
async function getCityNameFromCoords(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                return `${data[0].name}, ${data[0].country}`;
            }
        }
    } catch (error) {
        console.warn('Could not fetch city name:', error);
    }
    return null;
}

/**
 * Get current location using Geolocation API (Native Device Feature #1)
 */
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    name: 'Current Location',
                    isCurrentLocation: true // Flag to identify as current location
                };
                
                // Try to get the actual city name (but keep isCurrentLocation flag)
                try {
                    const cityName = await getCityNameFromCoords(location.lat, location.lon);
                    if (cityName) {
                        location.name = cityName;
                    }
                } catch (error) {
                    console.warn('Could not fetch city name:', error);
                }
                
                // Store location for future use
                localStorage.setItem(CACHE_KEYS.LOCATION, JSON.stringify(location));
                resolve(location);
            },
            (error) => {
                // Default to a fallback location if geolocation fails
                console.warn('Geolocation error:', error);
                const fallbackLocation = { lat: 51.5074, lon: -0.1278, name: 'London, UK' };
                resolve(fallbackLocation);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

/**
 * Fetch weather data from API
 */
async function fetchWeatherData(lat, lon) {
    const url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenWeatherMap API key. New keys may take up to 2 hours to activate.');
        } else if (response.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
        }
    }
    
    return await response.json();
}

/**
 * Display weather data in the UI
 */
function displayWeather(data, location) {
    const weatherContent = document.getElementById('weather-content');
    const locationNameElement = document.getElementById('location-name');
    
    // Get city name from weather API response (most accurate)
    const cityName = `${data.name}, ${data.sys.country}`;
    
    // On the current weather page, always show "Current Location" with city name subtitle
    // The city name comes from the weather API response, which is always accurate
    // Check if this is a saved location (would have savedLocationId) or current location
    const isSavedLocation = location.savedLocationId !== undefined;
    
    if (!isSavedLocation) {
        // Show "Current Location" as main heading and city name as subtitle
        locationNameElement.innerHTML = `
            <span>Current Location</span>
            <div class="location-subtitle">${cityName}</div>
        `;
        
        // Update the stored location with the actual city name and mark it as current location
        if (location.lat && location.lon) {
            location.name = cityName;
            location.isCurrentLocation = true; // Flag to identify as current location
            localStorage.setItem(CACHE_KEYS.LOCATION, JSON.stringify(location));
        }
    } else {
        // Show the stored location name (for saved locations from locations page)
        locationNameElement.textContent = location.name || cityName;
    }
    
    // Update temperature
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    
    // Update weather description
    document.getElementById('weather-description').textContent = data.weather[0].description;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    document.getElementById('weather-icon').src = 
        `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weather-icon').alt = data.weather[0].description;
    
    // Update details
    document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    
    // Show weather content
    weatherContent.classList.remove('hidden');
}

/**
 * Cache weather data for offline use
 */
function cacheWeatherData(data, location) {
    const cacheData = {
        data,
        location,
        timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEYS.CURRENT_WEATHER, JSON.stringify(cacheData));
}

/**
 * Load cached weather data
 */
function loadCachedWeather() {
    const cached = localStorage.getItem(CACHE_KEYS.CURRENT_WEATHER);
    if (cached) {
        try {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            const maxAge = 3600000; // 1 hour
            
            if (age < maxAge) {
                displayWeather(cacheData.data, cacheData.location);
                updateLastUpdated(cacheData.timestamp);
                return true;
            }
        } catch (err) {
            console.error('Error loading cached weather:', err);
        }
    }
    return false;
}

/**
 * Get stored location from localStorage
 */
function getStoredLocation() {
    const stored = localStorage.getItem(CACHE_KEYS.LOCATION);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(timestamp = null) {
    const lastUpdated = document.getElementById('last-updated');
    const time = timestamp || Date.now();
    const date = new Date(time);
    lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
}

/**
 * Use current location button handler
 */
document.getElementById('use-location-btn')?.addEventListener('click', async () => {
    try {
        // Clear stored location to force fresh geolocation
        localStorage.removeItem(CACHE_KEYS.LOCATION);
        const location = await getCurrentLocation();
        await loadWeather();
    } catch (err) {
        alert('Unable to get your location. Please check your browser permissions.');
    }
});

/**
 * Check notification permission status
 */
function checkNotificationPermission() {
    const notificationPrompt = document.getElementById('notification-prompt');
    
    if ('Notification' in window && Notification.permission === 'default') {
        notificationPrompt.classList.remove('hidden');
    } else {
        notificationPrompt.classList.add('hidden');
    }
}

/**
 * Request notification permission (Native Device Feature #2)
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            document.getElementById('notification-prompt').classList.add('hidden');
            
            // Show a test notification
            showNotification('Notifications Enabled', 'You will receive weather alerts!');
            
            // Schedule weather alerts
            scheduleWeatherAlerts();
        } else {
            alert('Notification permission denied');
        }
    } catch (err) {
        console.error('Error requesting notification permission:', err);
    }
}

/**
 * Show a notification
 */
function showNotification(title, body, icon = null) {
    if (Notification.permission === 'granted') {
        const options = {
            body,
            icon: icon || 'icons/icon-192x192.png',
            badge: 'icons/icon-72x72.png',
            tag: 'weather-alert',
            requireInteraction: false
        };
        
        new Notification(title, options);
    }
}

/**
 * Schedule weather alerts based on conditions
 */
function scheduleWeatherAlerts() {
    // Check weather every hour and send alerts for severe conditions
    setInterval(async () => {
        try {
            const location = getStoredLocation();
            if (!location) return;
            
            const weatherData = await fetchWeatherData(location.lat, location.lon);
            
            // Alert for severe weather conditions
            const condition = weatherData.weather[0].main.toLowerCase();
            const temp = weatherData.main.temp;
            
            if (condition.includes('thunderstorm') || condition.includes('extreme')) {
                showNotification(
                    'Severe Weather Alert',
                    `${weatherData.weather[0].description} in ${weatherData.name}. Stay safe!`
                );
            } else if (temp < 0) {
                showNotification(
                    'Freezing Temperature',
                    `Temperature is ${Math.round(temp)}°C. Bundle up!`
                );
            } else if (temp > 35) {
                showNotification(
                    'Hot Weather Alert',
                    `Temperature is ${Math.round(temp)}°C. Stay hydrated!`
                );
            }
        } catch (err) {
            console.error('Error checking weather for alerts:', err);
        }
    }, 3600000); // Check every hour
}

// Make functions available globally for onclick handlers
window.loadWeather = loadWeather;
window.requestNotificationPermission = requestNotificationPermission;

