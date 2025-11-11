import React, { useEffect, useState, useRef } from "react";
import "./styles.css";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const DEFAULT_CITY = "Kolkata";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export default function WeatherDashboard() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);


  const fetchWeather = async (requestedCity = city) => {
    if (!API_KEY) {
      setError("Missing API key. Add it to your .env file.");
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${requestedCity}&units=metric&appid=${API_KEY}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      const json = await res.json();

      setData({
        city: json.name,
        country: json.sys?.country,
        temperature: Math.round(json.main?.temp),
        description: json.weather?.[0]?.description,
        main: json.weather?.[0]?.main, // main condition
        iconCode: json.weather?.[0]?.icon,
        humidity: json.main?.humidity,
        windSpeed: json.wind?.speed,
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchWeather(city);
    intervalRef.current = setInterval(() => fetchWeather(city), REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);


  useEffect(() => {
    if (data?.temperature) {
      const prev = document.title;
      document.title = `${data.temperature}°C — ${data.city}`;
      return () => (document.title = prev);
    }
  }, [data]);


  const handleSubmit = (e) => {
    e.preventDefault();
    const newCity = e.target.cityInput.value.trim();
    if (newCity) {
      setCity(newCity);
      fetchWeather(newCity);
    }
  };


  const handleRefresh = () => fetchWeather(city);

  const getBackgroundClass = () => {
    if (!data?.main) return "bg-default";
    const main = data.main.toLowerCase();
    if (main.includes("clear")) return "bg-sunny";
    if (main.includes("cloud")) return "bg-cloudy";
    if (main.includes("rain") || main.includes("drizzle")) return "bg-rainy";
    if (main.includes("snow")) return "bg-snowy";
    if (main.includes("thunder")) return "bg-stormy";
    return "bg-default";
  };

  const iconUrl = data?.iconCode
    ? `https://openweathermap.org/img/wn/${data.iconCode}@2x.png`
    : null;

  return (
    <div className={`weather-page ${getBackgroundClass()}`}>
      <div className="weather-container">
        <h1 className="title">Weather Dashboard</h1>

        <form onSubmit={handleSubmit} className="city-form">
          <input
            name="cityInput"
            defaultValue={city}
            className="city-input"
            placeholder="Enter city (e.g., Mumbai)"
          />
          <button type="submit" className="btn">
            Get
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn secondary"
          >
            Refresh
          </button>
        </form>

        {loading && (
          <div className="spinner">
            <div className="spinner-dot"></div>
            <div>Loading weather...</div>
          </div>
        )}

        {error && <div className="error-box">Error: {error}</div>}

        {!loading && !error && data && (
          <div className="weather-card">
            <div className="card-top">
              <div className="location">
                <h2>
                  {data.city}
                  {data.country ? `, ${data.country}` : ""}
                </h2>
              </div>
              {iconUrl && <img src={iconUrl} alt={data.description} className="weather-icon" />}
              <div className="temp">{data.temperature}°C</div>
            </div>

            <div className="description">{data.description}</div>

            <div className="extra">
              <div>Humidity: {data.humidity}%</div>
              <div>Wind: {data.windSpeed} m/s</div>
            </div>

            <div className="note">Auto-refreshes every 5 minutes</div>
          </div>
        )}
      </div>
    </div>
  );
}
