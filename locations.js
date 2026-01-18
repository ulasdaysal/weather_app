/**
 * Weather PWA - Locations Page JavaScript
 * Handles saved locations management
 */

// Debounced add location function
let debouncedAddLocation = null;

// Initialize locations page
document.addEventListener('DOMContentLoaded', () => {
    if (!window.utils || !window.CONFIG || !window.apiClient) {
        console.error('Required dependencies not loaded. Make sure config.js, utils.js, and api.js are loaded first.');
        return;
    }

    window.utils.checkOnlineStatus();
    loadSavedLocations();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Setup debounced input handler
    const locationInput = window.utils.getElementByIdSafe('location-input');
    if (locationInput) {
        // Debounce input to prevent multiple API calls
        debouncedAddLocation = window.utils.debounce(() => {
            const value = locationInput.value.trim();
            if (value) {
                addLocation();
            }
        }, CONFIG.RATE_LIMIT.DEBOUNCE_MS);

        locationInput.addEventListener('input', debouncedAddLocation);
        
        // Handle Enter key
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addLocation();
            }
        });
    }
});

/**
 * Handle online event
 */
function handleOnline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.add('hidden');
    }
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = window.utils.getElementByIdSafe('offline-banner');
    if (offlineBanner) {
        offlineBanner.classList.remove('hidden');
    }
}

/**
 * Add current location using Geolocation API
 */
async function addCurrentLocation() {
    if (!navigator.geolocation) {
        window.alertModal('Geolocation is not supported by your browser', 'Geolocation Error');
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, CONFIG.GEOLOCATION_OPTIONS);
        });

        const location = {
            id: Date.now(), // Unique ID
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Current Location',
            timestamp: Date.now()
        };

        // Try to get city name from coordinates
        try {
            const cityName = await window.utils.getCityNameFromCoords(location.lat, location.lon);
            if (cityName) {
                location.name = cityName;
            }
        } catch (err) {
            console.warn('Could not fetch city name:', err);
        }

        addLocationToList(location);
        saveLocations();
    } catch (error) {
        console.error('Error getting current location:', error);
        window.alertModal('Unable to get your location. Please check your browser permissions.', 'Location Error');
    }
}

/**
 * Add location by city name
 */
async function addLocation() {
    const input = window.utils.getElementByIdSafe('location-input');
    if (!input) {
        console.error('Location input element not found');
        return;
    }

    const cityName = input.value.trim();

    // Validate input
    if (!window.utils.validateCityName(cityName)) {
        window.alertModal('Please enter a valid city name', 'Invalid Input');
        return;
    }

    try {
        const location = await window.apiClient.fetchLocationFromCityName(cityName);
        // Add unique ID
        location.id = Date.now();
        addLocationToList(location);
        saveLocations();
        input.value = ''; // Clear input
    } catch (error) {
        console.error('Error adding location:', error);
        window.alertModal(`Could not find location: ${cityName}. Please try again.`, 'Location Not Found');
    }
}

/**
 * Add location to the list
 */
function addLocationToList(location) {
    if (!window.utils.validateLocation(location)) {
        console.error('Invalid location data');
        return;
    }

    const locations = getSavedLocations();
    
    // Check if location already exists (by coordinates)
    const exists = locations.some(loc => 
        Math.abs(loc.lat - location.lat) < 0.01 && 
        Math.abs(loc.lon - location.lon) < 0.01
    );
    
    if (exists) {
        window.alertModal('This location is already in your list', 'Duplicate Location');
        return;
    }
    
    locations.push(location);
    displayLocations(locations);
}

/**
 * Get saved locations from localStorage
 */
function getSavedLocations() {
    try {
        const stored = localStorage.getItem(CONFIG.CACHE_KEYS.SAVED_LOCATIONS);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Error parsing saved locations:', err);
        return [];
    }
}

/**
 * Save locations to localStorage
 */
function saveLocations() {
    try {
        const locations = getSavedLocations();
        localStorage.setItem(CONFIG.CACHE_KEYS.SAVED_LOCATIONS, JSON.stringify(locations));
    } catch (err) {
        console.error('Error saving locations:', err);
        window.alertModal('Error saving locations. Storage may be full.', 'Storage Error');
    }
}

/**
 * Load and display saved locations
 */
function loadSavedLocations() {
    const locations = getSavedLocations();
    displayLocations(locations);
}

/**
 * Display locations in the UI (XSS-safe)
 */
function displayLocations(locations) {
    const locationsList = window.utils.getElementByIdSafe('locations-list');
    if (!locationsList) {
        console.error('Locations list element not found');
        return;
    }
    
    if (!Array.isArray(locations) || locations.length === 0) {
        locationsList.innerHTML = ''; // Clear first
        const emptyState = window.utils.createTextElement('p', 'No locations saved yet. Add your first location above!', 'empty-state');
        locationsList.appendChild(emptyState);
        return;
    }
    
    // Clear existing content (XSS-safe)
    locationsList.innerHTML = '';
    
    locations.forEach((location) => {
        if (!location || !location.id) {
            console.warn('Invalid location in list:', location);
            return;
        }
        const locationItem = createLocationItem(location);
        locationsList.appendChild(locationItem);
    });
}

/**
 * Create a location item element (XSS-safe)
 */
function createLocationItem(location) {
    if (!location || !location.id) {
        console.error('Invalid location data');
        return document.createElement('div');
    }

    const item = document.createElement('div');
    item.className = 'location-item';
    
    // Create location info section
    const locationInfo = document.createElement('div');
    locationInfo.className = 'location-info';
    
    const locationName = window.utils.createTextElement('div', location.name || 'Unknown Location', 'location-name');
    
    const coordsText = typeof location.lat === 'number' && typeof location.lon === 'number'
        ? `Lat: ${location.lat.toFixed(4)}, Lon: ${location.lon.toFixed(4)}`
        : 'Coordinates unavailable';
    const locationCoords = window.utils.createTextElement('div', coordsText, 'location-coords');
    
    locationInfo.appendChild(locationName);
    locationInfo.appendChild(locationCoords);
    
    // Create action buttons section
    const locationActions = document.createElement('div');
    locationActions.className = 'location-actions';
    
    // View Weather button
    const viewButton = document.createElement('button');
    viewButton.className = 'btn-view';
    viewButton.textContent = 'View Weather';
    viewButton.setAttribute('data-location-id', location.id.toString());
    viewButton.addEventListener('click', () => viewLocationById(location.id));
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('data-location-id', location.id.toString());
    deleteButton.addEventListener('click', () => deleteLocationById(location.id));
    
    locationActions.appendChild(viewButton);
    locationActions.appendChild(deleteButton);
    
    // Assemble the item
    item.appendChild(locationInfo);
    item.appendChild(locationActions);
    
    return item;
}

/**
 * View weather for a specific location by ID
 */
function viewLocationById(locationId) {
    if (!locationId) {
        console.error('Invalid location ID');
        window.alertModal('Invalid location data', 'Error');
        return;
    }

    try {
        const locations = getSavedLocations();
        const location = locations.find(loc => loc.id === locationId);
        
        if (!location) {
            window.alertModal('Location not found', 'Error');
            return;
        }

        if (!window.utils.validateLocation(location)) {
            window.alertModal('Invalid location data', 'Error');
            return;
        }
        
        // Create location object to view
        const locationToView = {
            lat: location.lat,
            lon: location.lon,
            name: location.name,
            isCurrentLocation: false,
            savedLocationId: locationId // Use actual ID
        };
        
        // Store as the location to view
        try {
            localStorage.setItem(CONFIG.CACHE_KEYS.LOCATION, JSON.stringify(locationToView));
        } catch (err) {
            console.error('Error storing location:', err);
            window.alertModal('Error storing location', 'Storage Error');
            return;
        }
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error viewing location:', error);
        window.alertModal('Error loading location. Please try again.', 'Error');
    }
}

/**
 * Delete a location by ID (fixed to use ID instead of index)
 */
async function deleteLocationById(locationId) {
    if (!locationId) {
        console.error('Invalid location ID');
        return;
    }

    const confirmed = await window.confirmModal(
        'Are you sure you want to delete this location?',
        'Delete Location'
    );

    if (!confirmed) {
        return;
    }

    try {
        const locations = getSavedLocations();
        const initialLength = locations.length;
        
        // Filter out the location with matching ID
        const filteredLocations = locations.filter(loc => loc.id !== locationId);
        
        if (filteredLocations.length === initialLength) {
            window.alertModal('Location not found', 'Error');
            return;
        }
        
        // Update localStorage
        try {
            localStorage.setItem(CONFIG.CACHE_KEYS.SAVED_LOCATIONS, JSON.stringify(filteredLocations));
        } catch (err) {
            console.error('Error saving locations:', err);
            window.alertModal('Error deleting location. Storage may be full.', 'Storage Error');
            return;
        }
        
        // Refresh display
        displayLocations(filteredLocations);
    } catch (error) {
        console.error('Error deleting location:', error);
        window.alertModal('Error deleting location. Please try again.', 'Error');
    }
}

// Legacy function for backward compatibility (uses ID now)
function viewLocation(index) {
    const locations = getSavedLocations();
    const location = locations[index];
    
    if (location && location.id) {
        viewLocationById(location.id);
    } else {
        console.error('Location not found at index:', index);
        window.alertModal('Location not found. Please try again.', 'Error');
    }
}

// Legacy function for backward compatibility (uses ID now)
function deleteLocation(index) {
    const locations = getSavedLocations();
    const location = locations[index];
    
    if (location && location.id) {
        deleteLocationById(location.id);
    } else {
        console.error('Location not found at index:', index);
        window.alertModal('Location not found. Please try again.', 'Error');
    }
}

// Make functions available globally for onclick handlers
window.addCurrentLocation = addCurrentLocation;
window.addLocation = addLocation;
window.viewLocation = viewLocation;
window.deleteLocation = deleteLocation;
