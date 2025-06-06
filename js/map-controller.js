// ===== MAP CONTROLLER MODULE =====
const MapController = {

  map: null,
  markers: [],
  allPrograms: [], // Store all programs for viewport filtering

  // Initialize the map
  initializeMap() {
    this.map = new mapboxgl.Map({
      container: 'map',
      style: GIG_CONFIG.MAPBOX_STYLE,
      center: GIG_CONFIG.DEFAULT_CENTER,
      zoom: GIG_CONFIG.DEFAULT_ZOOM,
      attributionControl: false
    });

    // Store map reference globally for access from other modules
    window.map = this.map;

    // Set up map event listeners
    this.setupMapEvents();

    return this.map;
  },

  // Set up map event listeners
  setupMapEvents() {
    // Map load event
    this.map.on('load', async () => {

      try {
        await DataService.loadGigData(true);
        UIComponents.showSuccess('Map data loaded successfully!', 'Ready');
      } catch (error) {
        console.error('❌ Critical error loading data:', error);
        UIComponents.showError('Error loading map data. Please check your connection and try again.', 'Loading Error');
      }
    });

    // Map click events for debugging
    this.map.on('click', (e) => {
      
      // Close all popups when clicking on empty map area
      // This ensures only one popup is open at a time
      this.closeAllPopups();
    });

    // Map error handling
    this.map.on('error', (e) => {
      console.error('❌ Map error:', e.error);
      UIComponents.showError('Map rendering error occurred.', 'Map Error');
    });

    // Viewport change events for filtering sidebar
    this.map.on('moveend', () => {
      this.updateSidebarForViewport();
    });

    this.map.on('zoomend', () => {
      this.updateSidebarForViewport();
    });
  },

  // Update sidebar based on current viewport
  updateSidebarForViewport() {
    if (!this.allPrograms || this.allPrograms.length === 0) {
      return;
    }

    // Always update viewport - removed the search active check
    const visiblePrograms = this.getVisiblePrograms();
    UIComponents.updateLocationsList(visiblePrograms);
    
  },

  // Get programs that are currently visible in the map viewport
  getVisiblePrograms() {
    if (!this.map || !this.allPrograms) {
      return [];
    }

    const bounds = this.map.getBounds();
    if (!bounds) {
      return this.allPrograms;
    }

    return this.allPrograms.filter(program => {
      if (!program.coordinates) {
        return false;
      }

      const [lng, lat] = program.coordinates;
      return bounds.contains([lng, lat]);
    });
  },

  // Add markers for all programs
  updateMapMarkers(data) {
    // Store all programs for viewport filtering
    this.allPrograms = data;

    // Clear existing markers
    this.clearMarkers();

    // Filter data with valid coordinates
    const validData = data.filter((program) => program.coordinates);

    validData.forEach((program) => {
      this.addMarker(program);
    });

    // If we have valid data, fit the map to show all markers
    if (validData.length > 0) {
      this.fitMapToMarkers(validData);
    }

    // Update sidebar for current viewport after a brief delay to ensure map is ready
    setTimeout(() => {
      this.updateSidebarForViewport();
    }, 100);
  },

  // Create a custom marker element with bicycle icon
  createCustomMarkerElement(isSearchMarker = false) {
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    
    const color = isSearchMarker ? '#8e44ad' : '#00BCD4';
    
    markerElement.innerHTML = `
      <div class="marker-pin" style="
        width: 30px;
        height: 30px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
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

  // Add a single marker to the map
  addMarker(program) {
    if (!program.coordinates) {
      console.warn('⚠️ No coordinates for program:', program.programType);
      return;
    }

    try {
      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(UIComponents.createPopupHTML(program));

      // Create custom marker element
      const markerElement = this.createCustomMarkerElement(false);

      // Create marker with custom element
      const marker = new mapboxgl.Marker({
        element: markerElement
      })
        .setLngLat(program.coordinates)
        .setPopup(popup)
        .addTo(this.map);

      // Store marker reference
      this.markers.push({
        marker: marker,
        program: program
      });

    } catch (error) {
      console.error('❌ Error adding marker for program:', program.programType, error);
    }
  },

  // Clear all markers from the map
  clearMarkers() {
    this.markers.forEach(({ marker }) => {
      marker.remove();
    });
    this.markers = [];
  },

  // Fit map to show all markers
  fitMapToMarkers(data, padding = 50) {
    if (!data || data.length === 0) return;

    try {
      const coordinates = data
        .filter(program => program.coordinates)
        .map(program => program.coordinates);

      if (coordinates.length === 0) return;

      if (coordinates.length === 1) {
        // Single marker - center on it
        this.map.flyTo({
          center: coordinates[0],
          zoom: GIG_CONFIG.FOCUSED_ZOOM,
          duration: 1000
        });
      } else {
        // Multiple markers - fit bounds
        const bounds = new mapboxgl.LngLatBounds();

        coordinates.forEach(coord => bounds.extend(coord));

        this.map.fitBounds(bounds, {
          padding: padding,
          duration: 1000,
          maxZoom: 12
        });
      }
    } catch (error) {
      console.error('❌ Error fitting map to markers:', error);
    }
  },

  // Reset map to default view
  resetMap() {
    if (!this.map) return;

    this.map.flyTo({
      center: GIG_CONFIG.DEFAULT_CENTER,
      zoom: GIG_CONFIG.DEFAULT_ZOOM,
      duration: 1000
    });
  },

  // Fly to specific coordinates
  flyToLocation(coordinates, zoom = GIG_CONFIG.FOCUSED_ZOOM) {
    if (!this.map || !coordinates) return;

    this.map.flyTo({
      center: coordinates,
      zoom: zoom,
      duration: 1500
    });
  },

  // Get current map bounds
  getCurrentBounds() {
    if (!this.map) return null;
    return this.map.getBounds();
  },

  // Check if coordinates are within current view
  isInCurrentView(coordinates) {
    if (!this.map || !coordinates) return false;

    const bounds = this.getCurrentBounds();
    if (!bounds) return false;

    const [lng, lat] = coordinates;
    return bounds.contains([lng, lat]);
  },

  // Find markers near a specific point
  findNearbyMarkers(coordinates, radiusInMiles = 10) {
    if (!coordinates || this.markers.length === 0) return [];

    const [targetLng, targetLat] = coordinates;

    return this.markers.filter(({ program }) => {
      if (!program.coordinates) return false;

      const [lng, lat] = program.coordinates;
      const distance = this.calculateDistance(targetLat, targetLng, lat, lng);
      
      return distance <= radiusInMiles;
    });
  },

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  },

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  },

  // Get map instance
  getMap() {
    return this.map;
  },

  // Check if map is loaded
  isMapLoaded() {
    return this.map && this.map.loaded();
  },

  // Force update sidebar for current viewport (public method)
  forceViewportUpdate() {
    this.updateSidebarForViewport();
  },

  // Get viewport statistics for debugging
  getViewportStats() {
    const visiblePrograms = this.getVisiblePrograms();
    const bounds = this.map ? this.map.getBounds() : null;
    
    return {
      totalPrograms: this.allPrograms ? this.allPrograms.length : 0,
      visiblePrograms: visiblePrograms.length,
      bounds: bounds ? {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      } : null,
      searchActive: SearchController && SearchController.isSearchCurrentlyActive ? SearchController.isSearchCurrentlyActive() : false
    };
  },

  // Close all open popups on the map
  closeAllPopups() {
    if (!this.map) return;
    
    // Close any popups that might be open
    const popups = document.querySelectorAll('.mapboxgl-popup');
    popups.forEach(popup => {
      popup.remove();
    });
  },

  // Find marker by program data
  findMarkerByProgram(targetProgram) {
    return this.markers.find(({ program }) => {
      // Match by coordinates and program type as a unique identifier
      return program.coordinates && 
             targetProgram.coordinates &&
             program.coordinates[0] === targetProgram.coordinates[0] &&
             program.coordinates[1] === targetProgram.coordinates[1] &&
             program.programType === targetProgram.programType &&
             program.address === targetProgram.address;
    });
  },

  // Open popup for a specific program
  openPopupForProgram(targetProgram) {
    if (!targetProgram || !targetProgram.coordinates) {
      console.warn('⚠️ Cannot open popup: No coordinates for program');
      return;
    }

    // Close all existing popups first
    this.closeAllPopups();

    // Find the marker for this program
    const markerData = this.findMarkerByProgram(targetProgram);
    
    if (markerData && markerData.marker) {
      // Open the popup for this marker
      markerData.marker.togglePopup();
    } else {
      console.warn('⚠️ Could not find marker for program:', targetProgram.programType);
    }
  },

  // Combined method to fly to location and open popup
  flyToLocationAndOpenPopup(targetProgram, zoom = GIG_CONFIG.FOCUSED_ZOOM) {
    if (!targetProgram || !targetProgram.coordinates) {
      console.warn('⚠️ Cannot fly to location: No coordinates for program');
      return;
    }

    // Fly to the location
    this.flyToLocation(targetProgram.coordinates, zoom);

    // Open popup after a small delay to ensure map has moved
    setTimeout(() => {
      this.openPopupForProgram(targetProgram);
    }, 300);
  },
};

// Export for debugging
window.MapController = MapController;

// Debug functions for testing viewport filtering
window.getViewportStats = () => MapController.getViewportStats();
window.forceViewportUpdate = () => MapController.forceViewportUpdate();
window.getVisiblePrograms = () => MapController.getVisiblePrograms();

// New popup management functions for debugging
window.closeAllPopups = () => MapController.closeAllPopups();
window.openPopupForProgram = (program) => MapController.openPopupForProgram(program);
window.flyToLocationAndOpenPopup = (program) => MapController.flyToLocationAndOpenPopup(program); 