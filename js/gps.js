export function initGPS(onSpeedUpdate, onGPSStatus) {
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
      // Speed is in m/s, convert to mph
      const speedMS = position.coords.speed || 0;
      const speedMPH = Math.round(speedMS * 2.23694);
      onSpeedUpdate(speedMPH);
      const accuracy = position.coords.accuracy.toFixed(1);
      onGPSStatus(`GPS: Locked (${accuracy}m)`);
    },
    (err) => {
      onGPSStatus("GPS Error: " + err.message);
    },
    options,
  );

  return watchId;
}
