import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [unit, setUnit] = useState('metric');
  const apiKey = 'cad370ba2f3422c7fa72acb77f314c22'; 

  const backendUrl = 'http://localhost:5000/api'; 


  const fetchCitySuggestions = async (cityName) => {
    if (cityName.length < 3) {
      setSuggestions([]); 
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/find?q=${cityName}&appid=${apiKey}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.list || []);
    } catch (err) {
      console.error("Error fetching city suggestions:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchSearchHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/getSearchHistory`);
      const data = await response.json();
      setSearchHistory(data);
    } catch (err) {
      console.error("Error fetching search history:", err);
    }
  };

  useEffect(() => {
    fetchSearchHistory(); 
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    fetchCitySuggestions(value);
  };


  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=${unit}` 
      );
      const data = await response.json();
      
      if (data.cod !== 200) {
        setError('City not found');
        setWeather(null);
        return;
      }

      setWeather(data);

  
      const newHistory = [...searchHistory, { city_name: cityName, timestamp: new Date() }];
      setSearchHistory(newHistory);


      await fetch(`${backendUrl}/saveSearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city_name: cityName }),
      });
    } catch (err) {
      setError('City not found');
      console.error('Error fetching weather data:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion.name);
    setSuggestions([]); 
    fetchWeather(suggestion.name);
  };


  const handleSearch = () => {
    if (city) {
      fetchWeather(city);
    }
  };

  
  const handleClearHistory = async () => {
    
    setSearchHistory([]);

   
    try {
      const response = await fetch(`${backendUrl}/clearHistory`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Search history cleared.');
      } else {
        console.error('Failed to clear search history');
      }
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  };

  const toggleUnit = () => {
    setUnit((prevUnit) => (prevUnit === 'metric' ? 'imperial' : 'metric'));
  };

  const convertTemperature = (temp, unit) => {
    if (unit === 'metric') {
      return temp; // Celsius
    }
    return (temp * 9/5) + 32; // Convert to Fahrenheit
  };

  return (
    <div className="app">
      <div className="weather-container">
        <h1 className="app-title">Weather App</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={handleInputChange}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {suggestions.length > 0 && (
          <ul className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.name}
                {suggestion.sys && suggestion.sys.country && `, ${suggestion.sys.country}`}
              </li>
            ))}
          </ul>
        )}

        {searchHistory.length > 0 && (
          <div className="history-section">
            <div className="history-box">
              <h3>Search History</h3>
              <button onClick={handleClearHistory} className="clear-history">
                Clear History
              </button>
            </div>

            <div className="history-list">
              {searchHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <p>
                    <strong>{item.city_name}</strong> - {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}

        {weather && (
          <div className="weather-info">
            <div className="weather-card">
              <h3 className="city-container">
                <span>{weather.name}</span>
                <button onClick={toggleUnit} className="unit-toggle">
                  {unit === 'metric' ? 'Switch to °F' : 'Switch to °C'}
                </button>
              </h3>
              <div className="weather-details">
                <div className="temperature">
                  <span className="temp-value">
                    {convertTemperature(weather.main.temp, unit)}°{unit === 'metric' ? 'C' : 'F'}
                  </span>
                  <span className="temp-label">Temperature</span>
                </div>
                <div className="humidity">
                  <span className="humidity-value">{weather.main.humidity}%</span>
                  <span className="humidity-label">Humidity</span>
                </div>
                <div className="wind-speed">
                  <span className="wind-speed-value">{weather.wind.speed} m/s</span>
                  <span className="wind-speed-label">Wind Speed</span>
                </div>
                <div className="weather-description">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
                    alt={weather.weather[0].description}
                    className="weather-icon"
                  />
                  <span>{weather.weather[0].description}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
