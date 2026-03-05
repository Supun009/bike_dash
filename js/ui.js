const fillPath = document.getElementById("rpm-path-fill");
const totalLength = fillPath.getTotalLength();
fillPath.style.strokeDasharray = totalLength;
// Set needle to zero immediately with no transition to avoid load flash
fillPath.style.transition = "none";
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

let smoothedRPM = 0;
let isAnimatingStartup = false;

export function playStartupAnimation() {
  isAnimatingStartup = true;
  const maxRPM = 14000;
  const duration = 1800; // sweep up and down

  // Wait 600ms before starting so the page settles
  setTimeout(() => {
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear 0->1->0 with ease-in-out applied
      let sweepProgress;
      if (progress < 0.5) {
        sweepProgress = progress * 2;
      } else {
        sweepProgress = 1 - (progress - 0.5) * 2;
      }
      const easedProgress =
        sweepProgress < 0.5
          ? 2 * sweepProgress * sweepProgress
          : 1 - Math.pow(-2 * sweepProgress + 2, 2) / 2;

      const targetRPM = easedProgress * maxRPM;

      // No CSS transition during JS-driven animation
      fillPath.style.transition = "none";
      updateRPMSVG(targetRPM, true);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation done: snap to zero, then enable smooth transitions for live data
        isAnimatingStartup = false;
        smoothedRPM = 0;
        fillPath.style.strokeDashoffset = totalLength;
        setTimeout(() => {
          fillPath.style.transition =
            "stroke-dashoffset 0.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease";
        }, 50);
      }
    }

    requestAnimationFrame(animate);
  }, 600);
}

export function updateRPMSVG(rpm, force = false) {
  if (isAnimatingStartup && !force) return;

  // Max RPM in UI is 14000
  const maxRPM = 14000;

  // Bypass smoothing during forced animations (like startup sequence)
  if (force) {
    smoothedRPM = rpm;
  } else {
    const smoothingFactor = 0.3;
    smoothedRPM = smoothedRPM + (rpm - smoothedRPM) * smoothingFactor;
  }

  const ratio = Math.min(smoothedRPM / maxRPM, 1);
  const offset = totalLength - totalLength * ratio;
  fillPath.style.strokeDashoffset = offset;

  // Color change near redline based on actual rpm for immediate warning
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
