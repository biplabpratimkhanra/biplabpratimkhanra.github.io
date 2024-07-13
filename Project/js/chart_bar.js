//Desktop
function loadChart2(EventId) {
    // Get current browser window dimensions
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x_size = w.innerWidth || e.clientWidth || g.clientWidth;

    let svg;

    // Read the data
    d3.csv(dataPath, function(error, data) {
        if (error) throw error;

        // Calculate the maximum number of CO2PerCapita and participating continents throughout the Periods(1990-2020)
        var CO2_max = getMaxCO2(data, EventId);
        var continents = getContinentsList(data);
        var allCountries = data.length;

        // filter and sort data
        data = data.filter(function(d) {
            return (GetGdpCo2PopPerYear(d, EventId) !== 0);
        });

        data.sort(function(b, a) {
            return GetGdpCo2PopPerYear(a, EventId) - GetGdpCo2PopPerYear(b, EventId);
        });

        var allActiveCountries = data.length;
        // Set canvas and chart dimensions
        const width = 0.80 * x_size;
        const height = 1000 + (allActiveCountries / allCountries) * (Event ? 500 : 1400);
        const canvas = { width: width, height: height };
        const margin = { left: 65, right: 52, top: 0, bottom: 45 };
        const chart = {
            width: canvas.width - (margin.right + margin.left),
            height: canvas.height - (margin.top + margin.bottom)
        };

        // Append an svg object to the var div
        svg = d3.select("#barDivId")
            .append("svg")
            .attr("width", canvas.width)
            .attr("height", canvas.height)
            .style("background-color", Event ? '#b3daf117' : '#ffff6f07')
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        // Create scale bands for the x axis, bar height (h) and fill color (c)
        var x = d3.scaleLinear()
            .domain([1, CO2_max])
            .range([2, chart.width]);
         //   .range([2, CO2_max]);
        var y = d3.scaleBand()
            .range([0, chart.height])
            .domain(data.map(function(d) { return d.Country_Code; })).padding(0.15);
        var c = d3.scaleOrdinal()
            .domain(["Europe & Central Asia", "Middle East & North Africa", 'North America', 'Latin America & Caribbean', "East Asia & Pacific", "South Asia", "Sub-Saharan Africa"])
            .range(["#0069b3ff", "#f07d00ff", "#00963fff", "#b70d7fff", "#ffcc01ff", "#e40613ff", "#b35a00"]);

        // Add a generic tooltip with 0 opacity
        var tooltip = d3.select("#barDivId")
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

        // Add X and Y axis
        svg.append("g")
            .attr("transform", "translate(0," + chart.height + ")")
            .attr("class", "x axis")
            .transition().delay(3500).duration(1500)
            .call(d3.axisBottom(x))
            .selectAll("text");

        svg.append("g")
            .attr("class", "y axis")
            .transition().delay(3500).duration(1500)
            .call(d3.axisLeft(y));

        // Add X and Y labels
        svg.append('g')
            .attr('transform', 'translate(' + (chart.width / 2) + ', ' + (chart.height + margin.top + 42) + ')')
            .append('text')
            .style("opacity", 0).transition().delay(3500).duration(2000).style("opacity", 1)
            .attr("class", "x label")
            .attr('text-anchor', 'middle')
            .text("CO2 per capita (in metric ton)");

        svg.append('g')
            .attr('transform', 'translate(' + (-margin.left + 15) + ', ' + (chart.height / 2 + margin.top) + ')')
            .append('text')
            .attr("class", "y label")
            .attr('text-anchor', 'middle')
            .attr("transform", "rotate(-90)")
            .text("Country")
            .style("opacity", 0).transition().delay(3500).duration(2000).style("opacity", 1);

        // Add bars
            console.log("y.bandwidth:", y.bandwidth())
        var bars = svg.append('g')
            .selectAll("bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", x(1))
            .attr("y", function(d) { return y(d.Country_Code); })
            .attr("width", 0)
            .attr("height", y.bandwidth())
            .style("fill", function(d) { return c(d.Region); })
            .style("opacity", 1.8);

        // Add lenght transitions
        bars.transition()
            .delay(3750)
            .duration(4000)
            .attr('width', function(d) {
                var width = x(GetGdpCo2PopPerYear(d, EventId));
                return width < 0 ? 0 : width;
            });

        // Add mouse events
        bars.on("mouseover", mouseOver)
            .on("mousemove", mouseOn)
            .on("mouseleave", mouseLeave);

        // Add values at the end of the bars
        svg.append('g')
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "datapoints")
            .attr("x", function(d) { return x(GetGdpCo2PopPerYear(d, EventId)); })
            .attr("y", function(d) { return y(d.Country_Code); })
            .attr("dx", 40)
            .attr("dy", y.bandwidth() / 2)
            .style("alignment-baseline", "central")
            .text(function(d) { return GetGdpCo2PopPerYear(d, EventId); })
            .style("font-size", "9px")
            .style("opacity", 0).transition().delay(6250).duration(2500).style("opacity", 0.8);


        // Add color legend
        var colorLegend = svg.selectAll("colorlegend")
            .data(continents)
            .enter().append("g")
            .attr("class", "colorlegend")
            .attr("transform", function(d, i) {
                return "translate(0," + (5 + 42 * (allActiveCountries / allCountries) + i * 20) + ")";
            });

        colorLegend.append("rect")
            .attr("x", chart.width - y.bandwidth())
            .attr("width", y.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function(d) { return c(d); })
            .style("stroke-width", 0)
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .style("opacity", 0).transition().delay(7000).duration(2000).style("opacity", 0.8);

        colorLegend.append("text")
            .attr("x", chart.width - y.bandwidth() - 10)
            .attr("dy", y.bandwidth() - 1)
            .style("text-anchor", "end")
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .text(function(d) { return d; })
            .style("fill-opacity", 0).transition().delay(6750).duration(2000).style("fill-opacity", 0.7);

        // Add annotation text (hint)
        svg.append("text")
            .attr("x", chart.width / 2)
            .attr("y", chart.height / 2)
            .attr("class", "annotation2")
            .style("text-anchor", "middle")
            .text("Highest CO2 produced by " + Co2MaxCountry + " in " + EventYear )
            .style("opacity", 0).transition().delay(5750).duration(3000).style("opacity", 0.3);

    });

    function getPopulation(d) {
        const offset = 5; // column number from where the GDP information columns start
        var index = offset + 3 * (EventId - 1);
        
        var VarPopulation = d3.values(d)[index + 2];
        VarPopulation = VarPopulation.replace(/,/g, "");
        var pop = 0;
        
        pop += VarPopulation == "" ? 0 : parseInt(VarPopulation.replace(/[^\d\.\-eE+]/g, ""));
        pop = Math.round(pop / 1000) / 1000; // convert to milions and round to 3 decimal places
        return pop;
    }


   function getGDPperCapita(d) 

   {
        const offset = 5; // column number from where the GDP information columns start
        var index = offset + 3 * (EventId - 1);
        var VarGDPPerCapita = d3.values(d)[index];
        VarGDPPerCapita = VarGDPPerCapita.replace(/,/g, "");

        var gdp = 0;
        gdp += VarGDPPerCapita == "" ? 0 : parseFloat(VarGDPPerCapita.replace(/[^\d\.\-eE+]/g, ""));
        return gdp;
    }


    function getCumulativeGdpCo2pop(d, EventId) {

        const offset = 5; // column number from where the GDP information columns start
        var index = offset + 3 * (EventId - 1);

        var VarGDPPerCapita = d3.values(d)[index];
        VarGDPPerCapita = VarGDPPerCapita.replace(/,/g, "");

        var VarCO2Percapita = d3.values(d)[index + 1];
        VarCO2Percapita = VarCO2Percapita.replace(/,/g, "");

        var VarPopulation = d3.values(d)[index + 2];
        VarPopulation = VarPopulation.replace(/,/g, "");

        VarGDPPerCapita = (isNaN(VarGDPPerCapita) || VarGDPPerCapita == "") ? 0.0 : parseFloat(VarGDPPerCapita);
        VarCO2Percapita = (isNaN(VarCO2Percapita) || VarCO2Percapita == "") ? 0.0 : parseFloat(VarCO2Percapita);
        VarPopulation = (isNaN(VarPopulation) || VarPopulation == "") ? 0 : parseInt(VarPopulation);

        return { VarCO2Percapita, VarPopulation, VarGDPPerCapita };
     

    }

    function GetGdpCo2PopPerYear(d, untilId) {

        
        let { VarCO2Percapita, VarPopulation, VarGDPPerCapita } = getCumulativeGdpCo2pop(d, untilId);
        var tot = 0;

        tot=VarCO2Percapita
        return tot;
    }

    function getMaxCO2(data, EventId) {
        let CO2PerCapita;
        var maxCO2PerCapita = 0;
        for (let i = 0; i < data.length; i++) {
            CO2PerCapita = GetGdpCo2PopPerYear(data[i], EventId);
            if (maxCO2PerCapita < CO2PerCapita) {
                maxCO2PerCapita = CO2PerCapita;
            }
        }
        return maxCO2PerCapita;
    }

    function getContinentsList(data) {
        const continents = [];

        for (let i = 0; i < data.length; i++) {
            if (GetGdpCo2PopPerYear(data[i], EventId) > 0) {
                if (!continents.includes(data[i].Region)) {
                    continents.push(data[i].Region);
                }
            }
        }
        return continents;
    }

    function getTooltipInfo(d) {
        let {CO2Percapita, Population, GDPPerCapita } = getCumulativeGdpCo2pop(d, EventId);
        let totalCO2PerCapita = GetGdpCo2PopPerYear(d, EventId);
        let htmlInfo;

        htmlInfo = "<b>Country:</b> " + d.Country_Name + '<br>' +
            "&emsp;&#8226;<b>&emsp;Population:</b> " + d3.format(',.3s')(getPopulation(d) * 1e6).replace(/G/, "B") + '<br>' +
            "&emsp;&#8226;<b>&emsp;GDP per Capita:</b> " + "$" + d3.format(',.3s')(getGDPperCapita(d)) + '<br>' +
            "&emsp;&#8226;<b>&emsp;CO2 per capita (in metric ton):</b> " + totalCO2PerCapita ;

        
        return htmlInfo;
    }

    function filterContinents(d) {
        svg.selectAll('.bar')
            .filter(function(data) {
                return (data.Region != d);
            })
            .transition()
            .style('opacity', 0.05);

        svg.selectAll('.datapoints')
            .filter(function(data) {
                return (data.Region != d);
            })
            .transition()
            .style('opacity', 0.05);
    }

    function filterContinentsOff(d) {
        svg.selectAll('.bar')
            .transition()
            .style('opacity', 0.8);

        svg.selectAll('.datapoints')
            .transition()
            .style('opacity', 0.8);
    }

}