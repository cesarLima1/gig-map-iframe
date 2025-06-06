// ===== DIRECTIONS CONTROLLER MODULE =====
const DirectionsController = {
  map: null,
  destinationMarker: null,
  originMarker: null,
  destination: null,
  origin: null,
  routeLayer: null,
  geocoder: null,
  mapClickInProgress: false,

  // Initialize the directions page
  init() {
    console.log('🚀 DirectionsController.init() started');
    
    try {
      this.parseURLParameters();
      this.initializeMap();
      this.setupGeocoder();
      this.updateDestinationInfo();
      
      console.log('✅ DirectionsController initialized successfully');
    } catch (error) {
      console.error('❌ Error during DirectionsController initialization:', error);
    }
  },

  // Parse URL parameters to get destination info
  parseURLParameters() {
    const params = new URLSearchParams(window.location.search);
    
    this.destination = {
      name: params.get('name') || 'Girls in Gear Program',
      address: params.get('address') || '',
      city: params.get('city') || '',
      state: params.get('state') || '',
      zip: params.get('zip') || '',
      lat: parseFloat(params.get('lat')) || 0,
      lng: parseFloat(params.get('lng')) || 0
    };

    console.log('🎯 Destination loaded:', this.destination);
  },

  // Initialize the map
  initializeMap() {
    mapboxgl.accessToken = GIG_CONFIG.MAPBOX_ACCESS_TOKEN;

    // Use fallback center if destination coordinates are invalid
    const center = (this.destination.lat && this.destination.lng && this.destination.lat !== 0 && this.destination.lng !== 0) 
      ? [this.destination.lng, this.destination.lat]
      : GIG_CONFIG.DEFAULT_CENTER;

    console.log('🗺️ Initializing map with center:', center);
    console.log('🎯 Destination coordinates:', this.destination.lat, this.destination.lng);

    this.map = new mapboxgl.Map({
      container: 'directions-map',
      style: GIG_CONFIG.MAPBOX_STYLE,
      center: center,
      zoom: this.destination.lat && this.destination.lng && this.destination.lat !== 0 && this.destination.lng !== 0 ? 12 : GIG_CONFIG.DEFAULT_ZOOM
    });

    this.map.on('load', () => {
      console.log('🗺️ Map loaded successfully');
      this.addDestinationMarker();
      this.setupMapClickHandler();
    });

    this.map.on('error', (e) => {
      console.error('❌ Map error:', e);
    });
  },

  // Add destination marker to the map
  addDestinationMarker() {
    console.log('📍 Attempting to add destination marker...');
    
    if (!this.destination.lat || !this.destination.lng || this.destination.lat === 0 || this.destination.lng === 0) {
      console.warn('⚠️ Invalid or missing destination coordinates:', this.destination.lat, this.destination.lng);
      console.warn('⚠️ Skipping destination marker');
      return;
    }

    try {
      // Create custom destination marker
      const markerElement = this.createDestinationMarkerElement();

      this.destinationMarker = new mapboxgl.Marker({
        element: markerElement
      })
        .setLngLat([this.destination.lng, this.destination.lat])
        .addTo(this.map);

      console.log('✅ Destination marker added successfully at:', [this.destination.lng, this.destination.lat]);
    } catch (error) {
      console.error('❌ Error adding destination marker:', error);
    }
  },

  // Create custom destination marker element
  createDestinationMarkerElement() {
    const markerElement = document.createElement('div');
    markerElement.className = 'destination-marker';
    
    markerElement.innerHTML = `
      <div class="marker-pin" style="
        width: 35px;
        height: 35px;
        background: #00BCD4;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 3px 10px rgba(0, 188, 212, 0.4);
      ">
        <div class="marker-icon" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 20C3.58333 20 2.39583 19.5208 1.4375 18.5625C0.479167 17.6042 0 16.4167 0 15C0 13.5833 0.4875 12.3958 1.4625 11.4375C2.4375 10.4792 3.61667 10 5 10C6.28333 10 7.3625 10.3833 8.2375 11.15C9.1125 11.9167 9.66667 12.8667 9.9 14H10.55L8.75 9H7V7H12V9H10.9L11.25 10H16.05L14.6 6H12V4H14.6C15.0333 4 15.4208 4.11667 15.7625 4.35C16.1042 4.58333 16.35 4.9 16.5 5.3L18.2 9.95H19C20.3833 9.95 21.5625 10.4375 22.5375 11.4125C23.5125 12.3875 24 13.5667 24 14.95C24 16.35 23.5167 17.5417 22.55 18.525C21.5833 19.5083 20.4 20 19 20C17.8 20 16.7458 19.625 15.8375 18.875C14.9292 18.125 14.35 17.1667 14.1 16H9.9C9.66667 17.15 9.1 18.1042 8.2 18.8625C7.3 19.6208 6.23333 20 5 20ZM5 18C5.68333 18 6.27083 17.8125 6.7625 17.4375C7.25417 17.0625 7.6 16.5833 7.8 16H5V14H7.8C7.6 13.4 7.25417 12.9167 6.7625 12.55C6.27083 12.1833 5.68333 12 5 12C4.15 12 3.4375 12.2875 2.8625 12.8625C2.2875 13.4375 2 14.15 2 15C2 15.8333 2.2875 16.5417 2.8625 17.125C3.4375 17.7083 4.15 18 5 18ZM12.7 14H14.1C14.1833 13.6167 14.2958 13.2583 14.4375 12.925C14.5792 12.5917 14.7667 12.2833 15 12H11.95L12.7 14ZM19 18C19.85 18 20.5625 17.7083 21.1375 17.125C21.7125 16.5417 22 15.8333 22 15C22 14.15 21.7125 13.4375 21.1375 12.8625C20.5625 12.2875 19.85 12 19 12H18.9L19.9 14.65L18 15.35L17.05 12.7C16.7167 12.9833 16.4583 13.3167 16.275 13.7C16.0917 14.0833 16 14.5167 16 15C16 15.8333 16.2875 16.5417 16.8625 17.125C17.4375 17.7083 18.15 18 19 18Z" fill="white"/>
          </svg>
        </div>
      </div>
    `;

    return markerElement;
  },

  // Create custom origin marker element
  createOriginMarkerElement() {
    const markerElement = document.createElement('div');
    markerElement.className = 'origin-marker';
    
    markerElement.innerHTML = `
      <div class="marker-pin" style="
        width: 35px;
        height: 35px;
        background: #4caf50;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        position: relative;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(76, 175, 80, 0.4);
      ">
        <div class="marker-icon" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="white"/>
            <circle cx="12" cy="12" r="4" fill="#4caf50"/>
          </svg>
        </div>
      </div>
    `;

    return markerElement;
  },

  // Set up geocoder for searching starting locations
  setupGeocoder() {
    console.log('🔍 Setting up geocoder...');
    
    try {
      this.geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false, // We'll handle markers manually
        placeholder: 'Search for your starting location...',
        bbox: [-180, -90, 180, 90],
        proximity: [this.destination.lng, this.destination.lat],
        countries: 'us' // Limit search to United States
      });

      const geocoderContainer = document.getElementById('geocoder');
      if (!geocoderContainer) {
        console.error('❌ Geocoder container not found');
        return;
      }

      geocoderContainer.appendChild(this.geocoder.onAdd(this.map));

      // Handle geocoder result selection
      this.geocoder.on('result', (e) => {
        console.log('🔍 Geocoder result selected:', e.result.place_name);
        const coordinates = e.result.geometry.coordinates;
        const placeName = e.result.place_name;
        
        this.setOrigin(coordinates[0], coordinates[1], placeName, true);
      });

      console.log('✅ Geocoder setup complete');
    } catch (error) {
      console.error('❌ Error setting up geocoder:', error);
    }
  },

  // Set up map click handler for selecting origin
  setupMapClickHandler() {
    this.map.on('click', (e) => {
      const coordinates = e.lngLat;
      
      // Set flag to indicate map click is in progress
      this.mapClickInProgress = true;
      
      // Prevent geocoder from showing suggestions during map click
      if (this.geocoder) {
        // Temporarily disable the geocoder
        const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input');
        if (geocoderInput) {
          // Clear and blur the input
          geocoderInput.blur();
          geocoderInput.value = '';
          
          // Temporarily disable the input to prevent any geocoder activity
          geocoderInput.disabled = true;
          
          // Hide any existing suggestions immediately
          const suggestionsContainer = document.querySelector('.mapboxgl-ctrl-geocoder .suggestions');
          if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
          }
        }
        
        // Clear the geocoder state
        this.geocoder.clear();
      }
      
      this.setOrigin(coordinates.lng, coordinates.lat, 'Selected location', false);
      
      // Re-enable geocoder after a short delay
      setTimeout(() => {
        this.mapClickInProgress = false;
        
        // Re-enable the geocoder input
        const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input');
        if (geocoderInput) {
          geocoderInput.disabled = false;
        }
        
        // Restore suggestions display
        const suggestionsContainer = document.querySelector('.mapboxgl-ctrl-geocoder .suggestions');
        if (suggestionsContainer) {
          suggestionsContainer.style.display = '';
        }
      }, 300);
    });
  },

  // Set origin location and get directions
  setOrigin(lng, lat, name = 'Your location', fromGeocoder = false) {
    this.origin = { lng, lat, name };

    // Remove existing origin marker
    if (this.originMarker) {
      this.originMarker.remove();
    }

    // Add new origin marker
    const markerElement = this.createOriginMarkerElement();
    this.originMarker = new mapboxgl.Marker({
      element: markerElement
    })
      .setLngLat([lng, lat])
      .addTo(this.map);

    // Only update geocoder input if origin was set via geocoder, not map click
    if (fromGeocoder) {
      this.geocoder.setInput(name);
    }

    // Get directions
    this.getDirections();

    console.log('🚀 Origin set:', this.origin);
  },

  // Get directions from Mapbox Directions API
  async getDirections() {
    if (!this.origin || !this.destination) {
      console.error('❌ Missing origin or destination');
      return;
    }

    // Show loading state
    this.showLoadingState();

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${this.origin.lng},${this.origin.lat};${this.destination.lng},${this.destination.lat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        this.displayRoute(data.routes[0]);
        this.displayDirections(data.routes[0]);
        this.fitMapToRoute(data.routes[0]);
      } else {
        throw new Error('No route found');
      }

    } catch (error) {
      console.error('❌ Error getting directions:', error);
      this.showError('Unable to get directions. Please try a different starting location.');
    }
  },

  // Display route on the map
  displayRoute(route) {
    // Remove existing route layer
    if (this.map.getLayer('route')) {
      this.map.removeLayer('route');
    }
    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }

    // Add route layer
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route.geometry
      }
    });

    this.map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00bcd4',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });

    console.log('🗺️ Route displayed on map');
  },

  // Display turn-by-turn directions in sidebar
  displayDirections(route) {
    const directionsPanel = document.getElementById('directions-panel');
    
    const distance = (route.distance * 0.000621371).toFixed(1); // Convert meters to miles
    const duration = Math.round(route.duration / 60); // Convert seconds to minutes

    directionsPanel.innerHTML = `
      <div class="directions-content active">
        <div class="route-summary">
          <div class="route-distance">${distance} miles</div>
          <div class="route-duration">${duration} minutes</div>
        </div>
        
        <div class="directions-steps">
          <ol class="directions-list">
            ${route.legs[0].steps.map((step, index) => {
              const stepDistance = (step.distance * 0.000621371).toFixed(1);
              return `
                <li class="direction-step">
                  <div class="step-icon">${index + 1}</div>
                  <div class="step-content">
                    <div class="step-instruction">${step.maneuver.instruction}</div>
                    <div class="step-distance">${stepDistance} mi</div>
                  </div>
                </li>
              `;
            }).join('')}
          </ol>
        </div>
      </div>
    `;

    console.log('📋 Directions displayed in sidebar');
  },

  // Fit map to show entire route
  fitMapToRoute(route) {
    const coordinates = route.geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds();

    coordinates.forEach(coord => bounds.extend(coord));
    
    // Also include origin and destination
    bounds.extend([this.origin.lng, this.origin.lat]);
    bounds.extend([this.destination.lng, this.destination.lat]);

    this.map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  },

  // Show loading state
  showLoadingState() {
    const directionsPanel = document.getElementById('directions-panel');
    directionsPanel.innerHTML = `
      <div class="loading-directions">
        <div class="loading-spinner"></div>
        <p>Getting directions...</p>
      </div>
    `;
  },

  // Show error message
  showError(message) {
    const directionsPanel = document.getElementById('directions-panel');
    directionsPanel.innerHTML = `
      <div class="error-message">
        <strong>Unable to get directions</strong><br>
        ${message}
      </div>
      <div class="directions-placeholder">
        <div class="placeholder-icon">🗺️</div>
        <p>Try selecting a different starting point</p>
      </div>
    `;
  },

  // Update destination info in sidebar
  updateDestinationInfo() {
    const destinationName = document.getElementById('destination-name');
    const destinationAddress = document.getElementById('destination-address');

    destinationName.textContent = this.destination.name;
    
    const fullAddress = [
      this.destination.address,
      this.destination.city,
      this.destination.state,
      this.destination.zip
    ].filter(part => part).join(', ');
    
    destinationAddress.textContent = fullAddress;
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Content Loaded - Starting DirectionsController');
  
  // Add a small delay to ensure all resources are loaded
  setTimeout(() => {
    DirectionsController.init();
  }, 100);
});

// Export for debugging
window.DirectionsController = DirectionsController;