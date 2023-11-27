var svg = d3.select("#timeline-svg"),
    margin = {top: 20, right: 20, bottom: 20, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

var x = d3.scaleTime()
    .domain([new Date(2000, 0, 1), new Date(2020, 0, 1)]) // Use your own date range
    .range([0, width]);

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xAxis = d3.axisBottom(x);

context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

var brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("brush end", brushed);

context.append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

function brushed() {
    var selection = d3.event.selection;

}
