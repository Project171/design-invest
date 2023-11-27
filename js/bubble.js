// SVG Size
let margin = {top: 80, right: 60, bottom: 60, left: 60};
let width = 860 - margin.left - margin.right;
let height = 400 - margin.top - margin.bottom;

// Create SVG container with id "chart-area"
const svg = d3.select("div#chart-area").append("svg")
    .attr("id", "chart-area")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Global variables
let currentYearIndex = 0;
const years = Array.from({length: 23}, (_, i) => 2001 + i); // Years from 2001 to 2023

async function loadData() {
    const data = await d3.csv("data/allocation-sector.csv");

    // Convert the loaded data to a nested JSON structure
    const jsonData = {};

    data.forEach(row => {
        const year = +row.year;
        const sector = row.sector;
        const total = +row.total;
        const yield = +row.yield;
        const income = +row.income;
        const capitalvalue = +row.capitalvalue.replace(/,/g, '');

        // Check if the year is already a key in the object
        if (!jsonData[year]) {
            jsonData[year] = {};
        }

        // Add the sector data to the object
        jsonData[year][sector] = {
            total: total, yield: yield, income: income, capitalvalue: capitalvalue
        };
    });

    // Flatten the nested structure into an array of objects
    const flatData = Object.keys(jsonData).reduce((d, year) => {
        const sectors = Object.keys(jsonData[year]);
        sectors.forEach(sector => {
            d.push({
                year: +year,
                sector: sector,
                total: jsonData[year][sector].total,
                yield: jsonData[year][sector].yield,
                income: jsonData[year][sector].income,
                capitalvalue: jsonData[year][sector].capitalvalue
            });
        });
        return d;
    }, []);

    console.log(flatData)
    const percentFormatter = d3.format("0.0%");

// Create scales
    var xScale = d3.scaleLinear()
        .domain([d3.min(flatData, d => Math.min(d.total, 0)), d3.max(flatData, d => Math.max(d.total, 0))])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([d3.min(flatData, d => Math.min(d.yield, 0)), d3.max(flatData, d => Math.max(d.yield, 0))])
        .range([height, 0]);

    var radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(flatData, d => d.capitalvalue)])
        .range([10, 45]);

    // Color scale for sectors
    var colorScale = d3.scaleOrdinal()
        .range(["rgb(148,16,16)", "rgb(231,157,19)", "rgb(42,145,46)", "rgb(15,83,134)"]);

    // Axes
    var xAxis = d3.axisBottom().scale(xScale);
    var yAxis = d3.axisLeft().scale(yScale);

// x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis.tickFormat(percentFormatter))
        .selectAll("text")
        .style("fill", "white");

// y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis.tickFormat(percentFormatter))
        .selectAll("text")
        .style("fill", "white")
        .attr("transform", "translate(0,0)"); // Adjust the y-axis position to meet x-axis at (0,0)


    // axis labels
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(" + (width - margin.bottom * 1.5) + "," + (height + margin.bottom - 10) + ")")
        .text("Cumulative Total Return (Annualized)")
        .style("fill", "white");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - margin.left * .90)
        .attr("dy", "1em")
        .text("Income Yield")
        .style("fill", "white");


// Play button for autoplay
    const playButton = d3.select("div.buttons").append("button")
        .attr("id", "playPauseButton")
        .text("Play")
        .on("click", function () {
            isPlaying = !isPlaying;
            const button = d3.select(this);

            if (isPlaying) {
                button.text("Pause");
                yearChangeButton.style("display", "none");  // Hide the button when playing
                playAnimation(flatData, xScale, yScale, radiusScale, colorScale);
            } else {
                button.text("Resume");
                clearInterval(interval);
                yearChangeButton.style("display", "block");  // Show the button when paused
                d3.select("#year-change-button").text("Change Year");
            }
        });

    // Button to show year change
    const yearChangeButton = d3.select("div").append("button")
        .attr("id", "year-change-button")
        .text("See by Year")
        .style("display", "none")  // Initially hide the button
        .on("click", function () {
            currentYearIndex = (currentYearIndex + 1) % years.length;
            yearChangeButton.text(years[currentYearIndex]);
            displayCirclesForYear(flatData, currentYearIndex, xScale, yScale, radiusScale, colorScale);
        });

    displayCirclesForYear(flatData, years.length - 1, xScale, yScale, radiusScale, colorScale);
}

function playAnimation(data, xScale, yScale, radiusScale, colorScale) {
    let autoplaySpeed = 500; // 0.5 second per year

    function step() {
        // Move to the next year
        currentYearIndex = (currentYearIndex + 1) % years.length;

        // Check if the current year is the last year in the animation
        if (currentYearIndex === 0) {  // This means we've cycled through all years and are back to the start
            clearInterval(interval);
            d3.select("#playPauseButton").text("Play Again");
            isPlaying = false;
            // Display the last year's data before stopping
            displayCirclesForYear(data, years.length - 1, xScale, yScale, radiusScale, colorScale);
            return;
        }

        displayCirclesForYear(data, currentYearIndex, xScale, yScale, radiusScale, colorScale);
        d3.select("#year-change-button").text(years[currentYearIndex]);
    }

    // Start autoplay
    interval = setInterval(step, autoplaySpeed);
}

let isPlaying = false;
let interval; // Declare interval globally to access it for clearing

function displayCirclesForYear(data, yearIndex, xScale, yScale, radiusScale, colorScale) {

    svg.selectAll("circle").remove();
    svg.selectAll(".circle-label").remove();
    d3.select(".tooltip").remove();

    //  tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Display circles for the current year
    const currentYear = years[yearIndex];
    const circlesForYear = data.filter(d => d.year === currentYear);


// Update the commentary box content with a table
    const commentaryBox = d3.select("#commentary-box");
    let commentaryContent = `<h1>${currentYear}</h1>`;

// Create the table
    commentaryContent += '<table>';
    commentaryContent += '<h5><th></th></h5><h5><th>Total Returns</th></h5><h5><th>Income Returns</th></h5><h5><th>Capital Value</th></h5>';

    circlesForYear.forEach(d => {
        const sectorColor = colorScale(d.sector); // Get color based on the color scale
        commentaryContent += `<tr style="color:${sectorColor};"><td><strong>${d.sector}</strong></td><td>${(d.total * 100).toFixed(0)}%</td><td>${(d.income).toFixed(0)}%</td><td>${(d.capitalvalue / 1e9).toFixed(0)}B</td></tr>`;
    });

    commentaryContent += '</table>';
    commentaryBox.html(commentaryContent);

// // Add legend
//     const legend = svg.append("g")
//         .attr("class", "legend");
// // Legend rectangles
//     const legendRect = legend.selectAll("rect")
//         .data(colorScale.range())
//         .enter().append("rect")
//         .attr("x", width - 1)
//         .attr("y", (d, i) => i * 20)
//         .attr("width", 18)
//         .attr("height", 18)
//         .style("fill", d => colorScale(d));
//
//     // Legend text
//     const legendText = legend.selectAll("text")
//         .data(circlesForYear)
//         .enter().append("text")
//         .attr("x", width-1)
//         .attr("y", (d, i) => i * 20 + 9)
//         .attr("dy", ".35em")
//         .text(d => d.sector)
//         .style("fill", d => colorScale(d.sector));

    function getTooltipBackgroundColor(sector) {
        return colorScale(sector);
    }

    // Create circles
    svg.selectAll("circle")
        .data(circlesForYear)
        .enter().append("circle")
        .attr("cx", d => xScale(d.total))
        .attr("cy", d => yScale(d.yield))
        .attr("r", d => radiusScale(d.capitalvalue))
        // .style("fill", "black")
        .style("stroke", d => colorScale(d.sector))
        // .style("stroke", "white")
        // .style("fill", d => colorScale(d.sector))
        .style("stroke-width", "35")
        .style("opacity", 0.85)

        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.95)
                .style("background-color", getTooltipBackgroundColor(d.sector));

            tooltip.html(`<h4>${d.sector}</h4><br><h5><strong>Total Returns:</strong></h5> ${(d.total * 100).toFixed(1) + "%"}<br><h5><strong>Income Yield:</strong></h5> ${(d.yield * 100).toFixed(1) + "%"}<br><h5><strong>Capital Value:</strong></h5> ${(d.capitalvalue / 1e9).toFixed(1) + "B"}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })

        .on("mouseout", function () {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        });

    // // Text labels within circles
    // svg.selectAll(".circle-label")
    //     .data(circlesForYear)
    //     .enter().append("text")
    //     .attr("class", "circle-label")
    //     .attr("x", d => xScale(d.total))
    //     .attr("y", d => yScale(d.yield))
    //     .attr("dy", 5)
    //     .attr("text-anchor", "middle")
    //     .text(d => (d.capitalvalue / 1e9).toFixed(0) + "B") // In Billions
    //     .style("font-size", "12px")
    //     .style("fill", "black")
    //     // .style("fill", d => colorScale(d.sector));

// Check if autoplay is enabled and pause at the end of the animation
    if (!isPlaying && yearIndex === years.length - 1) {
        clearInterval(interval);
        return;
    }
    // Move to the next year if autoplay is enabled
    if (isPlaying) {
        yearIndex = (yearIndex) % years.length;
        d3.select("#year-change-button").text(years[yearIndex]);
    }
}

loadData();
