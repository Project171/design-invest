$(function () {
    // Constants for map and city bubble styles
    const MAP_FILL_COLOR = '#9db943';
    const MAP_BORDER_COLOR = '#ffffff';
    const MAP_BORDER_WIDTH = 1;
    const CITY_HIGHLIGHT_FILL = '#cb5b5b';
    const CITY_HIGHLIGHT_BORDER = '#ffffff';
    const CITY_HIGHLIGHT_BORDER_WIDTH = 3;

    // Function to set up the map projection
    function setMapProjection(element) {
        var projection = d3.geo.mercator()
            .center([-95, 71])
            .scale(250)
            .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
        return {path: d3.geo.path().projection(projection), projection: projection};
    }

    // Load the TopoJSON file for the map
    d3.json("data/canada.topo.json", function (error, canadaMapData) {
        if (error) return console.error("Error loading Canada topo data:", error);

        // Render Canada map with static subunits
        var canadaMap = new Datamap({
            element: document.getElementById('canada'),
            geographyConfig: {
                dataJson: canadaMapData,
                popupTemplate: () => null, // Disable tooltips for map subunits
                highlightFillColor: MAP_FILL_COLOR,
                highlightBorderColor: MAP_BORDER_COLOR,
                borderColor: MAP_BORDER_COLOR,
                borderWidth: MAP_BORDER_WIDTH,
                highlightBorderWidth: MAP_BORDER_WIDTH
            },
            scope: 'canada',
            fills: {defaultFill: MAP_FILL_COLOR},
            setProjection: setMapProjection
        });

        // Load and process the GeoJSON file for cities
        d3.json("data/filtered_file.json", function (error, citiesData) {
            if (error) return console.error("Error loading cities data:", error);

            // Prepare city bubbles data
            var bubblesData = citiesData.features.map(feature => {
                let coords = feature.geometry.coordinates[0][0][0];
                return {
                    latitude: coords[1],
                    longitude: coords[0],
                    radius: 10,
                    city: feature.properties.NAME_3,
                    highlightFillColor: CITY_HIGHLIGHT_FILL,
                    highlightBorderColor: CITY_HIGHLIGHT_BORDER,
                    highlightBorderWidth: CITY_HIGHLIGHT_BORDER_WIDTH
                };
            });

            // Add dynamic city bubbles to the map
            canadaMap.bubbles(bubblesData, {
                popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>Market:  ${data.city}</strong></div>`,
                highlightFillColor: CITY_HIGHLIGHT_FILL,
                highlightBorderColor: CITY_HIGHLIGHT_BORDER,
                highlightBorderWidth: CITY_HIGHLIGHT_BORDER_WIDTH
            });
        });
    });
});