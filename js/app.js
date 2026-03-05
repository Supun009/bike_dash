import { connectBLE, parseBLEData } from "./ble.js";
import { initGPS } from "./gps.js";
import * as ui from "./ui.js";

const connectBtn = document.getElementById("connectBtn");

async function handleConnect() {
  try {
    const char = await connectBLE();

    connectBtn.innerText = "CONNECTED";
    connectBtn.style.borderColor = "var(--accent-green)";
    connectBtn.style.color = "var(--accent-green)";

    char.startNotifications();
    char.addEventListener("characteristicvaluechanged", (e) => {
      const data = parseBLEData(e.target.value);
      ui.updateUI(data);
    });
  } catch (err) {
    console.error(err);
    alert("Bluetooth Connection Failed: " + err.message);
  }
}

connectBtn.addEventListener("click", handleConnect);

// --- Initialize Global Logic ---
setInterval(ui.updateClock, 1000);
ui.updateClock();

console.log("Playing startup sequence...");
ui.playStartupAnimation();

console.log("Initializing GPS tracking...");
initGPS(
  (speed) => ui.updateSpeedDisplay(speed),
  (status) => ui.updateGPSStatus(status),
);
