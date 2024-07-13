//DeskTop
function loadChart1(EventId) {
    // Get current browser window dimensions

    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x_size = w.innerWidth || e.clientWidth || g.clientWidth,
        y_size = w.innerHeight || e.clientHeight || g.clientHeight;

    // Set canvas and chart dimensions
    const width = 0.85 * x_size;
    const height = (0.5 * x_size < 0.62 * y_size) ? 0.5 * x_size : 0.62 * y_size;
    const canvas = { width: width, height: height };
    const margin = { left: 65, right: 52, top: 12, bottom: 36 };
    const chart = {
        width: canvas.width - (margin.right + margin.left),
        height: canvas.height - (margin.top + margin.bottom)
    };

    // Max circle radius (max CO2 per Event per country) as a function of chart width and height
    const maxradius = (chart.width + chart.height) / 40;

    // Append an svg object to the scatter div
    var svg = d3.select("#scatterDivId")
        .append("svg")
        .attr("width", canvas.width)
        .attr("height", canvas.height)
        .style("background-color", Event ? '#b3daf117' : '#ffff6f07')
        //.call(d3.zoom().on("zoom", function() {
        //svg.attr("transform", d3.event.transform)
        //}))
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Read the data
    d3.csv(dataPath, function(error, data) {
        if (error) throw error;

        data = data.filter(
            function(d) {
                return (getPopulation(d) !== 0 && getGDPperCapita(d) !== 0 && computeTotalCO2s(d) !== 0);
            }
        );

        
        // Calculate the extreme values for the selected Event
        var pop_minmax = getMinMaxPopulation(data);
        var gdp_minmax = getMinMaxGDP(data);
        var CO2s_max = getMaxCO2s(data);
        var continents = getContinentsList(data);

        // Extract and modify the extreme values for the selected Event
        var pop_min_round = (pop_minmax[0] > 1) ? 1 : 0.1;
        var pop_min = Math.max(0.01, Math.floor(pop_minmax[0] / pop_min_round) * pop_min_round); // min population rounded down to the closest 0.1/1 milion + log protection
        var pop_max = Math.ceil(pop_minmax[1] / 100) * 100; // max population rounded up to the closest 100 milion
        var gdp_min = Math.floor(gdp_minmax[0] / 5000) * 5000; // min GDP per capita rounded down to the closest 5000
        var gdp_max = Math.ceil(gdp_minmax[1] / 10000) * 10000; // max GDP per capita rounded up to the closest 10000


        // Create scale bands for x and y axes, radius (r), and circle fill color (c)
        var x = d3.scaleLog().base(10).domain([pop_min, pop_max]).range([0, chart.width]);
        var y = d3.scaleLinear().domain([gdp_min, gdp_max]).range([chart.height, 0]);
        var r = d3.scaleSqrt().domain([1, CO2s_max]).range([1.5, maxradius]);
        var c = d3.scaleOrdinal()
            .domain(["Europe & Central Asia", "Middle East & North Africa", 'North America', 'Latin America & Caribbean', "East Asia & Pacific", "South Asia", "Sub-Saharan Africa"])
            .range(["#0069b3ff", "#f07d00ff", "#00963fff", "#b70d7fff", "#ffcc01ff", "#e40613ff", "#b35a00"]);

        // Add a generic tooltip with 0 opacity
        var tooltip = d3.select("#scatterDivId")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create tooltip actions
        var mouseOver = function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.8);

            tooltip.html(getTooltipInfo(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        };

        var mouseOn = function(d) {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        };

        var mouseLeave = function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        };

        // Add X axis
        var xTickValAll = [0.01, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        let xTickVal = [];
        for (let i = 0; i < xTickValAll.length; i++) {
            if (xTickValAll[i] >= pop_min && xTickValAll[i] <= pop_max) {
                xTickVal.push(xTickValAll[i]);
            }
        }

        var xAxis = d3.axisBottom(x)
            .tickValues(xTickVal)
            .tickFormat(d3.format('.1r'));

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chart.height + ")")
            .transition().duration(1500)
            .call(xAxis);

        var yAxis = d3.axisLeft(y)
            .tickFormat(d3.format(',.2r'));

        svg.append("g")
            .attr("class", "y axis")
            .transition().duration(1500)
            .call(yAxis);

        // Add X and Y labels
        svg.append('g')
            .attr('transform', 'translate(' + (chart.width / 2) + ', ' + (chart.height + 32) + ')')
            .append('text')
            .style("opacity", 0).transition().duration(2000).style("opacity", 1)
            .attr("class", "x label")
            .attr('text-anchor', 'middle')
            .text("Current population (in milions, log scale)");

        svg.append('g')
            .attr('transform', 'translate(' + (-margin.left + 15) + ', ' + (chart.height / 2 + margin.top) + ')')
            .append('text')
            .attr("class", "y label")
            .attr('text-anchor', 'middle')
            .attr("transform", "rotate(-90)")
            .text("Current GDP per Capita (in USD)")
            .style("opacity", 0).transition().duration(2000).style("opacity", 1);

        // Add circles
        var dots = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "datapoints")
            .attr("cx", 0)
            .attr("cy", (chart.height))
            .attr("r", 0)
            .style("fill", function(d) { return c(d.Region); })
            .style("opacity", 0.8);

        // Add radius and opacitytransitions
        dots.transition()
            .delay(750)
            .duration(2000)
            .attr("r", function(d) { 
                let radius = r(computeTotalCO2s(d));
                if (radius < 0) {
//                console.error("Negative radius:", radius, "for data:", d);
                radius = 0; // Ensure radius is non-negative
                    }
                return radius; 
            })
            //.attr("r", function(d) { return r(computeTotalCO2s(d)); })
            .attr("cx", function(d) { return x(getPopulation(d)); })
            .attr("cy", function(d) { return y(getGDPperCapita(d)); });

        // Add mouse events
        dots.on("mouseover", mouseOver)
            .on("mousemove", mouseOn)
            .on("mouseleave", mouseLeave);

        // Add country codes
        svg.append('g')
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "datapoints")
            .attr("x", function(d) { return x(getPopulation(d)); })
            .attr("y", function(d) { return y(getGDPperCapita(d)); })
            .attr("dx", function(d) { return 0.75 * r(computeTotalCO2s(d)); })
            .attr("dy", function(d) { return -0.8 * r(computeTotalCO2s(d)); })
            .text(function(d) { return d.Country_Code; })
            .style("font-size", "8px")
            .style("opacity", 0).transition().delay(500).duration(2000).style("opacity", 0.6);

        // Add color legend
        var colorLegend = svg.selectAll("colorlegend")
            .data(continents)
            .enter().append("g")
            .attr("class", "colorlegend")
            .attr("transform", function(d, i) {
                return "translate(0," + (10 + i * 20) + ")";
            });

        colorLegend.append("circle")
            .attr("cx", chart.width - 8)
            .attr("r", 7)
            .style("fill", function(d) { return c(d); })
            .style("stroke-width", 0)
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .style("opacity", 0).transition().delay(1500).duration(2000).style("opacity", 0.8);

        colorLegend.append("text")
            .attr("x", chart.width - 20)
            .attr("y", 0)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .text(function(d) { return d; })
            .style("fill-opacity", 0).transition().delay(2000).duration(2000).style("fill-opacity", 0.7);

      
        // Add annotations (Hints)
        var xAnnotation = chart.width / 2;
        var yAnnotation = -1;
        svg.append("text")
            .attr("x", xAnnotation)
            .attr("y", yAnnotation)
            .attr("class", "annotation")
            .style("text-anchor", "middle")
            .style('font-family', 'Montserrat')  // Set the font family
            .style('font-size', '13px')
            .style('fill', 'red')
            .text("Tip 1: hover over the circles for more details; Tip 2: hover over the color legend to filter continents")
            .style('opacity', 0);

        // Add annotations (Max CO2)
        var xMaxcountry = chart.width / 2;
        var yMaxcountry = 30;

        var maxCountry = svg.selectAll("maxcountry")
            .data(data.filter(
                function(d) {
                    return (computeTotalCO2s(d) == CO2s_max);
                }
            ))
            .enter()
            .append("g");

        maxCountry.append("line")
            .attr('x1', function(d) { return x(getPopulation(d)); })
            .attr('x2', xMaxcountry)
            .attr('y1', function(d) { return y(getGDPperCapita(d)); })
            .attr('y2', function(d) { return yMaxcountry; })
            .attr('stroke', 'black')
            .style('stroke-opacity', 0).transition().delay(2750).duration(2000).style('stroke-opacity', 0.5)
            .attr("stroke-width", 0.5)
            .style('stroke-dasharray', ('1,1'));

        maxCountry.append("text")
            .attr('x', xMaxcountry)
            .attr('dy', '-0.3em')
            .attr('y', yMaxcountry)
            .text('Country with highest CO2 production')
            .style("font-size", '10pt')
            .style('text-decoration', "underline")
            .style('text-anchor', "middle")
            .style('font-family', 'Calibri')
            .style("fill-opacity", 0).transition().delay(3000).duration(2000).style("fill-opacity", 0.5);

        // Add annotations (Event country)
        var xEventcountry = chart.width / 3;
        var yEventcountry = 50;

        var EventCountryAnnotation = svg.selectAll("Eventcountry")
            .data(data.filter(
                function(d) {
                    return (d.Country_Name == PopulationData);
                }
            ))
            .enter()
            .append("g");

        EventCountryAnnotation.append("line")
            .attr('x1', function(d) { return x(getPopulation(d)); })
            .attr('x2', xEventcountry)
            .attr('y1', function(d) { return y(getGDPperCapita(d)); })
            .attr('y2', yEventcountry)
            .attr('stroke', 'black')
            .style('stroke-opacity', 0).transition().delay(3000).duration(2000).style('stroke-opacity', 0.5)
            .attr("stroke-width", 0.5)
            .style('stroke-dasharray', ('1,1'));

        EventCountryAnnotation.append("text")
            .attr('x', xEventcountry)
            .attr('dy', '-0.3em')
            .attr('y', yEventcountry)
            .text('Country with largest population')
            .style("font-size", '10pt')
            .style('text-decoration', "underline")
            .style('text-anchor', "middle")
            .style("fill-opacity", 0).transition().delay(3250).duration(2000).style("fill-opacity", 0.6);

    });

    var counter = 0
    function getPopulation(d) {

        const offset = 5; // column number from where the GDP columns start
        var index = offset + 3 * (EventId - 1);
        
        var CountryPopulation = d3.values(d)[index + 2];
        CountryPopulation = CountryPopulation.replace(/,/g, "");


        var pop = 0;
        
        pop += CountryPopulation == "" ? 0 : parseInt(CountryPopulation.replace(/[^\d\.\-eE+]/g, ""));
        pop = Math.round(pop / 1000) / 1000; // convert to milions and round to 3 decimal places
        return pop;
    }

    function getGDPperCapita(d) {


        const offset = 5; // column number from where the GDP columns start
        var index = offset + 3 * (EventId - 1);

        var GDP_Per_Capita = d3.values(d)[index];
        GDP_Per_Capita = GDP_Per_Capita.replace(/,/g, "");

        var gdp = 0;
        gdp += GDP_Per_Capita == "" ? 0 : parseFloat(GDP_Per_Capita.replace(/[^\d\.\-eE+]/g, ""));
        return gdp;
    }

     function getCO2s(d) {
        const offset = 5; // column number from where the GDP columns start
        var index = offset + 3 * (EventId - 1);

        var GDP_Per_Capita = d3.values(d)[index];
        GDP_Per_Capita = GDP_Per_Capita.replace(/,/g, "");

        var CO2PerCapita = d3.values(d)[index + 1];
        CO2PerCapita = CO2PerCapita.replace(/,/g, "");

        var CountryPopulation = d3.values(d)[index + 2];
        CountryPopulation = CountryPopulation.replace(/,/g, "");

        GDP_Per_Capita = (isNaN(GDP_Per_Capita) || GDP_Per_Capita == "") ? 0.0 : parseFloat(GDP_Per_Capita);
        CO2PerCapita = (isNaN(CO2PerCapita) || CO2PerCapita == "") ? 0.0 : parseFloat(CO2PerCapita);
        CountryPopulation = (isNaN(CountryPopulation) || CountryPopulation == "") ? 0 : parseInt(CountryPopulation);

        return { GDP_Per_Capita, CO2PerCapita, CountryPopulation };
    } 

    function computeTotalCO2s(d) {

        let { CO2PerCapita, CountryPopulation, GDP_Per_Capita } = getCO2s(d);
        
        var tot = 0;

        if (GDP_Per_Capita == 0.0 || CO2PerCapita == 0.0 || CountryPopulation == 0) {
            tot=0;
            }
        else
        {
            tot = CO2PerCapita;
            
        }
        
        return tot;
    }

    function getMaxCO2s(data) {
        let CO2_s;
        var maxCO2_s = 0;

        for (let i = 0; i < data.length; i++) {
            CO2_s = computeTotalCO2s(data[i]);
            if (maxCO2_s < CO2_s) {
                maxCO2_s = CO2_s;
            }
        }
        return maxCO2_s;
    }

    function getMinMaxPopulation(data) {
        var minPop = Infinity;
        var maxPop = 0;
        let pop;

        for (let i = 0; i < data.length; i++) {
            //console.log("data.length:", data[i])
            if (computeTotalCO2s(data[i]) > 0 && getGDPperCapita(data[i]) > 0) {
                pop = getPopulation(data[i]);
                if (maxPop < pop) {
                    maxPop = pop;
                }
                if (minPop > pop && pop !== 0) {
                    minPop = pop;
                }
            }
        }
    return [minPop, maxPop];
    }

    function getMinMaxGDP(data) {
        var minGDP = Infinity;
        var maxGDP = 0;
        let gdp;

        for (let i = 0; i < data.length; i++) {
            if (computeTotalCO2s(data[i]) > 0 && getPopulation(data[i])) {
                gdp = getGDPperCapita(data[i]);
                if (maxGDP < gdp) {
                    maxGDP = gdp;
                }
                if (minGDP > gdp && gdp !== 0) {
                    minGDP = gdp;
                }
            }
        }
        return [minGDP, maxGDP];
    }

    function getContinentsList(data) {
        const continents = [];

        for (let i = 0; i < data.length; i++) {
            if (computeTotalCO2s(data[i]) > 0) {
                if (!continents.includes(data[i].Region)) {
                    continents.push(data[i].Region);
                }
            }
        }
        return continents;
    }

    function getTooltipInfo(d) {
        let { gold, silver, bronze } = getCO2s(d);
        let totalCO2_s = computeTotalCO2s(d);
        let htmlInfo;

        htmlInfo = "<b>Country:</b> " + d.Country_Name + '<br>' +
            "&emsp;&#8226;<b>&emsp;Population:</b> " + d3.format(',.3s')(getPopulation(d) * 1e6).replace(/G/, "B") + '<br>' +
            "&emsp;&#8226;<b>&emsp;GDP per Capita:</b> " + "$" + d3.format(',.3s')(getGDPperCapita(d)) + '<br>' +
            "&emsp;&#8226;<b>&emsp;CO2 produced (in metric ton) per Capita:</b> " + totalCO2_s;

        return htmlInfo;
    }

    function filterContinents(d) {
        svg.selectAll('.datapoints')
            .filter(function(data) {
                return (data.Region != d);
            })
            .transition()
            .style('opacity', 0.04);
    }

    function filterContinentsOff(d) {
        svg.selectAll('.datapoints')
            .transition()
            .style('opacity', 0.8);
    }
}