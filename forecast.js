/**
 * Weather PWA - Forecast Page JavaScript
 * Handles 5-day weather forecast display
 */

// API Configuration
const API_KEY = '79fa7767ac09d5fc8db2c7505cd7fea3'; // OpenWeatherMap API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache key for forecast data
const FORECAST_CACHE_KEY = 'forecast_cache';

// Initialize forecast page
document.addEventListener('DOMContentLoaded', () => {
    checkOnlineStatus();
    loadForecast();
    
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
    loadForecast(); // Refresh forecast when back online
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = document.getElementById('offline-banner');
    offlineBanner.classList.remove('hidden');
    // Load cached forecast data
    loadCachedForecast();
}

/**
 * Load 5-day forecast data
 */
async function loadForecast() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const forecastContent = document.getElementById('forecast-content');
    const errorMessage = document.getElementById('error-message');

    // Show loading state
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    forecastContent.classList.add('hidden');

    try {
        let location = getStoredLocation();
        
        // If no stored location, try to get current location
        if (!location) {
            location = await getCurrentLocation();
        }

        const forecastData = await fetchForecastData(location.lat, location.lon);
        displayForecast(forecastData, location);
        
        // Cache the forecast data
        cacheForecastData(forecastData, location);
        
    } catch (err) {
        console.error('Error loading forecast:', err);
        errorMessage.textContent = err.message || 'Failed to load forecast data. Please check your connection.';
        error.classList.remove('hidden');
        
        // Try to load cached forecast as fallback
        loadCachedForecast();
    } finally {
        loading.classList.add('hidden');
    }
}

/**
 * Get current location using Geolocation API
 */
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    name: 'Current Location'
                };
                resolve(location);
            },
            (error) => {
                // Default to a fallback location
                const fallbackLocation = { lat: 51.5074, lon: -0.1278, name: 'London, UK' };
                resolve(fallbackLocation);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

/**
 * Fetch 5-day forecast data from API
 */
async function fetchForecastData(lat, lon) {
    const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    
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
 * Display forecast data in the UI
 */
function displayForecast(data, location) {
    const forecastContent = document.getElementById('forecast-content');
    const forecastList = document.getElementById('forecast-list');
    const forecastLocation = document.getElementById('forecast-location');
    
    // Update location name
    forecastLocation.textContent = location.name || `${data.city.name}, ${data.city.country}`;
    
    // Group forecast by day
    const dailyForecasts = groupForecastsByDay(data.list);
    
    // Clear existing forecast items
    forecastList.innerHTML = '';
    
    // Display each day's forecast
    dailyForecasts.forEach((dayForecast, index) => {
        if (index < 5) { // Show only 5 days
            const forecastItem = createForecastItem(dayForecast);
            forecastList.appendChild(forecastItem);
        }
    });
    
    // Show forecast content
    forecastContent.classList.remove('hidden');
}

/**
 * Group forecast items by day
 */
function groupForecastsByDay(forecastList) {
    const dailyForecasts = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                date: date,
                items: [],
                minTemp: Infinity,
                maxTemp: -Infinity,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        }
        
        dailyForecasts[dayKey].items.push(item);
        dailyForecasts[dayKey].minTemp = Math.min(dailyForecasts[dayKey].minTemp, item.main.temp_min);
        dailyForecasts[dayKey].maxTemp = Math.max(dailyForecasts[dayKey].maxTemp, item.main.temp_max);
    });
    
    return Object.values(dailyForecasts);
}

/**
 * Create a forecast item element
 */
function createForecastItem(dayForecast) {
    const item = document.createElement('div');
    item.className = 'forecast-item';
    
    const date = dayForecast.date;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const iconCode = dayForecast.icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    item.innerHTML = `
        <div>
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-date">${dateStr}</div>
        </div>
        <div class="forecast-temp">
            <img src="${iconUrl}" alt="${dayForecast.description}" class="forecast-icon-small">
            <div class="forecast-temp-range">
                <div class="forecast-high">${Math.round(dayForecast.maxTemp)}°C</div>
                <div class="forecast-low">${Math.round(dayForecast.minTemp)}°C</div>
            </div>
        </div>
    `;
    
    return item;
}

/**
 * Cache forecast data for offline use
 */
function cacheForecastData(data, location) {
    const cacheData = {
        data,
        location,
        timestamp: Date.now()
    };
    localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(cacheData));
}

/**
 * Load cached forecast data
 */
function loadCachedForecast() {
    const cached = localStorage.getItem(FORECAST_CACHE_KEY);
    if (cached) {
        try {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            const maxAge = 3600000; // 1 hour
            
            if (age < maxAge) {
                displayForecast(cacheData.data, cacheData.location);
                return true;
            }
        } catch (err) {
            console.error('Error loading cached forecast:', err);
        }
    }
    return false;
}

/**
 * Get stored location from localStorage
 */
function getStoredLocation() {
    const stored = localStorage.getItem('user_location_cache');
    return stored ? JSON.parse(stored) : null;
}

// Make function available globally for onclick handlers
window.loadForecast = loadForecast;

