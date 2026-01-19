/**
 * Weather PWA - Main Application JavaScript
 * Handles current weather display, geolocation, and offline detection
 */

// Weather alert interval ID (for cleanup)
let weatherAlertIntervalId = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.utils || !window.CONFIG || !window.apiClient) {
        console.error('Required dependencies not loaded. Make sure config.js, utils.js, and api.js are loaded first.');
        return;
    }

    window.utils.checkOnlineStatus();
    loadWeather();
    checkNotificationPermission();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Setup city search input handler
    const citySearchInput = window.utils.getElementByIdSafe('city-search-input');
    if (citySearchInput) {
        // Handle Enter key
        citySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCityWeather();
            }
        });
    }
});

/**
 * Check if device is online and update UI accordingly
 */
function checkOnlineStatus() {
    window.utils.checkOnlineStatus();
}

/**
 * Handle online event
 */
function handleOnline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.add('hidden');
    }
    loadWeather(); // Refresh weather data when back online
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.remove('hidden');
    }
    // Load cached data
    loadCachedWeather();
}

/**
 * Load weather data for current or default location
 */
async function loadWeather() {
    const loading = window.utils.getElementByIdSafe('loading');
    const error = window.utils.getElementByIdSafe('error');
    const weatherContent = window.utils.getElementByIdSafe('weather-content');
    const errorMessage = window.utils.getElementByIdSafe('error-message');

    if (!loading || !error || !weatherContent || !errorMessage) {
        console.error('Required DOM elements not found');
        return;
    }

    // Show loading state
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    weatherContent.classList.add('hidden');

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

        const weatherData = await window.apiClient.fetchWeatherData(location.lat, location.lon, 'weather');
        displayWeather(weatherData, location);
        
        // Cache the data
        cacheWeatherData(weatherData, location);
        
        // Update last updated time
        updateLastUpdated();
        
    } catch (err) {
        console.error('Error loading weather:', err);
        if (errorMessage) {
            errorMessage.textContent = err.message || 'Failed to load weather data. Please check your connection.';
        }
        if (error) {
            error.classList.remove('hidden');
        }
        
        // Try to load cached data as fallback
        loadCachedWeather();
    } finally {
        if (loading) {
            loading.classList.add('hidden');
        }
    }
}

/**
 * Display weather data in the UI (XSS-safe)
 */
function displayWeather(data, location) {
    const weatherContent = window.utils.getElementByIdSafe('weather-content');
    const locationNameElement = window.utils.getElementByIdSafe('location-name');
    
    if (!weatherContent || !locationNameElement) {
        console.error('Required DOM elements not found');
        return;
    }

    // Validate API response structure
    if (!window.utils.validateWeatherResponse(data, 'weather')) {
        console.error('Invalid weather data structure');
        return;
    }

    // Safely get city name from weather API response
    const cityName = data.name && data.sys && data.sys.country 
        ? `${data.name}, ${data.sys.country}` 
        : 'Unknown Location';
    
    // Check if this is a saved location
    const isSavedLocation = location.savedLocationId !== undefined && location.savedLocationId !== null;
    
    if (!isSavedLocation) {
        // Show "Current Location" as main heading and city name as subtitle (XSS-safe)
        locationNameElement.innerHTML = ''; // Clear first
        const currentLocationSpan = window.utils.createTextElement('span', 'Current Location');
        const subtitleDiv = window.utils.createTextElement('div', cityName, 'location-subtitle');
        locationNameElement.appendChild(currentLocationSpan);
        locationNameElement.appendChild(subtitleDiv);
        
        // Update the stored location with the actual city name
        if (location.lat && location.lon) {
            location.name = cityName;
            location.isCurrentLocation = true;
            try {
                localStorage.setItem(CONFIG.CACHE_KEYS.LOCATION, JSON.stringify(location));
            } catch (err) {
                console.error('Error storing location:', err);
            }
        }
    } else {
        // Show the stored location name (XSS-safe)
        window.utils.setTextContent(locationNameElement, location.name || cityName);
        
        // Preserve the saved location info in localStorage
        if (location.lat && location.lon && location.savedLocationId) {
            location.name = location.name || cityName;
            try {
                localStorage.setItem(CONFIG.CACHE_KEYS.LOCATION, JSON.stringify(location));
            } catch (err) {
                console.error('Error storing location:', err);
            }
        }
    }
    
    // Safely update weather data with null checks
    const tempElement = window.utils.getElementByIdSafe('temperature');
    const descElement = window.utils.getElementByIdSafe('weather-description');
    const iconElement = window.utils.getElementByIdSafe('weather-icon');
    const feelsLikeElement = window.utils.getElementByIdSafe('feels-like');
    const humidityElement = window.utils.getElementByIdSafe('humidity');
    const windSpeedElement = window.utils.getElementByIdSafe('wind-speed');
    const pressureElement = window.utils.getElementByIdSafe('pressure');

    if (tempElement && data.main && typeof data.main.temp === 'number') {
        window.utils.setTextContent(tempElement, Math.round(data.main.temp).toString());
    }

    if (descElement && data.weather && data.weather[0] && data.weather[0].description) {
        window.utils.setTextContent(descElement, data.weather[0].description);
    }

    if (iconElement && data.weather && data.weather[0] && data.weather[0].icon) {
        const iconCode = data.weather[0].icon;
        iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.alt = data.weather[0].description || 'Weather icon';
    }

    if (feelsLikeElement && data.main && typeof data.main.feels_like === 'number') {
        window.utils.setTextContent(feelsLikeElement, `${Math.round(data.main.feels_like)}°C`);
    }

    if (humidityElement && data.main && typeof data.main.humidity === 'number') {
        window.utils.setTextContent(humidityElement, `${data.main.humidity}%`);
    }

    if (windSpeedElement && data.wind && typeof data.wind.speed === 'number') {
        window.utils.setTextContent(windSpeedElement, `${Math.round(data.wind.speed * 3.6)} km/h`);
    }

    if (pressureElement && data.main && typeof data.main.pressure === 'number') {
        window.utils.setTextContent(pressureElement, `${data.main.pressure} hPa`);
    }
    
    // Show weather content
    weatherContent.classList.remove('hidden');
}

/**
 * Cache weather data for offline use
 */
function cacheWeatherData(data, location) {
    try {
        const cacheData = {
            data,
            location,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.CACHE_KEYS.CURRENT_WEATHER, JSON.stringify(cacheData));
    } catch (err) {
        console.error('Error caching weather data:', err);
    }
}

/**
 * Load cached weather data
 */
function loadCachedWeather() {
    try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEYS.CURRENT_WEATHER);
        if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            
            if (age < CONFIG.CACHE_MAX_AGE.WEATHER) {
                displayWeather(cacheData.data, cacheData.location);
                updateLastUpdated(cacheData.timestamp);
                return true;
            }
        }
    } catch (err) {
        console.error('Error loading cached weather:', err);
    }
    return false;
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(timestamp = null) {
    const lastUpdated = window.utils.getElementByIdSafe('last-updated');
    if (!lastUpdated) {
        return;
    }
    
    const time = timestamp || Date.now();
    const date = new Date(time);
    window.utils.setTextContent(lastUpdated, `Last updated: ${date.toLocaleString()}`);
}

/**
 * Search for weather by city name
 */
async function searchCityWeather() {
    console.log('searchCityWeather called');
    const input = window.utils.getElementByIdSafe('city-search-input');
    if (!input) {
        console.error('City search input element not found');
        window.alertModal('Search input not found. Please refresh the page.', 'Error');
        return;
    }

    const cityName = input.value.trim();
    console.log('Searching for city:', cityName);

    // Validate input
    if (!window.utils.validateCityName(cityName)) {
        window.alertModal('Please enter a valid city name', 'Invalid Input');
        return;
    }

    const loading = window.utils.getElementByIdSafe('loading');
    const error = window.utils.getElementByIdSafe('error');
    const weatherContent = window.utils.getElementByIdSafe('weather-content');
    const errorMessage = window.utils.getElementByIdSafe('error-message');

    if (!loading || !error || !weatherContent || !errorMessage) {
        console.error('Required DOM elements not found:', { loading, error, weatherContent, errorMessage });
        window.alertModal('Page elements not loaded. Please refresh the page.', 'Error');
        return;
    }

    // Show loading state
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    weatherContent.classList.add('hidden');

    // Disable search button during search
    const searchButton = document.querySelector('.add-location-form .btn-add');
    const originalButtonText = searchButton?.textContent;
    if (searchButton) {
        searchButton.disabled = true;
        searchButton.textContent = 'Searching...';
    }

    try {
        console.log('Fetching location for:', cityName);
        // Fetch location coordinates from city name
        const location = await window.apiClient.fetchLocationFromCityName(cityName);
        console.log('Location found:', location);
        
        // Validate location before making API call
        if (!window.utils.validateLocation(location)) {
            throw new Error('Invalid location data received');
        }

        console.log('Fetching weather data for:', location);
        // Fetch weather data
        const weatherData = await window.apiClient.fetchWeatherData(location.lat, location.lon, 'weather');
        console.log('Weather data received:', weatherData);
        
        // Store the searched location
        location.isCurrentLocation = false;
        try {
            localStorage.setItem(CONFIG.CACHE_KEYS.LOCATION, JSON.stringify(location));
        } catch (err) {
            console.error('Error storing location:', err);
        }
        
        displayWeather(weatherData, location);
        
        // Cache the data
        cacheWeatherData(weatherData, location);
        
        // Update last updated time
        updateLastUpdated();
        
        // Clear input
        input.value = '';
        console.log('Search completed successfully');
        
    } catch (err) {
        console.error('Error searching city weather - Full error:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        
        let errorMsg;
        const errMessage = err.message || String(err);
        
        if (errMessage.includes('not found') || errMessage.includes('Location')) {
            errorMsg = `Could not find city "${cityName}". Please check the spelling and try again.`;
        } else if (errMessage.includes('API key') || errMessage.includes('401')) {
            errorMsg = 'Invalid API key. Please check your OpenWeatherMap API key configuration.';
        } else if (errMessage.includes('Network') || errMessage.includes('connection') || errMessage.includes('Failed to fetch')) {
            errorMsg = 'Network error. Please check your internet connection and try again.';
        } else if (errMessage.includes('Rate limit')) {
            errorMsg = 'Too many requests. Please wait a moment and try again.';
        } else {
            errorMsg = `Error: ${errMessage}. Please try again.`;
        }
        
        if (errorMessage) {
            errorMessage.textContent = errorMsg;
        }
        if (error) {
            error.classList.remove('hidden');
        }
        
        // Also show modal for better visibility
        window.alertModal(errorMsg, 'Search Error');
    } finally {
        if (loading) {
            loading.classList.add('hidden');
        }
        // Restore search button
        if (searchButton && originalButtonText) {
            searchButton.disabled = false;
            searchButton.textContent = originalButtonText;
        }
    }
}

/**
 * Use current location button handler
 */
const useLocationBtn = window.utils.getElementByIdSafe('use-location-btn');
if (useLocationBtn) {
    useLocationBtn.addEventListener('click', async () => {
        try {
            // Clear stored location to force fresh geolocation
            localStorage.removeItem(CONFIG.CACHE_KEYS.LOCATION);
            const location = await window.utils.getCurrentLocation();
            await loadWeather();
        } catch (err) {
            console.error('Error getting location:', err);
            window.alertModal('Unable to get your location. Please check your browser permissions.', 'Location Error');
        }
    });
}

/**
 * Check notification permission status
 */
function checkNotificationPermission() {
    const notificationPrompt = window.utils.getElementByIdSafe('notification-prompt');
    if (!notificationPrompt) {
        return;
    }
    
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
        window.alertModal('This browser does not support notifications', 'Notification Error');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            const notificationPrompt = window.utils.getElementByIdSafe('notification-prompt');
            if (notificationPrompt) {
                notificationPrompt.classList.add('hidden');
            }
            
            // Show a test notification
            showNotification('Notifications Enabled', 'You will receive weather alerts!');
            
            // Schedule weather alerts
            scheduleWeatherAlerts();
        } else {
            window.alertModal('Notification permission denied', 'Permission Denied');
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
        
        try {
            new Notification(title, options);
        } catch (err) {
            console.error('Error showing notification:', err);
        }
    }
}

/**
 * Schedule weather alerts based on conditions (with cleanup)
 */
function scheduleWeatherAlerts() {
    // Clear any existing interval to prevent memory leaks
    if (weatherAlertIntervalId !== null) {
        clearInterval(weatherAlertIntervalId);
        weatherAlertIntervalId = null;
    }

    // Check weather every hour and send alerts for severe conditions
    weatherAlertIntervalId = setInterval(async () => {
        try {
            const location = window.utils.getStoredLocation();
            if (!location || !window.utils.validateLocation(location)) {
                return;
            }
            
            const weatherData = await window.apiClient.fetchWeatherData(location.lat, location.lon, 'weather');
            
            // Validate response structure
            if (!window.utils.validateWeatherResponse(weatherData, 'weather')) {
                return;
            }
            
            // Alert for severe weather conditions
            if (weatherData.weather && weatherData.weather[0] && weatherData.main) {
                const condition = weatherData.weather[0].main ? weatherData.weather[0].main.toLowerCase() : '';
                const temp = typeof weatherData.main.temp === 'number' ? weatherData.main.temp : null;
                const description = weatherData.weather[0].description || 'Unknown condition';
                const cityName = weatherData.name || 'Unknown location';
                
                if (condition.includes('thunderstorm') || condition.includes('extreme')) {
                    showNotification(
                        'Severe Weather Alert',
                        `${description} in ${cityName}. Stay safe!`
                    );
                } else if (temp !== null && temp < CONFIG.ALERTS.FREEZING_TEMP) {
                    showNotification(
                        'Freezing Temperature',
                        `Temperature is ${Math.round(temp)}°C. Bundle up!`
                    );
                } else if (temp !== null && temp > CONFIG.ALERTS.HOT_TEMP) {
                    showNotification(
                        'Hot Weather Alert',
                        `Temperature is ${Math.round(temp)}°C. Stay hydrated!`
                    );
                }
            }
        } catch (err) {
            console.error('Error checking weather for alerts:', err);
        }
    }, CONFIG.ALERTS.CHECK_INTERVAL);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (weatherAlertIntervalId !== null) {
        clearInterval(weatherAlertIntervalId);
        weatherAlertIntervalId = null;
    }
    // Cancel all pending API requests
    window.apiClient.cancelAllRequests();
});

// Make functions available globally for onclick handlers
window.loadWeather = loadWeather;
window.requestNotificationPermission = requestNotificationPermission;
window.searchCityWeather = searchCityWeather;
