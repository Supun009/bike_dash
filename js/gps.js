export function initGPS(onSpeedUpdate, onGPSStatus) {
  if (!window.isSecureContext) {
    onGPSStatus("GPS Blocked: Needs HTTPS/Localhost");
    console.warn(
      "GPS tracking requires a secure context (HTTPS or localhost).",
    );
    return;
  }

  if (!navigator.geolocation) {
    onGPSStatus("GPS Not Supported");
    return;
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 5000,
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      // Speed is in m/s, convert to km/h (1 m/s = 3.6 km/h)
      const speedMS = position.coords.speed;

      // Handle null/null speed (common when stationary or indoors)
      const speedKMH =
        speedMS !== null && speedMS !== undefined
          ? Math.round(speedMS * 3.6)
          : 0;

      console.log(
        `GPS Update: Raw=${speedMS}, KMH=${speedKMH}, Acc=${position.coords.accuracy}`,
      );

      onSpeedUpdate(speedKMH);
      const accuracy = position.coords.accuracy.toFixed(1);
      onGPSStatus(`GPS: Locked (${accuracy}m)`);
    },
    (err) => {
      console.error("GPS Error:", err);
      onGPSStatus("GPS Error: " + err.message);
    },
    options,
  );

  return watchId;
}
