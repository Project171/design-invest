class LineChart {

    constructor(_parentElement, _data, _macroEventHandler) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.macroEventHandler = _macroEventHandler;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 300 - vis.margin.top - vis.margin.bottom;
        // vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(d3.format(".0%"))
            .ticks(6);

        // Set domains by finding the min and max of both the X and Y
        let minMaxX = d3.extent(vis.data.map(function (d) { return d.date; }));
        vis.x.domain(minMaxX);

        let minMaxY = [d3.min(vis.data.map(function (d) { return d.gdp_yy_chg; })),
            d3.max(vis.data.map(function (d) { return d.gdp_yy_chg; }))];

        vis.y.domain(minMaxY);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // // Axis title
        // vis.svg.append("text")
        //     .attr("x", -50)
        //     .attr("y", -8)
        //     .text("Votes");

        // // Append a path for the line
        // vis.line = d3.line()
        //     .x(d => vis.x(d.date))
        //     .y(d => vis.y(d.gdp_yy_chg));
        //
        // vis.svg.append("path")
        //     // .datum(vis.data)
        //     .data([vis.data])
        //     .attr("class", "line")
        //     .attr("d", vis.line);

        // Add the line
        vis.svg.append("path")
            .datum(vis.data)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return vis.x(d.date) })
                .y(function(d) { return vis.y(d.gdp_yy_chg) })
            );

        // Quarter time scale for brushing
        const quarterScale = d3.scaleTime()
            .domain(vis.x.domain())  // Use the same domain as xScale
            .range(vis.x.range())
            .nice(d3.timeQuarter);  // Quantize to quarters

        vis.currentBrushRegion = null;
        vis.brush = d3.brushX()
            .extent([[0,0],[vis.width, vis.height]])
            .on("brush", function (event) {
                // User just selected a specific region
                vis.currentBrushRegion = event.selection;

                if (vis.currentBrushRegion) {
                    // Quantize the brush selection to quarters
                    vis.currentBrushRegion = vis.currentBrushRegion.map(quarterScale.invert);
                    console.log(vis.currentBrushRegion);
                }

                // console.log(vis.currentBrushRegion);

                // 3. Trigger the event 'selectionChanged' of our event handler
                vis.macroEventHandler.trigger("selectionChanged", vis.currentBrushRegion);
            });

        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush)


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }



    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        this.displayData = this.data;

        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     * Function parameters only needed if different kinds of updates are needed
     */

    updateVis() {
        let vis = this;

        // Call brush component here
        // *** TO-DO ***
        // vis.brushGroup.call(vis.brush);
        // vis.brushGroup.call(vis.zoom);
        // vis.brushGroup.call(zoom)
        // 	.on("mousedown.zoom", null)
        // 	.on("touchstart.zoom", null);


        // Call the area function and update the path
        // D3 uses each data point and passes it to the area function.
        // The area function translates the data into positions on the path in the SVG.
        // vis.timePath
        //     .datum(vis.displayData)
        //     .attr("d", vis.area)
        //     .attr("clip-path", "url(#clip)");
        //
        //
        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    // onSelectionChange(selectionStart, selectionEnd) {
    // let vis = this;

    // Change the selected time range
    // d3.select("#time-period-min").text(dateFormatter(selectionStart));
    // d3.select("#time-period-max").text(dateFormatter(selectionEnd));

    // // Not sure why the other way didn't work, but this way works for me!
    // document.querySelector(".time-period-min").innerText = dateFormatter(selectionStart);
    // document.querySelector(".time-period-max").innerText = dateFormatter(selectionEnd);

    // }
}


// TODO start at 1981 instead of 1980 because I don't have data there
// But I would still like the x axis to start at 1980