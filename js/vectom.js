// Initialize the map and set its view to Canada's approximate geographic center
var map = L.map('map').setView([49.1304, -97.1384], 4); // Latitude, Longitude, Zoom Level

// Add OpenStreetMap tiles to your map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define city coordinates
var cities = [
    {"name": "Vancouver", "coords": [49.2827, -123.1207]},
    {"name": "Edmonton", "coords": [53.5461, -113.4938]},
    {"name": "Calgary", "coords": [51.0447, -114.0719]},
    {"name": "Toronto", "coords": [43.6532, -79.3832]},
    {"name": "Ottawa", "coords": [45.4215, -75.6972]},
    {"name": "Montréal", "coords": [45.5017, -73.5673]}
];

// Add markers for each city
cities.forEach(function(city) {
    L.marker(city.coords)
        .bindPopup(city.name)
        .addTo(map);
});
