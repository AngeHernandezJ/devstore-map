//initialize instance fro map with a default location and zoom
//([lat, lng], zoom)
const map = L.map("map").setView([19.4326, -99.1332], 12);

//adding tile layer
L.tileLayer(
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    //Copyright
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }
).addTo(map);

//save poligons on feature group property
const drawnItems = new L.FeatureGroup();
//saving
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  position: "topright",
//configuration parameters
  draw: {
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: {
        color: "#2563eb",
        weight: 3
      }
    },

    polyline: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
    marker: false
  },

  edit: {
    featureGroup: drawnItems,
    edit: true,
    remove: true
  }
});

map.addControl(drawControl);

//function to update coordinates every a new point for the polygon is added
function updateCoordinates() {
//build JSON to get coordinates
  const geojson = drawnItems.toGeoJSON();
//FOR BACK-END DEVELOPER: COORIDNATES ARRAY
  console.log(geojson.features[0].geometry.coordinates[0]);
    
}

//to build polygon on a layer
map.on(L.Draw.Event.CREATED, function(event) {
  const layer = event.layer;

  drawnItems.addLayer(layer);

  updateCoordinates();
});

//to be able to update polygon
map.on(L.Draw.Event.EDITED, function() {
  updateCoordinates();
});

//delete polygon
map.on(L.Draw.Event.DELETED, function() {
  updateCoordinates();
});

//
let searchMarker = null;

const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Search for an address or location...",
    errorMessage: "Location not found"
})
.on("markgeocode", function(event) {
//Object contains the info for the event
    const geoResult = event?.geocode;

    //Validate result
    if (!geoResult?.center) {
        console.warn("No valid location was found.");
        return;
    }

    //Center map on found location
    if (geoResult.bbox?.isValid()) {
        map.fitBounds(geoResult.bbox);
    } else {
        map.setView(geoResult.center, 15);
    }

    //Obtain coordinates
    const latitude = geoResult.center.lat;
    const longitude = geoResult.center.lng;

    console.log("Location found:");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    //delete last marker
    if (searchMarker) {
        map.removeLayer(searchMarker);
    }

    //add new marker
    searchMarkera = L.marker([
        latitude,
        longitude
    ])
    .addTo(map)
    .bindPopup(geoResult.name || "Location found")
    .openPopup();

})
.addTo(map);

updateCoordinates();
