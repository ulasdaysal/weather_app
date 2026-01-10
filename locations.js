/**
 * Weather PWA - Locations Page JavaScript
 * Handles saved locations management
 */

// Storage key for saved locations
const SAVED_LOCATIONS_KEY = 'saved_locations';

// Initialize locations page
document.addEventListener('DOMContentLoaded', () => {
    checkOnlineStatus();
    loadSavedLocations();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Handle Enter key in location input
    const locationInput = document.getElementById('location-input');
    if (locationInput) {
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addLocation();
            }
        });
    }
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
}

/**
 * Handle offline event
 */
function handleOffline() {
    const offlineBanner = document.getElementById('offline-banner');
    offlineBanner.classList.remove('hidden');
}

/**
 * Add current location using Geolocation API
 */
async function addCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        });

        const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'Current Location',
            timestamp: Date.now()
        };

        // Try to get city name from coordinates
        try {
            const cityName = await getCityNameFromCoords(location.lat, location.lon);
            if (cityName) {
                location.name = cityName;
            }
        } catch (err) {
            console.warn('Could not fetch city name:', err);
        }

        addLocationToList(location);
        saveLocations();
    } catch (error) {
        alert('Unable to get your location. Please check your browser permissions.');
    }
}

/**
 * Add location by city name
 */
async function addLocation() {
    const input = document.getElementById('location-input');
    const cityName = input.value.trim();

    if (!cityName) {
        alert('Please enter a city name');
        return;
    }

    try {
        const location = await getLocationFromCityName(cityName);
        addLocationToList(location);
        saveLocations();
        input.value = ''; // Clear input
    } catch (error) {
        alert(`Could not find location: ${cityName}. Please try again.`);
    }
}

/**
 * Get location coordinates from city name
 */
async function getLocationFromCityName(cityName) {
    const API_KEY = '79fa7767ac09d5fc8db2c7505cd7fea3'; // OpenWeatherMap API key
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        }
        throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
        throw new Error('Location not found');
    }
    
    return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: `${data[0].name}, ${data[0].country}`,
        timestamp: Date.now()
    };
}

/**
 * Get city name from coordinates (reverse geocoding)
 */
async function getCityNameFromCoords(lat, lon) {
    const API_KEY = '79fa7767ac09d5fc8db2c7505cd7fea3'; // OpenWeatherMap API key
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        }
        throw new Error('Failed to fetch city name');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
        return `${data[0].name}, ${data[0].country}`;
    }
    
    return null;
}

/**
 * Add location to the list
 */
function addLocationToList(location) {
    const locations = getSavedLocations();
    
    // Check if location already exists
    const exists = locations.some(loc => 
        Math.abs(loc.lat - location.lat) < 0.01 && 
        Math.abs(loc.lon - location.lon) < 0.01
    );
    
    if (exists) {
        alert('This location is already in your list');
        return;
    }
    
    locations.push(location);
    displayLocations(locations);
}

/**
 * Get saved locations from localStorage
 */
function getSavedLocations() {
    const stored = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Save locations to localStorage
 */
function saveLocations() {
    const locations = getSavedLocations();
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
}

/**
 * Load and display saved locations
 */
function loadSavedLocations() {
    const locations = getSavedLocations();
    displayLocations(locations);
}

/**
 * Display locations in the UI
 */
function displayLocations(locations) {
    const locationsList = document.getElementById('locations-list');
    
    if (locations.length === 0) {
        locationsList.innerHTML = '<p class="empty-state">No locations saved yet. Add your first location above!</p>';
        return;
    }
    
    locationsList.innerHTML = '';
    
    locations.forEach((location, index) => {
        const locationItem = createLocationItem(location, index);
        locationsList.appendChild(locationItem);
    });
}

/**
 * Create a location item element
 */
function createLocationItem(location, index) {
    const item = document.createElement('div');
    item.className = 'location-item';
    
    // Create location info section
    const locationInfo = document.createElement('div');
    locationInfo.className = 'location-info';
    
    const locationName = document.createElement('div');
    locationName.className = 'location-name';
    locationName.textContent = location.name;
    
    const locationCoords = document.createElement('div');
    locationCoords.className = 'location-coords';
    locationCoords.textContent = `Lat: ${location.lat.toFixed(4)}, Lon: ${location.lon.toFixed(4)}`;
    
    locationInfo.appendChild(locationName);
    locationInfo.appendChild(locationCoords);
    
    // Create action buttons section
    const locationActions = document.createElement('div');
    locationActions.className = 'location-actions';
    
    // View Weather button with data attribute
    const viewButton = document.createElement('button');
    viewButton.className = 'btn-view';
    viewButton.textContent = 'View Weather';
    viewButton.setAttribute('data-lat', location.lat);
    viewButton.setAttribute('data-lon', location.lon);
    viewButton.setAttribute('data-name', location.name);
    viewButton.addEventListener('click', () => viewLocationFromButton(viewButton));
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteLocation(index));
    
    locationActions.appendChild(viewButton);
    locationActions.appendChild(deleteButton);
    
    // Assemble the item
    item.appendChild(locationInfo);
    item.appendChild(locationActions);
    
    return item;
}

/**
 * View weather for a specific location (using button data attributes)
 */
function viewLocationFromButton(button) {
    try {
        const lat = parseFloat(button.getAttribute('data-lat'));
        const lon = parseFloat(button.getAttribute('data-lon'));
        const name = button.getAttribute('data-name');
        
        if (isNaN(lat) || isNaN(lon) || !name) {
            throw new Error('Invalid location data');
        }
        
        // Create location object to view
        const locationToView = {
            lat: lat,
            lon: lon,
            name: name,
            isCurrentLocation: false, // Mark as NOT current location
            savedLocationId: -1 // Mark as saved location
        };
        
        // Store as the location to view
        localStorage.setItem('user_location_cache', JSON.stringify(locationToView));
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error viewing location:', error);
        alert('Error loading location. Please try again.');
    }
}

/**
 * View weather for a specific location (legacy method using index)
 */
function viewLocation(index) {
    const locations = getSavedLocations();
    const location = locations[index];
    
    if (location) {
        // Create location object to view
        const locationToView = {
            lat: location.lat,
            lon: location.lon,
            name: location.name,
            isCurrentLocation: false, // Mark as NOT current location
            savedLocationId: index // Add ID to identify as saved location
        };
        
        // Store as the location to view
        localStorage.setItem('user_location_cache', JSON.stringify(locationToView));
        
        // Redirect to home page
        window.location.href = 'index.html';
    } else {
        console.error('Location not found at index:', index);
        alert('Location not found. Please try again.');
    }
}

/**
 * Delete a location
 */
function deleteLocation(index) {
    if (confirm('Are you sure you want to delete this location?')) {
        const locations = getSavedLocations();
        locations.splice(index, 1);
        saveLocations();
        displayLocations(locations);
    }
}

// Make functions available globally for onclick handlers
window.addCurrentLocation = addCurrentLocation;
window.addLocation = addLocation;
window.viewLocation = viewLocation;
window.viewLocationFromButton = viewLocationFromButton;
window.deleteLocation = deleteLocation;

