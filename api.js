/**
 * Weather PWA - API Client
 * Handles API calls with rate limiting, AbortController, and error handling
 */

class APIClient {
    constructor() {
        this.requestQueue = [];
        this.requestTimestamps = [];
        this.abortControllers = new Map();
    }

    /**
     * Rate limiting: track requests and enforce limits
     * @param {string} requestId - Unique request identifier
     * @returns {boolean} - True if request can proceed
     */
    canMakeRequest(requestId) {
        const now = Date.now();
        const windowStart = now - CONFIG.RATE_LIMIT.WINDOW_MS;
        
        // Remove old timestamps outside the window
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => timestamp > windowStart
        );
        
        // Check if we've exceeded the limit
        if (this.requestTimestamps.length >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
            console.warn('Rate limit exceeded. Please wait before making more requests.');
            return false;
        }
        
        // Add current timestamp
        this.requestTimestamps.push(now);
        return true;
    }

    /**
     * Cancel a pending request
     * @param {string} requestId - Request identifier
     */
    cancelRequest(requestId) {
        const controller = this.abortControllers.get(requestId);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(requestId);
        }
    }

    /**
     * Cancel all pending requests
     */
    cancelAllRequests() {
        this.abortControllers.forEach((controller) => {
            controller.abort();
        });
        this.abortControllers.clear();
    }

    /**
     * Fetch weather data with rate limiting and abort support
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} endpoint - API endpoint ('weather' or 'forecast')
     * @returns {Promise<Object>} - Weather data
     */
    async fetchWeatherData(lat, lon, endpoint = 'weather') {
        // Validate inputs
        if (!window.utils.validateLocation({ lat, lon })) {
            throw new Error('Invalid location coordinates');
        }

        const requestId = `${endpoint}-${lat}-${lon}-${Date.now()}`;
        
        // Check rate limit
        if (!this.canMakeRequest(requestId)) {
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }

        // Create AbortController for this request
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);

        try {
            const url = `${CONFIG.API_BASE_URL}/${endpoint}?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.API_KEY}`;
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            // Remove controller after request completes
            this.abortControllers.delete(requestId);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
                } else if (response.status === 429) {
                    throw new Error('API rate limit exceeded. Please try again later.');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API error: ${response.status} - ${errorData.message || response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            // Validate response structure
            const responseType = endpoint === 'forecast' ? 'forecast' : 'weather';
            if (!window.utils.validateWeatherResponse(data, responseType)) {
                throw new Error('Invalid API response structure');
            }
            
            return data;
        } catch (error) {
            // Remove controller on error
            this.abortControllers.delete(requestId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            throw error;
        }
    }

    /**
     * Fetch location coordinates from city name
     * @param {string} cityName - City name
     * @returns {Promise<Object>} - Location object with lat, lon, name
     */
    async fetchLocationFromCityName(cityName) {
        // Validate input
        if (!window.utils.validateCityName(cityName)) {
            throw new Error('Invalid city name');
        }

        const requestId = `geocode-${cityName}-${Date.now()}`;
        
        // Check rate limit
        if (!this.canMakeRequest(requestId)) {
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }

        // Create AbortController
        const controller = new AbortController();
        this.abortControllers.set(requestId, controller);

        try {
            const url = `${CONFIG.GEO_API_BASE_URL}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${CONFIG.API_KEY}`;
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            this.abortControllers.delete(requestId);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
                }
                throw new Error('Failed to fetch location');
            }
            
            const data = await response.json();
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('Location not found');
            }
            
            // Validate response structure
            if (!data[0].lat || !data[0].lon || !data[0].name || !data[0].country) {
                throw new Error('Invalid location data received');
            }
            
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                name: `${data[0].name}, ${data[0].country}`,
                timestamp: Date.now()
            };
        } catch (error) {
            this.abortControllers.delete(requestId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            }
            throw error;
        }
    }
}

// Create singleton instance
const apiClient = new APIClient();

// Make available globally
window.apiClient = apiClient;

