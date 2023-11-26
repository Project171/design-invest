/* * * * * * * * * * * * * *
*      RetailVis       *
* * * * * * * * * * * * * */

class RetailVis {
    constructor(parentElement, retailData) {
        this.parentElement = parentElement;
        this.retailData = retailData;

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Initialize drawing area dimensions, scales, axes, etc.
        // ...

        // Call the function to update the visualization
        this.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Process data and prepare it for visualization
        // ...

        // Call the function to update the visualization
        this.updateVis();
    }

    updateVis() {
        let vis = this;

        // Bind data to the visualization elements and render them
        // ...
    }
}

// Example usage:
// let myRetailVis = new retailVis("#retail-vis-container", retailData);
// myRetailVis.wrangleData();
