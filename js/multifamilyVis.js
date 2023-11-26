/* * * * * * * * * * * * * *
*      MultifamilyVis       *
* * * * * * * * * * * * * */

class MultifamilyVis {
    constructor(parentElement, multifamilyData) {
        this.parentElement = parentElement;
        this.multifamilyData = multifamilyData;

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
// let myMultifamilyVis = new MultifamilyVis("#multifamily-vis-container", multifamilyData);
// myMultifamilyVis.wrangleData();
