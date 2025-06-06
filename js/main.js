// ===== MAIN APPLICATION =====
const GigMapApp = {

  // Application initialization
  async initialize() {
    try {
      console.log('🚀 Initializing Girls in Gear Map Application...');

      // Initialize UI components and event listeners
      this.initializeUI();

      // Initialize search functionality
      SearchController.initialize();

      // Initialize the map
      MapController.initializeMap();

      console.log('✅ Application initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing application:', error);
      UIComponents.showError('Failed to initialize application. Please refresh the page.', 'Initialization Error');
    }
  },

  // Initialize UI components
  initializeUI() {
    console.log('🎨 Initializing UI components...');

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
      console.log('🔄 Reloading application data...');
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
      console.log('📤 Exporting application data...');
      
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
    console.log('📋 Application Info:', info);
    
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
    console.log('🔄 Application reset complete');
  },
  
  // Get all loaded program data
  data: () => globalGigData,
  
  // Get map instance
  map: () => MapController.getMap(),
  
  // Test geocoding
  testGeocode: async (address) => {
    const result = await GeocodingService.geocodeAddress(address, '', '', '');
    console.log('📍 Geocoding result:', result);
    return result;
  },
  
  // Test search
  testSearch: async (query) => {
    const results = await GeocodingService.getLocationSuggestions(query);
    console.log('🔍 Search results:', results);
    return results;
  },
  
  // Show all available debug commands
  help: () => {
    console.log(`
🛠️ Debug Commands Available:
- debug.status() - Get application status
- debug.info() - Get detailed application info
- debug.reload() - Reload all data
- debug.export() - Export current data
- debug.reset() - Reset application
- debug.data() - Get all program data
- debug.map() - Get map instance
- debug.testGeocode(address) - Test geocoding
- debug.testSearch(query) - Test search
- debug.help() - Show this help

📊 Data Access:
- globalGigData - All program data
- GIG_CONFIG - Configuration settings

🏗️ Modules:
- DataService - Data fetching and processing
- GeocodingService - Location services
- UIComponents - UI manipulation
- MapController - Map management
- SearchController - Search functionality
- GigMapApp - Main application
    `);
  }
};

// Show debug info on startup (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🛠️ Development mode detected. Type debug.help() for available commands.');
} 