/**
 * Weather PWA - Service Worker Registration
 * Registers the service worker for offline functionality
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available, prompt user to refresh
                            console.log('New service worker available. Refresh to update.');
                            // You could show a notification to the user here
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
        
        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload page when new service worker takes control
            window.location.reload();
        });
    });
} else {
    console.warn('Service Workers are not supported in this browser');
}

