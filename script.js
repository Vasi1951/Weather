// Weather condition codes mapping (WMO Weather interpretation codes)
const weatherCodes = {
  0: { description: 'Clear sky', icon: '☀️', type: 'clear' },
  1: { description: 'Mainly clear', icon: '🌤️', type: 'clear' },
  2: { description: 'Partly cloudy', icon: '⛅', type: 'cloudy' },
  3: { description: 'Overcast', icon: '☁️', type: 'cloudy' },
  45: { description: 'Fog', icon: '🌫️', type: 'fog' },
  48: { description: 'Depositing rime fog', icon: '🌫️', type: 'fog' },
  51: { description: 'Light drizzle', icon: '🌦️', type: 'rain' },
  53: { description: 'Moderate drizzle', icon: '🌦️', type: 'rain' },
  55: { description: 'Dense drizzle', icon: '🌧️', type: 'rain' },
  61: { description: 'Slight rain', icon: '🌦️', type: 'rain' },
  63: { description: 'Moderate rain', icon: '🌧️', type: 'rain' },
  65: { description: 'Heavy rain', icon: '🌧️', type: 'rain' },
  71: { description: 'Slight snow', icon: '🌨️', type: 'snow' },
  73: { description: 'Moderate snow', icon: '🌨️', type: 'snow' },
  75: { description: 'Heavy snow', icon: '❄️', type: 'snow' },
  77: { description: 'Snow grains', icon: '🌨️', type: 'snow' },
  80: { description: 'Slight rain showers', icon: '🌦️', type: 'rain' },
  81: { description: 'Moderate rain showers', icon: '🌧️', type: 'rain' },
  82: { description: 'Violent rain showers', icon: '⛈️', type: 'rain' },
  85: { description: 'Slight snow showers', icon: '🌨️', type: 'snow' },
  86: { description: 'Heavy snow showers', icon: '❄️', type: 'snow' },
  95: { description: 'Thunderstorm', icon: '⛈️', type: 'thunder' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️', type: 'thunder' },
  99: { description: 'Heavy thunderstorm', icon: '⛈️', type: 'thunder' }
};

// Reset function to clear everything
function resetApp() {
  // Clear input
  document.getElementById('cityInput').value = '';
  
  // Hide all dynamic content
  document.getElementById('weatherContent').innerHTML = `
    <div class="initial-state">
      <i class="fas fa-cloud-sun-rain"></i>
      <p class="welcome-text">Welcome to Weather Experience</p>
      <p class="sub-text">Search any city worldwide to get real-time weather updates</p>
    </div>
  `;
  
  // Hide suggestions and errors
  document.getElementById('suggestionsSection').style.display = 'none';
  document.getElementById('errorMessage').classList.remove('active');
  document.getElementById('autocompleteList').classList.remove('active');
  
  // Reset background to default
  document.getElementById('bgLayer').className = 'bg-layer bg-clear-day';
  
  // Clear weather effects
  document.getElementById('weatherEffects').innerHTML = '';
  
  // Focus back on input
  document.getElementById('cityInput').focus();
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Fetch city suggestions for autocomplete
async function fetchCitySuggestions(query) {
  if (query.length < 3) return [];
  
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}

// Display autocomplete suggestions
function displayAutocompleteSuggestions(suggestions) {
  const list = document.getElementById('autocompleteList');
  list.innerHTML = '';
  
  if (suggestions.length === 0) {
    list.classList.remove('active');
    return;
  }
  
  suggestions.forEach(city => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    
    // Build location string
    let locationParts = [city.name];
    if (city.admin1) locationParts.push(city.admin1);
    if (city.country) locationParts.push(city.country);
    
    item.innerHTML = `
      <i class="fas fa-map-marker-alt"></i>
      <span class="city-name">${city.name}</span>
      ${city.admin1 ? `<span class="admin-info">${city.admin1}</span>` : ''}
      <span class="country-name">${city.country || ''}</span>
    `;
    
    item.addEventListener('click', () => {
      document.getElementById('cityInput').value = city.name;
      list.classList.remove('active');
      getWeather();
    });
    
    list.appendChild(item);
  });
  
  list.classList.add('active');
}

// Handle input with debouncing
const handleInput = debounce(async (e) => {
  const query = e.target.value.trim();
  if (query.length >= 3) {
    const suggestions = await fetchCitySuggestions(query);
    displayAutocompleteSuggestions(suggestions);
  } else {
    document.getElementById('autocompleteList').classList.remove('active');
  }
}, 300);

// Show "Did you mean?" suggestions
function showDidYouMeanSuggestions(suggestions) {
  const section = document.getElementById('suggestionsSection');
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '';
  
  if (suggestions.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  suggestions.forEach(city => {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.innerHTML = `
      <i class="fas fa-location-arrow"></i>
      ${city.name}${city.country ? `, ${city.country}` : ''}
    `;
    chip.addEventListener('click', () => {
      document.getElementById('cityInput').value = city.name;
      section.style.display = 'none';
      getWeather();
    });
    list.appendChild(chip);
  });
  
  section.style.display = 'block';
}

// Smart suggestions based on weather conditions
function getSuggestions(weatherType, temp, windSpeed, isDay) {
  const suggestions = [];
  
  // Temperature based
  if (temp < 0) {
    suggestions.push("It's freezing! Wear heavy winter clothing and stay warm.");
    suggestions.push("Watch out for icy patches on roads and sidewalks.");
  } else if (temp < 10) {
    suggestions.push("Quite chilly! Bring a warm jacket or coat.");
    suggestions.push("Perfect weather for a hot coffee or tea.");
  } else if (temp < 20) {
    suggestions.push("Mild temperature - a light jacket or sweater should suffice.");
    suggestions.push("Great weather for outdoor activities like hiking or cycling.");
  } else if (temp < 30) {
    suggestions.push("Warm and pleasant! Dress lightly and stay hydrated.");
    suggestions.push("Don't forget sunscreen if you're spending time outdoors.");
  } else {
    suggestions.push("It's hot! Drink plenty of water and avoid strenuous activity during peak hours.");
    suggestions.push("Wear breathable, light-colored clothing and seek shade when possible.");
  }

  // Weather type based
  switch(weatherType) {
    case 'rain':
      suggestions.push("Don't forget your umbrella and waterproof shoes!");
      suggestions.push("Drive carefully - roads may be slippery.");
      break;
    case 'snow':
      suggestions.push("Wear boots with good traction to prevent slipping.");
      suggestions.push("Allow extra time for travel due to potential delays.");
      break;
    case 'thunder':
      suggestions.push("Stay indoors if possible during the storm.");
      suggestions.push("Avoid using electrical appliances and stay away from windows.");
      break;
    case 'fog':
      suggestions.push("Drive with low beams and maintain safe following distance.");
      suggestions.push("Wear bright or reflective clothing if walking outdoors.");
      break;
    case 'clear':
      if (isDay) suggestions.push("Beautiful day! Perfect for photography or picnics.");
      else suggestions.push("Clear night - great for stargazing!");
      break;
    case 'cloudy':
      suggestions.push("Good weather for outdoor exercise without harsh sun.");
      break;
  }

  // Wind based
  if (windSpeed > 30) {
    suggestions.push("Strong winds today! Secure loose objects outdoors.");
    suggestions.push("Be cautious of falling branches or debris.");
  }

  return suggestions.slice(0, 3);
}

// Get background class based on weather and time
function getBackgroundClass(weatherType, isDay) {
  if (weatherType === 'rain') return 'bg-rain';
  if (weatherType === 'snow') return 'bg-snow';
  if (weatherType === 'thunder') return 'bg-thunder';
  if (weatherType === 'fog') return 'bg-fog';
  if (weatherType === 'clear') return isDay ? 'bg-clear-day' : 'bg-clear-night';
  if (weatherType === 'cloudy') return isDay ? 'bg-cloudy-day' : 'bg-cloudy-night';
  return 'bg-clear-day';
}

// Create weather effects
function createWeatherEffects(weatherType) {
  const container = document.getElementById('weatherEffects');
  container.innerHTML = '';

  if (weatherType === 'rain' || weatherType === 'thunder') {
    for (let i = 0; i < 50; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
      drop.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(drop);
    }
  }

  if (weatherType === 'snow') {
    for (let i = 0; i < 30; i++) {
      const flake = document.createElement('div');
      flake.className = 'snow-flake';
      flake.innerHTML = '❄';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
      flake.style.animationDelay = Math.random() * 2 + 's';
      flake.style.fontSize = (Math.random() * 10 + 10) + 'px';
      container.appendChild(flake);
    }
  }

  if (weatherType === 'cloudy' || weatherType === 'fog') {
    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      cloud.style.width = (Math.random() * 100 + 100) + 'px';
      cloud.style.height = (Math.random() * 40 + 40) + 'px';
      cloud.style.top = (Math.random() * 30) + '%';
      cloud.style.left = (Math.random() * 80) + '%';
      cloud.style.animationDuration = (Math.random() * 10 + 15) + 's';
      cloud.style.animationDelay = (Math.random() * 5) + 's';
      container.appendChild(cloud);
    }
  }

  if (weatherType === 'thunder') {
    const lightning = document.createElement('div');
    lightning.className = 'lightning';
    container.appendChild(lightning);
  }
}

// Format date
function formatDate(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }

  showLoading(true);
  hideError();
  document.getElementById('suggestionsSection').style.display = 'none';
  document.getElementById('autocompleteList').classList.remove('active');

  try {
    // Get coordinates using Open-Meteo Geocoding API with multiple results
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      // Try to find similar cities with fuzzy search
      const fuzzyUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.substring(0, 3))}&count=10&language=en&format=json`;
      const fuzzyResponse = await fetch(fuzzyUrl);
      const fuzzyData = await fuzzyResponse.json();
      
      if (fuzzyData.results && fuzzyData.results.length > 0) {
        showDidYouMeanSuggestions(fuzzyData.results.slice(0, 5));
        throw new Error(`"${city}" not found. Try clicking one of the suggestions above or check your spelling.`);
      } else {
        throw new Error("City not found. Please check the spelling or try a different city name.");
      }
    }

    // If multiple results, show suggestions
    if (geoData.results.length > 1) {
      showDidYouMeanSuggestions(geoData.results);
    }

    // Use the first (best) result
    const { latitude, longitude, name, country, admin1 } = geoData.results[0];
    const displayLocation = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

    // Get weather data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=6`;
    
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    displayWeather(name, country, weatherData);
  } catch (error) {
    showError(error.message || "Failed to fetch weather data. Please try again.");
  } finally {
    showLoading(false);
  }
}

function displayWeather(city, country, data) {
  const current = data.current;
  const daily = data.daily;
  const weatherInfo = weatherCodes[current.weather_code] || weatherCodes[0];
  const isDay = current.is_day === 1;

  // Update background
  const bgClass = getBackgroundClass(weatherInfo.type, isDay);
  document.getElementById('bgLayer').className = `bg-layer ${bgClass}`;
  
  // Create weather effects
  createWeatherEffects(weatherInfo.type);

  // Get suggestions
  const suggestions = getSuggestions(weatherInfo.type, current.temperature_2m, current.wind_speed_10m, isDay);

  // Build HTML
  const html = `
    <div class="weather-card">
      <div class="city-name">${city}, ${country}</div>
      <div class="weather-icon-main">${weatherInfo.icon}</div>
      <div class="temperature">${Math.round(current.temperature_2m)}°C</div>
      <div class="condition-text">${weatherInfo.description}</div>
      
      <div class="weather-details">
        <div class="detail-item">
          <i class="fas fa-wind"></i>
          <div class="detail-label">Wind</div>
          <div class="detail-value">${current.wind_speed_10m} km/h</div>
        </div>
        <div class="detail-item">
          <i class="fas fa-tint"></i>
          <div class="detail-label">Humidity</div>
          <div class="detail-value">${current.relative_humidity_2m}%</div>
        </div>
        <div class="detail-item">
          <i class="fas fa-gauge-high"></i>
          <div class="detail-label">Pressure</div>
          <div class="detail-value">${current.surface_pressure} hPa</div>
        </div>
      </div>
    </div>

    <div class="suggestions-box">
      <div class="suggestions-title">
        <i class="fas fa-lightbulb"></i> Smart Suggestions
      </div>
      <ul class="suggestion-list">
        ${suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div class="forecast-section">
      <div class="forecast-title">
        <i class="fas fa-calendar-alt"></i> 5-Day Forecast
      </div>
      <div class="forecast-container">
        ${daily.time.slice(1, 6).map((time, index) => {
          const code = daily.weather_code[index + 1];
          const info = weatherCodes[code] || weatherCodes[0];
          return `
            <div class="forecast-card">
              <div class="forecast-day">${formatDate(time)}</div>
              <div class="forecast-icon">${info.icon}</div>
              <div class="forecast-temp-high">${Math.round(daily.temperature_2m_max[index + 1])}°</div>
              <div class="forecast-temp-low">${Math.round(daily.temperature_2m_min[index + 1])}°</div>
              <div class="forecast-condition">${info.description}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.getElementById("weatherContent").innerHTML = html;
}

function showLoading(show) {
  document.getElementById("loading").classList.toggle("active", show);
  if (show) {
    document.getElementById("weatherContent").style.opacity = "0.3";
  } else {
    document.getElementById("weatherContent").style.opacity = "1";
  }
}

function showError(message) {
  const errorEl = document.getElementById("errorMessage");
  document.getElementById("errorText").textContent = message;
  errorEl.classList.add("active");
  setTimeout(() => errorEl.classList.remove("active"), 8000);
}

function hideError() {
  document.getElementById("errorMessage").classList.remove("active");
}

// Event Listeners
document.getElementById("cityInput").addEventListener("input", handleInput);

document.getElementById("cityInput").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    document.getElementById('autocompleteList').classList.remove('active');
    getWeather();
  }
});

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    document.getElementById('autocompleteList').classList.remove('active');
  }
});