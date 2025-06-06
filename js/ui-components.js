// ===== UI COMPONENTS MODULE =====
const UIComponents = {

  // Update loading state
  updateLoadingState(isLoading) {
    const chapterInfo = document.querySelector('.chapter-info-text h3');
    const chapterSubtext = document.querySelector('.chapter-info-text p');

    if (isLoading) {
      chapterInfo.textContent = 'Loading data...';
      chapterSubtext.textContent = 'Getting programs from Google Sheets';
    }
  },

  // Update locations list in sidebar
  updateLocationsList(data) {
    const locationsList = document.querySelector('.locations-list');
    const chapterInfo = document.querySelector('.chapter-info-text h3');
    const chapterSubtext = document.querySelector('.chapter-info-text p');

    // Update counter
    chapterInfo.textContent = `${data.length} Programs Found`;
    chapterSubtext.textContent = 'Girls in Gear programs near you!';

    // Clear existing list
    locationsList.innerHTML = '';

    // Add new elements
    data.forEach((program) => {
      const locationItem = this.createLocationItem(program);
      locationsList.appendChild(locationItem);
    });
  },

  // Create a single location item element
  createLocationItem(program) {
    const locationItem = document.createElement('div');
    locationItem.className = 'location-item';
    
    locationItem.innerHTML = `
      <div class="location-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 20C3.58333 20 2.39583 19.5208 1.4375 18.5625C0.479167 17.6042 0 16.4167 0 15C0 13.5833 0.4875 12.3958 1.4625 11.4375C2.4375 10.4792 3.61667 10 5 10C6.28333 10 7.3625 10.3833 8.2375 11.15C9.1125 11.9167 9.66667 12.8667 9.9 14H10.55L8.75 9H7V7H12V9H10.9L11.25 10H16.05L14.6 6H12V4H14.6C15.0333 4 15.4208 4.11667 15.7625 4.35C16.1042 4.58333 16.35 4.9 16.5 5.3L18.2 9.95H19C20.3833 9.95 21.5625 10.4375 22.5375 11.4125C23.5125 12.3875 24 13.5667 24 14.95C24 16.35 23.5167 17.5417 22.55 18.525C21.5833 19.5083 20.4 20 19 20C17.8 20 16.7458 19.625 15.8375 18.875C14.9292 18.125 14.35 17.1667 14.1 16H9.9C9.66667 17.15 9.1 18.1042 8.2 18.8625C7.3 19.6208 6.23333 20 5 20ZM5 18C5.68333 18 6.27083 17.8125 6.7625 17.4375C7.25417 17.0625 7.6 16.5833 7.8 16H5V14H7.8C7.6 13.4 7.25417 12.9167 6.7625 12.55C6.27083 12.1833 5.68333 12 5 12C4.15 12 3.4375 12.2875 2.8625 12.8625C2.2875 13.4375 2 14.15 2 15C2 15.8333 2.2875 16.5417 2.8625 17.125C3.4375 17.7083 4.15 18 5 18ZM12.7 14H14.1C14.1833 13.6167 14.2958 13.2583 14.4375 12.925C14.5792 12.5917 14.7667 12.2833 15 12H11.95L12.7 14ZM19 18C19.85 18 20.5625 17.7083 21.1375 17.125C21.7125 16.5417 22 15.8333 22 15C22 14.15 21.7125 13.4375 21.1375 12.8625C20.5625 12.2875 19.85 12 19 12H18.9L19.9 14.65L18 15.35L17.05 12.7C16.7167 12.9833 16.4583 13.3167 16.275 13.7C16.0917 14.0833 16 14.5167 16 15C16 15.8333 16.2875 16.5417 16.8625 17.125C17.4375 17.7083 18.15 18 19 18Z" fill="white"/>
        </svg>
      </div>
      <div class="location-details">
        <div class="location-name">${this.escapeHtml(program.programType)} - ${this.escapeHtml(program.ageRange)}</div>
        <div class="location-address">${this.escapeHtml(program.address)}, ${this.escapeHtml(program.city)}, ${this.escapeHtml(program.state)} ${this.escapeHtml(program.zip)}</div>
        <div class="location-contact">${this.escapeHtml(program.meetingDay)} | ${this.escapeHtml(program.meetingTime)}</div>
        <div class="location-website" style="color: #00bcd4; font-weight: 600;">
          ${this.escapeHtml(program.region)} | ${this.escapeHtml(program.registrationStatus)}
        </div>
      </div>
      <div class="expand-arrow">›</div>
    `;

    // Add click event
    locationItem.addEventListener('click', () => {
      if (program.coordinates && MapController) {
        // Use the new combined method to fly to location and open popup
        MapController.flyToLocationAndOpenPopup(program);
      }
    });

    return locationItem;
  },

  // Create popup HTML for map markers
  createPopupHTML(program) {
    return `
      <div class="map-popup">
        <div class="popup-title">${this.escapeHtml(program.programType)}</div>
        <div class="popup-subtitle">${this.escapeHtml(program.region)}</div>
        <div class="popup-address">${this.escapeHtml(program.address)}, ${this.escapeHtml(program.city)}</div>
        
        <div class="popup-contact-info">
          <div class="popup-contact-item">
            <span class="contact-icon">📞</span>
            <span class="contact-text">${this.escapeHtml(program.phone || '(555) 555-5555')}</span>
          </div>
          
          <div class="popup-contact-item">
            <span class="contact-icon">🌐</span>
            <span class="contact-text">${this.escapeHtml(program.website || 'www.gotrsouthcentralak.org')}</span>
          </div>
        </div>
        
        <button class="view-directions-btn" onclick="UIComponents.openDirectionsPage('${this.escapeHtml(program.programType)}', '${this.escapeHtml(program.address)}', '${this.escapeHtml(program.city)}', '${this.escapeHtml(program.state)}', '${this.escapeHtml(program.zip)}', ${program.coordinates ? program.coordinates[1] : 0}, ${program.coordinates ? program.coordinates[0] : 0})">
          View Directions
        </button>
      </div>
    `;
  },

  // Open directions page in new tab
  openDirectionsPage(name, address, city, state, zip, lat, lng) {
    const params = new URLSearchParams({
      name: name,
      address: address,
      city: city,
      state: state,
      zip: zip,
      lat: lat,
      lng: lng
    });
    
    const directionsUrl = `directions.html?${params.toString()}`;
    window.open(directionsUrl, '_blank');
  },

  // Show search suggestions
  showSuggestions(suggestions) {
    const suggestionsContainer = document.querySelector('.search-suggestions');

    // Handle both old format (array) and new format (object with geocoded and programs)
    let geoSuggestions = [];
    let programSuggestions = [];
    
    if (Array.isArray(suggestions)) {
      // Old format - just geocoded suggestions
      geoSuggestions = suggestions;
    } else if (suggestions && typeof suggestions === 'object') {
      // New format - combined suggestions
      geoSuggestions = suggestions.geocoded || [];
      programSuggestions = suggestions.programs || [];
    }

    if (geoSuggestions.length === 0 && programSuggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    let html = '';
    let index = 0;

    // Add program suggestions first (with sidebar design)
    if (programSuggestions.length > 0) {
      programSuggestions.forEach((program) => {
        html += `
          <div class="search-suggestion-item program-suggestion" data-index="${index}" data-type="program" data-program-id="${program.id}">
            <div class="suggestion-location-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20C3.58333 20 2.39583 19.5208 1.4375 18.5625C0.479167 17.6042 0 16.4167 0 15C0 13.5833 0.4875 12.3958 1.4625 11.4375C2.4375 10.4792 3.61667 10 5 10C6.28333 10 7.3625 10.3833 8.2375 11.15C9.1125 11.9167 9.66667 12.8667 9.9 14H10.55L8.75 9H7V7H12V9H10.9L11.25 10H16.05L14.6 6H12V4H14.6C15.0333 4 15.4208 4.11667 15.7625 4.35C16.1042 4.58333 16.35 4.9 16.5 5.3L18.2 9.95H19C20.3833 9.95 21.5625 10.4375 22.5375 11.4125C23.5125 12.3875 24 13.5667 24 14.95C24 16.35 23.5167 17.5417 22.55 18.525C21.5833 19.5083 20.4 20 19 20C17.8 20 16.7458 19.625 15.8375 18.875C14.9292 18.125 14.35 17.1667 14.1 16H9.9C9.66667 17.15 9.1 18.1042 8.2 18.8625C7.3 19.6208 6.23333 20 5 20ZM5 18C5.68333 18 6.27083 17.8125 6.7625 17.4375C7.25417 17.0625 7.6 16.5833 7.8 16H5V14H7.8C7.6 13.4 7.25417 12.9167 6.7625 12.55C6.27083 12.1833 5.68333 12 5 12C4.15 12 3.4375 12.2875 2.8625 12.8625C2.2875 13.4375 2 14.15 2 15C2 15.8333 2.2875 16.5417 2.8625 17.125C3.4375 17.7083 4.15 18 5 18ZM12.7 14H14.1C14.1833 13.6167 14.2958 13.2583 14.4375 12.925C14.5792 12.5917 14.7667 12.2833 15 12H11.95L12.7 14ZM19 18C19.85 18 20.5625 17.7083 21.1375 17.125C21.7125 16.5417 22 15.8333 22 15C22 14.15 21.7125 13.4375 21.1375 12.8625C20.5625 12.2875 19.85 12 19 12H18.9L19.9 14.65L18 15.35L17.05 12.7C16.7167 12.9833 16.4583 13.3167 16.275 13.7C16.0917 14.0833 16 14.5167 16 15C16 15.8333 16.2875 16.5417 16.8625 17.125C17.4375 17.7083 18.15 18 19 18Z" fill="white"/>
              </svg>
            </div>
            <div class="suggestion-location-details">
              <div class="suggestion-location-name">${this.escapeHtml(program.programType)} - ${this.escapeHtml(program.ageRange)}</div>
              <div class="suggestion-location-address">${this.escapeHtml(program.address)}, ${this.escapeHtml(program.city)}, ${this.escapeHtml(program.state)} ${this.escapeHtml(program.zip)}</div>
              <div class="suggestion-contact-info">
                <div class="suggestion-contact-item">
                  <span class="suggestion-contact-icon">📞</span>
                  <span class="suggestion-contact-text">${this.escapeHtml(program.phone || '(907) 306-0789')}</span>
                </div>
                <div class="suggestion-contact-item">
                  <span class="suggestion-contact-icon">🌐</span>
                  <span class="suggestion-contact-text">${this.escapeHtml(program.website || 'www.gotrsouthcentralak.org')}</span>
                </div>
              </div>
            </div>
            <div class="suggestion-expand-arrow">›</div>
          </div>
        `;
        index++;
      });
    }

    // Add geocoded suggestions after programs
    if (geoSuggestions.length > 0) {
      geoSuggestions.forEach((suggestion) => {
        html += `
          <div class="search-suggestion-item geocoded-suggestion" data-index="${index}" data-type="geocoded" data-lng="${suggestion.center[0]}" data-lat="${suggestion.center[1]}">
            <div class="suggestion-location-icon geocoded-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20C3.58333 20 2.39583 19.5208 1.4375 18.5625C0.479167 17.6042 0 16.4167 0 15C0 13.5833 0.4875 12.3958 1.4625 11.4375C2.4375 10.4792 3.61667 10 5 10C6.28333 10 7.3625 10.3833 8.2375 11.15C9.1125 11.9167 9.66667 12.8667 9.9 14H10.55L8.75 9H7V7H12V9H10.9L11.25 10H16.05L14.6 6H12V4H14.6C15.0333 4 15.4208 4.11667 15.7625 4.35C16.1042 4.58333 16.35 4.9 16.5 5.3L18.2 9.95H19C20.3833 9.95 21.5625 10.4375 22.5375 11.4125C23.5125 12.3875 24 13.5667 24 14.95C24 16.35 23.5167 17.5417 22.55 18.525C21.5833 19.5083 20.4 20 19 20C17.8 20 16.7458 19.625 15.8375 18.875C14.9292 18.125 14.35 17.1667 14.1 16H9.9C9.66667 17.15 9.1 18.1042 8.2 18.8625C7.3 19.6208 6.23333 20 5 20ZM5 18C5.68333 18 6.27083 17.8125 6.7625 17.4375C7.25417 17.0625 7.6 16.5833 7.8 16H5V14H7.8C7.6 13.4 7.25417 12.9167 6.7625 12.55C6.27083 12.1833 5.68333 12 5 12C4.15 12 3.4375 12.2875 2.8625 12.8625C2.2875 13.4375 2 14.15 2 15C2 15.8333 2.2875 16.5417 2.8625 17.125C3.4375 17.7083 4.15 18 5 18ZM12.7 14H14.1C14.1833 13.6167 14.2958 13.2583 14.4375 12.925C14.5792 12.5917 14.7667 12.2833 15 12H11.95L12.7 14ZM19 18C19.85 18 20.5625 17.7083 21.1375 17.125C21.7125 16.5417 22 15.8333 22 15C22 14.15 21.7125 13.4375 21.1375 12.8625C20.5625 12.2875 19.85 12 19 12H18.9L19.9 14.65L18 15.35L17.05 12.7C16.7167 12.9833 16.4583 13.3167 16.275 13.7C16.0917 14.0833 16 14.5167 16 15C16 15.8333 16.2875 16.5417 16.8625 17.125C17.4375 17.7083 18.15 18 19 18Z" fill="white"/>
              </svg>
            </div>
            <div class="suggestion-location-details">
              <div class="suggestion-location-name geocoded-name">${this.escapeHtml(suggestion.placeName)}</div>
              <div class="suggestion-location-address">${this.escapeHtml(suggestion.placeType)}</div>
            </div>
            <div class="suggestion-expand-arrow">›</div>
          </div>
        `;
        index++;
      });
    }

    suggestionsContainer.innerHTML = html;
    suggestionsContainer.style.display = 'block';

    // Add click listeners to suggestions
    suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        
        if (type === 'geocoded') {
          // Handle geocoded suggestion
          const lng = parseFloat(item.dataset.lng);
          const lat = parseFloat(item.dataset.lat);
          const placeName = item.querySelector('.suggestion-location-name').textContent;

          // Update search input
          document.querySelector('.search-input').value = placeName;

          // Go to location
          SearchController.goToLocation(lng, lat, placeName);
        } else if (type === 'program') {
          // Handle program suggestion
          const programId = parseInt(item.dataset.programId);
          const program = globalGigData.find(p => p.id === programId);
          
          if (program && program.coordinates) {
            // Update search input with program info
            document.querySelector('.search-input').value = `${program.programType} - ${program.city}, ${program.state}`;

            // Fly to program location and open popup
            if (MapController && MapController.flyToLocationAndOpenPopup) {
              MapController.flyToLocationAndOpenPopup(program);
            }
          }
        }

        // Hide suggestions
        this.hideSuggestions();
      });
    });
  },

  // Hide search suggestions
  hideSuggestions() {
    const suggestionsContainer = document.querySelector('.search-suggestions');
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '';
  },

  // Update selected suggestion (for keyboard navigation)
  updateSelectedSuggestion(selectedIndex) {
    const suggestions = document.querySelectorAll('.search-suggestion-item');
    suggestions.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
    });
  },

  // Show error message
  showError(message, title = 'Error') {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: 'Montserrat', sans-serif;
    `;
    
    errorDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 5px;">${this.escapeHtml(title)}</div>
      <div style="font-size: 14px;">${this.escapeHtml(message)}</div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  },

  // Show success message
  showSuccess(message, title = 'Success') {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: 'Montserrat', sans-serif;
    `;
    
    successDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 5px;">${this.escapeHtml(title)}</div>
      <div style="font-size: 14px;">${this.escapeHtml(message)}</div>
    `;

    document.body.appendChild(successDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  },

  // Utility function to escape HTML
  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  },

  // Initialize UI event listeners
  initializeEventListeners() {
    // Reset button
    const resetButton = document.querySelector('.reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        SearchController.resetMap();
      });
    }

    // Search input events
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      // Real-time search for programs
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query) {
          DataService.searchPrograms(query);
        } else {
          // Clear search when input is empty
          if (SearchController && SearchController.clearSearch) {
            SearchController.clearSearch();
          }
        }
      });

      // Enter key for search
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query) {
            DataService.searchPrograms(query);
          } else {
            SearchController.clearSearch();
          }
        }
      });
    }

    // Search icon click
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput && searchInput.value.trim()) {
          DataService.searchPrograms(searchInput.value);
        }
      });
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideSuggestions();
      }
    });
  }
};

// Export for debugging
window.UIComponents = UIComponents;