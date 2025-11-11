import React from "react";
import WeatherDashboard from "./WeatherDashboard";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <WeatherDashboard />
    </div>
  );
}
