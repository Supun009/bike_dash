export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
export const CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export async function connectBLE() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: "Bike_Dashboard_BLE" }],
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const char = await service.getCharacteristic(CHAR_UUID);
    return char;
  } catch (err) {
    throw err;
  }
}

export function parseBLEData(value) {
  const str = new TextDecoder().decode(value);
  const [rpm, temp, volt] = str.split(",");
  return {
    rpm: parseInt(rpm) || 0,
    temp: parseFloat(temp) || 0.0,
    volt: parseFloat(volt) || 0.0,
  };
}
