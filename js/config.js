// ===== GLOBAL CONFIGURATION =====
const GIG_CONFIG = {
  // Mapbox Configuration
  MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoiZ2lybHNpbmdlYXIiLCJhIjoiY2xwcmF1ajNlMDdiOTJpb2xpcjI5dXF3YiJ9.gAAFitjNaaaHyWJ86qdG9A',
  MAPBOX_STYLE: 'mapbox://styles/girlsingear/cmbica3mo006k01s6a8in69g5',
  
  // Map Default Settings
  DEFAULT_CENTER: [-98.5795, 39.8283],
  DEFAULT_ZOOM: 3.5,
  FOCUSED_ZOOM: 12,
  
  // Google Sheets Configuration
  // GOOGLE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1ygPq1Cfz0zW1pPCvdFB_R4yTh_XmKman7Pv__eVJePM/export?format=csv&gid=719830008',
  GOOGLE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1zUQVdXSOtEtWpJ0GQJ7vJRYr_TybpnabaqpSWmvzlcw/export?format=csv&gid=0',
  
  // CORS Proxy URLs (fallback options)
  CORS_PROXIES: [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ],
  
  // UI Configuration
  SEARCH_DELAY: 100, // ms delay between geocoding requests
  SEARCH_MARKER_TIMEOUT: 15000, // 15 seconds
  SEARCH_MIN_CHARACTERS: 2,
  MAX_SEARCH_SUGGESTIONS: 5,
  
  // Data fallback (empty - data must come from Google Sheets)
  SAMPLE_DATA: []
};

// Global variables
let globalGigData = [];
let isLoadingData = false;

// Initialize Mapbox
mapboxgl.accessToken = GIG_CONFIG.MAPBOX_ACCESS_TOKEN; 