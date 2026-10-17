<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { recyclingLocations } from "../data/recyclingLocations";
import { filterLocations, geocodeAddress, getRoute, mapToken } from "../services/maps";

import { focusElement } from "../services/accessibility";

const mapElement = ref(null);
const text = ref("");
const material = ref("");
const destination = ref("");
const address = ref("");
const route = ref(null);
const error = ref("");
const errorField = ref("");
const mapError = ref("");
const busy = ref(false);
const ready = ref(false);
const configured = mapToken.startsWith("pk.");
const locations = ref(recyclingLocations);
const visible = computed(() => filterLocations(locations.value, text.value, material.value));
const materials = [...new Set(recyclingLocations.flatMap((location) => location.materials))].sort();
const controller = new AbortController();
let map;
let markers = [];
let startMarker;

function clearRoute() {
  route.value = null;
  startMarker?.remove();
  if (map?.getSource("route")) map.getSource("route").setData({ type: "FeatureCollection", features: [] });
}
function showLocations() {
  markers.forEach((marker) => marker.remove());
  markers = visible.value.filter((location) => location.coordinates).map((location) => {
    const marker = new mapboxgl.Marker({ color: "#198754" }).setLngLat(location.coordinates)
      .setPopup(new mapboxgl.Popup().setText(location.name)).addTo(map);
    marker.getElement().setAttribute("aria-label", location.name);
    return marker;
  });
}
watch([text, material], () => {
  if (!visible.value.some((location) => location.id === destination.value)) destination.value = "";
  if (ready.value) showLocations();
});
watch([address, destination], clearRoute);

async function planRoute() {
  if (busy.value || !ready.value) return;
  clearRoute();
  error.value = "";
  errorField.value = "";
  if (address.value.trim().length < 3 || !destination.value) {
    error.value = "Enter a starting address and select a destination.";
    errorField.value = address.value.trim().length < 3 ? "start" : "destination";
    focusElement(errorField.value);
    return;
  }
  busy.value = true;
  try {
    const [start] = await geocodeAddress(address.value.trim(), controller.signal);
    if (!start) throw new Error("Starting address not found in Melbourne. Try a more specific address.");
    const end = locations.value.find((location) => location.id === destination.value);
    const result = await getRoute(start.coordinates, end.coordinates, controller.signal);
    if (controller.signal.aborted) return;
    route.value = { ...result, start: start.label };
    focusElement("route-summary");
    startMarker = new mapboxgl.Marker({ color: "#2455a4" }).setLngLat(start.coordinates).addTo(map);
    startMarker.getElement().setAttribute("role", "img");
    startMarker.getElement().setAttribute("aria-label", `Starting point: ${start.label}`);
    const data = { type: "Feature", properties: {}, geometry: result.geometry };
    if (map.getSource("route")) map.getSource("route").setData(data);
    else {
      map.addSource("route", { type: "geojson", data });
      map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#2455a4", "line-width": 5 } });
    }
    const bounds = new mapboxgl.LngLatBounds();
    result.geometry.coordinates.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { padding: 40, maxZoom: 15, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  } catch (cause) { if (!controller.signal.aborted) { error.value = cause.message; focusElement("route-error"); } }
  finally { busy.value = false; }
}

onMounted(() => {
  if (!configured) return;
  busy.value = true;
  try {
    map = new mapboxgl.Map({ container: mapElement.value, accessToken: mapToken, style: "mapbox://styles/mapbox/streets-v12", center: [145.08, -37.82], zoom: 10 });
    map.on("error", () => { mapError.value = "Map could not load. Check your connection or map token."; if (!ready.value) busy.value = false; });
    map.on("load", async () => {
      try {
        const results = await Promise.all(recyclingLocations.map(async (location) => {
          const [match] = await geocodeAddress(location.address, controller.signal);
          return { ...location, coordinates: match?.coordinates };
        }));
        if (controller.signal.aborted) return;
        locations.value = results;
        ready.value = true;
        showLocations();
        if (results.some((location) => !location.coordinates)) error.value = "Some destinations could not be located. Refresh to retry.";
      } catch (cause) { if (!controller.signal.aborted) error.value = cause.message; }
      finally { busy.value = false; }
    });
  } catch { mapError.value = "Map display is unavailable on this device."; busy.value = false; }
});
onUnmounted(() => { controller.abort(); map?.remove(); });
</script>

<template>
  <main id="main-content" tabindex="-1" class="container py-4">
    <h1>Recycling locations</h1>
    <p>Find a drop-off centre and get a driving route.</p>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label for="location-search" class="form-label">Location or suburb</label><input id="location-search" v-model="text" type="search" class="form-control" :disabled="busy" placeholder="Camberwell or Kew" /></div>
      <div class="col-md-6"><label for="material" class="form-label">Material</label><select id="material" v-model="material" class="form-select" :disabled="busy"><option value="">All materials</option><option v-for="entry in materials" :key="entry">{{ entry }}</option></select></div>
    </div>
    <p v-if="!configured" class="alert alert-warning">Map service is not configured yet.</p>
    <p v-if="mapError" class="alert alert-warning" role="alert">{{ mapError }}</p>
    <div v-if="configured" ref="mapElement" class="map border mb-3" role="region" aria-label="Recycling location map" aria-describedby="map-help"></div>
    <p id="map-help" class="small">The list and destination selector provide the same locations without using the map. Use Tab to move past map controls.</p>
    <p v-if="!visible.length" role="status">No matching locations. Change your search or material.</p>
    <ul class="mb-4">
      <li v-for="location in visible" :key="location.id" class="mb-2">
        <strong>{{ location.name }}</strong> — {{ location.address }}<br />
        {{ location.materials.join(', ') }} · <a :href="location.source" target="_blank" rel="noopener noreferrer">Council details<span class="visually-hidden"> for {{ location.name }} (opens in a new tab)</span></a>
      </li>
    </ul>
    <form novalidate :aria-busy="busy" @submit.prevent="planRoute">
      <p>Starting address and destination are required.</p>
      <fieldset :disabled="busy || !ready">
        <legend class="h4">Driving route</legend>
        <label for="start" class="form-label">Starting address</label>
        <input id="start" required :aria-invalid="errorField === 'start'" :aria-describedby="errorField === 'start' ? 'route-error' : undefined" v-model="address" maxlength="200" class="form-control mb-3" placeholder="Street address or suburb in Melbourne" />
        <label for="destination" class="form-label">Destination</label>
        <select id="destination" required :aria-invalid="errorField === 'destination'" :aria-describedby="errorField === 'destination' ? 'route-error' : undefined" v-model="destination" class="form-select mb-3"><option value="">Select a recycling centre</option><option v-for="location in visible" :key="location.id" :value="location.id" :disabled="!location.coordinates">{{ location.name }}</option></select>
        <button type="submit" class="btn btn-success">Get route</button>
      </fieldset>
    </form>
    <p v-if="busy" class="mt-3" role="status">Loading…</p>
    <p v-if="error" id="route-error" tabindex="-1" class="alert alert-warning mt-3" role="alert">{{ error }}</p>
    <p v-if="route" id="route-summary" tabindex="-1" class="mt-3" role="status"><strong>{{ (route.distance / 1000).toFixed(1) }} km · about {{ Math.max(1, Math.round(route.duration / 60)) }} minutes</strong><br />From: {{ route.start }}</p>
    <details v-if="route" class="mt-3"><summary>Written driving directions</summary><ol><li v-for="(step, index) in route.steps" :key="index">{{ step }}</li></ol></details>
    <p class="small text-secondary mt-4">Addresses are sent to Mapbox for routing. Check the matched starting address and council details before travelling; fees and acceptance limits may apply. Route times are estimates. Pins are address matches, not verified entrances.</p>
  </main>
</template>

<style scoped>
.map { height: 350px; }
</style>
