class Canada {

    constructor(_parentElement, _geoData, _citiesData, _industrialData, _officeData, _multifamilyData, _retailData) {
        this.parentElement = _parentElement;
        this.geoData = _geoData;
        this.citiesData = _citiesData;
        this.industrialData = _industrialData;
        this.officeData = _officeData;
        this.multifamilyData = _multifamilyData;
        this.retailData = _retailData;
        this.populationData = _populationData;
        this.combinedData = []; // Initialize combinedData
        this.selectedSector = null; // Initialize selectedSector
        this.timelineRange = null; // Initialize timelineRange
        this.initVis();
    }


    initVis() {
        let vis = this;

        // Define dimensions and margins for the SVG
        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = 800 - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

        // Append SVG to the DOM
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Define projection and path
        vis.projection = d3.geoMercator()
            .center([-97, 49])
            .scale(300)
            .translate([vis.width / 2, vis.height / 2]);

        vis.path = d3.geoPath().projection(vis.projection);

        // Draw the map
        vis.svg.selectAll(".country")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.canada).features)
            .enter().append("path")
            .attr("class", "country")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("d", vis.path)
            .attr("fill", "rgb(33,163,161, 0.9)");

        // Initialize elements and functionality
        vis.highlightRegions();
        vis.initSectorIcons();
        vis.wrangleData();
        vis.initTimeline();

    }

    highlightRegions() {
        let vis = this;

        // Coordinates for key regions - these would be longitude and latitude
        const regions = {
            "Vancouver": [-123.1207, 49.2827],
            "Edmonton": [-113.4938, 53.5461],
            "Calgary": [-114.0719, 51.0447],
            "Toronto": [-79.3832, 43.6532],
            "Ottawa": [-75.6972, 45.4215],
            "Montreal": [-73.5673, 45.5017]
        };

        // Plot circles for key regions
        vis.svg.selectAll(".region")
            .data(Object.entries(regions))
            .enter().append("circle")
            .attr("class", "region")
            .attr("cx", d => vis.projection(d[1])[0])
            .attr("cy", d => vis.projection(d[1])[1])
            .attr("r", 10)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .attr("fill", "rgb(159,33,163, 0.9)")
            .append("title")
            .text(d => d[0]);

        vis.initSectorIcons();
    }

    initSectorIcons() {
        let vis = this;

        // Define data for sector icons
        const sectors = [
            {id: "retail", iconPath: "img/retail.svg"},
            {id: "office", iconPath: "img/office.svg"},
            {id: "industrial", iconPath: "img/industrial.svg"},
            {id: "multi", iconPath: "img/multi.svg"}
        ];

        // Iterate over sectors and load SVGs
        sectors.forEach(sector => {
            fetch(sector.iconPath)
                .then(response => response.text())
                .then(svgData => {
                    document.getElementById(sector.id).innerHTML = svgData;
                    // Additional logic (like event listeners) for each sector icon
                });
        });

        // Add click event listeners for each sector
        document.getElementById("retail").addEventListener("click", () => vis.selectSector("retail"));
        document.getElementById("office").addEventListener("click", () => vis.selectSector("office"));
        document.getElementById("industrial").addEventListener("click", () => vis.selectSector("industrial"));
        document.getElementById("multi").addEventListener("click", () => vis.selectSector("multi"));

    }

    selectSector(sector) {
        let vis = this;
        vis.selectedSector = sector;
        vis.updateMap();
    }

    initTimeline() {
        let vis = this;

        // Define dimensions and margins for the timeline
        vis.timelineMargin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.timelineWidth = document.getElementById('timeline').clientWidth - vis.timelineMargin.left - vis.timelineMargin.right;
        vis.timelineHeight = 100 - vis.timelineMargin.top - vis.timelineMargin.bottom; // Adjust height as needed

        // Append SVG for the timeline to the 'timeline' div
        vis.timelineSvg = d3.select("#timeline")
            .append("svg")
            .attr("width", vis.timelineWidth + vis.timelineMargin.left + vis.timelineMargin.right)
            .attr("height", vis.timelineHeight + vis.timelineMargin.top + vis.timelineMargin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.timelineMargin.left}, ${vis.timelineMargin.top})`);

        // Scales for the timeline
        vis.xScale = d3.scaleTime()
            .range([0, vis.timelineWidth])
            .domain(d3.extent(vis.combinedData, function (d) {
                return d.date;
            }));

        vis.yScale = d3.scaleLinear()
            .range([vis.timelineHeight, 0]);

        // Axes
        vis.xAxis = d3.axisBottom(vis.xScale);

        vis.timelineSvg.append("g")
            .attr("transform", `translate(0, ${vis.timelineHeight})`)
            .call(vis.xAxis);

        // Brush
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.timelineWidth, vis.timelineHeight]])
            .on("brush end", brushed);

        vis.timelineSvg.append("g")
            .attr("class", "brush")
            .call(vis.brush);

        console.log("Timeline initialized", {
            timelineWidth: vis.timelineWidth,
            timelineHeight: vis.timelineHeight,
            xScaleDomain: vis.xScale.domain()
        });

        function brushed(event) {
            let selection = event.selection;
            if (selection) {
                let dateRange = selection.map(vis.xScale.invert);
                vis.timelineRange = dateRange; // Set timeline range
                vis.updateMap(vis.selectedSector); // Update the map with the current sector and new date range
            }

        }
    }

    updateMap() {
        let vis = this;
        if (!vis.selectedSector || !vis.timelineRange) return;

        // Efficient filtering logic
        let filteredData = vis.combinedData.filter(d =>
            d.sector === vis.selectedSector &&
            vis.timelineRange[0] <= d.date &&
            d.date <= vis.timelineRange[1]
        );
    }

    wrangleData() {
        let vis = this;

        if (!Array.isArray(vis.industrialData) || !Array.isArray(vis.officeData) ||
            !Array.isArray(vis.multifamilyData) || !Array.isArray(vis.retailData)) {
            console.error('Data is not in array format');
            return;
        }

        // Combine all sector data into one array
        vis.combinedData = [...vis.industrialData, ...vis.officeData, ...vis.multifamilyData, ...vis.retailData];

        vis.combinedData.forEach(d => d.date = new Date(d.date));
        vis.combinedData.sort((a, b) => a.date - b.date);

        console.log("Display combinedData", vis.combinedData);

        // Update the visualization
        vis.updateVis();
    }

    updateVis() {
        let vis = this;


    }
}
