/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
define([
    'jquery',
    'd3',
    'sprintf',
    'charts/base'
], function($, d3, p, k) {
    'use strict';
    var rate,
        rateTooltipFormat;

    rateTooltipFormat = '%.1f%%&nbsp;(%d/%d)<br />%s';

    k.charts.rate = function() {
        var margin = {top: 10, right: 0, bottom: 50, left: 80},
            width = 720,
            height = 145,
            w = width - margin.left - margin.right,
            h = height - margin.top - margin.bottom,
            xscale = d3.scale.linear(),
            yscale = d3.scale.linear().domain([0, 100]).range([h, 0]),
            xaxis = d3.svg.axis().orient('bottom'),
            yaxis = d3.svg.axis().orient('left'),
            zoom = d3.behavior.zoom(),
            dataAttributes = null,
            clickFunction = null,
            gType = '',
            area,
            line,
            svg,
            svge,
            clipP,
            div,
            xaxisg,
            yaxisg,
            tData,
            defs,
            dataKeys,
            parsedData,
            dataLength = 0,
            maxRound = 0,
            fixedW = 45;

        yaxis
            .scale(yscale)
            .ticks(3)
            .innerTickSize(-w)
            .tickFormat(function(d) {
                return d + '%';
            });

        area = d3.svg.area()
            .x(function(d, i) {
                return xscale(i);
            })
            .y0(h)
            .y1(function(d) {
                return yscale(k.rateNumber(d[1], d[0]));
            });

        line = d3.svg.line()
            .x(function(d, i) {
                return xscale(i);
            })
            .y(function(d) {
                return yscale(k.rateNumber(d[1], d[0]));
            })
            .interpolate('linear');

        function setupTooltips() {
            $('svg .pass-dot').tooltip({
                html: true,
                trigger: 'hover',
                container: 'body',
                placement: 'top',
                title: function() {
                    var el = $(this),
                        kernel = el.data('kernel') || 'unknown',
                        pass = el.data('pass') || 0,
                        total = el.data('total') || 0,
                        pRate = el.data('rate') || 0.0;

                    return p.sprintf(
                        rateTooltipFormat, pRate, pass, total, kernel);
                }
            });
        }

        function drawCommon() {
            xaxisg.call(xaxis);

            clipP.selectAll('.data').attr('d', line);
            clipP.selectAll('.area').attr('d', area);
            clipP.selectAll('.pass-dot' + '.' + gType)
                .attr('cx', function(d, i) {
                    return xscale(i);
                })
                .attr('cy', function(d) {
                    return yscale(k.rateNumber(d[1], d[0]));
                })
                .attr('data-rate', function(d) {
                    return k.rateNumber(d[1], d[0]);
                })
                .on('mouseover', function() {
                    var kernel = this.getAttribute('data-kernel') || null,
                        tick;
                    d3.select(this).style('stroke-width', 2.5);
                    if (kernel !== null) {
                        tick = $(
                            'text.x-tick' +
                            '.' + gType +
                            '[data-kernel="' + kernel + '"]');
                        tick.css('font-weight', 'bolder');
                    }
                })
                .on('mouseout', function() {
                    var kernel = this.getAttribute('data-kernel') || null,
                        tick;
                    d3.select(this).style('stroke-width', 1.5);
                    if (kernel !== null) {
                        tick = $(
                            'text.x-tick' +
                            '.' + gType +
                            '[data-kernel="' + kernel + '"]');
                        tick.css('font-weight', 'normal');
                    }
                });

            xaxisg.selectAll('text')
                .attr('class', 'x-tick' + ' ' + gType)
                .style('text-anchor', 'end')
                .style('font-weight', 'normal')
                .attr('transform', 'translate(-5,1) rotate(-20)')
                .on('mouseover', function() {
                    var kernel = this.getAttribute('data-kernel') || null,
                        dot;
                    d3.select(this).style('font-weight', 'bolder');
                    if (kernel !== null) {
                        dot = $(
                            'circle.pass-dot' +
                            '.' + gType +
                            '[data-kernel="' + kernel + '"]');
                        dot.css('stroke-width', 2.5);
                        dot.tooltip('show');
                    }
                })
                .on('mouseout', function() {
                    var kernel = this.getAttribute('data-kernel') || null,
                        dot;
                    d3.select(this).style('font-weight', 'normal');
                    if (kernel !== null) {
                        dot = $(
                            'circle.pass-dot' +
                            '.' + gType +
                            '[data-kernel="' + kernel + '"]');
                        dot.css('stroke-width', 1.5);
                        dot.tooltip('hide');
                    }
                });

            if (clickFunction !== null) {
                clipP.selectAll('.pass-dot')
                    .on('click', function() {
                        clickFunction(this);
                    });

                xaxisg.selectAll('text')
                    .on('click', function() {
                        clickFunction(this);
                    });
            }

            if (dataAttributes !== null) {
                dataAttributes.forEach(function(value) {
                    clipP.selectAll('.pass-dot' + '.' + gType)
                        .attr('data-' + value, function(d, i) {
                            var returnData = null;
                            if (i < dataLength) {
                                returnData = tData[dataKeys[i]][value];
                            }
                            return returnData;
                        });

                    xaxisg.selectAll('text' + '.' + gType)
                        .attr('data-' + value, function(d) {
                            var returnData = null;
                            if (d < dataLength) {
                                returnData = tData[dataKeys[d]][value];
                            }
                            return returnData;
                        });
                });
            }

            setupTooltips();
        }

        // Draw evetyhing that was setup.
        function draw() {
            yaxisg.call(yaxis);
            yaxisg.selectAll('text')
                .attr('transform', 'translate(-7,0)');
            yaxisg.select('line')
                .classed('y-first', true);

            drawCommon();
        }

        function zoomed() {
            var t = null,
                dx = 0,
                dy = 0,
                max = w - maxRound - 1;

            t = zoom.translate();
            dx = Math.min(0, Math.max(t[0], max));
            dy = t[1];

            zoom.translate([dx, dy]);
            drawCommon();
        }

        rate = function(selection) {
            selection.each(function(data) {
                var i = 0,
                    rangeR = w;

                gType = data.graphType || '';
                tData = data.values;
                dataAttributes = data.dataAttributes || null;
                clickFunction = data.clickFunction || null;
                dataKeys = Object.keys(tData);
                parsedData = [new Array(dataLength)];
                dataLength = dataKeys.length;

                xscale
                    .domain([0, dataLength - 1]);
                if (dataLength >= 15) {
                    // Use a fixed width spacing if more than 15.
                    maxRound = dataLength * fixedW;
                    rangeR = maxRound;
                    xscale.rangeRound([0, rangeR]);
                } else if (dataLength <= 14 && dataLength > 3) {
                    xscale.rangeRound([0, w]);
                } else {
                    xscale
                        .domain([0, dataLength])
                        .rangeRound([0, w]);
                }

                for (i; i < dataLength; i = i + 1) {
                    parsedData[0][i] = [
                        tData[dataKeys[i]].total, tData[dataKeys[i]].pass
                    ];
                }

                xaxis
                    .scale(xscale)
                    .ticks(dataLength)
                    .tickFormat(function(d) {
                        var returnData = null,
                            kernel = null;
                        if (d < dataLength) {
                            returnData = null;
                            kernel = dataKeys[d];
                            if (kernel.length > 13) {
                                kernel = kernel.slice(0, 11) + '\u2026';
                            }
                            returnData = kernel;
                        }
                        return returnData;
                    });

                div = d3.select(this).selectAll('svg')
                    .data(parsedData);

                svg = div
                    .enter()
                    .append('svg:svg')
                    .attr('width', width)
                    .attr('height', height);

                defs = svg.append('defs');
                defs.append('clipPath')
                    .attr('id', 'clipper')
                    .append('rect')
                    .attr('x', 0)
                    .attr('y', -10)
                    .attr('width', w)
                    .attr('height', h + 10);

                // Where everything will be appended.
                svge = svg
                    .append('g')
                    .attr(
                        'transform',
                        'translate(' + margin.left + ',' + margin.top + ')');

                // The x axis.
                svge.append('g')
                    .attr('class', 'x axis x-axis')
                    .attr('transform', 'translate(0,' + h + ')');
                xaxisg = svg.selectAll('.x.axis.x-axis');

                // The y axis.
                svge.append('g')
                    .attr('class', 'y axis y-axis')
                    .attr('pointer-events', 'none');
                yaxisg = svg.selectAll('.y.axis.y-axis');

                // The clip-path to cut out the graph.
                clipP = svge.append('g')
                    .attr('clip-path', 'url(#clipper)');

                clipP.selectAll('path.data')
                    .data(parsedData)
                    .enter().append('path')
                        .attr('class', 'data rate-line' + ' ' + gType);

                clipP.selectAll('path.area')
                    .data(parsedData)
                        .enter()
                        .append('path')
                            .attr('class', 'area rate-area' + ' ' + gType);

                clipP.selectAll('circle')
                    .data(parsedData[0])
                    .enter().append('circle')
                        .attr('class', 'pass-dot' + ' ' + gType)
                        .attr('r', 2.5)
                        .style('stroke-width', 1.5);

                if (dataLength >= 15) {
                    zoom.x(xscale)
                        .scaleExtent([1, 1])
                        .on('zoom', zoomed);

                    svg.call(zoom)
                        .on('mousewheel.zoom', null)
                        .on('DOMMouseScroll.zoom', null);

                    clipP.style('cursor', 'move');

                    // Position at the end of the graph, adding 1 more pixel
                    // in order to show the final tick.
                    zoom.translate([w - maxRound - 1, 0]);
                }
                draw();
            });
        };

        rate.width = function(value) {
            var returnData = width;
            if (arguments.length) {
                width = value;
                returnData = rate;
            }
            return returnData;
        };

        rate.xscale = function(value) {
            var returnData = xscale;
            if (arguments.length) {
                xscale = value;
                returnData = rate;
            }
            return returnData;
        };

        return rate;
    };
});
