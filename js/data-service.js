// ===== DATA SERVICE MODULE =====
const DataService = {

  // Fetch data from Google Sheets with CORS proxy fallback
  async fetchGoogleSheetData() {
    try {
      isLoadingData = true;
      console.log('📥 Fetching data from Google Sheet...');

      // Show loading indicator
      UIComponents.updateLoadingState(true);

      let csvText = null;
      let lastError = null;

      // Try with different CORS proxies
      for (let i = 0; i < GIG_CONFIG.CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = GIG_CONFIG.CORS_PROXIES[i] + encodeURIComponent(GIG_CONFIG.GOOGLE_SHEET_URL);
          console.log(`🔄 Trying proxy ${i + 1}/${GIG_CONFIG.CORS_PROXIES.length}...`);

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }

          const data = await response.json();

          // Handle different proxy response formats
          csvText = this.extractCSVFromResponse(data);

          if (csvText) {
            console.log('✅ Data obtained successfully with proxy', i + 1);
            console.log('📄 Content length:', csvText.length);
            break;
          }

        } catch (error) {
          console.warn(`⚠️ Error with proxy ${i + 1}:`, error.message);
          lastError = error;

          // If it's not the last proxy, continue
          if (i < GIG_CONFIG.CORS_PROXIES.length - 1) {
            console.log('🔄 Trying next proxy...');
            continue;
          }
        }
      }

      // If we couldn't get data with any proxy
      if (!csvText) {
        throw new Error(`Could not get data with any proxy. Last error: ${lastError?.message}`);
      }

      return this.parseCSVData(csvText);

    } catch (error) {
      console.error('❌ Error fetching Google Sheet data:', error);
      throw error;
    } finally {
      isLoadingData = false;
      UIComponents.updateLoadingState(false);
    }
  },

  // Extract CSV text from proxy response
  extractCSVFromResponse(data) {
    let csvText = null;

    if (data.contents) {
      // allorigins.win format
      csvText = data.contents;

      // Check if it's a Data URL (data:text/csv;base64,...)
      if (csvText.startsWith('data:')) {
        console.log('🔄 Detected Data URL, extracting base64...');
        const base64Index = csvText.indexOf('base64,');
        if (base64Index !== -1) {
          const base64Content = csvText.substring(base64Index + 7);
          try {
            csvText = atob(base64Content);
            console.log('✅ Data URL decoded successfully');
          } catch (e) {
            console.error('❌ Error decoding Data URL base64:', e);
            throw new Error('Error decoding Data URL');
          }
        }
      }
      // Check if it looks like pure base64
      else if (csvText && !csvText.includes(',') && /^[A-Za-z0-9+/=]+$/.test(csvText.replace(/\s/g, ''))) {
        console.log('🔄 Detected pure base64 content, decoding...');
        try {
          csvText = atob(csvText);
        } catch (e) {
          console.warn('⚠️ Error decoding detected base64');
        }
      }
    } else if (typeof data === 'string') {
      csvText = data;
      // Handle Data URL in direct response too
      if (csvText.startsWith('data:')) {
        const base64Index = csvText.indexOf('base64,');
        if (base64Index !== -1) {
          const base64Content = csvText.substring(base64Index + 7);
          try {
            csvText = atob(base64Content);
          } catch (e) {
            console.error('❌ Error decoding direct Data URL:', e);
          }
        }
      }
    } else if (data.data) {
      csvText = data.data;
    }

    return csvText;
  },

  // Parse CSV data using Papa Parse
  parseCSVData(csvText) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: function (header) {
          // Clean and normalize column names
          return header
            .trim()
            .replace(/\s+/g, '')
            .replace(/([A-Z])/g, (match, letter, index) => {
              return index > 0 ? letter.toLowerCase() : letter.toLowerCase();
            });
        },
        complete: function (results) {
          if (results.errors.length > 0) {
            console.error('❌ CSV parsing errors:', results.errors);
            reject(new Error('Error parsing CSV data'));
            return;
          }
          console.log('✅ Data parsed successfully:', results.data.length, 'rows');
          resolve(results.data);
        },
        error: function (error) {
          console.error('❌ Papa Parse error:', error);
          reject(error);
        }
      });
    });
  },

  // Process and normalize sheet data
  processSheetData(rawData) {
    console.log('🔄 Processing data...');

    return rawData
      .map((row, index) => {
        // Map columns according to your structure
        const processedRow = {
          id: index + 1,
          programType: row.programtype || row['Program Type'] || '',
          address: row.address || row['Address'] || '',
          address2: row.address2 || row['Address 2'] || '',
          city: row.city || row['City'] || '',
          state: row.state || row['State'] || '',
          zip: row.zip || row['Zip'] || '',
          ageRange: row.agerange || row['Age Range'] || '',
          meetingDay: row.meetingday || row['Meeting Day'] || '',
          meetingTime: row.meetingtime || row['Meeting Time'] || '',
          region: row.region || row['Region'] || '',
          registrationStatus: row.registrationstatus || row['Registration Status'] || '',
          acceptingVolunteers: row.acceptingvolunteers || row['Accepting Volunteers'] || '',
          latitude: parseFloat(row.latitude || row['Latitude']) || null,
          longitude: parseFloat(row.longitude || row['Longitude']) || null
        };

        return processedRow;
      })
      .filter((row) => row.address && row.city && row.state); // Filter rows with essential data
  },

  // Main function to load and process all data
  async loadGigData(useSheetData = true) {
    try {
      let rawData;

      if (useSheetData) {
        // Try to load data from Google Sheet
        try {
          rawData = await this.fetchGoogleSheetData();
        } catch (error) {
          console.warn('⚠️ Error loading Google Sheet, using sample data:', error);
          rawData = GIG_CONFIG.SAMPLE_DATA;
          useSheetData = false;
        }
      } else {
        rawData = GIG_CONFIG.SAMPLE_DATA;
      }

      // Process data
      const processedData = useSheetData ? this.processSheetData(rawData) : rawData;

      // Geocode addresses
      const geocodedData = await GeocodingService.geocodeAllData(processedData);

      // Store in global variable
      globalGigData = geocodedData;

      console.log('🎉 Data loaded successfully:', globalGigData.length, 'programs');

      // Update UI
      UIComponents.updateLocationsList(globalGigData);
      MapController.updateMapMarkers(globalGigData);

      return globalGigData;
    } catch (error) {
      console.error('❌ Error loading data:', error);

      // Fallback to sample data
      if (useSheetData) {
        console.log('🔄 Trying with sample data...');
        return await this.loadGigData(false);
      }

      throw error;
    }
  },

  // Search programs by query
  searchPrograms(query) {
    if (!query.trim()) {
      // Clear search when query is empty
      if (SearchController && SearchController.clearSearch) {
        SearchController.clearSearch();
      }
      return globalGigData;
    }

    // Set search as active
    if (SearchController) {
      SearchController.isSearchActive = true;
    }

    const filtered = globalGigData.filter((program) => {
      const searchText =
        `${program.programType} ${program.address} ${program.city} ${program.state} ${program.region} ${program.ageRange}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    UIComponents.updateLocationsList(filtered);
    console.log(`🔍 Search "${query}": ${filtered.length} results`);
    return filtered;
  }
};

// ===== DEVELOPMENT AND DEBUG FUNCTIONS =====
// Export utility functions to window for debugging
window.DataService = DataService;
window.reloadData = () => DataService.loadGigData(true);
window.useSampleData = () => DataService.loadGigData(false);

window.exportData = function () {
  console.log('📤 Current data:', globalGigData);
  const dataStr = JSON.stringify(globalGigData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gig-data.json';
  link.click();
};

window.getSheetInfo = function () {
  console.log('📋 Google Sheet Information:');
  console.log('🔗 Original URL:', GIG_CONFIG.GOOGLE_SHEET_URL);
  console.log('📊 Data loaded:', globalGigData.length, 'programs');
  console.log('🗺️ With coordinates:', globalGigData.filter((d) => d.coordinates).length);
}; 