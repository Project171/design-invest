class SectorVis {
    constructor(_parentElement, _vacancyData, _rentGrowthData, _colors, _industrial) {
        this.parentElement = _parentElement;
        this.vacancyData = _vacancyData;
        this.rentGrowthData = _rentGrowthData;
        this.vColor = _colors.vColor;
        this.eColor = _colors.eColor;
        this.cColor = _colors.cColor;
        this.tColor = _colors.tColor;
        this.oColor = _colors.oColor;
        this.mColor = _colors.mColor;
        this.rentGrowthColor = _colors.rentGrowthColor;
        this.vacancyColor = _colors.vacancyColor;
        this.combinedData = []; // Initialize combinedData
        this.selectedMarket = "Toronto"; // Initialize selectedMarket
        this.selectedSector = 'vacancy';
        this.timelineRange = null; // Initialize timelineRange
        this.currentView = 'line'; // Default view

        this.colors = {
            "Toronto": _colors.vColor,
            "Montreal": _colors.mColor,
            "Ottawa": _colors.oColor,
            "Vancouver": _colors.vColor,
            "Calgary": _colors.cColor,
            "Edmonton": _colors.eColor
        };
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };
        vis.width = 800 - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Event listener for the dropdown
        d3.select("#regionDropdown").on("change", (event) => {
            this.selectedMarket = event.target.value;
            this.wrangleData();
        });

        // Initialize Timeline
        vis.initTimeline();
        vis.initSectorIcons();
        vis.wrangleData();
    }


    wrangleData() {
        let vis = this;

        // Process the raw data
        vis.processedVacancyData = vis.processIndustrialData(vis.vacancyData);
        vis.processedRentGrowthData = vis.processIndustrialData(vis.rentGrowthData);

        // Combine the processed data
        vis.combinedData = vis.combineData(vis.processedVacancyData, vis.processedRentGrowthData);

        // Check if the data arrays are valid
        if (!Array.isArray(vis.vacancyData) || !Array.isArray(vis.rentGrowthData)) {
            console.error('Data is not in array format');
            return;
        }

        // Filter or modify the combinedData based on the selected region
        if (vis.selectedMarket) {
            vis.filteredData = vis.combinedData.filter(d => {
                // Example filter condition - modify according to your data structure
                return d.market === vis.selectedMarket;
            });
        } else {
            // If no market is selected, use the combined data as is
            vis.filteredData = vis.combinedData;
        }

        // Update the visualization with the filtered or unfiltered data
        vis.updateTimeline();
        vis.updateVis();
    }


    updateTimeline() {
        let vis = this;

        // Update the timeline scale domain if needed
        let quarters = vis.combinedData.map(d => d.date); // Adjust as needed
        vis.timelineX.domain(quarters);

        // Redraw the axis
        vis.timelineSvg.select(".x.axis")
            .call(d3.axisBottom(vis.timelineX).tickFormat(function (d, i) {
                return i % 4 === 0 ? d : ""; // Adjust formatting as needed
            }));


        // Update brush
        var brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height - 2]]) // Adjusted height for brush
            .on("end", function (event) {
                vis.brushEnded(event);
            });



    }

    combineData() {
        let vis = this;
        let combinedData = [];

        vis.processedVacancyData.forEach(vacancyRecord => {
            if (vacancyRecord.date) {
                let rentGrowthRecord = vis.processedRentGrowthData.find(rentRecord => rentRecord.date && rentRecord.date.getTime() === vacancyRecord.date.getTime());

                if (rentGrowthRecord) {
                    combinedData.push({
                        date: vacancyRecord.date,
                        Toronto_vacancy: vacancyRecord.Toronto,
                        Montreal_vacancy: vacancyRecord.Montreal,
                        Ottawa_vacancy: vacancyRecord.Ottawa,
                        Vancouver_vacancy: vacancyRecord.Vancouver,
                        Calgary_vacancy: vacancyRecord.Calgary,
                        Edmonton_vacancy: vacancyRecord.Edmonton,
                        Toronto_rentGrowth: rentGrowthRecord.Toronto,
                        Montreal_rentGrowth: rentGrowthRecord.Montreal,
                        Ottawa_rentGrowth: rentGrowthRecord.Ottawa,
                        Vancouver_rentGrowth: rentGrowthRecord.Vancouver,
                        Calgary_rentGrowth: rentGrowthRecord.Calgary,
                        Edmonton_rentGrowth: rentGrowthRecord.Edmonton
                    });
                } else {
                    console.log(`No matching rent growth record found for date: ${vacancyRecord.date}`);
                }
            } else {
                console.log('Missing date in vacancy record:', vacancyRecord);
            }
        });

        console.log("Combined Data after processing:", combinedData);
        return combinedData;
    }


    parseQuarterlyDate(dateString) {
        const parts = dateString.split(' '); // Split by space
        const year = parts[1]; // The year is the second part
        let month;

        // Determine the month based on the quarter
        switch(parts[0]) {
            case 'Q1':
                month = '01';
                break;
            case 'Q2':
                month = '04';
                break;
            case 'Q3':
                month = '07';
                break;
            case 'Q4':
                month = '10';
                break;
            default:
                console.error("Invalid quarter:", parts[0]);
                return null; // Return null for invalid quarter
        }

        return new Date(`${year}-${month}-01`); // Construct a date object
    }


    processIndustrialData(data) {
        let vis = this;
        vis.processedData = [];

        if (!Array.isArray(data)) {
            console.error("Data is not an array:", data);
            return [];
        }

        data.forEach(row => {
            let date = vis.parseQuarterlyDate(row['Date']);
            console.log(`Parsed date for ${row['Date']}:`, date); // Add this line for debugging
            vis.processedData.push({
                date: date,
                Toronto: +row['Toronto'] || null,
                Montreal: +row['Montreal'] || null,
                Ottawa: +row['Ottawa'] || null,
                Vancouver: +row['Vancouver'] || null,
                Calgary: +row['Calgary'] || null,
                Edmonton: +row['Edmonton'] || null
            });
        });

        return vis.processedData;
    }

    initTimeline() {
        let vis = this;

        var margin = {top: 10, right: 30, bottom: 50, left: 30}, width = 860 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        var svg = d3.select("#timeline2").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + 50)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



        // Extract quarters or appropriate time labels from combinedData
        let quarters = vis.combinedData.map(d => d.date); // Adjust this to your date format


        // Define the x scale for the timeline
        vis.x = d3.scalePoint()
            .domain(quarters)
            .range([0, width]);

        var xAxis = d3.axisBottom(vis.x).tickFormat(function (d, i) {
            return i % 4 === 0 ? d : ""; // Only display every 4th label
        });


        var gX = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Rotate the text labels
        gX.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-55)"); // Adjust the angle as needed

        vis.brush = d3.brushX()
            .extent([[0, 0], [width, height - 2]]) // Adjusted height for brush
            .on("end", function (event) {
                vis.brushEnded(event);
            });

        svg.append("g")
            .attr("class", "brush")
            .call(vis.brush);
    }

    brushEnded(event) {
        let vis = this;
        if (!event.selection) return; // If no selection, do nothing

        function invertPointScale(scale, value, rangePadding) {
            // Assuming rangePadding is the padding you have on both sides of the range
            const domain = scale.domain();
            const range = scale.range();
            const eachBand = (range[range.length - 1] - rangePadding * 2) / (domain.length - 1);

            const index = Math.max(0, Math.min(domain.length - 1, Math.floor((value - rangePadding) / eachBand)));

            return domain[index];
        }


        const rangePadding = 0; // Adjust based on scale's range settings

        // Convert pixel coordinates to data using the custom invert function
        const quarters = event.selection.map(pixelValue => invertPointScale(vis.x, pixelValue, rangePadding));

        // Convert pixel coordinates to data values
        const selectionRange = event.selection.map(vis.timelineX.invert);

        // Filter the data based on the selected range
        vis.filteredData = vis.combinedData.filter(d =>
            d.date >= selectionRange[0] && d.date <= selectionRange[1]
        );

        // Optionally, update the visualization with the filtered data
        vis.updateVis();
    }



    // invertPointScale(scale, value) {
    //     // Function to invert a point scale (find the closest domain value for a given pixel position)
    //     const domain = scale.domain();
    //     const range = scale.range();
    //     const rangePoints = range.map((d, i) => [d, domain[i]]);
    //     let minDistance = Math.abs(rangePoints[0][0] - value);
    //     let closestElement = rangePoints[0][1];
    //
    //     rangePoints.forEach(function (d) {
    //         let distance = Math.abs(d[0] - value);
    //         if (distance < minDistance) {
    //             minDistance = distance;
    //             closestElement = d[1];
    //         }
    //     });
    //
    //     return closestElement;
    // }

    updateVis() {
        let vis = this;

        // Determine which data set to use (filtered data if available, otherwise the full data)
        let dataToUse = vis.filteredData && vis.filteredData.length > 0 ? vis.filteredData : vis.combinedData;

        // Remove existing chart elements
        vis.svg.selectAll(".bar").remove();
        vis.svg.selectAll("path").remove();


        // Draw the chart based on the current view and selected sector
        if (vis.currentView === 'line') {
            if (vis.selectedSector === 'vacancy') {
                // Call a method to draw the line chart for vacancy
                vis.drawLineChartVacancy(dataToUse);
            } else if (vis.selectedSector === 'rentGrowth') {
                // Call a method to draw the line chart for rent growth
                vis.drawLineChartRentGrowth(dataToUse);
            }
        } else if (vis.currentView === 'bar') {
            if (vis.selectedSector === 'vacancy') {
                // Call a method to draw the bar chart for vacancy
                vis.drawBarChartVacancy(dataToUse);
            } else if (vis.selectedSector === 'rentGrowth') {
                // Call a method to draw the bar chart for rent growth
                vis.drawBarChartRentGrowth(dataToUse);
            }
        }
    }


    drawLineChart() {
        let vis = this;

        // Ensure combinedData is defined and not empty
        if (!vis.combinedData || vis.combinedData.length === 0) {
            console.error("No data available for line chart");
            return;
        }

        // Log data structure for debugging
        console.log("Combined Data for Line Chart:", vis.combinedData);


        // Define scales
        let xScale = d3.scaleTime()
            .domain(d3.extent(vis.combinedData, d => d.date))
            .range([0, vis.width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => Math.max(d[vis.selectedMarket + "_vacancy"], d[vis.selectedMarket + "_rentGrowth"]))])
            .range([vis.height, 0]);

        // Define line generator for each market
        let line = d3.line()
            .defined(d => !isNaN(d[vis.selectedMarket + "_vacancy"])) // Only draw line for defined data
            .x(d => xScale(d.date))
            .y(d => yScale(d[vis.selectedMarket + "_vacancy"]));

        // Append a path for each market
        Object.keys(vis.colors).forEach(market => {
            // Check if the market data is present
            if (!vis.combinedData.some(d => typeof d[market + "_vacancy"] === 'number')) {
                console.warn(`Data for market ${market} is not available`);
                return;
            }

            vis.svg.append("path")
                .datum(vis.combinedData.filter(d => !isNaN(d[market + "_vacancy"]))) // Filter out undefined data
                .attr("fill", "none")
                .attr("stroke", vis.colors[market])
                .attr("d", line);
        });



        console.log("Combined Data Sample:", vis.combinedData.slice(0, 5)); // Log a sample of the combined data
        console.log("X Scale Result Sample:", vis.combinedData.slice(0, 5).map(d => xScale(d.date)));
        console.log("Y Scale Result Sample for a Market:", vis.combinedData.slice(0, 5).map(d => yScale(d.selectedMarket))); // Replace 'Toronto' with the selected market
        console.log("Selected Market:", vis.selectedMarket);
        console.log("Data Object Keys:", Object.keys(vis.combinedData[0]));
        console.log("Dynamic Key for Y Scale:", vis.selectedMarket + "_vacancy");

        console.log("Toronto Vacancy Values:", vis.combinedData.map(d => d.Toronto_vacancy));


        // Define axes
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        // Append X axis
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(xAxis);

        // Append Y axis
        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(yAxis);
    }
    initSectorIcons() {
        let vis = this;
        const sectors = {
            'vacancy': "img/vacancy.svg",
            'rentGrowth': "img/rentGrowth.svg"
        };

        // Select the h3 element
        const header = document.querySelector('#industrial1 h3');

        Object.entries(sectors).forEach(([sector, iconPath]) => {
            fetch(iconPath)
                .then(response => response.text())
                .then(svgData => {
                    document.getElementById(sector).innerHTML = svgData;
                })
                .then(() => {
                    document.getElementById(sector).addEventListener("click", function() {
                        // Update the selected sector
                        vis.selectedSector = sector;
                        // Check if the sector is 'rentGrowth' to update the text accordingly
                        if (sector === 'rentGrowth') {
                            header.textContent = 'Rent Growth in Industrial Sector';
                        } else {
                            // Update the h3 text with the sector name for other sectors
                            header.textContent = `${sector.charAt(0).toUpperCase() + sector.slice(1)} in Industrial Sector`;
                        }

                        if (vis.selectedSectorElement) {
                            vis.selectedSectorElement.classList.remove(`${vis.selectedSectorElement.id}-clicked`);
                        }
                        vis.selectedSectorElement = this;
                        vis.selectedSectorElement.classList.add(`${sector}-clicked`);

                        // Call updateVis to redraw the chart
                        vis.updateVis();
                    });
                });
        });
    }

    drawLineChartVacancy(data) {
        let vis = this;

        // Define scales for vacancy data
        let xScale = d3.scaleTime()
            .domain(d3.extent(vis.combinedData, d => d.date))
            .range([0, vis.width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => d[vis.selectedMarket + "_vacancy"])])
            .range([vis.height, 0]);

        // Define the line generator
        let line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d[vis.selectedMarket + "_vacancy"]));

        // Draw the line for vacancy
        vis.svg.append("path")
            .datum(vis.combinedData)
            .attr("fill", "none")
            .attr("stroke", vis.vacancyColor)
            .attr("d", line);

        // Add X and Y axes
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(xScale));

        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(yScale));
    }

    drawLineChartRentGrowth(data) {
        let vis = this;

        // Define scales for rent growth data
        let xScale = d3.scaleTime()
            .domain(d3.extent(vis.combinedData, d => d.date))
            .range([0, vis.width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => d[vis.selectedMarket + "_rentGrowth"])])
            .range([vis.height, 0]);

        // Define the line generator
        let line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d[vis.selectedMarket + "_rentGrowth"]));

        // Draw the line for rent growth
        vis.svg.append("path")
            .datum(vis.combinedData)
            .attr("fill", "none")
            .attr("stroke", vis.rentGrowthColor)
            .attr("d", line);

        // Add X and Y axes
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(xScale));

        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(yScale));
    }


    drawBarChartVacancy(data) {
        let vis = this;

        // Define scales for bar chart
        let xScale = d3.scaleBand()
            .domain(vis.combinedData.map(d => d.date))
            .range([0, vis.width])
            .padding(0.1);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => d[vis.selectedMarket + "_vacancy"])])
            .range([vis.height, 0]);

        // Draw bars for vacancy
        vis.svg.selectAll(".bar")
            .data(vis.combinedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.date))
            .attr("y", d => yScale(d[vis.selectedMarket + "_vacancy"]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => vis.height - yScale(d[vis.selectedMarket + "_vacancy"]))
            .attr("fill", vis.vacancyColor);

        // Add X and Y axes
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(xScale));

        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(yScale));
    }



    drawBarChartRentGrowth(data) {
        let vis = this;

        // Define scales for bar chart
        let xScale = d3.scaleBand()
            .domain(vis.combinedData.map(d => d.date))
            .range([0, vis.width])
            .padding(0.1);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => d[vis.selectedMarket + "_rentGrowth"])])
            .range([vis.height, 0]);

        // Draw bars for rent growth
        vis.svg.selectAll(".bar")
            .data(vis.combinedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.date))
            .attr("y", d => yScale(d[vis.selectedMarket + "_rentGrowth"]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => vis.height - yScale(d[vis.selectedMarket + "_rentGrowth"]))
            .attr("fill", vis.rentGrowthColor);

        // Add X and Y axes
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(xScale));

        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(yScale));
    }

    updateHeaderText(text) {
        let vis = this;
        const header = document.querySelector('#industrial1 h3');
        header.textContent = text;
    }
    getSectorColor(sector) {
        let vis = this;
        switch(sector) {
            case 'vacancy': return vis.vacancyColor;
            case 'rentGrowth': return vis.rentGrowthColor;
            default: return 'black'; // Default color if no match is found
        }
    }
    drawBarChart() {
        let vis = this;

        // Define scales
        let x0Scale = d3.scaleBand()
            .domain(vis.combinedData.map(d => d.date))
            .rangeRound([0, vis.width])
            .paddingInner(0.1);

        let x1Scale = d3.scaleBand()
            .domain(Object.keys(vis.colors))
            .rangeRound([0, x0Scale.bandwidth()])
            .padding(0.05);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.combinedData, d => Math.max(...Object.keys(vis.colors).map(market => d[market + "_vacancy"])))])
            .range([vis.height, 0]);

        // Add the bars for each market
        vis.combinedData.forEach(d => {
            Object.keys(vis.colors).forEach((market, i) => {
                let marketDataKey = market + "_vacancy"; // Construct the data key dynamically
                vis.svg.append("rect")
                    .attr("class", "bar")
                    .attr("x", x0Scale(d.date) + x1Scale.bandwidth() * i)
                    .attr("y", yScale(d[marketDataKey]))
                    .attr("width", x1Scale.bandwidth())
                    .attr("height", vis.height - yScale(d[marketDataKey]))
                    .attr("fill", vis.colors[market]);
            });
        });

        // Define axes
        let xAxis = d3.axisBottom(x0Scale).tickFormat(d3.timeFormat("%Y-%Q")); // Format ticks for quarterly data
        let yAxis = d3.axisLeft(yScale);

        // Append X axis
        vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(xAxis);

        // Append Y axis
        vis.svg.append("g")
            .attr("class", "axis y-axis")
            .call(yAxis);



    }


    toggleView(newView) {
        let vis = this;

        // Update current view and redraw the chart
        vis.currentView = newView;
        vis.updateVis();
    }
}
