'use strict';

Chart.defaults.global.legend.display = false;

//--------------------------------------------------------------------------------------------------------------//

// Fetches the data from the API and distributes it to the formatting functions

const getConfirmedCasesDataObj = (confirmedCases, deathCases) => {
    const formatDateString = (date) =>  date.split("T").splice(0, 1).toString() // returns a date string in the following format - "2020-04-26"
    const confirmedCasesReversed = confirmedCases.reverse()
    const deathCasesReversed = deathCases.reverse()
    // declaring the data object, which will provide data for charts later on 
    let dataObject = {confirmedCasesByDistricts: {}, confirmedCasesByDate: {}, deathCasesByDate: {}, deathCasesByArea: {}}
    // making data object default values be equal to zero in order to increment them later on 
    confirmedCasesReversed
                .map(confirmedCase => formatDateString(confirmedCase.date))
                .forEach(date => { dataObject["confirmedCasesByDate"][date] =  0 })
    dataObject["deathCasesByDate"] = {...dataObject["confirmedCasesByDate"]}
    confirmedCases
                .map(confirmedCase => confirmedCase.healthCareDistrict)
                .forEach(district => { dataObject["confirmedCasesByDistricts"][district] =  0 })
    deathCases
            .map(deathCase => deathCase.area)
            .forEach(area => { dataObject["deathCasesByArea"][area] =  0 })
    confirmedCasesReversed.forEach((confirmedCase, _) => {
        const formattedConfirmedCaseDate = formatDateString(confirmedCase.date)
        if (formattedConfirmedCaseDate) { // if string is not null
            // incrementing data object depending on confirmed cases on that particular date
            dataObject["confirmedCasesByDate"][formattedConfirmedCaseDate] += 1
        }
        // incrementing data object depending on a health care district where the confirmed case was determined
        dataObject["confirmedCasesByDistricts"][confirmedCase.healthCareDistrict] += 1
    })
    deathCasesReversed.forEach((deathCase, _) => {
        const formattedDeathCaseDate = formatDateString(deathCase.date)
        if (formattedDeathCaseDate && typeof dataObject["deathCasesByDate"][formattedDeathCaseDate] !== "undefined") {
            dataObject["deathCasesByDate"][formattedDeathCaseDate] += 1
        }
        // incrementing data object depending on a health care district where the death case occured
        dataObject["deathCasesByArea"][deathCase.area] += 1
    })
    return dataObject
}

//--------------------------------------------------------------------------------------------------------------//

// Fetches the data from the api and distributes it to the formatting functions

async function getDataObj () {
    try {
        const response = await fetch('https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/finnishCoronaData/v2');
        if (!response.ok) throw new Error('jokin meni pieleen');
        const formattedResponse = await response.json();
        const confirmedCases = formattedResponse.confirmed
        const deathCases = formattedResponse.deaths
        const dataObject = getConfirmedCasesDataObj(confirmedCases, deathCases)
        getTodaysDeaths(dataObject);
        return dataObject
    } catch (error) {
        console.log(error)
    }
}

//--------------------------------------------------------------------------------------------------------------//

// Functions to return

// returns all confirmed cases in progression

const getTotalCases = (dataObj) => {
    const cumulativeSum = (sum => value => sum += value)(0);
    return Object.values(dataObj["confirmedCasesByDate"]).reverse().map(cumulativeSum)
}

// returns all death cases in progression

const getTotalDeaths = (dataObj) => {
    const cumulativeSum = (sum => value => sum += value)(0);
    return Object.values(dataObj["deathCasesByDate"]).reverse().map(cumulativeSum)
}

// Format dates to please the Finnish eye

const formatDates = (dataObj) => {
    let formattedDates = [];
    for (let i=0; i < Object.keys(dataObj["confirmedCasesByDate"]).reverse().length; i++) {
        var datePart = Object.keys(dataObj["confirmedCasesByDate"]).reverse()[i].match(/\d+/g),
            month = datePart[1], day = datePart[2];
                if (datePart[1].length === 2 && datePart[1] < 10) {
                    month = datePart[1][1];
                }
                if (datePart[2].length === 2 && datePart[2] < 10) {
                    day = datePart[2][1];
                }
            formattedDates.push(day+'.'+month+'.');
    }
    return formattedDates;
}

function getTodaysDeaths(dataObj) {
    let todaysDeaths = Object.values(dataObj["deathCasesByDate"])[0];
    document.getElementById("deathsByDateHeader").innerHTML += `<b>${todaysDeaths}</b>`;
    //document.querySelector('#info').innerHTML = `<li><strong>Kuolleita viimeisen vrk:n aikana: </strong>${todaysDeaths}</li>`;
    return todaysDeaths;
}

//--------------------------------------------------------------------------------------------------------------//

// Contexts of the charts' pointing elements

const confirmedCasesByDateLineChartCtx = document.querySelector('#confirmedCasesByDateLineChart').getContext('2d');
const confirmedCasesByDistrictBarChartCtx = document.querySelector('#confirmedCasesByDistrictBarChart').getContext('2d');

const deathCasesByDateLineChartCtx = document.querySelector('#deathCasesByDateLineChart').getContext('2d');
const deathCasesByDistrictBarChartCtx = document.querySelector('#deathCasesByDistrictBarChart').getContext('2d');

const cumulativeLineChartCtx = document.querySelector('#cumulativeLineChart').getContext('2d');
const deathCasesCumulativeLineChartCtx = document.querySelector('#deathCasesCumulativeLineChart').getContext('2d');

// Declaring elements affected by buttons

const totalCasesChart = document.getElementById("cumulativeLineChart");
const totalCasesHeader = document.getElementById("cumulativeLineChartHeader");
const dateCasesChart = document.getElementById("confirmedCasesByDateLineChartHeader");
const dateCasesHeader = document.getElementById("confirmedCasesByDateLineChart");

//--------------------------------------------------------------------------------------------------------------//

const caseChartOptions = {
    display: chartTypeButtonsCases(),
    options: {
        tooltips: {
            mode: 'index'
        }
    },
    axisX: [{
        ticks: {
            autoSkip: true,
            maxTicksLimit: 31
        }
    }]
}

const deathChartOptions = {
    display: chartTypeButtonsDeaths(),
    options: {
        tooltips: {
            mode: 'index'
        }
    },
    axisX: [{
        ticks: {
            autoSkip: true,
            maxTicksLimit: 31
        }
    }]
}

// colors required to highlight the bar chart values
const confirmedCasesByDistrictBarColors = ["#000000", "#10316b", "#e25822", "#ececeb", "#f6f578", "#f6d743", "#649d66", "#06623b", "#10316b", "#000000", "#e25822", "#ececeb", "#f6f578", "#f6d743", "#649d66", "#06623b", "#10316b", "#000000", "#e25822", "#ececeb", "#f6f578", "#f6d743"]

//--------------------------------------------------------------------------------------------------------------//

// Messy functions of chart type buttons

function chartTypeButtonsCases() {
    dateCasesChart.style.display = "none";
    dateCasesHeader.style.display = "none";

    // Button "Kumulatiivinen" of cases

    document.getElementById("cumulativeCasesButton").addEventListener('click', function(evt) {
        totalCasesChart.style.display = "block";
        totalCasesHeader.style.display = "block";
        dateCasesHeader.style.display = "none";
        dateCasesChart.style.display = "none";
        /*document.getElementById("cumulativeCasesButton").style.borderStyle = "inset";
        document.getElementById("dateCasesButton").style.borderStyle = "none";*/
    })

    // Button "Päiväkohtainen" of cases

    document.getElementById("dateCasesButton").addEventListener('click', function(evt) {
        dateCasesChart.style.display = "block";
        dateCasesHeader.style.display = "block";
        totalCasesHeader.style.display = "none";
        totalCasesChart.style.display = "none";
        /*document.getElementById("cumulativeCasesButton").style.borderStyle = "none";
        document.getElementById("dateCasesButton").style.borderStyle = "inset";*/
    })
}

function chartTypeButtonsDeaths() {
    document.getElementById("deathCasesByDateLineChart").style.display = "none";
    document.getElementById("deathsByDateHeader").style.display = "none";

    // Button "Kumulatiivinen" of deaths

    document.getElementById("cumulativeDeathsButton").addEventListener('click', function(evt) {
        document.getElementById("deathCasesCumulativeLineChart").style.display = "block";
        document.getElementById("cumulativeDeathsHeader").style.display = "block";
        document.getElementById("deathsByDateHeader").style.display = "none";
        document.getElementById("deathCasesByDateLineChart").style.display = "none";
    })

    // Button "Päiväkohtainen" of deaths

    document.getElementById("dateDeathsButton").addEventListener('click', function(evt) {
        document.getElementById("deathCasesByDateLineChart").style.display = "block";
        document.getElementById("deathsByDateHeader").style.display = "block";
        document.getElementById("cumulativeDeathsHeader").style.display = "none";
        document.getElementById("deathCasesCumulativeLineChart").style.display = "none";
    })

}



//--------------------------------------------------------------------------------------------------------------//

// Initiation of chart objects that are responsible for chart illustrations



const drawCharts = (dataObj) => {
    // Vahvistetut tartunnat päivämäärittäin
    //document.getElementById("byDate").addEventListener('click', function(evt) {
        new Chart(confirmedCasesByDateLineChartCtx, {
            type: 'bar',
            data: {
                labels: formatDates(dataObj), // x-axis values
                maximum: 31,
                datasets: [
                    {
                        fill: true,
                        data: Object.values(dataObj["confirmedCasesByDate"]).
                            reverse(), // y-axis values
                        borderColor: "#e25822",
                        borderWidth: 1,
                        backgroundColor: "#e25822",
                        labelAngle: 0
                    }]
            },
            options:  {
                caseChartOptions,
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                hover: {
                    mode: 'index',
                    intersect: false
                }
            }
        })
    //})

    // Vahvistetut tartunnat sairaanhoitopiireittäin

    new Chart(confirmedCasesByDistrictBarChartCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(dataObj["confirmedCasesByDistricts"]),
            datasets: [{
                fill: false,
                point: {
                    radius: 0
                },
                data: Object.values(dataObj["confirmedCasesByDistricts"]),
                backgroundColor: confirmedCasesByDistrictBarColors,
                borderColor: confirmedCasesByDistrictBarColors,
                borderWidth: 1
            }]
        },
        options:  {
            caseChartOptions,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    })

    // Vahvistetut kuolemat päivämäärittäin

    new Chart(deathCasesByDateLineChartCtx, {
        type: 'bar',
        data: {
            labels: formatDates(dataObj),
            labelAngle: 0,
            datasets: [{
                fill: true,
                data: Object.values(dataObj["deathCasesByDate"]).reverse(),
                color: "#222",
                backgroundColor: "#222",
                borderWidth: 1,
                fillColor: '#000000'
            }]
        },
        options:  {
            deathChartOptions,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    })

    // Vahvistetut kuolemat sairaaloittain

    new Chart(deathCasesByDistrictBarChartCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(dataObj["deathCasesByArea"]),
            datasets: [{
                fill: false,
                data: Object.values(dataObj["deathCasesByArea"]),
                backgroundColor: confirmedCasesByDistrictBarColors,
                borderColor: confirmedCasesByDistrictBarColors,
                borderWidth: 1
            }]
        },
        options:  {
            deathChartOptions,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    }),

        // Vahvistetut tartunnat yhteensä Suomessa

    new Chart(cumulativeLineChartCtx, {
        type: 'line',
        data: {
            labels: formatDates(dataObj),
            datasets: [{
                fill: false,
                data: getTotalCases(dataObj),
                borderColor: "#e25822",
                borderWidth: 1
            }]
        },
        options:  {
            caseChartOptions,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    })
        // Vahvistetut kuolemat yhteensä Suomessa

    new Chart(deathCasesCumulativeLineChartCtx, {
        type: 'line',
        data: {
            labels: formatDates(dataObj),
            datasets: [{
                fill: false,
                data: getTotalDeaths(dataObj),
                borderColor: "#000000",
                borderWidth: 1,
            }]
        },
        options:  {
            deathChartOptions,
            tooltips: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    })
}

//--------------------------------------------------------------------------------------------------------------//

(async () => {
    // awaiting for the function to obtain the latest data and passing it to the chart drawing function
    const dataSource = await getDataObj();
    drawCharts(dataSource);
})();