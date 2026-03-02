const fillPath = document.getElementById("rpm-path-fill");
const totalLength = fillPath.getTotalLength();
fillPath.style.strokeDasharray = totalLength;
fillPath.style.strokeDashoffset = totalLength;

export function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  document.getElementById("time").innerText = `${hours}:${minutes} ${ampm}`;
}

export function updateUI(data) {
  // RPM Logic
  updateRPMSVG(data.rpm);

  // Temperature Logic
  const tempElement = document.getElementById("temp");
  const fanWarning = document.getElementById("fanWarning");
  tempElement.innerText = data.temp.toFixed(1);

  // Remove existing color classes
  tempElement.classList.remove("glow-blue", "glow-green", "glow-red");

  if (data.temp < 75) {
    tempElement.classList.add("glow-blue");
    fanWarning.classList.add("hidden");
  } else if (data.temp >= 75 && data.temp <= 110) {
    tempElement.classList.add("glow-green");
    fanWarning.classList.remove("hidden"); // FAN ON warning at 75+
  } else {
    tempElement.classList.add("glow-red");
    fanWarning.classList.remove("hidden");
  }

  // Voltage Logic
  document.getElementById("volt").innerText = data.volt.toFixed(1);
  const voltElement = document.getElementById("volt");
  if (data.volt < 11.5) {
    voltElement.classList.add("glow-red");
  } else {
    voltElement.classList.remove("glow-red");
  }
}

export function updateRPMSVG(rpm) {
  // Max RPM in UI is 14000
  const maxRPM = 14000;
  const ratio = Math.min(rpm / maxRPM, 1);
  const offset = totalLength - totalLength * ratio;
  fillPath.style.strokeDashoffset = offset;

  // Color change near redline
  if (rpm > 12000) {
    fillPath.style.stroke = "var(--accent-red)";
  } else {
    fillPath.style.stroke = "var(--accent-cyan)";
  }
}

export function updateSpeedDisplay(speed) {
  document.getElementById("speed").innerText = speed;
}

export function updateGPSStatus(status) {
  document.getElementById("gpsStatus").innerText = status;
}
