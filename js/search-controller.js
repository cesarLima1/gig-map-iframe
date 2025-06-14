// ===== SEARCH CONTROLLER MODULE =====
const SearchController = {

  currentSearchMarker: null,
  selectedSuggestionIndex: -1,
  searchTimeout: null,

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
      // Get geocoded suggestions from Mapbox
      const geoSuggestions = await GeocodingService.getLocationSuggestions(query);
      
      // Get matching programs from sidebar data
      const programSuggestions = this.getMatchingPrograms(query);
      
      // Combine both types of suggestions
      const combinedSuggestions = {
        geocoded: geoSuggestions || [],
        programs: programSuggestions || []
      };
      
      UIComponents.showSuggestions(combinedSuggestions);
      this.selectedSuggestionIndex = -1;
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
      UIComponents.hideSuggestions();
    }
  },

  // Get matching programs from current data
  getMatchingPrograms(query) {
    if (!query.trim()) {
      return [];
    }

    // Get only programs visible in current viewport
    const visiblePrograms = MapController && MapController.getVisiblePrograms ? 
      MapController.getVisiblePrograms() : 
      (typeof globalGigData !== 'undefined' ? globalGigData : []);

    if (!visiblePrograms || visiblePrograms.length === 0) {
      return [];
    }

    const searchQuery = query.toLowerCase();
    
    return visiblePrograms.filter((program) => {
      const searchableText = [
        program.programType,
        program.address,
        program.city,
        program.state,
        program.region,
        program.ageRange
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    }).slice(0, 5); // Limit to 5 program suggestions
  },

  // Perform location search and go to first result
  async performLocationSearch(query) {
    try {
      // Get both types of suggestions
      const geoSuggestions = await GeocodingService.getLocationSuggestions(query);
      const programSuggestions = this.getMatchingPrograms(query);
      
      // Prioritize geocoded suggestions, then program suggestions
      let firstResult = null;
      let searchType = null;
      
      if (geoSuggestions && geoSuggestions.length > 0) {
        firstResult = geoSuggestions[0];
        searchType = 'geocoded';
      } else if (programSuggestions && programSuggestions.length > 0) {
        firstResult = programSuggestions[0];
        searchType = 'program';
      }
      
      if (firstResult) {
        if (searchType === 'geocoded') {
          // Update search input
          document.querySelector('.search-input').value = firstResult.placeName;
          
          // Go to location
          this.goToLocation(firstResult.center[0], firstResult.center[1], firstResult.placeName);
        } else if (searchType === 'program') {
          // Handle program result
          document.querySelector('.search-input').value = `${firstResult.programType} - ${firstResult.city}, ${firstResult.state}`;
          
          if (firstResult.coordinates && MapController && MapController.flyToLocationAndOpenPopup) {
            MapController.flyToLocationAndOpenPopup(firstResult);
          }
        }
        
        // Hide suggestions
        UIComponents.hideSuggestions();
      } else {
        UIComponents.showError(`No se encontraron resultados para "${query}"`, 'Error de búsqueda');
      }
    } catch (error) {
      console.error('❌ Error performing location search:', error);
      UIComponents.showError('Error al realizar la búsqueda. Por favor, intenta de nuevo.', 'Error de búsqueda');
    }
  },

  // Go to specific location on map
  goToLocation(lng, lat, placeName) {
    // Remove previous search marker if exists
    this.removeSearchMarker();

    // Fly to the location
    MapController.flyToLocation([lng, lat]);

    // Add a new search marker
    this.addSearchMarker(lng, lat, placeName);
  },

  // Add search marker to map
  addSearchMarker(lng, lat, placeName) {
    try {
      // Create custom search marker element with bicycle icon
      const markerElement = MapController.createCustomMarkerElement(true);

      this.currentSearchMarker = new mapboxgl.Marker({
        element: markerElement
      })
        .setLngLat([lng, lat])
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

    // Close all popups before resetting map
    MapController.closeAllPopups();

    // Reset map view
    MapController.resetMap();

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
    
    // Remove search marker
    this.removeSearchMarker();
    
    // Sidebar is always controlled by viewport filtering only
    // No need to explicitly update it here as it's handled by map events
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
    return false; // Always return false since viewport filtering is always active
  }
};

// Export for debugging
window.SearchController = SearchController; 