let lastPosition = null;
let lastTime = null;

export function initGPS(onSpeedUpdate, onGPSStatus) {
  if (!navigator.geolocation) {
    onGPSStatus("GPS Not Supported");
    setGPSIcon("inactive");
    return null;
  }

  // Warn if not secure context (GPS hardware needs HTTPS)
  if (!window.isSecureContext) {
    console.warn(
      "⚠️ Not a secure context. GPS will use network location (low accuracy). Use HTTPS for real GPS.",
    );
    onGPSStatus("Need HTTPS for GPS");
    setGPSIcon("warning");
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 2000,
    timeout: 15000,
  };

  onGPSStatus("GPS: Searching...");
  setGPSIcon("inactive");

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      const currentTime = position.timestamp;
      const acc = coords.accuracy;

      console.log(
        `GPS raw: lat=${coords.latitude}, lon=${coords.longitude}, speed=${coords.speed}, acc=${acc}m`,
      );

      // Always accept data, but show accuracy level to user
      let speedKMH = null;

      // Source 1: Browser/OS provided speed (best source, hardware-smoothed)
      if (
        coords.speed !== null &&
        coords.speed !== undefined &&
        coords.speed >= 0
      ) {
        speedKMH = coords.speed * 3.6;
        console.log(`GPS: Using hardware speed: ${speedKMH.toFixed(1)} km/h`);
      }

      // Source 2: Manual calculation from coordinates
      if (speedKMH === null && lastPosition && lastTime) {
        const timeDiff = (currentTime - lastTime) / 1000;

        if (timeDiff >= 1) {
          const distance = calculateDistance(
            lastPosition.latitude,
            lastPosition.longitude,
            coords.latitude,
            coords.longitude,
          );

          // Only trust manual calc if accuracy is decent
          if (acc < 50 && distance > 2) {
            speedKMH = (distance / timeDiff) * 3.6;
            console.log(
              `GPS: Calculated speed: ${speedKMH.toFixed(1)} km/h (dist=${distance.toFixed(1)}m, dt=${timeDiff.toFixed(1)}s)`,
            );
          } else {
            speedKMH = 0;
          }
        }
      }

      // Cap unrealistic speeds
      if (speedKMH !== null && speedKMH > 200) {
        console.warn(
          `GPS: Unrealistic speed ${speedKMH.toFixed(0)} km/h, capping`,
        );
        speedKMH = null; // Discard, don't update display
      }

      // Update display
      if (speedKMH !== null) {
        const finalSpeed = Math.max(0, Math.round(speedKMH));
        onSpeedUpdate(finalSpeed);
      }

      // Update status indicator
      if (acc <= 10) {
        onGPSStatus(`GPS: Excellent (${acc.toFixed(0)}m)`);
        setGPSIcon("active");
      } else if (acc <= 50) {
        onGPSStatus(`GPS: Good (${acc.toFixed(0)}m)`);
        setGPSIcon("active");
      } else if (acc <= 200) {
        onGPSStatus(`GPS: Fair (${acc.toFixed(0)}m)`);
        setGPSIcon("warning");
      } else {
        onGPSStatus(`GPS: Weak (${acc.toFixed(0)}m)`);
        setGPSIcon("warning");
      }

      // Always store position for next calculation
      lastPosition = coords;
      lastTime = currentTime;
    },
    (err) => {
      console.error("GPS Error:", err);
      setGPSIcon("inactive");

      let msg = "GPS Error";
      if (err.code === 1) msg = "Location Denied";
      if (err.code === 2) msg = "No GPS Signal";
      if (err.code === 3) msg = "GPS Timeout";
      onGPSStatus(msg);
    },
    options,
  );

  return watchId;
}

function setGPSIcon(state) {
  const icon = document.getElementById("gpsIcon");
  if (icon) icon.className = `gps-icon ${state}`;
}

// Haversine formula - distance between two lat/lon points in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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
