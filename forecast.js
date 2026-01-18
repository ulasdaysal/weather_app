/**
 * Weather PWA - Forecast Page JavaScript
 * Handles 5-day weather forecast display
 */

// Initialize forecast page
document.addEventListener('DOMContentLoaded', () => {
    if (!window.utils || !window.CONFIG || !window.apiClient) {
        console.error('Required dependencies not loaded. Make sure config.js, utils.js, and api.js are loaded first.');
        return;
    }

    window.utils.checkOnlineStatus();
    loadForecast();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
});

/**
 * Handle online event
 */
function handleOnline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.add('hidden');
    }
    loadForecast(); // Refresh forecast when back online
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.remove('hidden');
    }
    // Load cached forecast data
    loadCachedForecast();
}

/**
 * Load 5-day forecast data
 */
async function loadForecast() {
    const loading = window.utils.getElementByIdSafe('loading');
    const error = window.utils.getElementByIdSafe('error');
    const forecastContent = window.utils.getElementByIdSafe('forecast-content');
    const errorMessage = window.utils.getElementByIdSafe('error-message');

    if (!loading || !error || !forecastContent || !errorMessage) {
        console.error('Required DOM elements not found');
        return;
    }

    // Show loading state
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    forecastContent.classList.add('hidden');

    try {
        let location = window.utils.getStoredLocation();
        
        // If no stored location, try to get current location
        if (!location) {
            location = await window.utils.getCurrentLocation();
        }

        // Validate location before making API call
        if (!window.utils.validateLocation(location)) {
            throw new Error('Invalid location data');
        }

        const forecastData = await window.apiClient.fetchWeatherData(location.lat, location.lon, 'forecast');
        displayForecast(forecastData, location);
        
        // Cache the forecast data
        cacheForecastData(forecastData, location);
        
    } catch (err) {
        console.error('Error loading forecast:', err);
        if (errorMessage) {
            errorMessage.textContent = err.message || 'Failed to load forecast data. Please check your connection.';
        }
        if (error) {
            error.classList.remove('hidden');
        }
        
        // Try to load cached forecast as fallback
        loadCachedForecast();
    } finally {
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

/**
 * Display forecast data in the UI (XSS-safe)
 */
function displayForecast(data, location) {
    const forecastContent = window.utils.getElementByIdSafe('forecast-content');
    const forecastList = window.utils.getElementByIdSafe('forecast-list');
    const forecastLocation = window.utils.getElementByIdSafe('forecast-location');
    
    if (!forecastContent || !forecastList || !forecastLocation) {
        console.error('Required DOM elements not found');
        return;
    }

    // Validate API response structure
    if (!window.utils.validateWeatherResponse(data, 'forecast')) {
        console.error('Invalid forecast data structure');
        return;
    }

    // Safely update location name
    const locationName = location.name || 
        (data.city && data.city.name && data.city.country 
            ? `${data.city.name}, ${data.city.country}` 
            : 'Unknown Location');
    window.utils.setTextContent(forecastLocation, locationName);
    
    // Group forecast by day
    const dailyForecasts = groupForecastsByDay(data.list);
    
    // Clear existing forecast items (XSS-safe)
    forecastList.innerHTML = '';
    
    // Display each day's forecast (max 5 days)
    dailyForecasts.slice(0, 5).forEach((dayForecast) => {
        const forecastItem = createForecastItem(dayForecast);
        forecastList.appendChild(forecastItem);
    });
    
    // Show forecast content
    forecastContent.classList.remove('hidden');
}

/**
 * Group forecast items by day
 */
function groupForecastsByDay(forecastList) {
    if (!Array.isArray(forecastList)) {
        return [];
    }

    const dailyForecasts = {};
    
    forecastList.forEach(item => {
        if (!item || !item.dt || !item.weather || !Array.isArray(item.weather) || 
            item.weather.length === 0 || !item.main) {
            return; // Skip invalid items
        }

        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyForecasts[dayKey]) {
            dailyForecasts[dayKey] = {
                date: date,
                items: [],
                minTemp: Infinity,
                maxTemp: -Infinity,
                icon: item.weather[0].icon || '',
                description: item.weather[0].description || ''
            };
        }
        
        dailyForecasts[dayKey].items.push(item);
        
        if (typeof item.main.temp_min === 'number') {
            dailyForecasts[dayKey].minTemp = Math.min(dailyForecasts[dayKey].minTemp, item.main.temp_min);
        }
        if (typeof item.main.temp_max === 'number') {
            dailyForecasts[dayKey].maxTemp = Math.max(dailyForecasts[dayKey].maxTemp, item.main.temp_max);
        }
    });
    
    return Object.values(dailyForecasts);
}

/**
 * Create a forecast item element (XSS-safe)
 */
function createForecastItem(dayForecast) {
    const item = document.createElement('div');
    item.className = 'forecast-item';
    
    const date = dayForecast.date;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Create day/date container
    const dateContainer = document.createElement('div');
    const dayElement = window.utils.createTextElement('div', dayName, 'forecast-day');
    const dateElement = window.utils.createTextElement('div', dateStr, 'forecast-date');
    dateContainer.appendChild(dayElement);
    dateContainer.appendChild(dateElement);
    
    // Create temperature container
    const tempContainer = document.createElement('div');
    tempContainer.className = 'forecast-temp';
    
    // Add icon if available
    if (dayForecast.icon) {
        const iconImg = document.createElement('img');
        iconImg.src = `https://openweathermap.org/img/wn/${dayForecast.icon}@2x.png`;
        iconImg.alt = dayForecast.description || 'Weather icon';
        iconImg.className = 'forecast-icon-small';
        tempContainer.appendChild(iconImg);
    }
    
    // Create temperature range
    const tempRange = document.createElement('div');
    tempRange.className = 'forecast-temp-range';
    
    if (dayForecast.maxTemp !== Infinity && dayForecast.maxTemp !== -Infinity) {
        const highTemp = window.utils.createTextElement('div', `${Math.round(dayForecast.maxTemp)}°C`, 'forecast-high');
        tempRange.appendChild(highTemp);
    }
    
    if (dayForecast.minTemp !== Infinity && dayForecast.minTemp !== -Infinity) {
        const lowTemp = window.utils.createTextElement('div', `${Math.round(dayForecast.minTemp)}°C`, 'forecast-low');
        tempRange.appendChild(lowTemp);
    }
    
    tempContainer.appendChild(tempRange);
    
    // Assemble item
    item.appendChild(dateContainer);
    item.appendChild(tempContainer);
    
    return item;
}

/**
 * Cache forecast data for offline use
 */
function cacheForecastData(data, location) {
    try {
        const cacheData = {
            data,
            location,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.CACHE_KEYS.FORECAST, JSON.stringify(cacheData));
    } catch (err) {
        console.error('Error caching forecast data:', err);
    }
}

/**
 * Load cached forecast data
 */
function loadCachedForecast() {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEYS.FORECAST);
        if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            
            if (age < CONFIG.CACHE_MAX_AGE.FORECAST) {
                displayForecast(cacheData.data, cacheData.location);
                return true;
            }
        }
    } catch (err) {
        console.error('Error loading cached forecast:', err);
    }
    return false;
}

// Make function available globally for onclick handlers
window.loadForecast = loadForecast;
