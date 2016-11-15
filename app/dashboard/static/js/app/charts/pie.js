/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'd3',
    'sprintf',
    'charts/base'
], function($, d3, p, k) {
    'use strict';
    var piechart;
    var sTooltipFmt;

    sTooltipFmt = '<span ' +
        'rel="tooltip" data-toggle="tooltip" title="%s">%d</span>';

    k.charts.piechart = function() {
        var color;
        var svg;
        var svge;

        var settings;

        settings = {
            legend: false,
            margin: {top: 0, right: 0, bottom: 0, left: 0},
            radius: {inner: -30, outer: -50},
            size: {height: 200, width: 200},
            text: 'total reports'
        };

        // pass, fail, unknown
        color = ['#5cb85c', '#d9534f', '#f0ad4e'];

        piechart = function(selection) {
            var gArc;
            var gLayout;
            var radius;

            radius = Math.min(
                piechart.settings().size.width,
                piechart.settings().size.height) / 2;
            gLayout = d3.layout.pie().sort(null);
            gArc = d3.svg.arc()
                .innerRadius(radius + piechart.settings().radius.inner)
                .outerRadius(radius + piechart.settings().radius.outer);

            selection.each(function(data) {
                svg = d3.select(this).append('svg:svg')
                    .attr('width', piechart.settings().size.width)
                    .attr('height', piechart.settings().size.height);
                svge = svg.append('g')
                    .attr(
                        'transform',
                        'translate(' +
                            (piechart.settings().size.width / 2) + ',' +
                            (piechart.settings().size.height / 2) + ')');

                svge.selectAll('path')
                    .data(gLayout(data.values))
                    .enter()
                    .append('path')
                        .attr('fill', function(d, i) {
                            return color[i];
                        })
                        .attr('d', gArc);

                svge.append('text')
                    .attr('dy', '0em')
                    .style('text-anchor', 'middle')
                    .attr('class', 'pie-chart-inside')
                    .text(data.total);

                svge.append('text')
                    .attr('dy', '1.5em')
                    .style('text-anchor', 'middle')
                    .attr('class', 'pie-chart-data')
                    .text(piechart.settings().text);

                if (piechart.settings().legend) {
                    $('#success-cell')
                        .empty()
                        .append(
                            p.sprintf(
                                sTooltipFmt, 'Successful', data.values[0]))
                        .css('border-bottom-color', color[0]);
                    $('#fail-cell')
                        .empty()
                        .append(
                            p.sprintf(sTooltipFmt, 'Failed', data.values[1]))
                        .css('border-bottom-color', color[1]);
                    $('#unknown-cell')
                        .empty()
                        .append(
                            p.sprintf(sTooltipFmt, 'Unknown', data.values[2]))
                        .css('border-bottom-color', color[2]);
                }
            });
        };

        piechart.settings = function(value) {
            var key;
            var ret = settings;

            if (value) {
                for (key in value) {
                    if (value.hasOwnProperty(key)) {
                        settings[key] = value[key];
                    }
                }
                ret = piechart;
            }
            return ret;
        };

        return piechart;
    };
});
