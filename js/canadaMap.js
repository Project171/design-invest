class CanadaMap {

    constructor(_parentElement, _geoData, _colors) {
        this.parentElement = _parentElement;
        this.geoData = _geoData;
        this.retailColor = _colors.retailColor;
        this.officeColor = _colors.officeColor;
        this.industrialColor = _colors.industrialColor;
        this.multifamilyColor = _colors.multifamilyColor;
        this.vColor = _colors.vColor;
        this.eColor = _colors.eColor;
        this.cColor = _colors.cColor;
        this.tColor = _colors.tColor;
        this.oColor = _colors.oColor;
        this.mColor = _colors.mColor;
        this.selectedRegionElement = null;
        this.selectedSectorElement = null;


        this.initVis();
    }


    initVis() {
        let vis = this;
        vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };
        vis.width = 800 - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;
        vis.projection = d3.geoMercator().center([-97, 49]).scale(300).translate([vis.width / 2, vis.height / 2]);
        vis.path = d3.geoPath().projection(vis.projection);

        // console.log("colors: ",vis.colors);

        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.svg.selectAll(".country")
            .data(topojson.feature(vis.geoData, vis.geoData.objects.canada).features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", vis.path)
            .attr("fill", "gray")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        vis.highlightRegions();
        vis.initSectorIcons();
    }

    highlightRegions() {
        let vis = this;

        // Coordinates for key regions - these would be longitude and latitude
        const regions = {
            "Vancouver": { coords: [-123.1207, 49.2827], color: vis.vColor },
            "Edmonton": { coords: [-113.4938, 53.5461], color: vis.eColor },
            "Calgary": { coords: [-114.0719, 51.0447], color: vis.cColor },
            "Toronto": { coords: [-79.3832, 43.6532], color: vis.tColor },
            "Ottawa": { coords: [-75.6972, 45.4215], color: vis.oColor },
            "Montreal": { coords: [-73.5673, 45.5017], color: vis.mColor }
        };


        vis.svg.selectAll(".region")
            .data(Object.entries(regions))
            .enter().append("circle")
            .attr("class", "region")
            .attr("cx", d => vis.projection(d[1].coords)[0])
            .attr("cy", d => vis.projection(d[1].coords)[1])
            .attr("r", 10)
            .attr("fill", d => d[1].color)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke", "white")
                    .attr("stroke-width", 3);
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("stroke", "none");
            })
            .on("click", function(event, d) {
                // Reset the previously selected region, if any
                if (vis.selectedRegionElement) {
                    vis.selectedRegionElement
                        .attr("stroke", "none")
                        .attr("stroke-width", 0);
                }

                // Update the selected region element
                vis.selectedRegionElement = d3.select(this);
                vis.selectedRegionElement
                    .attr("stroke", "white")  // or a specific color if you prefer
                    .attr("stroke-width", 3);

                // Update content based on the selected region
                vis.updateCardContentRegion(d[0]);
                vis.updateHeaderText(`${d[0]}`, d[1].color);
            })
            .append("title")
            .text(d => d[0]);
    }

    updateCardContentRegion(region) {
        let vis = this;
        vis.regionInfo = {
            'Vancouver': "<h3><strong>VANCOUVER</strong></h3><br>The green city is a hub for residential and commercial properties, with high property values. <strong>Key Features</strong> include a strong housing market, diverse demographics, and thriving commercial districts.",
            'Edmonton': "<h3><strong>EDMONTON</strong></h3><br>The real estate market offers a stable environment for both commercial and residential sectors. <strong>Key Features</strong> include governmental buildings, and an affordable housing market with growing service and technology sectors.",
            'Calgary': "<h3><strong>CALGARY</strong></h3><br>The energy capital features modern commercial properties and residential areas. <strong>Key Features</strong> include proximity to natural resources, modern downtown area, and suburban expansion.",
            'Toronto': "<h3><strong>TORONTO</strong></h3><br>The financial capital has a high demand for both commercial and residential spaces. <strong>Key Features</strong> include a diverse economy, high-density urban center, and a luxury housing market.",
            'Ottawa': "<h3><strong>OTTAWA</strong></h3><br>The capital city has a stable real estate market with a significant presence of governmental and diplomatic properties. <strong>Key Features</strong> include governmental offices, historical sites, mixed urban and suburban areas.",
            'Montreal': "<h3><strong>MONTREAL</strong></h3><br>The gourmet capital fuses historical architecture with contemporary development. <strong>Key Features</strong> include robust industrial and service sectors, and its status as a significant port city."
        };
        d3.select("#content .card-body").html(vis.regionInfo[region]);
    }
    updateCardContent(sector) {
        let vis = this;
        vis.sectorInfo = {
            'retail': "<h3><strong>RETAIL</strong></h3><br>It includes shopping centers, malls, and high-street shops. <strong>Challenges</strong> include adapting to online shopping trends, sustaining foot traffic, and managing market competition with the rise of mixed-use developments.",
            'office': "<h3><strong>OFFICE</strong></h3><br>It includes skyscrapers and small business buildings. <strong>Challenges</strong> include adapting to remote work, managing vacancy rates, and upgrading older buildings with demand for flexible workspaces and green buildings gaining importance.",
            'industrial': "<h3><strong>INDUSTRIAL</strong></h3><br>It includes manufacturing, logistics, warehouses, and distribution centers. <strong>Challenges</strong> include maintaining location accessibility, technological advancements and environmental regulations with demand for smart factories.",
            'multifamily': "<h3><strong>RESIDENTIAL</strong></h3><br>It includes rental apartments and condominiums. <strong>Challenges</strong> include affordable housing, effective property management, and navigating market fluctuations with urbanization-driven demand and the development of luxury units."
        };
        d3.select("#content .card-body").html(vis.sectorInfo[sector]);
    }

    updateHeaderText(text, color) {
        let vis = this;
        const header = document.querySelector('#real-estate-sectors-and-vectom h1');
        header.textContent = text;
        header.style.color = color; // Set the header color
    }

    getSectorColor(sector) {
        let vis = this;
        switch(sector) {
            case 'retail': return vis.retailColor;
            case 'office': return vis.officeColor;
            case 'industrial': return vis.industrialColor;
            case 'multifamily': return vis.multifamilyColor;
            default: return 'black'; // Default color if no match is found
        }
    }


    initSectorIcons() {
        let vis = this;
        const sectors = {
            'retail': "img/retail.svg",
            'office': "img/office.svg",
            'industrial': "img/industrial.svg",
            'multifamily': "img/multifamily.svg"
        };


        Object.entries(sectors).forEach(([sector, iconPath]) => {
            fetch(iconPath)
                .then(response => response.text())
                .then(svgData => {
                    document.getElementById(sector).innerHTML = svgData;
                })
                .then(() => {
                    document.getElementById(sector).addEventListener("click", function() {
                        if (vis.selectedRegionElement) {
                            vis.selectedRegionElement.classed("region-clicked", false);
                            vis.selectedRegionElement = null;
                        }
                        if (vis.selectedSectorElement) {
                            vis.selectedSectorElement.classList.remove(`${vis.selectedSectorElement.id}-clicked`);
                        }
                        vis.selectedSectorElement = this;
                        vis.selectedSectorElement.classList.add(`${sector}-clicked`);
                        vis.updateCardContent(sector);
                        let sectorColor = vis.getSectorColor(sector);
                        vis.updateHeaderText(`${sector.charAt(0).toUpperCase() + sector.slice(1)} Sector`, sectorColor);
                    });
                });
        });
    }
}