# Plan 08 — Transport: pilih lokasi dengan Leaflet (realtime)

Goal: the transport flow starts with a **map**: the customer picks the pickup point
(or "lokasi saya"), then the dropoff, confirms, and only then the booking form opens.

## Scope
- `npm i leaflet react-leaflet` (done).
- `src/components/transport/LocationPicker.tsx` (client) — a Leaflet map with:
  - a click-to-pick map, a "Gunakan lokasi saya" button (`navigator.geolocation`),
  - the two markers (pickup / dropoff) and a search field for the address.
- `src/app/transport/pickup/page.tsx` — step 1 of the flow: the map + the two inputs.
  "Lanjut" is enabled only when both points are set; it goes to
  `/transport/booking?pickup=…&dropoff=…`.
- `src/app/transport/booking/page.tsx` — step 2: date/time, passengers, the vehicle and
  the notes, then "Konfirmasi" → a booking action (reuse the existing booking action
  where possible, otherwise a "coming soon" confirmation).
- The marker icons use our own inline SVG / a div icon (no extra image files).

## Done when
- The map loads, a click drops a marker, "Gunakan lokasi saya" fills the pickup, and
  "Lanjut" hands the two coordinates over to the next step.
