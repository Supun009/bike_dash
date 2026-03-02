let lastPosition = null;
let lastTime = null;

export function initGPS(onSpeedUpdate, onGPSStatus) {
  // Relaxing secure context check slightly for development but keeping warning
  if (!window.isSecureContext && window.location.protocol !== "file:") {
    onGPSStatus("GPS Fix: Use HTTPS");
    console.warn("GPS tracking usually requires HTTPS.");
  }

  if (!navigator.geolocation) {
    onGPSStatus("GPS Not Supported");
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 0, // Force fresh data
    timeout: 10000, // Longer timeout for initial lock
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      const currentTime = position.timestamp;

      // Source 1: Browser provided speed
      let speedKMH =
        coords.speed !== null && coords.speed !== undefined
          ? coords.speed * 3.6
          : null;

      // Source 2: Manual calculation fallback (Distance / Time)
      if (speedKMH === null && lastPosition && lastTime) {
        const distance = calculateDistance(
          lastPosition.latitude,
          lastPosition.longitude,
          coords.latitude,
          coords.longitude,
        );
        const timeDiff = (currentTime - lastTime) / 1000; // in seconds
        if (timeDiff > 0) {
          const calculatedSpeedMS = distance / timeDiff;
          // Filter out noise (only use if distance moved > 2m)
          if (distance > 2) {
            speedKMH = calculatedSpeedMS * 3.6;
          } else {
            speedKMH = 0;
          }
        }
      }

      // Default to 0 if everything fails
      const finalSpeed = Math.max(0, Math.round(speedKMH || 0));

      console.log(`GPS: ${finalSpeed} km/h (Acc: ${coords.accuracy}m)`);

      onSpeedUpdate(finalSpeed);
      onGPSStatus(`GPS: Locked (${coords.accuracy.toFixed(0)}m)`);

      lastPosition = coords;
      lastTime = currentTime;
    },
    (err) => {
      console.error("GPS Error:", err);
      let msg = "GPS Error";
      if (err.code === 1) msg = "Location Access Denied";
      if (err.code === 2) msg = "Position Unavailable";
      if (err.code === 3) msg = "GPS Timeout";
      onGPSStatus(msg);
    },
    options,
  );

  return watchId;
}

// Distance calculation using Haversine formula (returns meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
