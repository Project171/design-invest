class mapVis {
    constructor(_parentElement, _industrialData, _officeData, _multifamilyData, _retailData) {
        this.parentElement = _parentElement;
        this.industrialData = _industrialData;
        this.officeData = _officeData;
        this.multifamilyData = _multifamilyData;
        this.retailData = _retailData;
        this.displayData = [];
        this.parseDate = d3.timeParse("%m/%d/%Y");
        this.selectedCity = ""; // Initialize selectedCity
        // call method initVis
        this.initVis();


        this.MAP_FILL_COLOR = '#9db943';
        this.MAP_BORDER_COLOR = '#ffffff';
        this.MAP_BORDER_WIDTH = 1;
        this.CITY_HIGHLIGHT_FILL = '#cb5b5b';
        this.CITY_HIGHLIGHT_BORDER = '#ffffff';
        this.CITY_HIGHLIGHT_BORDER_WIDTH = 3;


    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 50, bottom: 20, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Function to set up the map projection
        function setMapProjection(element) {
            vis.projection = d3.geo.mercator()
                .center([-95, 71])
                .scale(250)
                .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
            return {path: d3.geo.path().projection(vis.projection), projection: vis.projection};
        }

        // Load the TopoJSON file for the map
        d3.json("data/canada.topo.json", function (error, canadaMapData) {
                if (error) return console.error("Error loading Canada topo data:", error);

                // Render Canada map with static subunits
                vis.canadaMap = new Datamap({
                    element: document.getElementById('canada'),
                    geographyConfig: {
                        dataJson: canadaMapData,
                        popupTemplate: () => null, // Disable tooltips for map subunits
                        highlightFillColor: vis.MAP_FILL_COLOR,
                        highlightBorderColor: vis.MAP_BORDER_COLOR,
                        borderColor: vis.MAP_BORDER_COLOR,
                        borderWidth: vis.MAP_BORDER_WIDTH,
                        highlightBorderWidth: vis.MAP_BORDER_WIDTH
                    },
                    scope: 'canada',
                    fills: {defaultFill: vis.MAP_FILL_COLOR},
                    setProjection: setMapProjection
                });

                // Load and process the GeoJSON file for cities
                d3.json("data/filtered_file.json", function (error, citiesData) {
                        if (error) return console.error("Error loading cities data:", error);

                        // Prepare city bubbles data
                        vis.bubblesData = citiesData.features.map(feature => {
                            let coords = feature.geometry.coordinates[0][0][0];
                            return {
                                latitude: coords[1],
                                longitude: coords[0],
                                radius: 10,
                                city: feature.properties.NAME_3,
                                highlightFillColor: vis.CITY_HIGHLIGHT_FILL,
                                highlightBorderColor: vis.CITY_HIGHLIGHT_BORDER,
                                highlightBorderWidth: vis.CITY_HIGHLIGHT_BORDER_WIDTH
                            };
                        });

                        // Add dynamic city bubbles to the map
                        vis.canadaMap.bubbles(vis.bubblesData, {
                            popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>Market:  ${data.city}</strong></div>`,
                            highlightFillColor: vis.CITY_HIGHLIGHT_FILL,
                            highlightBorderColor: vis.CITY_HIGHLIGHT_BORDER,
                            highlightBorderWidth: vis.CITY_HIGHLIGHT_BORDER_WIDTH
                        });

                        // Add event listener for city bubbles
                        vis.canadaMap.svg.selectAll('.datamaps-bubble').on('click', function (data) {
                            vis.selectedCity = data.city;
                            vis.updateVis();
                        });

                        // Initialize the timeline
                        vis.initTimeline();
                    }
                )
            }
        )
    }

    // init timeline

    initTimeline() {
        let vis = this;
        vis.timelineElement = document.getElementById('timeline');
        vis.timeline = new Timeline(vis.timelineElement, vis.industrialData, vis.officeData, vis.multifamilyData, vis.retailData);
    }

    // updateVis

    updateVis() {
        let vis = this;

        // Filter data based on selectedCity
        vis.displayData = vis.officeData.filter(d => {
            return d.city === vis.selectedCity;
        });

        // Update the visualization
        vis.updateVis();
    }


    // updateMapBasedOnDateRange

    updateMapBasedOnDateRange(dateRange) {
        let vis = this;
        vis.displayData = vis.officeData.filter(d => {
            let date = vis.parseDate(d.date);
            return date >= dateRange[0] && date <= dateRange[1];
        });
        vis.updateVis();
    }

    // updateVis

    updateVis() {


    }

    // brushEnded

    brushEnded(event) {
        if (!event.selection) return;
        this.dateRange = event.selection.map(d => d.invert(d));
        this.updateMapBasedOnDateRange(this.dateRange);
    }

    // wrangleDataStatic

    wrangleDataStatic() {
        let vis = this;

        // rearrange data structure and group by state
        let dataByDate = Array.from(d3.group(vis.officeData, d => d.date), ([key, value]) => ({key, value}))
        this.wrangleDataResponsive();
    }

    // wrangleDataResponsive

    wrangleDataResponsive() {
        let vis = this;

        vis.filteredData = [];

        // filter
        if (vis.selectedCity !== '') {
            vis.data.forEach(date => {
                if (vis.selectedCity === date.state) {
                    vis.filteredData.push(date)
                }
            })
        }

        // rearrange data structure and group by state
        let dataByDate = Array.from(d3.group(vis.filteredData, d => vis.officeData), ([key, value]) => ({
            key,
            value
        }))
        this.wrangleData();
    }

    // wrangleData

    wrangleData() {
        let vis = this;

        // Update the visualization
        this.updateVis();
    }

    // updateVis

    updateVis() {

    }

}