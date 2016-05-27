queue()
    .defer(d3.json,'data/states/ca_counties.json')
    .defer(d3.csv,'data/stations/ca_precip_stations_clean.csv')
    .defer(d3.csv,'data/ca/ca_precip_clean.csv')
    .await(function(error, topo, stations, data) {
        var margins = { top: 20, right: 50, left: 50, bottom: 75 },
            parse_date = d3.time.format("%m-%Y").parse,
            height = 600 - margins.top - margins.bottom;

        var tip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        var precip_colors = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'];

        data.forEach(function(d) {
            d.num_date = +d.date;
            d.month = d.date.substr(4,2);
            d.date = parse_date(d.month + '-' + d.date.substr(0,4));
        });

        var size = data.length;
        var width  = window.innerWidth - 100 - margins.right - margins.left,
            scale = 1,
            projection = d3.geo.mercator()
                .scale(scale)
                .translate([0,0]);

        // Calculate bounds to properly center map
        var path = d3.geo.path().projection(projection);
        var bounds = path.bounds(topo);
        scale = .98 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
        var translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
            (height - scale * (bounds[1][1] + bounds[0][1])) / 2
        ];

        // update projection
        projection = d3.geo.mercator().scale(scale).translate(translation);
        path = path.projection(projection);

        var station_colors = {};
        stations.forEach(function(d) {
            var g = [];
            g[0] = +d.lng;
            g[1] = +d.lat;
            var position = projection(g);
            d.x = position[0];
            d.y = position[1];

            var used = [];
            for(var i=0; i<size; i++) {
                if(used.indexOf(data[i].station) !== -1) break;

                if(d.station === data[i].station) {
                    used.push(data[i].station);

                    var list = data.filter(function(g) {
                        return d.station === g.station;
                    });

                    var grouped = d3.nest()
                        .key(function(d) { return d.month; })
                        .entries(list);

                    grouped.sort(function(a, b) {
                        return a.key - b.key;
                    });

                    grouped.forEach(function(x) {
                        station_colors[data[i].station + "-" + x.key] = d3.scale.quantize()
                            .domain(d3.extent(x.values, ƒ('dpnp')))
                            .range(precip_colors);
                    });

                    break;
                }
            }
        });

        var start_stations = station_groups(200001);

        /**
         * Create map & clippath
         */
        var map_svg = d3.select('#map').append('svg')
            .attr('height', height)
            .attr('width', width);
           // .call(zoom);

        var defs = map_svg.append('defs');
        var clip = defs.append('clipPath')
            .attr('id', 'clipped-map');

        clip.selectAll("path")
            .data(topo.features)
            .enter()
            .append("path")
            .attr("d", path);

        var map = map_svg.append('g');

        var map_draw = map.selectAll("path")
            .data(topo.features);

        map_draw.enter()
            .append("path");

        map_draw.attr("d", path);

        var station_data = map.selectAll("circle")
            .data(start_stations);

        var circle = circles(station_data);

        /**
         * Create overlay
         */
        var voronoi = d3.geom.voronoi()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .clipExtent([[0, 0], [width, height]]);


        var overlay = map_svg.append('g')
            .attr("id", "voronoi")
            .attr("clip-path", "url(#clipped-map)");

        var overlay_layer = overlay.selectAll('.cell').data(start_stations);

        overlayz(overlay_layer, start_stations, 200001, tip);

        /**
         * Timer
         */
        var timer = chroniton()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .width(width)
            .labelFormat(d3.time.format('%B, %Y'))
            .on('change', function(d) {
                var year = d.getFullYear();
                var month = d.getMonth() + 1;
                if(month < 10) month = "0" + month;
                var full_date = year + '' + month;

                var station_list = station_groups(full_date);
                var station_datas = map.selectAll("circle")
                    .data(station_list);

                circles(station_datas);
                overlayz(overlay.selectAll('.cell').data(station_list), station_list, full_date, tip);
            });

        d3.select("#slider").call(timer);

        /**
         * Show graphs
         */
        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false)
        d3.selectAll('#load').classed('hide', true);

        /**
         * Utility functions
         */

            // Circle info for enter, update and exit
        function circles(selector) {
            selector.enter()
                .append("circle")
                .attr("class", "map-circle");

            selector.attr("cx", function(d) {
                return projection([d.lng, d.lat])[0]; })
                .attr("cy", function(d) {
                    return projection([d.lng, d.lat])[1]; })
                .attr("r", 4);

            selector.exit().remove()
        }

        function draw_overlay(d) {
            return d.cell.length ? "M" + d.cell.join("L") + "Z" : null;
        }

        function overlayz(layer, station_list, time, tip) {
            voronoi(station_list).forEach(function(d) { d.point.cell = d; });

            layer.enter().append("path");

            layer.attr("class", "cell")
                .attr("id", function(d) { return "circle_" + d.station; })
                .attr("d", function(d) { return draw_overlay(d); })
                .on('mouseover touchstart', function(d) {
                    var val = _.find(data, function(o) {
                        return o.station == d.station && o.num_date == time;
                    });

                    tip.transition()
                        .duration(200)
                        .style("opacity", .9);

                    tip.html(
                            '<h4 class="text-center">' + stringDate(val.num_date)+ '</h4>' +
                                '<ul class="list-unstyled">' +
                                '<li>Station Number: ' + val.station + '</li>' +
                                '<li>Total Rainfall: ' + val.tpcp + ' inches</li>' +
                                '<li>Departure from Avg: ' + val.dpnp + ' inches</li>' +
                                '</ul>'
                        )
                        .style("top", (d3.event.pageY-118)+"px")
                        .style("left", (d3.event.pageX-38)+"px");
                })
                .on('mouseout touchend', function(d) {
                    tip.transition()
                        .duration(200)
                        .style("opacity", 0);
                })
                .style("fill", function(d) {
                    var val = _.find(data, function(o) {
                        return o.station == d.station && o.num_date == time;
                    });

                    return colors(val);
                });

            layer.exit().remove();
        }

        function colors(item) {
            return station_colors[item.station + "-" + item.month](item.dpnp);
        }

        function station_groups(selected_time) {
            var start_stations = [];
            for(var i=0; i<stations.length; i++) {
                for(var j=0; j<size; j++) {
                    if(stations[i].station == data[j].station && data[j].num_date == selected_time) {
                        start_stations.push(stations[i]);
                        break;
                    }
                }
            }

            return start_stations;
        }

        /**
         * Get formatted date
         * @param num_date
         * @returns {string}
         */
        function stringDate(num_date) {
            var string_date = "" + num_date;
            var year = string_date.substr(0, 4);
            var month = string_date.substr(4, 2);
            var month_names = ["January", "February", "March",
                "April", "May", "June",
                "July", "August", "September",
                "October", "November", "December"];

            var month_num = parseInt(month, 10) - 1;

            return month_names[month_num] + ", " + year;
        }

});