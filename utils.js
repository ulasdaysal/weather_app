/**
 * Weather PWA - Utility Functions
 * Shared utility functions used across multiple files
 */

/**
 * Safely get element by ID with null check
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} - Element or null if not found
 */
function getElementByIdSafe(id) {
    if (!id || typeof id !== 'string') {
        console.warn('getElementByIdSafe: Invalid ID provided');
        return null;
    }
    return document.getElementById(id);
}

/**
 * Check if device is online and update UI accordingly
 * @param {string} bannerId - ID of offline banner element
 */
function checkOnlineStatus(bannerId = 'offline-banner') {
    const offlineBanner = getElementByIdSafe(bannerId);
    if (!offlineBanner) {
        console.warn('checkOnlineStatus: Offline banner element not found');
        return;
    }
    
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
    } else {
        offlineBanner.classList.add('hidden');
    }
}

/**
 * Get current location using Geolocation API
 * @returns {Promise<Object>} - Location object with lat, lon, name
 */
function getCurrentLocation() {
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
                    isCurrentLocation: true
                };
                
                // Try to get the actual city name
                try {
                    const cityName = await getCityNameFromCoords(location.lat, location.lon);
                    if (cityName) {
                        location.name = cityName;
                    }
                } catch (error) {
                    console.warn('Could not fetch city name:', error);
                }
                
                // Store location for future use
                const stored = JSON.stringify(location);
                localStorage.setItem(CONFIG.CACHE_KEYS.LOCATION, stored);
                resolve(location);
            },
            (error) => {
                console.warn('Geolocation error:', error);
                // Return fallback location instead of rejecting
                resolve(CONFIG.DEFAULT_LOCATION);
            },
            CONFIG.GEOLOCATION_OPTIONS
        );
    });
}

/**
 * Get city name from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} - City name or null
 */
async function getCityNameFromCoords(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || 
        isNaN(lat) || isNaN(lon)) {
        console.warn('getCityNameFromCoords: Invalid coordinates');
        return null;
    }
    
    try {
        const url = `${CONFIG.GEO_API_BASE_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (data && Array.isArray(data) && data.length > 0 && 
            data[0].name && data[0].country) {
            return `${data[0].name}, ${data[0].country}`;
        }
    } catch (error) {
        console.warn('Could not fetch city name:', error);
    }
    return null;
}

/**
 * Get stored location from localStorage
 * @returns {Object|null} - Stored location or null
 */
function getStoredLocation() {
    try {
        const stored = localStorage.getItem(CONFIG.CACHE_KEYS.LOCATION);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error parsing stored location:', error);
        return null;
    }
}

/**
 * Validate API response structure
 * @param {Object} data - API response data
 * @param {string} type - Response type ('weather' or 'forecast')
 * @returns {boolean} - True if valid
 */
function validateWeatherResponse(data, type = 'weather') {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    if (type === 'weather') {
        return !!(data.name && 
                 data.main && typeof data.main.temp === 'number' &&
                 data.weather && Array.isArray(data.weather) && data.weather.length > 0 &&
                 data.sys && data.sys.country);
    } else if (type === 'forecast') {
        return !!(data.city && data.city.name &&
                 data.list && Array.isArray(data.list) && data.list.length > 0);
    }
    
    return false;
}

/**
 * Safely set text content (prevents XSS)
 * @param {HTMLElement|null} element - Target element
 * @param {string} text - Text content
 */
function setTextContent(element, text) {
    if (!element) {
        console.warn('setTextContent: Element is null');
        return;
    }
    element.textContent = text || '';
}

/**
 * Create element with text content (prevents XSS)
 * @param {string} tag - HTML tag name
 * @param {string} text - Text content
 * @param {string} className - CSS class name
 * @returns {HTMLElement} - Created element
 */
function createTextElement(tag, text, className = '') {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    element.textContent = text || '';
    return element;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate location object
 * @param {Object} location - Location object
 * @returns {boolean} - True if valid
 */
function validateLocation(location) {
    return location && 
           typeof location.lat === 'number' && 
           typeof location.lon === 'number' &&
           !isNaN(location.lat) && 
           !isNaN(location.lon) &&
           location.lat >= -90 && location.lat <= 90 &&
           location.lon >= -180 && location.lon <= 180;
}

/**
 * Validate city name input
 * @param {string} cityName - City name to validate
 * @returns {boolean} - True if valid
 */
function validateCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
        return false;
    }
    const trimmed = cityName.trim();
    return trimmed.length > 0 && trimmed.length <= 100; // Reasonable limit
}

// Make functions available globally
window.utils = {
    getElementByIdSafe,
    checkOnlineStatus,
    getCurrentLocation,
    getCityNameFromCoords,
    getStoredLocation,
    validateWeatherResponse,
    setTextContent,
    createTextElement,
    debounce,
    validateLocation,
    validateCityName
};

