/**
 * Weather PWA - Configuration
 * Centralized configuration for API keys and constants
 * 
 * NOTE: In production, API keys should be stored server-side
 * and accessed via a backend proxy to avoid exposing them in client code
 */

// API Configuration
const CONFIG = {
    // OpenWeatherMap API Key
    // TODO: Move to backend proxy in production
    API_KEY: '79fa7767ac09d5fc8db2c7505cd7fea3',
    API_BASE_URL: 'https://api.openweathermap.org/data/2.5',
    GEO_API_BASE_URL: 'https://api.openweathermap.org/geo/1.0',
    
    // Cache keys for localStorage
    CACHE_KEYS: {
        CURRENT_WEATHER: 'current_weather_cache',
        FORECAST: 'forecast_cache',
        LOCATION: 'user_location_cache',
        SAVED_LOCATIONS: 'saved_locations'
    },
    
    // Cache expiration times (milliseconds)
    CACHE_MAX_AGE: {
        WEATHER: 3600000, // 1 hour
        FORECAST: 3600000, // 1 hour
        LOCATION: 300000 // 5 minutes
    },
    
    // API rate limiting
    RATE_LIMIT: {
        MAX_REQUESTS: 60, // per window
        WINDOW_MS: 60000, // 1 minute window
        DEBOUNCE_MS: 500 // debounce delay for input
    },
    
    // Default location (fallback)
    DEFAULT_LOCATION: {
        lat: 51.5074,
        lon: -0.1278,
        name: 'London, UK'
    },
    
    // Geolocation options
    GEOLOCATION_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
    },
    
    // Weather alert thresholds
    ALERTS: {
        FREEZING_TEMP: 0, // Celsius
        HOT_TEMP: 35, // Celsius
        CHECK_INTERVAL: 3600000 // 1 hour
    }
};

// Make config available globally
window.CONFIG = CONFIG;

