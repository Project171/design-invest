class cBarChart {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        // this.eventHandler = _eventHandler;

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Create a new dataset with just these market change values
        vis.market_change_data = createConsumerData(vis.data);

        // console.log("vis.market_change_data: ", vis.market_change_data)

        vis.margin = { top: 40, right: 20, bottom: 60, left: 225 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 462.5 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes

        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        vis.y = d3.scaleBand()
            .range([vis.height, 0])
            .padding(0.1);
            // // Trying to have a different padding between groups
            // .paddingInner(0.1)
            // .paddingOuter(0.2);

        // Define a percentage format
        // const formatPercent = d3.format(".0%");

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(".0%"))
            .ticks(8);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // TODO might need to move this down to updatevis later? or maybe it's fine here...
        // Scale the range of the data
        // think about vis.x, may need to set some kind of static domain like [-100, 100]
        // vis.x.domain([d3.min(vis.market_change_data, d => d.change), d3.max(vis.market_change_data, d => d.change)]);
        vis.x.domain([-3000, 3000])
        vis.y.domain(vis.market_change_data.map(d => d.category).reverse()); // reverse because I want Total at the top

        // Draw the bars
        vis.svg.selectAll(".bar")
            .data(vis.market_change_data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => vis.y(d.category))
            .attr("height", vis.y.bandwidth())
            .attr("x", d => (d.change >= 0) ? vis.x(0) : vis.x(d.change))  // This code helps us get the bars to start at the 0 line
            .attr("width", d => Math.abs(vis.x(0) - vis.x(d.change)));

        //// For debugging
        // vis.market_change_data.forEach(function (d) {
        //     console.log("d.category: ", d.category)
        //     console.log("width: ", vis.x(d.change))
        // })

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

        // Update the domain
        // This minValue code is to make sure that the x-axis starts at 0 if there are no negative values
        const minValue = d3.min(vis.market_change_data, d => d.change);
        vis.x.domain([minValue < 0 ? minValue : 0, d3.max(vis.market_change_data, d => d.change)]);

        // Enter Update barcharts
        vis.svg.selectAll(".bar")
            .data(vis.market_change_data)
            .enter().append("rect")
            .merge(vis.svg.selectAll(".bar"))
            .transition()
            .duration(800)
            .attr("class", "bar")
            .attr("y", d => vis.y(d.category))
            .attr("height", vis.y.bandwidth())
            .attr("x", d => (d.change >= 0) ? vis.x(0) : vis.x(d.change))  // This code helps us get the bars to start at the 0 line
            .attr("width", d => Math.abs(vis.x(0) - vis.x(d.change)))
            .attr("fill", d => {
                switch (d.grouping) {
                    case "Total":
                        return "darkgrey";
                    case "Essential":
                        return "green";
                    case "Discretionary":
                        return "orange";
                    case "Housing":
                        return "brown";
                    default:
                        return "gray"; // Or any other default color
                }
            });

        // Exit barcharts
        vis.svg.selectAll(".bar")
            .data(vis.market_change_data)
            .exit()
            .remove();

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);
    }

    onSelectionChange(selectionStart, selectionEnd) {
        let vis = this;

        // Filter original unfiltered data depending on selected time period (brush)
        vis.filteredData = vis.data.filter(function (d) {
            return d.date >= selectionStart && d.date <= selectionEnd;
        });

        // Create dataset but with new filtered data
        vis.market_change_data = createConsumerData(vis.filteredData);
        vis.wrangleData();
    }
}