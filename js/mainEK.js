/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let myMap,
    myRetail,
    myIndustrial,
    myMultifamily,
    myOffice;

let selectedTimeRange = [];
let selectedCategory;

// load data using promises
let promises = [
    d3.json("data/canada.topo.json"),
    d3.json("data/filtered_file.json"),
    d3.csv("data/IndustrialAvailability.csv"),
    d3.csv("data/OfficeVacancy.csv"),
    d3.csv("data/RentalRateGrowthMultifamily_modified.csv"),
    d3.csv("data/Retail.csv")
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data);
    })
    .catch(function (err) {
        console.error('Error loading data: ', err);
        // Display an error message to the user, or handle the error as appropriate.
    });

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray);

    // Assume dataArray[1], dataArray[2], dataArray[3], dataArray[4] contain data for each sector respectively
    let geoData = dataArray[1];
    let citiesData = dataArray[2];
    let industrialData = dataArray[3];
    let officeData = dataArray[4];
    let multifamilyData = dataArray[5];
    let retailData = dataArray[6];

    // Initialize map
    myMap = new CanadaMap('canada', geoData, citiesData, industrialData, multifamilyData, retailData);
    // myMap = new mapVis('canada', "data/canada.topo.json", "data/filtered_file.json", 'brushDiv');
    // Initialize map with actual data
    //myMap = new MapVis('canada', officeData, geoData, citiesData, industrialData, multifamilyData, retailData);

    console.log(officeData);

    // Initialize visualizations for each sector
    myIndustrial = new IndustrialVis('industrialVis', industrialData);
    myOffice = new CanadaMap('officeVis', officeData);
    myMultifamily = new MultifamilyVis('multifamilyVis', multifamilyData);
    myRetail = new RetailVis('retailVis', retailData);

    // init brush
    myBrushVis = new BrushVis('brushDiv', industrialData, officeData, multifamilyData, retailData);

    // Listen for the category selector change
    // document.getElementById('categorySelector').addEventListener('change', categoryChange);

    // Load each sector SVG
    loadSVG('industrial', 'img/industrial.svg');
    loadSVG('office', 'img/office.svg');
    loadSVG('multi', 'img/multi.svg');
    loadSVG('retail', 'img/retail.svg');


//     // Set the initial category
//     categoryChange();
}

// Category change function
// function categoryChange() {
//     selectedCategory = document.getElementById('categorySelector').value;
//
//     if (myMap) {
//         myMap.wrangleData();
//     } else {
//         console.error('myMap is not initialized');
//     }
//     if (myRetail) {
//         myRetail.wrangleData();
//     } else {
//         console.error('retail is not initialized');
//     }
//     // After initializing myBarVisOne and myBarVisTwo
//     if (myIndustrial) {
//         myIndustrial.wrangleData();
//     } else {
//         console.error('industrial is not initialized');
//     }
//
//     if (myMultifamily) {
//         myMultifamily.wrangleData();
//     } else {
//         console.error('multifamily is not initialized');
//     }
//
//     if (myOffice) {
//         myOffice.wrangleData();
//     } else {
//         console.error('office is not initialized');
//     }
// }

// Function to load and append SVG to the container
function loadSVG(sectorId, filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(svgData => {
            document.getElementById(sectorId).innerHTML = svgData;
            // Add your hover event listener here
            document.getElementById(sectorId).addEventListener('mouseenter', () => {
                // Update the map based on the sector hovered
                updateMapForSector(sectorId);
            });
        });
}

// Function to update the map visualization based on the sector
function updateMapForSector(sectorId) {
    // Logic to update the map visualization
    console.log(`Update map for sector: ${sectorId}`);

    // Update the map based on the sector hovered
    myMap.wrangleData(sectorId);
    myBrushVis.wrangleData(sectorId);
    // myRetail.wrangleData(sectorId);
    // myIndustrial.wrangleData(sectorId);
    // myMultifamily.wrangleData(sectorId);
    // myOffice.wrangleData(sectorId);


}


// Ensure the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Fetch and load the industrial SVG
    fetch('img/industrial.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('industrial').innerHTML = data;
        });

    // Repeat the process for multi, office, and retail
    fetch('img/multi.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('multi').innerHTML = data;
        });

    fetch('img/office.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('office').innerHTML = data;
        });

    fetch('img/retail.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('retail').innerHTML = data;
        });
});

