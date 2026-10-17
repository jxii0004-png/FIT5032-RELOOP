export const mapToken = import.meta.env.VITE_MAPBOX_TOKEN || "";
export const melbourneBounds = [144.4, -38.5, 145.8, -37.3];
export function inServiceArea(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) return false;
  const [lng, lat] = coordinates;
  return lng >= melbourneBounds[0] && lng <= melbourneBounds[2] && lat >= melbourneBounds[1] && lat <= melbourneBounds[3];
}
async function request(url, signal) {
  if (!mapToken.startsWith("pk.")) throw new Error("Maps are awaiting service setup.");
  const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Map access was denied. Please contact the administrator." : "Map service is unavailable. Please try again later.");
  return response.json();
}
export async function geocodeAddress(address, signal) {
  const params = new URLSearchParams({ q: address, access_token: mapToken, country: "au", bbox: melbourneBounds.join(","), autocomplete: "false", limit: "1" });
  const data = await request(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, signal);
  return (data.features || []).map((feature) => ({
    label: feature.properties.full_address || feature.properties.name,
    coordinates: feature.geometry.coordinates,
  })).filter((entry) => inServiceArea(entry.coordinates));
}
export async function getRoute(start, end, signal) {
  if (!inServiceArea(start) || !inServiceArea(end)) throw new Error("Choose an origin and destination within the Melbourne service area.");
  const params = new URLSearchParams({ access_token: mapToken, geometries: "geojson", overview: "full", alternatives: "false", steps: "true" });
  const data = await request(`https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(",")};${end.join(",")}?${params}`, signal);
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) throw new Error("No route was found for these addresses. Try another starting address.");
  return { geometry: route.geometry, distance: route.distance, duration: route.duration, steps: route.legs.flatMap((leg) => leg.steps.map((step) => step.maneuver.instruction)) };
}
export function filterLocations(locations, text, material) {
  const term = text.trim().toLowerCase();
  return locations.filter((location) => (!material || location.materials.includes(material)) && `${location.name} ${location.address}`.toLowerCase().includes(term));
}
