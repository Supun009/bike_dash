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

      const gpsIcon = document.getElementById("gpsIcon");

      // Relaxed accuracy check (skip if horizontal error > 100m)
      if (coords.accuracy > 100) {
        console.warn(`GPS: Poor accuracy (${coords.accuracy}m)`);
        onGPSStatus(`Low Acc (${coords.accuracy.toFixed(0)}m)`);
        if (gpsIcon) {
          gpsIcon.className = "gps-icon warning";
        }
        return;
      }

      if (gpsIcon) {
        gpsIcon.className = "gps-icon active";
      }

      // Source 1: Browser provided speed (Smoothed by OS/Hardware)
      let speedKMH =
        coords.speed !== null && coords.speed !== undefined && coords.speed >= 0
          ? coords.speed * 3.6
          : null;

      // Source 2: Manual calculation fallback
      if (speedKMH === null && lastPosition && lastTime) {
        const timeDiff = (currentTime - lastTime) / 1000; // in seconds

        // Only calculate if at least 1 second has passed to reduce jitter impact
        if (timeDiff >= 1) {
          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            coords.latitude,
            coords.longitude,
          );

          const calculatedSpeedMS = distance / timeDiff;

          // Only update if moved more than 3 meters (filtering GPS "drift")
          if (distance > 3) {
            speedKMH = calculatedSpeedMS * 3.6;
          } else {
            speedKMH = 0;
          }
        } else {
          // Not enough time passed, keep current speed or wait
          return;
        }
      }

      // Safety Cap: Bikes rarely go 200+ km/h. Clip unrealistic jumps.
      if (speedKMH > 199) speedKMH = 0;

      const finalSpeed = Math.max(0, Math.round(speedKMH || 0));

      console.log(`GPS: ${finalSpeed} km/h (Acc: ${coords.accuracy}m)`);

      onSpeedUpdate(finalSpeed);
      onGPSStatus(`GPS: Locked (${coords.accuracy.toFixed(0)}m)`);

      lastPosition = coords;
      lastTime = currentTime;
    },
    (err) => {
      console.error("GPS Error:", err);
      const gpsIcon = document.getElementById("gpsIcon");
      if (gpsIcon) gpsIcon.className = "gps-icon inactive";

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
