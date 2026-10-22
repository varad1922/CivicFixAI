/**
 * CivicFix AI — Integrated Google Maps & Geocoding Service
 * Uses Google Maps Platform API with fallback to OpenStreetMap Nominatim
 */

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC3yAJy67DmQJ2bZpJRHIu5rOO2WFuFs-A';

/**
 * Reverse geocodes latitude and longitude coordinates into a human-readable address.
 * Attempts Google Maps Geocoding API first, falls back to Nominatim if billing is unconfigured.
 */
export const reverseGeocode = async (lat, lng) => {
  if (lat == null || lng == null) return '';

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return '';

  // 1. Try Google Maps Geocoding API with configured key
  if (GOOGLE_MAPS_KEY) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latNum},${lngNum}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(gUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      }
    } catch (err) {
      console.warn('Google Geocoding request failed, trying fallback:', err.message);
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim reverse geocoding
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}`;
    const res = await fetch(nomUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CivicFixAI/1.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        // Create concise address summary from road, suburb, city
        const a = data.address || {};
        const parts = [
          a.road || a.pedestrian || a.suburb,
          a.neighbourhood || a.city_district || a.subdistrict,
          a.city || a.town || a.county,
          a.state
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding fallback failed:', err.message);
  }

  // 3. Coordinate string fallback
  return `GPS: ${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
};

/**
 * Returns Leaflet TileLayer configuration options
 */
export const MAP_LAYERS = {
  DARK_CARTO: {
    id: 'dark',
    name: 'Dark Neon (Default)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 20
  },
  GOOGLE_ROAD: {
    id: 'google_road',
    name: 'Google Roadmap',
    url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; Google Maps',
    subdomains: '0123',
    maxZoom: 20
  },
  GOOGLE_SATELLITE: {
    id: 'google_sat',
    name: 'Google Satellite',
    url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
    attribution: '&copy; Google Maps Satellite',
    subdomains: '0123',
    maxZoom: 20
  }
};
