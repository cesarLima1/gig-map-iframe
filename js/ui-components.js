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
      <div class="location-icon"></div>
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
      if (program.coordinates && window.map) {
        window.map.flyTo({
          center: program.coordinates,
          zoom: GIG_CONFIG.FOCUSED_ZOOM,
          duration: 1000
        });
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
            <span class="contact-text">${this.escapeHtml(program.phone || '(907) 306-0789')}</span>
          </div>
          
          <div class="popup-contact-item">
            <span class="contact-icon">🌐</span>
            <span class="contact-text">${this.escapeHtml(program.website || 'www.gotrsouthcentralak.org')}</span>
          </div>
        </div>
        
        <button class="view-directions-btn" onclick="UIComponents.openDirections('${this.escapeHtml(program.address)}, ${this.escapeHtml(program.city)}, ${this.escapeHtml(program.state)} ${this.escapeHtml(program.zip)}')">
          View Directions
        </button>
      </div>
    `;
  },

  // Open directions in Google Maps
  openDirections(address) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  },

  // Show search suggestions
  showSuggestions(suggestions) {
    const suggestionsContainer = document.querySelector('.search-suggestions');

    if (!suggestions || suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    suggestionsContainer.innerHTML = suggestions
      .map((suggestion, index) => `
        <div class="search-suggestion-item" data-index="${index}" data-lng="${suggestion.center[0]}" data-lat="${suggestion.center[1]}">
          <div class="suggestion-text">${this.escapeHtml(suggestion.placeName)}</div>
          <div class="suggestion-type">${this.escapeHtml(suggestion.placeType)}</div>
        </div>
      `)
      .join('');

    suggestionsContainer.style.display = 'block';

    // Add click listeners to suggestions
    suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        const lng = parseFloat(item.dataset.lng);
        const lat = parseFloat(item.dataset.lat);
        const placeName = item.querySelector('.suggestion-text').textContent;

        // Update search input
        document.querySelector('.search-input').value = placeName;

        // Go to location
        SearchController.goToLocation(lng, lat, placeName);

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
        DataService.searchPrograms(e.target.value);
      });

      // Enter key for search
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          DataService.searchPrograms(e.target.value);
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