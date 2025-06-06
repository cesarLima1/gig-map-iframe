// ===== DATA SERVICE MODULE =====
const DataService = {

  // Fetch data from Google Sheets with CORS proxy fallback
  async fetchGoogleSheetData() {
    try {
      isLoadingData = true;

      // Show loading indicator
      UIComponents.updateLoadingState(true);

      let csvText = null;
      let lastError = null;

      // Try with different CORS proxies
      for (let i = 0; i < GIG_CONFIG.CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = GIG_CONFIG.CORS_PROXIES[i] + encodeURIComponent(GIG_CONFIG.GOOGLE_SHEET_URL);

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
          }

          const data = await response.json();

          // Handle different proxy response formats
          csvText = this.extractCSVFromResponse(data);

          if (csvText) {
            break;
          }

        } catch (error) {
          console.warn(`⚠️ Error with proxy ${i + 1}:`, error.message);
          lastError = error;

          // If it's not the last proxy, continue
          if (i < GIG_CONFIG.CORS_PROXIES.length - 1) {
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
        const base64Index = csvText.indexOf('base64,');
        if (base64Index !== -1) {
          const base64Content = csvText.substring(base64Index + 7);
          try {
            csvText = atob(base64Content);
          } catch (e) {
            console.error('❌ Error decoding Data URL base64:', e);
            throw new Error('Error decoding Data URL');
          }
        }
      }
      // Check if it looks like pure base64
      else if (csvText && !csvText.includes(',') && /^[A-Za-z0-9+/=]+$/.test(csvText.replace(/\s/g, ''))) {
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
          console.error('❌ Error loading Google Sheet data:', error);
          throw new Error('Failed to load data from Google Sheet. Please check your connection and try again.');
        }
      } else {
        throw new Error('No data source available');
      }

      // Process data
      const processedData = this.processSheetData(rawData);

      // Geocode addresses
      const geocodedData = await GeocodingService.geocodeAllData(processedData);

      // Store in global variable
      globalGigData = geocodedData;

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
  }
};

// ===== DEVELOPMENT AND DEBUG FUNCTIONS =====
// Export utility functions to window for debugging
window.DataService = DataService;
window.reloadData = () => DataService.loadGigData(true);

window.exportData = function () {
  const dataStr = JSON.stringify(globalGigData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gig-data.json';
  link.click();
};

window.getSheetInfo = function () {
}; 