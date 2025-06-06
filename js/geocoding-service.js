// ===== GEOCODING SERVICE MODULE =====
const GeocodingService = {

  // Geocode a single address using Mapbox Geocoding API
  async geocodeAddress(address, city, state, zip) {
    try {
      // Build complete address
      const fullAddress = `${address}${address ? ', ' : ''}${city}, ${state} ${zip}`.trim();

      // Mapbox Geocoding API URL
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        fullAddress
      )}.json?access_token=${mapboxgl.accessToken}&country=US&limit=1`;

      const response = await fetch(geocodingUrl);

      if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].center; // [lng, lat]
        return coordinates;
      } else {
        console.warn(`⚠️ No coordinates found for: ${fullAddress}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error geocoding ${address}:`, error);
      return null;
    }
  },

  // Geocode all data with rate limiting
  async geocodeAllData(data) {
    const geocodedData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      let coordinates = null;
      
      // First, try to use existing latitude and longitude
      if (item.latitude && item.longitude && item.latitude !== null && item.longitude !== null) {
        coordinates = [parseFloat(item.longitude), parseFloat(item.latitude)]; // [lng, lat] format for Mapbox
      } else {
        // Fallback to geocoding if coordinates are not available
        
        // Add small delay to avoid rate limits when geocoding
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, GIG_CONFIG.SEARCH_DELAY));
        }
        
        coordinates = await this.geocodeAddress(item.address, item.city, item.state, item.zip);
      }

      geocodedData.push({
        ...item,
        coordinates: coordinates
      });

      // Update progress
      const progress = Math.round(((i + 1) / data.length) * 100);
    }

    return geocodedData;
  },

  // Get location suggestions for search
  async getLocationSuggestions(query) {
    if (!query.trim() || query.length < GIG_CONFIG.SEARCH_MIN_CHARACTERS) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${mapboxgl.accessToken}&` +
          `country=US&` +
          `types=place,postcode,locality,neighborhood,address&` +
          `limit=${GIG_CONFIG.MAX_SEARCH_SUGGESTIONS}`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features.map(feature => ({
          placeName: feature.place_name,
          center: feature.center,
          placeType: feature.place_type ? feature.place_type[0] : 'location'
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error getting location suggestions:', error);
      return [];
    }
  },

  // Reverse geocoding (coordinates to address)
  async reverseGeocode(lng, lat) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          `access_token=${mapboxgl.accessToken}&` +
          `country=US&` +
          `limit=1`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return {
          placeName: data.features[0].place_name,
          properties: data.features[0].properties,
          context: data.features[0].context
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error reverse geocoding:', error);
      return null;
    }
  }
};

// Export for debugging
window.GeocodingService = GeocodingService; 