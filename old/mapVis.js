class MapVis {
    constructor(_parentElement, _officeData, _geoData, _citiesData, _industrialData, _multifamilyData, _retailData) {
        this.parentElement = _parentElement;
        this.officeData = _officeData;
        this.geoData = _geoData;
        this.citiesData = _citiesData;
        this.industrialData = _industrialData;
        this.multifamilyData = _multifamilyData;
        this.retailData = _retailData;
        this.selectedCity = "";
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up SVG with appropriate dimensions
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", 800)  // Adjust as needed
            .attr("height", 600); // Adjust as needed

        // Define map projection
        vis.projection = d3.geoMercator()
            .center([-95, 71])  // Center on Canada
            .scale(250)
            .translate([400, 300]);  // Adjust based on SVG dimensions

        // Define path generator
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Load and display the map
        d3.json("data/canada.topo.json").then(function (canadaMapData) {
            vis.svg.selectAll(".country")
                .data(topojson.feature(canadaMapData, canadaMapData.objects.countries).features)
                .enter().append("path")
                .attr("class", "country")
                .attr("d", vis.path);
        });

        // Add city bubbles
        vis.svg.selectAll(".city")
            .data(vis.officeData)
            .enter().append("circle")
            .attr("class", "city")
            .attr("cx", d => vis.projection([d.longitude, d.latitude])[0])
            .attr("cy", d => vis.projection([d.longitude, d.latitude])[1])
            .attr("r", 5)  // Adjust radius as needed
            .on("click", d => {
                vis.selectedCity = d.city;
                vis.updateVis();
            });

        // Add any additional initialization steps here
    }

    updateVis() {
        let vis = this;

        // Update visualization based on selected city or other interactions
        // This might include filtering data, adjusting styles, or other dynamic changes

        // For example, highlight the selected city
        vis.svg.selectAll(".city")
            .style("fill", d => d.city === vis.selectedCity ? "red" : "blue");
    }

    // Add additional methods as needed for interaction, data processing, etc.
}
