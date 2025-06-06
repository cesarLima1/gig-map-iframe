# Girls in Gear - Program Locator Map

A professional, modular web application for locating Girls in Gear programs across the United States. Built with modern JavaScript ES6 modules, Mapbox GL JS, and responsive design.

## 🏗️ Project Structure

The project has been refactored from a single `index.html` file into a well-organized, modular structure:

```
├── index.html              # Main HTML structure
├── styles/
│   ├── main.css            # Core styles and components
│   └── responsive.css      # Mobile and responsive styles
├── js/
│   ├── config.js           # Configuration and constants
│   ├── data-service.js     # Google Sheets data fetching
│   ├── geocoding-service.js # Mapbox geocoding services
│   ├── ui-components.js    # UI manipulation and components
│   ├── map-controller.js   # Map initialization and control
│   ├── search-controller.js # Search functionality
│   └── main.js             # Application initialization
└── README.md              # Project documentation
```

## ✨ Key Features

- **📍 Interactive Map**: Mapbox GL JS with custom styling
- **🔍 Smart Search**: Location-based search with autocomplete
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🗂️ Data Integration**: Real-time Google Sheets integration
- **⚡ Fast Performance**: Optimized loading and caching
- **🛠️ Developer Tools**: Built-in debugging and utilities

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (for local development)

### Local Development

1. **Clone or download the project**
2. **Serve the files using a local web server**:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. **Open your browser** and navigate to `http://localhost:8000`

## 📁 Module Overview

### `js/config.js`

Central configuration file containing:

- Mapbox access tokens and styles
- Google Sheets URLs and CORS proxies
- Default map settings
- Sample data for testing

### `js/data-service.js`

Handles data operations:

- Fetches data from Google Sheets
- Processes and normalizes CSV data
- Manages fallback mechanisms
- Provides search functionality

### `js/geocoding-service.js`

Location services powered by Mapbox:

- Address to coordinates conversion
- Location search suggestions
- Reverse geocoding
- Rate limiting and error handling

### `js/ui-components.js`

User interface management:

- DOM manipulation utilities
- Dynamic content generation
- Event handling
- Error and success notifications

### `js/map-controller.js`

Map functionality:

- Mapbox GL JS initialization
- Marker management
- Map navigation and controls
- Bounds calculation and fitting

### `js/search-controller.js`

Search functionality:

- Real-time search suggestions
- Keyboard navigation
- Location-based filtering
- Search marker management

### `js/main.js`

Application coordinator:

- Module initialization
- Error handling
- Debug utilities
- Global state management

## 🛠️ Development Tools

The application includes built-in debugging tools accessible via browser console:

```javascript
// Get application status
debug.status();

// View detailed application info
debug.info();

// Reload data from Google Sheets
debug.reload();

// Export current data
debug.export();

// Reset application
debug.reset();

// Test geocoding
debug.testGeocode('New York, NY');

// Test search
debug.testSearch('California');

// Show all available commands
debug.help();
```

## 🔧 Configuration

### Mapbox Setup

Update the Mapbox access token in `js/config.js`:

```javascript
MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here';
```

### Google Sheets Integration

Configure your Google Sheets URL in `js/config.js`:

```javascript
GOOGLE_SHEET_URL: 'your_google_sheets_csv_url_here';
```

### Styling

Customize the appearance by modifying:

- `styles/main.css` - Core styles
- `styles/responsive.css` - Mobile styles

## 📱 Responsive Design

The application is fully responsive with breakpoints for:

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🎯 Benefits of Modular Structure

### For Development

- **Maintainability**: Each module has a single responsibility
- **Debuggability**: Easy to isolate and fix issues
- **Collaboration**: Multiple developers can work on different modules
- **Testing**: Modules can be tested independently

### For Performance

- **Caching**: Individual files can be cached separately
- **Loading**: Potential for lazy loading modules
- **Minification**: Each file can be optimized individually

### For Iframe Usage

- **Self-contained**: All dependencies are clearly defined
- **Portable**: Easy to embed in other applications
- **Configurable**: Settings can be easily modified
- **Reliable**: Better error handling and fallback mechanisms

## 🔍 Browser Console Access

For debugging and development, the following objects are available in the browser console:

- `GigMapApp` - Main application controller
- `DataService` - Data operations
- `MapController` - Map management
- `SearchController` - Search functionality
- `UIComponents` - UI utilities
- `GeocodingService` - Location services
- `globalGigData` - Current program data
- `GIG_CONFIG` - Application configuration
- `debug` - Debug utilities

## 📊 Data Flow

1. **Initialization**: Application loads and initializes modules
2. **Map Setup**: Mapbox map is created and configured
3. **Data Fetching**: Google Sheets data is retrieved and processed
4. **Geocoding**: Addresses are converted to coordinates
5. **Rendering**: Markers are placed on map and UI is updated
6. **Interaction**: User can search, filter, and navigate

## 🚦 Error Handling

The application includes comprehensive error handling:

- Network connectivity issues
- API rate limiting
- Invalid data formats
- Geocoding failures
- Map rendering errors

## 📈 Performance Considerations

- **Debounced Search**: Prevents excessive API calls
- **Rate Limiting**: Respects Mapbox API limits
- **Lazy Loading**: UI components load as needed
- **Memory Management**: Proper cleanup of markers and events
- **Caching**: Geocoded results are cached

## 🔒 Security

- **Input Sanitization**: All user inputs are properly escaped
- **CORS Handling**: Multiple fallback proxies for data fetching
- **API Key Management**: Secure token handling
- **XSS Prevention**: HTML content is properly escaped

---

**Developed for Girls in Gear** | Built with modern web technologies for maximum compatibility and performance.
