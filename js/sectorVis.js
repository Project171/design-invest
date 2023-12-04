class SectorVis {
    constructor(_parentElement, _vacancyData, _rentGrowthData, _colors) {
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


        // Initialize Timeline
        vis.initTimeline();
        vis.initSectorIcons();
        vis.wrangleData();
    }


    wrangleData() {
        let vis = this;

        vis.processedVacancyData = vis.processIndustrialData(vis.vacancyData);
        console.log("processedVacancyData: ", vis.processedVacancyData);

        vis.processedRentGrowthData = vis.processIndustrialData(vis.rentGrowthData);
        console.log("processedRentGrowthData: ", vis.processedRentGrowthData);

        vis.combinedData = vis.combineData(vis.processedVacancyData, vis.processedRentGrowthData);
        console.log("combinedData: ", vis.combinedData);

        if (!Array.isArray(vis.vacancyData) || !Array.isArray(vis.rentGrowthData)) {
            console.error('Data is not in array format');
            return;
        }


        // Update the visualization
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

        // Define margin, width, and height
        let margin = {top: 10, right: 30, bottom: 50, left: 30},
            width = 960 - margin.left - margin.right, // Adjust as needed
            height = 100 - margin.top - margin.bottom; // Adjust as needed

        // Create SVG for timeline
        vis.timelineSvg = d3.select("#timeline2") // Adjust selector as needed
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Extract quarters or appropriate time labels from combinedData
        let quarters = vis.combinedData.map(d => d.date); // Adjust this to your date format

        // Define the scale for the timeline
        vis.timelineX = d3.scalePoint()
            .domain(quarters)
            .range([0, width]);

        // Define and append the X-axis with tick format
        vis.timelineSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(vis.timelineX).tickFormat(function (d, i) {
                return i % 4 === 0 ? d : "";
            }));

        // Define and append the X-axis with tick format
        let xAxis = d3.axisBottom(vis.timelineX).tickFormat(function (d, i) {
            return i % 4 === 0 ? d : ""; // Only display every 4th label
        });

        let gX = vis.timelineSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        // Rotate the text labels as in VectomMapVis
        gX.selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-55)"); // Adjust the angle as needed


        // Add brush
        var brush = d3.brushX()
            .extent([[0, 0], [width, height - 2]]) // Adjusted height for brush
            .on("end", function (event) {
                vis.brushEnded(event);
            });

        svg.append("g")
            .attr("class", "brush")
            .call(brush);
    }

    brushEnded(event) {
        let vis = this;

        if (!event.selection) return;
        var selectedRange = event.selection.map(d => vis.invertPointScale(vis.x, d));
        var startQuarter = selectedRange[0];
        var endQuarter = selectedRange[1];

        // Update the visualization
        vis.updateVis();
    }



    invertPointScale(scale, value) {
        // Function to invert a point scale (find the closest domain value for a given pixel position)
        const domain = scale.domain();
        const range = scale.range();
        const rangePoints = range.map((d, i) => [d, domain[i]]);
        let minDistance = Math.abs(rangePoints[0][0] - value);
        let closestElement = rangePoints[0][1];

        rangePoints.forEach(function (d) {
            let distance = Math.abs(d[0] - value);
            if (distance < minDistance) {
                minDistance = distance;
                closestElement = d[1];
            }
        });

        return closestElement;
    }

    updateVis() {
        let vis = this;

        // Remove existing chart elements
        vis.svg.selectAll(".bar").remove();
        vis.svg.selectAll("path").remove();



        // Draw the chart based on the current view
        if (vis.currentView === 'line') {
            vis.drawLineChart();
            console.log("drawLineChart:");
        } else if (vis.currentView === 'bar') {
            vis.drawBarChart();
            console.log("drawBarChart:");
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
                        // Update the h3 text with the sector name
                        header.textContent = `${sector.charAt(0).toUpperCase() + sector.slice(1)}`;

                        if (vis.selectedSectorElement) {
                            vis.selectedSectorElement.classList.remove(`${vis.selectedSectorElement.id}-clicked`);
                        }
                        vis.selectedSectorElement = this;
                        vis.selectedSectorElement.classList.add(`${sector}-clicked`);
                        let sectorColor = vis.getSectorColor(sector);
                        vis.updateHeaderText(`${sector.charAt(0).toUpperCase() + sector.slice(1)} by Market`);
                    });
                });
        });
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
