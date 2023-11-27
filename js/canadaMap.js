class CanadaMap {
    constructor(_parentElement, _geoData, _citiesData, _timelineElementId) {
        this.parentElement = _parentElement;
        this.topoJsonPath = _geoData;
        this.citiesJsonPath = _citiesData;
        this.timelineElementId = _timelineElementId;
        this.mapFillColor = '#9db943';
        this.mapBorderColor = '#ffffff';
        this.mapBorderWidth = 1;
        this.cityHighlightFill = '#cb5b5b';
        this.cityHighlightBorder = '#ffffff';
        this.cityHighlightBorderWidth = 3;
        this.initMap();
        this.initTimeline();
    }

    setProjection() {
        let vis = this;
        vis.element = document.getElementById(vis.parentElement);
        if (!vis.element) {
            console.error("Map element not found:", vis.parentElement);
            return;
        }

        vis.projection = d3.geoMercator()
            .center([-95, 71])
            .scale(240)
            .translate([vis.element.offsetWidth / 2, vis.element.offsetHeight / 2]);
    }

    initMap() {
        let vis = this;
        this.setProjection();
        if (!vis.projection) return; // Stop if projection is not set

        // Load TopoJSON and GeoJSON inside initMap
        Promise.all([
            d3.json(vis.topoJsonPath),
            d3.json(vis.citiesJsonPath)
        ]).then(function (data) {
            const [canadaMapData, citiesData] = data;

            vis.map = new Datamap({
                element: vis.element,
                geographyConfig: {
                    popupTemplate: () => null,
                    highlightFillColor: vis.mapFillColor,
                    highlightBorderColor: vis.mapBorderColor,
                    borderColor: vis.mapBorderColor,
                    borderWidth: vis.mapBorderWidth,
                    highlightBorderWidth: vis.mapBorderWidth
                },
                scope: 'canada',
                fills: {defaultFill: vis.mapFillColor},
                setProjection: () => ({path: d3.geoPath().projection(vis.projection), projection: vis.projection})
            });

            vis.map.updateChoropleth(canadaMapData);

            let bubblesData = citiesData.features.map(feature => {
                let coords = feature.geometry.coordinates[0][0][0];
                return {
                    latitude: coords[1],
                    longitude: coords[0],
                    radius: 10,
                    city: feature.properties.NAME_3,
                    highlightFillColor: vis.cityHighlightFill,
                    highlightBorderColor: vis.cityHighlightBorder,
                    highlightBorderWidth: vis.cityHighlightBorderWidth
                };
            });

            vis.map.bubbles(bubblesData, {
                popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>Market: ${data.city}</strong></div>`,
                highlightFillColor: vis.cityHighlightFill,
                highlightBorderColor: vis.cityHighlightBorder,
                highlightBorderWidth: vis.cityHighlightBorderWidth
            });

        }).catch(error => console.error("Error loading map data:", error));

        // Initialize the timeline
        this.initTimeline();
    }

    initTimeline() {
        let vis = this;
        vis.timelineElement = document.getElementById(vis.timelineElementId);

        if (!vis.timelineElement) {
            console.error("Timeline element not found:", vis.timelineElementId);
            return;
        }

        const parseQuarter = (q) => {
            let [quarter, year] = q.split(' ');
            let month = (parseInt(quarter) - 1) * 3;
            return new Date(year, month);
        };

        this.width = vis.timelineElement.clientWidth;
        this.height = vis.timelineElement.clientHeight;

        this.timeScale = d3.scaleTime()
            .domain([parseQuarter("Q1 2000"), parseQuarter("Q4 2023")])
            .range([0, this.width]);

        this.timelineSvg = d3.select("#" + this.timelineElementId);
        this.timelineSvg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.timeScale));

        this.brush = d3.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on("end", event => this.brushEnded(event));

        this.timelineSvg.append("g").call(this.brush);
    }

    brushEnded(event) {
        if (!event.selection) return;
        this.dateRange = event.selection.map(d => d.invert(d));
        this.updateMapBasedOnDateRange(this.dateRange);
    }

    updateMapBasedOnDateRange(dateRange) {
        // Logic to update map based on date range
    }
}
