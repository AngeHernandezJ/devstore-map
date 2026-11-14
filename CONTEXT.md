# Project Context

## Purpose

A static browser application for searching locations and drawing, editing, and deleting polygons on an interactive map. The initial view is Mexico City at latitude 19.4326, longitude -99.1332, zoom 12. The page title is "Map with searching and polygon drawing".

This document describes the source currently present in this directory. No backend, persistence, package manifest, build pipeline, automated tests, or deployment configuration is included.

## File structure

```text
index.html          Page markup, map container, CDN dependencies, script loading
scripts/script.js   Map initialization, polygon controls, coordinate logging, search
styles/style.css    Page styles and map dimensions
CONTEXT.md          Project overview and maintenance context
```

## Stack and dependencies

- Plain HTML, CSS, and JavaScript; no framework or compilation step.
- Leaflet 1.9.4, loaded from unpkg as CSS and JavaScript; exposes the global `L` object.
- Leaflet.draw 1.0.4, loaded from cdnjs for polygon drawing and editing.
- Leaflet Control Geocoder: stylesheet pinned to 2.4.0, JavaScript loaded from an unversioned unpkg URL. The script does not explicitly configure a geocoding provider.
- OpenStreetMap raster tiles at `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with attribution and maximum zoom 19.

Internet access is required for CDN libraries, map tiles, and location searches. No API key or environment variables are configured in the source. HTML declares Spanish (`lang="es"`), while visible text mixes Spanish and English.

## Running locally

Open `index.html` in a modern browser. No installation or build step is defined. Alternatively, serve this directory with any static HTTP server. For example, if Python is installed:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. Open the browser developer console to inspect coordinate output and runtime errors. The current startup error is described below.

## Architecture and behavior

`index.html` loads library scripts in dependency order: Leaflet, Leaflet.draw, geocoder, then the local application script. The `#map` element exists before map initialization. CSS gives the map full available width and a fixed height of 500px.

All application logic is in `scripts/script.js`, without modules or a separate state layer:

1. `map` initializes the map and adds OpenStreetMap tiles.
2. `drawnItems`, an `L.FeatureGroup`, holds user-created polygons in memory.
3. `drawControl` appears at the top right. Only polygon drawing is enabled; intersecting polygons are disallowed during drawing, area display is enabled, and outlines use blue (`#2563eb`) with weight 3. Existing polygons can be edited and removed.
4. Draw-created events add a polygon to the feature group. Created, edited, and deleted events call `updateCoordinates()`.
5. `updateCoordinates()` converts the feature group to GeoJSON and logs the first polygon's outer coordinate ring.
6. The geocoder handles `markgeocode`, validates the result center, fits the result bounds when valid, or centers at zoom 15. It logs latitude and longitude and adds a marker with a popup.
7. A final `updateCoordinates()` call runs immediately on page load.

There is no save action or durable storage. Reloading clears drawn geometry and markers. Location search does not create a polygon.

## Geometry and backend integration

`drawnItems.toGeoJSON()` produces a GeoJSON FeatureCollection containing the drawn layers. The current console output selects only:

```javascript
geojson.features[0].geometry.coordinates[0]
```

This is the outer ring of the first polygon, with coordinate pairs in GeoJSON order `[longitude, latitude]`. Leaflet map initialization and marker constructors instead use `[latitude, longitude]` arrays. Preserve this distinction when adding integrations.

Multiple polygons can exist in the feature group, but the current logger ignores all except the first. No network request sends geometry to a backend. The comment addressed to a backend developer marks the current logging location as an intended integration point, not an implemented API contract.

## Known issues and limitations

- **Empty collection error:** `updateCoordinates()` accesses `features[0].geometry` without checking whether any features exist. Its initial call throws a TypeError because the feature group starts empty. Deleting the final polygon triggers the same problem. Event handlers and controls are registered before the initial failure.
- **Search marker typo:** the result marker is assigned to `searchMarkera`, while cleanup checks `searchMarker`. In the current classic script, the typo creates an unintended global and leaves `searchMarker` null, so repeated searches accumulate markers. Strict mode or module conversion would make the assignment throw instead.
- **Dependency reproducibility:** geocoder JavaScript is unpinned while its CSS is pinned; library versions can drift.
- **Limited output:** polygon coordinates appear only in the developer console; there is no visible coordinate panel, export, or persistence.
- **Unused styles:** `#coordinates` and button rules exist, but the HTML contains neither a coordinates element nor application buttons.
- No automated tests or documented validation commands are present.

These observations come from source inspection; browser behavior was not tested while preparing this document.

## Development guidance

- Keep the DOM map container and dependency load order intact.
- Follow the existing plain JavaScript and two-space HTML/CSS style unless introducing an agreed project-wide convention.
- Guard empty feature collections before reading polygon geometry.
- Decide whether a future consumer needs the first polygon, every polygon, or the complete FeatureCollection before defining an API payload.
- Use the declared `searchMarker` variable consistently when fixing marker replacement.
- Retain OpenStreetMap attribution when changing the tile layer or layout.
- Keep CDN versions consistent and explicit when updating dependencies.

## Manual validation checklist

After functional changes, serve the page and check:

- Initial map view, tile loading, layout, and browser console.
- Polygon creation, editing, deletion, and deletion of the last polygon.
- Multiple polygons and the expected coordinate output/order.
- Location search, result centering, popup display, and repeated searches replacing the prior marker once the typo is fixed.
- Search failure handling and layout at narrow viewport widths.
