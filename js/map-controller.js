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
      console.log('🗺️ Map loaded, starting data loading...');

      try {
        await DataService.loadGigData(true);
        UIComponents.showSuccess('Map data loaded successfully!', 'Ready');
      } catch (error) {
        console.error('❌ Critical error loading data:', error);
        UIComponents.showError('Error loading map data. Using sample data.', 'Loading Error');
      }
    });

    // Map click events for debugging
    this.map.on('click', (e) => {
      console.log('📍 Map clicked at:', e.lngLat.lng, e.lngLat.lat);
      
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

    // Don't update viewport if search is currently active
    if (SearchController && SearchController.isSearchCurrentlyActive && SearchController.isSearchCurrentlyActive()) {
      return;
    }

    const visiblePrograms = this.getVisiblePrograms();
    UIComponents.updateLocationsList(visiblePrograms);
    
    console.log(`👁️ Viewport update: ${visiblePrograms.length}/${this.allPrograms.length} programs visible`);
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

    console.log(`📍 Adding ${validData.length} markers to map`);

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

      // Create marker
      const marker = new mapboxgl.Marker({
        color: '#00BCD4'
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
      console.log('📍 Opened popup for:', targetProgram.programType);
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