// ===== SEARCH CONTROLLER MODULE =====
const SearchController = {

  currentSearchMarker: null,
  selectedSuggestionIndex: -1,
  searchTimeout: null,
  isSearchActive: false, // Track if search is currently active

  // Initialize search functionality
  initialize() {
    this.setupSearchEventListeners();
  },

  // Set up search event listeners
  setupSearchEventListeners() {
    const searchInput = document.querySelector('.search-input');

    if (searchInput) {
      // Real-time suggestions as user types
      searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      // Handle keyboard navigation
      searchInput.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e);
      });
    }
  },

  // Handle search input with debouncing
  handleSearchInput(query) {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Check if search is being cleared
    if (!query.trim()) {
      this.clearSearch();
      return;
    }

    // Debounce the search to avoid too many API calls
    this.searchTimeout = setTimeout(async () => {
      await this.getSuggestions(query);
    }, 300); // 300ms delay
  },

  // Handle keyboard navigation in suggestions
  handleKeyboardNavigation(e) {
    const suggestions = document.querySelectorAll('.search-suggestion-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
      UIComponents.updateSelectedSuggestion(this.selectedSuggestionIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
      UIComponents.updateSelectedSuggestion(this.selectedSuggestionIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedSuggestionIndex >= 0 && suggestions[this.selectedSuggestionIndex]) {
        suggestions[this.selectedSuggestionIndex].click();
      } else if (e.target.value.trim()) {
        // If no suggestion selected, search for the first result
        this.performLocationSearch(e.target.value);
      }
    } else if (e.key === 'Escape') {
      UIComponents.hideSuggestions();
      this.selectedSuggestionIndex = -1;
    }
  },

  // Get search suggestions
  async getSuggestions(query) {
    try {
      const suggestions = await GeocodingService.getLocationSuggestions(query);
      UIComponents.showSuggestions(suggestions);
      this.selectedSuggestionIndex = -1;
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      UIComponents.hideSuggestions();
    }
  },

  // Perform location search and go to first result
  async performLocationSearch(query) {
    try {
      const suggestions = await GeocodingService.getLocationSuggestions(query);
      
      if (suggestions && suggestions.length > 0) {
        const firstResult = suggestions[0];
        
        // Update search input
        document.querySelector('.search-input').value = firstResult.placeName;
        
        // Go to location
        this.goToLocation(firstResult.center[0], firstResult.center[1], firstResult.placeName);
        
        // Hide suggestions
        UIComponents.hideSuggestions();
      } else {
        UIComponents.showError(`No results found for "${query}"`, 'Search Error');
      }
    } catch (error) {
      console.error('❌ Error performing location search:', error);
      UIComponents.showError('Error performing search. Please try again.', 'Search Error');
    }
  },

  // Go to specific location on map
  goToLocation(lng, lat, placeName) {
    // Set search as active to prevent viewport filtering
    this.isSearchActive = true;

    // Remove previous search marker if exists
    this.removeSearchMarker();

    // Fly to the location
    MapController.flyToLocation([lng, lat]);

    // Add a new search marker
    this.addSearchMarker(lng, lat, placeName);

    // Find and highlight nearby programs
    this.highlightNearbyPrograms(lng, lat);
  },

  // Add search marker to map
  addSearchMarker(lng, lat, placeName) {
    try {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="popup-title">Search Result</div>
        <div class="popup-address">${UIComponents.escapeHtml(placeName)}</div>
      `);

      // Create custom search marker element with bicycle icon
      const markerElement = MapController.createCustomMarkerElement(true);

      this.currentSearchMarker = new mapboxgl.Marker({
        element: markerElement
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(MapController.getMap());

      // Remove the search marker after timeout
      setTimeout(() => {
        this.removeSearchMarker();
      }, GIG_CONFIG.SEARCH_MARKER_TIMEOUT);

    } catch (error) {
      console.error('❌ Error adding search marker:', error);
    }
  },

  // Remove search marker
  removeSearchMarker() {
    if (this.currentSearchMarker) {
      this.currentSearchMarker.remove();
      this.currentSearchMarker = null;
    }
  },

  // Highlight programs near the searched location
  highlightNearbyPrograms(lng, lat) {
    const nearbyMarkers = MapController.findNearbyMarkers([lng, lat], 25); // 25 mile radius
    
    if (nearbyMarkers.length > 0) {
      console.log(`📍 Found ${nearbyMarkers.length} programs within 25 miles`);
      
      // Filter and display nearby programs in sidebar
      const nearbyPrograms = nearbyMarkers.map(({ program }) => program);
      UIComponents.updateLocationsList(nearbyPrograms);
      
      UIComponents.showSuccess(
        `Found ${nearbyPrograms.length} programs near your search location`,
        'Programs Found'
      );
    } else {
      console.log('📍 No programs found within 25 miles');
      UIComponents.showError('No programs found within 25 miles of this location', 'No Results');
    }
  },

  // Reset map and search
  resetMap() {
    // Remove search marker if it exists
    this.removeSearchMarker();

    // Clear search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }

    // Hide suggestions
    UIComponents.hideSuggestions();

    // Reset map view
    MapController.resetMap();

    // Clear search state
    this.isSearchActive = false;

    // Reset selected suggestion index
    this.selectedSuggestionIndex = -1;

    // Trigger viewport update after reset
    setTimeout(() => {
      MapController.updateSidebarForViewport();
    }, 100);
  },

  // Clear search
  clearSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    UIComponents.hideSuggestions();
    this.selectedSuggestionIndex = -1;
    
    // Clear search state
    this.isSearchActive = false;
    
    // Remove search marker
    this.removeSearchMarker();
    
    // Resume viewport filtering
    MapController.updateSidebarForViewport();
  },

  // Get current search query
  getCurrentQuery() {
    const searchInput = document.querySelector('.search-input');
    return searchInput ? searchInput.value.trim() : '';
  },

  // Set search query
  setSearchQuery(query) {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = query;
    }
  },

  // Check if search is currently active
  isSearchCurrentlyActive() {
    return this.isSearchActive;
  }
};

// Export for debugging
window.SearchController = SearchController; 