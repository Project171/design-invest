class dualChart {
    constructor(_parentElement, _industrial, _colors) {
        this.parentElement = _parentElement;
        this.industrial = _industrial;
        this.textColor = _colors.textColor;
        this.backgroundColor = _colors.backgroundColor;
        this.vColor = _colors.vColor;
        this.cColor = _colors.cColor;
        this.mColor = _colors.mColor;
        this.dataAttributes = {
            'Absorption (LHS)': {
                color: _colors.mColor,
                // Any other attributes you want to store for Absorption
            },
            'New Supply (LHS)': {
                color: _colors.vColor,
                // Any other attributes you want to store for New Supply
            },
            'Availability Rate (RHS)': {
                color: _colors.cColor,
                // Any other attributes you want to store for Availability Rate
            }
        };
        this.keys = Object.keys(this.dataAttributes);

        this.loadData();
        this.initVis();
    }


    loadData() {
        let vis = this;


        // Parse the dates and sort the data
        vis.parseQuarter = (dateStr) => {
            if (typeof dateStr !== 'string' || !dateStr) {
                console.error('Invalid date format:', dateStr);
                return new Date(0); // Return epoch date as a fallback
            }
            let parts = dateStr.split(" ");
            if (parts.length !== 2) {
                console.error('Date does not contain two parts:', dateStr);
                return new Date(0); // Return epoch date as a fallback
            }
            const [q, year] = parts;
            let quarterMapping = {'Q1': 0, 'Q2': 1, 'Q3': 2, 'Q4': 3};
            return new Date(year, quarterMapping[q] * 3);
        };

        // Parse the date field and prepare the values array
        vis.data = vis.industrial.map(d => {
            let parsedDate = vis.parseQuarter(d.Date);
            let formattedDate = d3.timeFormat("%Y-%m")(parsedDate); // Format the date as "YYYY-MM"
            return {
                date: formattedDate,
                parsedDate: parsedDate,
                values: [
                    {name: 'Absorption (LHS)', value: +d['Absorption (LHS)'].replace(/,/g, '')},
                    {name: 'New Supply (LHS)', value: +d['New Supply (LHS)'].replace(/,/g, '')},
                    {
                        name: 'Availability Rate (RHS)',
                        value: parseFloat(d['Availability Rate (RHS)'].replace(/%/g, '')) / 100.0
                    }
                ]
            };
        });

        // Ensure that data is sorted by parsedDate
        vis.data.sort((a, b) => a.parsedDate - b.parsedDate);
        // Find the current year
        const currentYear = new Date().getFullYear();

        // Calculate the start year (6 years ago)
        vis.startYear = currentYear - 5; // Subtract 5 because the current year is included

        // Filter the data to include only the last 6 years
        vis.data = vis.data.filter(d => {
            const year = d.parsedDate.getFullYear();
            return year >= vis.startYear && year <= currentYear;
        });

        console.log("Filtered data for 6 years =", vis.data);
    }


    initVis() {

        let vis = this;
        vis.startIndex = 0; // Initialize startIndex
        vis.visibleYears = 6; // Set the number of years you want to display
        vis.legendY = - 30;

        console.log("vis.data=", vis.data);


        vis.margin = {top: 20, right: 65, bottom: 30, left: 90};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 480 - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("viewBox", `0 0 ${vis.width + vis.margin.left + vis.margin.right} ${vis.height + vis.margin.top + vis.margin.bottom}`)
            .classed("svg-content-responsive", true)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");




        // Scales for the years and the quarters
        vis.x0 = d3.scaleBand()
            .domain(vis.data.map(d => d.key)) // domain is the years
            .range([0, vis.width])
            .paddingInner(0);

        vis.x1 = d3.scaleBand()
            .domain(['Q1', 'Q2', 'Q3', 'Q4']) // domain is always Q1-Q4 for the quarters
            .range([0, vis.x0.bandwidth()])
            .padding(0);

        vis.y0 = d3.scaleLinear().range([vis.height, 0]);
        vis.y1 = d3.scaleLinear().range([vis.height, 0]);
        vis.color = d3.scaleOrdinal().range([vis.vColor, vis.cColor, vis.mColor]);

        // Axes
        vis.xAxis = d3.axisBottom(vis.x0)
            .tickSize(2)
            .tickPadding(20);
        vis.xAxisInner = d3.axisBottom(vis.x1)
            .tickSize(2)
            .tickPadding(5);

        vis.yAxisLeft = d3.axisLeft(vis.y0)
            .tickSize(2)
            .tickPadding(2);
        vis.yAxisRight = d3.axisRight(vis.y1)
            .tickSize(2)
            .tickPadding(2)
            .tickFormat(d3.format(".1%")); //format to one decimal place

        vis.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y0 axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -45)
            .attr("y", -80)
            .attr("dy", "1em")
            .style("text-anchor", "end")
            .style("font-size", "1rem")
            .style("fill", vis.dataAttributes['Absorption (LHS)'].color)
            .text("Absorption (LHS) & New Supply (LHS)");

        vis.svg.append("g")
            .attr("class", "y1 axis")
            .attr("transform", "translate(" + vis.width + ",0)")
            .append("text")
            .attr("transform", "rotate(90)")
            .attr("x", 300)
            .attr("y", -45)
            .attr("dy", ".1em")
            .style("text-anchor", "end")
            .style("font-size", "1rem")
            .style("fill", vis.dataAttributes['Availability Rate (RHS)'].color)
            .text("Availability Rate (RHS)");


        vis.initButtons();
        vis.wrangleData();


    }

    initButtons() {
        let vis = this; // Reference to the class instance for use in event handlers

        // Attach event listeners to buttons
        d3.select('#scroll-left').on('click', function () {
            vis.scrollLeft();
        });
        d3.select('#scroll-right').on('click', function () {
            vis.scrollRight();
        });
    }

    // noinspection JSVoidFunctionReturnValueUsed
    wrangleData(arrayLike) {
        let vis = this;


        // Create a nested structure: an array of years, each with an array of quarters
        vis.nestedData = Array.from(d3.group(vis.data, d => d3.timeFormat("%Y")(d.parsedDate)), ([key, value]) => ({
            key,
            values: value
        }));

        // Sort the nested data by year
        vis.nestedData.sort((a, b) => d3.ascending(a.key, b.key));
        // Update the domain of the x0 scale to include only the years in the filtered data
        //vis.x0.domain(vis.nestedData.map(d => d.key).filter(year => year >= vis.startYear));

        console.log("Nested data values: ", vis.nestedData.map(yearObj => yearObj.values.map(quarterObj => quarterObj.values.map(v => `${v.name}: ${v.value}`))));


        const slicedData = vis.nestedData.slice(vis.startIndex, vis.startIndex + vis.visibleYears);
        console.log("Sliced Data: ", slicedData);

        vis.newDomain = slicedData.map(d => d.key);
        console.log("New Domain: ", vis.newDomain);

        // Update the domain of the x0 scale based on the startIndex and visibleYears
        vis.newDomain = vis.nestedData.slice(vis.startIndex, vis.startIndex + vis.visibleYears).map(d => d.key);
        vis.x0.domain(vis.newDomain);

        vis.svg.select(".x.axis").call(vis.xAxis);


        // Update the chart with the new data
        vis.updateVis();


    }


    updateVis() {
        let vis = this;

        // Set the domains for the scales
        vis.years = Array.from(d3.group(vis.nestedData, d => d3.timeFormat("%Y")(d.parsedDate)).keys());
        vis.quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

        // Find the min and max values for the y0 scale
        vis.minValue = d3.min(vis.data, d => d3.min(d.values, v => v.value));
        vis.maxValue = d3.max(vis.data, d => d3.max(d.values, v => v.value));

        // Set the domain for the y0 scale
        vis.y0.domain([vis.minValue, vis.maxValue]).nice();
        vis.x1.domain(vis.quarters).rangeRound([0, vis.x0.bandwidth()]);
        //vis.y0.domain([0, d3.max(vis.data, d => d3.max(d.values, v => v.value))]);
        vis.y1.domain([0, d3.max(vis.data, d => d.values.find(v => v.name === 'Availability Rate (RHS)').value)]);


        // Update axes
        vis.svg.select(".x.axis").call(vis.xAxis);
        vis.svg.select(".y0.axis").call(vis.yAxisLeft);
        vis.svg.select(".y1.axis").call(vis.yAxisRight);


        // console.log("vis.nestedData=", vis.nestedData);
        //
        // // Debugging: Log the data to see if it's structured correctly
        // console.log(vis.nestedData.map(d => d.values.map(v => `${v.name}: ${v.value}`)));
        // console.log("Nested data values: ", vis.nestedData.map(yearObj => yearObj.values.map(quarterObj => quarterObj.values.map(v => `${v.name}: ${v.value}`))));
        //

        vis.barGroups = vis.svg.selectAll(".bar-group")
            .data(vis.nestedData)
            .enter()
            .append("g")
            .attr("class", "bar-group")
            .attr("transform", function (d) {
                // Debugging: Log the value being used in the translate function
                console.log("Transforming group with key:", d.key, "x0 position:", vis.x0(d.key));
                return `translate(${vis.x0(d.key)},0)`;
            });

        // Loop through each year group
        vis.barGroups.each(function (yearData) {
            const yearGroup = d3.select(this);

            // Map each month to a quarter
            const monthToQuarter = month => {
                if (month >= 1 && month <= 3) return 'Q1';
                if (month >= 4 && month <= 6) return 'Q2';
                if (month >= 7 && month <= 9) return 'Q3';
                if (month >= 10 && month <= 12) return 'Q4';
                return 'Unknown';
            };

            // Loop through each quarter data
            yearData.values.forEach(quarterData => {
                // Parse the month and calculate the quarter
                const month = +quarterData.date.split("-")[1]; // '07' becomes 7
                const quarter = monthToQuarter(month);

                // Now create a group for each quarter and draw the bars
                const quarterGroup = yearGroup.append("g")
                    .attr("transform", `translate(${vis.x1(quarter)},0)`);

                // Calculate the width for each bar (half the bandwidth of quarters)
                const barWidth = vis.x1.bandwidth() / 2;

                // Draw bars for Absorption (LHS) and New Supply (LHS)
                quarterData.values.forEach((d, index) => {
                    // Filter only the required bars
                    if (d.name === 'Absorption (LHS)' || d.name === 'New Supply (LHS)') {
                        // Calculate the bar's y position and height
                        let barHeight = Math.abs(vis.y0(d.value) - vis.y0(0)); // Height is the absolute difference from 0
                        let barY = d.value >= 0 ? vis.y0(d.value) : vis.y0(0); // Y is at value if positive, at 0 if negative

                        quarterGroup.append("rect")
                            .attr("class", "bar " + d.name.replace(/\s+/g, '-').toLowerCase())
                            .attr("x", index * barWidth) // Position based on index
                            .attr("y", barY)
                            .attr("width", barWidth)
                            .attr("height", barHeight)
                            .style("fill", vis.dataAttributes[d.name].color);
                    }
                });
            });
        });

        // Append the inner x-axis to each bar group for the quarters
        vis.barGroups.each(function (d) {
            d3.select(this).append("g")
                .attr("class", "x-axis-inner")
                .attr("transform", `translate(0,${vis.height})`)
                .call(vis.xAxisInner);
        });

        // Create the line generator for Availability Rate
        vis.lineData = vis.data.map(d => ({
            date: d.date,
            value: d.values.find(v => v.name === 'Availability Rate (RHS)').value
        }));

        vis.lineGenerator = d3.line()
            .x(d => {
                const year = d.date.split('-')[0]; // Get the year part of the date
                // Calculate the quarter based on the month
                const month = d.date.split('-')[1];
                const quarter = `Q${Math.ceil(parseInt(month) / 3)}`;
                // Position the line in the center of the quarter band
                return vis.x0(year) + vis.x1(quarter) + vis.x1.bandwidth() / 2;
            })
            .y(d => vis.y1(d.value));

        // Draw the line for Availability Rate
        vis.svg.append("path")
            .datum(vis.lineData) // bind the processed data to the path
            .attr("class", "line-availability-rate")
            .attr("d", vis.lineGenerator)
            .style("stroke", vis.cColor)
            .style("stroke-width", "2px")
            .style("fill", "none");

        // Draw the circles for Availability Rate
        vis.svg.selectAll(".circle-availability-rate")
            .data(vis.lineData)
            .enter()
            .append("circle")
            .attr("class", "circle-availability-rate")
            .attr("cx", d => {
                const year = d.date.split('-')[0]; // Get the year part of the date
                // Calculate the quarter based on the month
                const month = d.date.split('-')[1];
                const quarter = `Q${Math.ceil(parseInt(month) / 3)}`;
                // Position the line in the center of the quarter band
                return vis.x0(year) + vis.x1(quarter) + vis.x1.bandwidth() / 2;
            })
            .attr("cy", d => vis.y1(d.value))
            .attr("r", 4)
            .style("fill", vis.cColor)
            .style("stroke", vis.backgroundColor)
            .style("stroke-width", "2px");

        vis.renderLegend();

    }

    renderLegend() {
        let vis = this;

        vis.svg.selectAll(".legend").remove();

        // Create a group for the legend
        //Define the starting position for the legend
        const legendStartingX = 160;
        //const legendY = -15; // Y position for the legend
        const legendSpacing = 150; // Space between legend items

        // Legend
        vis.legend = vis.svg.selectAll(".legend")
            .data(vis.keys) // Use the keys from the dataAttributes
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
            return "translate(" + (legendStartingX + i * legendSpacing) + "," + vis.legendY + ")";
        });


        vis.legend.append("rect")
            .attr("x", 0)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", function(d) { return vis.dataAttributes[d].color; });

        vis.legend.append("text")
            .attr("x", 24) // Position the text to the right of the rectangle
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start") // Align text to start at the given x position
            .style("fill", vis.textColor)
            .text(function(d) { return d; });

        // // Calculate the width of each legend item by summing up widths of text and rects
        // vis.legendItemWidths = [];
        // vis.legend.each(function () {
        //     vis.legendItemWidths.push(this.getBBox().width + 10); // Add some padding
        // });
        //
        // // Calculate the total width of the legend
        // vis.legendWidth = d3.sum(vis.legendItemWidths);
        //
        // // Calculate the starting position for the legend group
        // vis.legendStartingX = (vis.width - vis.legendWidth) / 2; // Center the legend
        //
        // // Move the legend items to their positions
        // vis.currentX = 0;
        // vis.legend.attr("transform", function (d, i) {
        //     vis.x = vis.currentX;
        //     vis.currentX += vis.legendItemWidths[i];
        //     return `translate(${vis.x},0)`;
        // });
        //
        // // Move the whole legend group to the center
        // vis.legend.attr("transform", `translate(${vis.legendStartingX},${vis.legendY})`);
    }

    // Scroll left function
    scrollLeft() {
        let vis = this;
        if (vis.startIndex > 0) {
            vis.startIndex -= 1;
            vis.wrangleData();
        }
    }

    // Scroll right function
    scrollRight() {
        let vis = this;
        if (vis.startIndex < vis.nestedData.length - vis.visibleYears) {
            vis.startIndex += 1;
            vis.wrangleData();
        }
    }


}
