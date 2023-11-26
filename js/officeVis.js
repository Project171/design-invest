/* * * * * * * * * * * * * *
*      OfficeVis       *
* * * * * * * * * * * * * */

class OfficeVis {
    constructor(_parentElement, _officeData) {
        this.parentElement = _parentElement;
        this.officeData = _officeData;
        this.displayData = [];
        this.parseDate = d3.timeParse("%m/%d/%Y");
        this.selectedCity = ""; // Initialize selectedCity

        // call method initVis
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up margins, width, and height
        vis.margin = {top: 20, right: 20, bottom: 10, left: 20};

        if (document.getElementById(vis.parentElement)) {
            vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
            // Rest of your code
        } else {
            console.error("Element not found: ", vis.parentElement);
        }

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // init scales
        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // init x & y axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + vis.height + ")");
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis axis--y");

        // init pathGroup
        vis.pathGroup = vis.svg.append('g').attr('class', 'pathGroup');

        // init brushGroup
        vis.brushGroup = vis.svg.append('g').attr('class', 'brushGroup');

        // init tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // init title
        vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text('Office')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // init legend
        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width - 100}, 20)`);

        vis.legend.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', 'steelblue');

        vis.legend.append('text')
            .attr('transform', `translate(15, 10)`)
            .text('Average');

        vis.legend.append('rect')
            .attr('y', 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', 'orange');

        vis.legend.append('text')
            .attr('transform', `translate(15, 30)`)
            .text('Selected');

        // init path one (average)
        vis.pathOne = vis.pathGroup
            .append('path')
            .attr("class", "pathOne");

        // init path two (single city)
        vis.pathTwo = vis.pathGroup
            .append('path')
            .attr("class", "pathTwo");


        // init path generator
        vis.area = d3.area()
            .x(function (d) {
                return vis.x(d.date);
            })
            .y0(vis.y(0))
            .y1(function (d) {
                return vis.y(d.selectedCity);
            });

        // init brush
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("end", event => vis.brushEnded(event));

        // init clip path
        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Call the function to update the visualization
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        console.log("Display data in officeData:", vis.officeData); // Log the data

        // Filter data based on selectedCity
        vis.displayData = vis.officeData.filter(d => {
            return d.city === vis.selectedCity;
        });


        // Update the visualization
        vis.updateVis();
    }


    updateVis() {
        let vis = this;
        // Update the domain of the x & y scales
        vis.x.domain(d3.extent(vis.displayData, d => d.date));
        vis.y.domain([0, d3.max(vis.displayData, d => d.selectedCity)]);

        // Update the x & y axis
        vis.xAxis.call(d3.axisBottom(vis.x));
        vis.yAxis.call(d3.axisLeft(vis.y));

        // Update the path for the average
        vis.pathOne
            .datum(vis.displayData)
            .attr("fill", "steelblue")
            .attr("d", vis.area);

        // Update the path for the selected city
        vis.pathTwo
            .datum(vis.displayData)
            .attr("fill", "orange")
            .attr("d", vis.area);

        // Update the brush
        vis.brushGroup.call(vis.brush);
        vis.brushGroup.selectAll('.overlay')
            .on('mousemove', function (event) {
                let xPos = d3.pointer(event)[0];
                let date = vis.x.invert(xPos);
                let formatTime = d3.timeFormat("%m/%d/%Y");
                date = formatTime(date);
                let selectedCity = vis.displayData.filter(d => d.date === date)[0].selectedCity;
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 15) + "px")
                    .html(`<strong>${date}</strong><br>${selectedCity}`);
            })
            .on('mouseout', function () {
                vis.tooltip.style("opacity", 0);
            });
    }

    brushEnded(event) {
        let vis = this;
        if (!event.selection) return;
        let dateRange = event.selection.map(d => d.invert(d));
        vis.updateMapBasedOnDateRange(dateRange);
    }

    updateMapBasedOnDateRange(dateRange) {
        let vis = this;
        // Logic to update map based on date range

    }

    updateSelectedCity(selectedCity) {
        let vis = this;
        vis.selectedCity = selectedCity;
        vis.wrangleData();
    }

}

