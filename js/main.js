// ===== MAIN APPLICATION =====
const GigMapApp = {

  // Application initialization
  async initialize() {
    try {

      // Initialize UI components and event listeners
      this.initializeUI();

      // Initialize search functionality
      SearchController.initialize();

      // Initialize the map
      MapController.initializeMap();

    } catch (error) {
      console.error('❌ Error initializing application:', error);
      UIComponents.showError('Failed to initialize application. Please refresh the page.', 'Initialization Error');
    }
  },

  // Initialize UI components
  initializeUI() {

    // Set up UI event listeners
    UIComponents.initializeEventListeners();

    // Set initial state
    this.setInitialState();
  },

  // Set initial application state
  setInitialState() {
    // Clear search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }

    // Hide suggestions
    UIComponents.hideSuggestions();

    // Set initial chapter info
    const chapterInfo = document.querySelector('.chapter-info-text h3');
    const chapterSubtext = document.querySelector('.chapter-info-text p');
    
    if (chapterInfo && chapterSubtext) {
      chapterInfo.textContent = 'Loading Programs...';
      chapterSubtext.textContent = 'Please wait while we load the data';
    }
  },

  // Handle application errors
  handleError(error, context = 'Application') {
    console.error(`❌ ${context} Error:`, error);
    
    // Show user-friendly error message
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.message) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('geocoding')) {
        userMessage = 'Location search temporarily unavailable.';
      } else if (error.message.includes('map')) {
        userMessage = 'Map loading error. Please refresh the page.';
      }
    }

    UIComponents.showError(userMessage, `${context} Error`);
  },

  // Get application status
  getStatus() {
    return {
      mapLoaded: MapController.isMapLoaded(),
      dataLoaded: globalGigData.length > 0,
      markersCount: MapController.markers.length,
      isLoading: isLoadingData,
      currentQuery: SearchController.getCurrentQuery()
    };
  },

  // Reload application data
  async reloadData() {
    try {
      UIComponents.showSuccess('Reloading data...', 'Please Wait');
      
      await DataService.loadGigData(true);
      
      UIComponents.showSuccess('Data reloaded successfully!', 'Complete');
    } catch (error) {
      this.handleError(error, 'Data Reload');
    }
  },

  // Export application data
  exportData() {
    try {
      
      const exportData = {
        timestamp: new Date().toISOString(),
        programsCount: globalGigData.length,
        programs: globalGigData,
        configuration: {
          mapStyle: GIG_CONFIG.MAPBOX_STYLE,
          defaultCenter: GIG_CONFIG.DEFAULT_CENTER,
          defaultZoom: GIG_CONFIG.DEFAULT_ZOOM
        },
        status: this.getStatus()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `gig-map-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      
      UIComponents.showSuccess('Data exported successfully!', 'Export Complete');
    } catch (error) {
      this.handleError(error, 'Data Export');
    }
  },

  // Get application information
  getInfo() {
    const info = {
      version: '2.0.0',
      description: 'Girls in Gear Program Locator',
      lastUpdated: new Date().toISOString(),
      status: this.getStatus(),
      configuration: GIG_CONFIG,
      modules: {
        DataService: typeof DataService !== 'undefined',
        GeocodingService: typeof GeocodingService !== 'undefined',
        UIComponents: typeof UIComponents !== 'undefined',
        MapController: typeof MapController !== 'undefined',
        SearchController: typeof SearchController !== 'undefined'
      }
    };

    console.table(info.status);
    
    return info;
  }
};

// ===== APPLICATION STARTUP =====
// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  GigMapApp.initialize();
});

// ===== GLOBAL ERROR HANDLING =====
window.addEventListener('error', (event) => {
  console.error('💥 Global Error:', event.error);
  GigMapApp.handleError(event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled Promise Rejection:', event.reason);
  GigMapApp.handleError(event.reason, 'Promise');
});

// ===== EXPORT TO GLOBAL SCOPE FOR DEBUGGING =====
window.GigMapApp = GigMapApp;

// ===== DEVELOPMENT UTILITIES =====
// These functions are available in the browser console for debugging

window.debug = {
  // Get current application status
  status: () => GigMapApp.getStatus(),
  
  // Get application info
  info: () => GigMapApp.getInfo(),
  
  // Reload data
  reload: () => GigMapApp.reloadData(),
  
  // Export data
  export: () => GigMapApp.exportData(),
  
  // Clear all data and reset
  reset: () => {
    globalGigData = [];
    SearchController.resetMap();
  },
  
  // Get all loaded program data
  data: () => globalGigData,
  
  // Get map instance
  map: () => MapController.getMap(),
  
  // Test geocoding
  testGeocode: async (address) => {
    const result = await GeocodingService.geocodeAddress(address, '', '', '');
    return result;
  },
  
  // Test search
  testSearch: async (query) => {
    const results = await GeocodingService.getLocationSuggestions(query);
    return results;
  },
  
  // Show all available debug commands
  help: () => {

  }
};

// Show debug info on startup (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  
} 