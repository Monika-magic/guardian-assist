import type { Coords } from "./sasn-store";

export function getCurrentLocation(): Promise<Coords> {
  return new Promise((resolve) => {
    const fallback: Coords = { lat: 28.6139, lng: 77.2090, ts: Date.now() }; // New Delhi
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return resolve(fallback);
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

export function driftCoords(c: Coords): Coords {
  // simulate small movement (~5-15m)
  const dLat = (Math.random() - 0.5) * 0.0002;
  const dLng = (Math.random() - 0.5) * 0.0002;
  return { lat: c.lat + dLat, lng: c.lng + dLng, ts: Date.now() };
}

export const mapsUrl = (c: Coords) => `https://www.google.com/maps?q=${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
