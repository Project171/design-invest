/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */


// Combined Global Variables
let myMap, VectomMap, mySectorVis;
let macroChart, consumerChart, unemploymentChart, mortgageChart;

// Function to convert date objects to strings or reverse
let dateParser = d3.timeParse("%m/%d/%Y");


let geoDataPath = "data/canada.topo.json";
let populationDataPath = "data/canada_provinces_pop.csv";


let promises = [
    d3.csv("data/macro.csv"),
    d3.csv("data/consumer.csv"),
    d3.csv("data/housing.csv"),
    d3.json(geoDataPath),
    d3.json("data/filtered_file.json"),
    d3.csv("data/vacancy.csv"),
    d3.csv("data/rentGrowth.csv"),
    d3.csv(populationDataPath)
];


Promise.all(promises)
    .then(function (data) {
        // Rename the column in the first dataset only
        const renamedData = data.map(function (dataset, index) {
            if (index === 0) {
                return dataset.map(function (row) {
                    return {
                        date: dateParser(row['Date']),
                        // consumer_index: +row['Consumer price index'],
                        // consumption: +row['Consumption, private, real, LCU'],
                        // employment: +row['Employment, total'],
                        // gdp: +row['GDP, real, LCU'],
                        // interest_bank: +row['Interest rate, central bank policy'],
                        // interest_bond: +row['Interest rate, 10-Year Benchmark Bond Yield'],
                        // population: +row['Population, total'],
                        unemployment: +row['Unemployment rate'],
                        gdp_yy_chg: +row['GDP, real, LCU, Y/Y %Chg'],

                    };
                });
            } else if (index === 1) {
                return dataset.map(function (row) {
                    return {
                        date: dateParser(row['Date']),
                        // alc_tob_narc: +row['Consumer spending, nominal, LCU - Alcoholic beverages, tobacco and narcotics - Total'],
                        clothing: +row['Consumer spending, nominal, LCU - Clothing and footwear - Total'],
                        eating_out: +row['Consumer spending, nominal, LCU - Eating out'],
                        // comms_gs: +row['Consumer spending, nominal, LCU - Communication goods and services - Total'],
                        // fin_serv: +row['Consumer spending, nominal, LCU - Financial services not elsewhere classified'],
                        food_bev: +row['Consumer spending, nominal, LCU - Food and non-alcoholic beverages - Total'],
                        // furniture: +row['Consumer spending, nominal, LCU - Furniture and furnishings, carpets and other floor coverings'],
                        health_gs: +row['Consumer spending, nominal, LCU - Health goods and services - Total'],
                        household_outdoor: +row['Consumer spending, nominal, LCU - Household and garden tools and equipment'],
                        household_appliances: +row['Consumer spending, nominal, LCU - Household appliances'],
                        household_expenditures: +row['Consumer spending, nominal, LCU - Household furnishings, household equipment and other housing expenditure - Total'],
                        // household_utensils: +row['Consumer spending, nominal, LCU - Household glassware, tableware and household utensils'],
                        // housing_electric_gas: +row['Consumer spending, nominal, LCU - Housing electricity, gas and other fuels'],
                        housing_maintenance: +row['Consumer spending, nominal, LCU - Housing maintenance and repairs'],
                        // housing_rent: +row['Consumer spending, nominal, LCU - Housing rent'],
                        // imputed_housing_rent: +row['Consumer spending, nominal, LCU - Imputed housing rent'],
                        medical_products: +row['Consumer spending, nominal, LCU - Medical products, appliances and equipment'],
                        // newspapers_books: +row['Consumer spending, nominal, LCU - Newspapers, books and stationery'],
                        // non_alc_beverages: +row['Consumer spending, nominal, LCU - Non-alcoholic beverages'],
                        // non_personal_transport: +row['Consumer spending, nominal, LCU - Non-personal transport services'],
                        // other_gs: +row['Consumer spending, nominal, LCU - Other goods and services - Total'],
                        // other_rec_cult: +row['Consumer spending, nominal, LCU - Other recreational and cultural durable goods'],
                        // other_rec: +row['Consumer spending, nominal, LCU - Other recreational items and equipment'],
                        personal_gs: +row['Consumer spending, nominal, LCU - Personal care goods and services'],
                        // personal_transport: +row['Consumer spending, nominal, LCU - Personal transport running costs'],
                        rec_cult: +row['Consumer spending, nominal, LCU - Recreational and cultural goods and services - Total'],
                        restaurants_hotels: +row['Consumer spending, nominal, LCU - Restaurants and hotels  - Total'],
                        // household_gs: +row['Consumer spending, nominal, LCU - Routine household maintenance goods and services'],
                        // telephone_equip: +row['Consumer spending, nominal, LCU - Telephone equipment'],
                        // telephone_serv: +row['Consumer spending, nominal, LCU - Telephone services'],
                        total_consumer_spending: +row['Consumer spending, nominal, LCU - Total consumer spending'],
                        // transport_vehicles: +row['Consumer spending, nominal, LCU - Transport services and vehicle purchases - Total'],
                        // vehicles: +row['Consumer spending, nominal, LCU - Vehicle purchases']
                    }
                })
            } else if (index === 2) {
                return dataset.map(function (row) {
                    return {
                        date: dateParser(row['Date']),
                        sale_price_index: +row['CREA Average Residential Sale Price Index'],
                        // housing_starts: +row['Housing starts'],
                        mortgage_rates: +row['Interest rate on fixed 5-year mortgages [%]'],
                        housing_market_value: +row['Market value of housing stock, LCU [C$; Millions]'],
                    }
                })

            } else {
                // For other datasets, keep them as they are
                return dataset;
            }
        });

        initMainPage(renamedData);
    })
    .catch(function (err) {
        console.error('Error loading data: ', err);
        // Display an error message to the user, or handle the error as appropriate.
    });

// initMainPage
function initMainPage(dataArray) {

    let macro_data = dataArray[0]
    let consumer_data = dataArray[1]
    let housing_data = dataArray[2]
    let geoData = dataArray[3];
    let citiesData = dataArray[4];
    let vacancyData = dataArray[5];
    let rentGrowthData = dataArray[6];
    let populationData = dataArray[7];

    let colors = getColorDefinitions();
    console.log(colors)


    console.log("macro_data: ", macro_data)
    console.log("consumer_data: ", consumer_data)
    console.log("housing_data: ", housing_data)

    // log data
    console.log('check out ALL the data', dataArray);

    let macroEventHandler = {
        bind: (eventName, handler) => {
            document.body.addEventListener(eventName, handler);
        },
        trigger: (eventName, extraParameters) => {
            document.body.dispatchEvent(new CustomEvent(eventName, {
                detail: extraParameters
            }));
        }
    }

    macroChart = new LineChart("macro_vis", macro_data, macroEventHandler)
    macroChart = new LineChart("macro_vis2", macro_data, macroEventHandler)
    consumerChart = new cBarChart("consumer_vis", consumer_data, colors, macroEventHandler)
    // housingChart = new hBarChart("housing_vis", housing_data)
    unemploymentChart = new AreaChart("unemployment_vis", macro_data, "unemployment")
    mortgageChart = new AreaChart("mortgage_vis", housing_data, "mortgage_rates")

    macroEventHandler.bind("selectionChanged", function (event) {
        let rangeStart = event.detail[0];
        let rangeEnd = event.detail[1];
        consumerChart.onSelectionChange(rangeStart, rangeEnd);
        unemploymentChart.onSelectionChange(rangeStart, rangeEnd);
        mortgageChart.onSelectionChange(rangeStart, rangeEnd);
    });

    // Initialize my visualizations
    myMap = new CanadaMap("canada", geoData, colors);
    VectomMap = new VectomMapVis('map', populationDataPath, geoDataPath, colors);
    mySectorVis = new SectorVis("chart-container", vacancyData, rentGrowthData, colors);
    mySectorVis.toggleView('line'); // or 'bar'
    VectomMap.addColorScaleKey();

    document.getElementById('resetButton').addEventListener('click', () => {
        VectomMap.resetToCurrentPopulation(); //
    });


    // Ensure the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function () {
        // Fetch and load the industrial SVG
        fetch('img/vacancy.svg')
            .then(response => response.text())
            .then(data => {
                document.getElementById('vacancy').innerHTML = data;
            });

        // Repeat the process for multi, office, and retail
        fetch('img/rentGrowth.svg')
            .then(response => response.text())
            .then(data => {
                document.getElementById('rentGrowth').innerHTML = data;
            });

    });

    document.addEventListener('scroll', function () {
        const sections = document.querySelectorAll('.scroll-section');
        const dots = document.querySelectorAll('.dot-navigation .dot');

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const pageScroll = document.documentElement.scrollTop;

            // Check if the section is currently active (in viewport)
            if (pageScroll >= sectionTop && pageScroll < sectionTop + sectionHeight) {
                dots[index].classList.add('active');
            } else {
                dots[index].classList.remove('active');
            }
        });
    });
// Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// For Macro Dash
function calculateMarketValueChange(data, selectedColumn) {
    // Filter out rows with NA values for 'Market value of housing stock'
    const filteredData = data.filter(d => !isNaN(d[selectedColumn]));

    //// For debugging purposes
    // data.forEach(function (d,i) {
    //     console.log("index: ", i)
    //     console.log("selectedColumn: ", selectedColumn)
    //     console.log("d[selectedColumn]: ", d[selectedColumn])
    //     console.log("!isNaN(d[selectedColumn]): ", !isNaN(d[selectedColumn]))
    // });

    // console.log("data: ", data)
    // console.log("selectedColumn: ", selectedColumn)
    // console.log("filteredData: ", filteredData)
    // Find the minimum and maximum dates
    const minDate = d3.min(filteredData, d => new Date(d.date));
    const maxDate = d3.max(filteredData, d => new Date(d.date));
    // console.log("minDate: ", minDate)
    // console.log("maxDate: ", maxDate)

    // Find the market value at the minimum and maximum dates
    const minValue = filteredData.find(d => new Date(d.date).getTime() === minDate.getTime())[selectedColumn];
    const maxValue = filteredData.find(d => new Date(d.date).getTime() === maxDate.getTime())[selectedColumn];
    // console.log("minDate: ", minValue)
    // console.log("maxDate: ", maxValue)

    // Calculate the percentage change
    percentageChange = ((maxValue / minValue) - 1);
    // console.log("percentageChange: ", percentageChange)

    // console.log("percentageChange: ", percentageChange)
    return percentageChange;
}

// For Macro Dash
function createConsumerData(data) {
    consumer_data = [
        {
            category: 'Total Consumer Spending'
            , change: calculateMarketValueChange(data, "total_consumer_spending")
            , grouping: 'Total'
        },
        {
            category: 'Personal Care Goods and Services'
            , change: calculateMarketValueChange(data, "personal_gs")
            , grouping: 'Essential'
        },
        {
            category: 'Food and Non-Alcoholic Beverages'
            , change: calculateMarketValueChange(data, "food_bev")
            , grouping: 'Essential'
        },
        {
            category: 'Health Goods and Services'
            , change: calculateMarketValueChange(data, "health_gs")
            , grouping: 'Essential'
        },
        {
            category: 'Medical Products'
            , change: calculateMarketValueChange(data, "medical_products")
            , grouping: 'Essential'
        },
        {
            category: 'Travel and Hotels'
            , change: calculateMarketValueChange(data, "restaurants_hotels")
            , grouping: 'Discretionary'
        },
        {
            category: 'Eating Out'
            , change: calculateMarketValueChange(data, "eating_out")
            , grouping: 'Discretionary'
        },
        {
            category: 'Clothing and Footwear'
            , change: calculateMarketValueChange(data, "clothing")
            , grouping: 'Discretionary'
        },
        {
            category: 'Recreational'
            , change: calculateMarketValueChange(data, "rec_cult")
            , grouping: 'Discretionary'
        },
        {
            category: 'Household Furnishings'
            , change: calculateMarketValueChange(data, "household_expenditures")
            , grouping: 'Housing'
        },
        {
            category: 'Household Appliances'
            , change: calculateMarketValueChange(data, "household_appliances")
            , grouping: 'Housing'
        },
        {
            category: 'Household Garden Tools and Equipment'
            , change: calculateMarketValueChange(data, "household_outdoor")
            , grouping: 'Housing'
        },
        {
            category: 'Housing Maintenance and Repairs'
            , change: calculateMarketValueChange(data, "housing_maintenance")
            , grouping: 'Housing'
        },
    ];

    return consumer_data
}

// For Macro Dash
function createHousingData(data) {
    housing_data = [
        {
            category: 'Housing Market Value'
            , change: calculateMarketValueChange(data, "housing_market_value")
        },
        {
            category: 'Residential Sales Price Index'
            , change: calculateMarketValueChange(data, "sale_price_index")
        },
    ];

    return housing_data
}

function getColorDefinitions() {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
        totalColor: rootStyle.getPropertyValue('--color1').trim(),
        essentialColor: rootStyle.getPropertyValue('--color2').trim(),
        discretionaryColor: rootStyle.getPropertyValue('--color3').trim(),
        housingColor: rootStyle.getPropertyValue('--color4').trim(),
        retailColor: rootStyle.getPropertyValue('--color3').trim(),
        officeColor: rootStyle.getPropertyValue('--color4').trim(),
        industrialColor: rootStyle.getPropertyValue('--color1').trim(),
        multifamilyColor: rootStyle.getPropertyValue('--color2').trim(),
        vColor: rootStyle.getPropertyValue('--color3').trim(),
        eColor: rootStyle.getPropertyValue('--color4').trim(),
        cColor: rootStyle.getPropertyValue('--color1').trim(),
        tColor: rootStyle.getPropertyValue('--color2').trim(),
        oColor: rootStyle.getPropertyValue('--color5').trim(),
        mColor: rootStyle.getPropertyValue('--color6').trim()
    };
}
