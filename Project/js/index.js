// Initialize global variables - Desktop
var sceneId = 0;
var numberOfEvent = Infinity; // number of summer/winter olympic games
var PopulationData = '';
var Co2MaxCountry = '';
var EventYear = '';
var Event = 0; // {0 - summer; 1 - winter}
var dataPath = '';
var CO2DetailPath = '';

function homeScene() {
    sceneId = 0;
    document.getElementById("bp").style.visibility = 'hidden';
    document.getElementById("bn").style.visibility = 'hidden';
    document.getElementById("bh").style.visibility = 'hidden';
    document.getElementById("bs").style.visibility = 'visible';
    document.getElementById("bs").innerHTML = "Explore CO2 Produced by Countries";
    document.getElementById("bh").innerHTML = "";
    clearVenueYearsChart();
    document.getElementById("introDivId").style.display = "block";
    d3.select("#sourceDivId").html("");
}

function DataProcessMethod() {
    Event = 0;
    dataPath = 'data/CO2Detail.csv';
    CO2DetailPath = 'data/CO2Detail_IDs.csv';
    initVisualization();
}


function initVisualization() {
    document.getElementById("bn").disabled = false;
    document.getElementById("bp").style.visibility = 'visible';
    document.getElementById("bn").style.visibility = 'visible';
    document.getElementById("bh").style.visibility = 'visible';
    document.getElementById("bs").style.visibility = 'hidden';
    document.getElementById("bh").innerHTML = "Home";
    document.getElementById("bs").innerHTML = "";
    document.getElementById("introDivId").style.display = "none";
    nextScene(0);
    d3.select("#sourceDivId").html("<p>*Original data source: <a href='https://data.worldbank.org/indicator/EN.ATM.CO2E.KT?end=2020&most_recent_year_desc=false&start=1990&type=shaded&view=chart'>https://data.worldbank.org/indicator/EN.ATM.CO2E.KT?end=2020&most_recent_year_desc=false&start=1990&type=shaded&view=chart</a></p>");
}

function nextScene(clickId) {
    if (clickId != 0) {
        sceneId = clickId - 1;
    }
    if (sceneId < numberOfEvent) {
        sceneId += 1;
        document.getElementById("bp").disabled = false;
        document.getElementById("bn").disabled = true;
        clearVenueYearsChart();
        updateVenue(sceneId);
        loadChart1(sceneId);
        loadChart2(sceneId);

    }
    if (sceneId == 1) {
        document.getElementById("bp").disabled = true;
    }
    if (sceneId >= numberOfEvent) {
        document.getElementById("bn").disabled = true;
    } else {
        setTimeout(function() {
            document.getElementById("bn").disabled = false;
        }, 200);
    }
}

function previousScene() {
    if (sceneId > 1) {
        sceneId -= 1;
        document.getElementById("bp").disabled = true;
        document.getElementById("bn").disabled = false;
        updateVenue(sceneId);
        clearVenueYearsChart();
        loadChart1(sceneId);
        loadChart2(sceneId);
    }
    if (sceneId == 1) {
        document.getElementById("bp").disabled = true;
    } else {
        setTimeout(function() {
            document.getElementById("bp").disabled = false;
        }, 200);
    }
}



function clearVenueYearsChart() {
    d3.select("#venueDivId").selectAll('h2').remove();
    d3.select("#yearsDivId").selectAll('p').remove();
    document.getElementById("scatterDivId").innerHTML = "";
    document.getElementById("barDivId").innerHTML = "";
}

function updateVenue(EventId) {

    d3.csv(CO2DetailPath, function(error, data) {
        if (error) throw error;

        var EventType = '';
      //  if (Event) {
      //      EventType = 'Winter';
       // } else {
       //     EventType = 'Summer';
              EventType = ' '
      //  }

        window.numberOfEvent = data.length;
        var yearText_i = '';
        var yearText = '';
        yearText = '<p><b>' + EventType + ' CO2 per Capita in *:</b> ';

        for (var i = 0; i < data.length; i++) {
            if (data[i].ID < EventId) {
                yearText_i = '<b style="background-color : ' + (Event ? '#69f5ec;">' : '#69f5ec;">'); // + data[i].Year + '</b>';
                yearText_i += '<a href="javascript:nextScene(' + (i + 1) + ')">' + data[i].Year + '</a></b>';
            } else if (data[i].ID == EventId) {
                d3.select("#venueDivId").insert("h2").text(' CO2 Produced by countries in ' +
                    data[i].Year).style('background', Event ? '#69f5ec' : '#69f5ec');
                yearText_i = '<b style="border:2px; border-style:solid; border-color:#FF0000; border-radius: 3px; background-color :' + (Event ? '#B3DAF1;">' : '#FFFE6F;">') + data[i].Year + '</b>';
                window.PopulationData = data[i].PopulationMax;
                window.Co2MaxCountry = data[i].CO2Max;
                window.EventYear = data[i].Year;
            } else {
                //yearText_i = data[i].Year;
                yearText_i = '<a href="javascript:nextScene(' + (i + 1) + ')">' + data[i].Year + '</a>';
            }
            if (data[i].ID < EventId) {
                yearText_i += '<b style="background-color : ' + (Event ? '#B3DAF1;">' : '#FFFE6F;">') + ((i < data.length - 1) ? ' | ' : '') + '</b>';
            } else {
                yearText_i += (i < data.length - 1) ? ' | ' : '';
            }
            yearText += yearText_i;
        }
        yearText += '</p>';
        d3.select("#yearsDivId").html(yearText);
    });
}