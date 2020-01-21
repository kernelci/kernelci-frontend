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
    'd3',
    'charts/base'
], function(d3, k) {
    'use strict';
    var bar;

    k.charts.bar = function() {
        var margin = {top: 5, right: 25, bottom: 45, left: 75},
            width = 430,
            height = 268,
            w = width - margin.right - margin.left,
            h = height - margin.top - margin.bottom,
            xscale = d3.scale.ordinal().rangeRoundBands([0, w], 0.5, 0.1),
            yscale = d3.scale.linear().range([h, 0]),
            xaxis = d3.svg.axis().orient('bottom'),
            yaxis = d3.svg.axis().orient('left'),
            div,
            svg,
            svge,
            tData,
            barColor,
            tReverse = false,
            dataLength,
            exp,
            parsedData = [],
            maxVal,
            dataKeys,
            xaxisg,
            yaxisg;

        bar = function(selection) {
            selection.each(function(data) {
                var idx = 0,
                    multiplier;

                tData = data.values;
                barColor = data.color;
                tReverse = data.reverse;
                dataKeys = Object.keys(tData);
                dataLength = dataKeys.length;

                for (idx; idx < dataLength; idx = idx + 1) {
                    parsedData.push(tData[dataKeys[idx]]);
                }

                if (tReverse) {
                    parsedData = parsedData.reverse();
                    dataKeys = dataKeys.reverse();
                }

                maxVal = d3.max(parsedData);
                exp = Math.floor(Math.log10(maxVal));

                if (exp === 0 || exp < 0) {
                    exp = 1;
                }
                multiplier = Math.pow(10, exp);

                xscale.domain(d3.range(0, dataLength));
                yscale.domain(
                    [0, Math.ceil(maxVal / multiplier) * multiplier]);

                xaxis
                    .scale(xscale)
                    .ticks(dataLength)
                    .tickFormat(function(d, i) {
                        return dataKeys[i];
                    });

                yaxis
                    .scale(yscale)
                    .ticks(3)
                    .innerTickSize(-w);

                div = d3.select(this).selectAll('svg').data([parsedData]);

                svg = div
                    .enter()
                    .append('svg:svg')
                    .attr('width', width)
                    .attr('height', height);

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

                xaxisg.call(xaxis);
                xaxisg.selectAll('text')
                    .style('font-weight', 'normal');

                yaxisg.call(yaxis);
                yaxisg.selectAll('text')
                    .attr('transform', 'translate(-7,0)');
                // Remove the dashed y-line from the 0 position.
                yaxisg.select('line')
                    .classed('y-first', true);

                svge.selectAll('.bar')
                    .data(parsedData)
                    .enter()
                        .append('rect')
                        .attr('class', 'bar')
                        .attr('x', function(d, i) {
                            return xscale(i);
                        })
                        .attr('width', xscale.rangeBand())
                        .attr('y', function(d) {
                            return yscale(d);
                        })
                        .attr('height', function(d) {
                            return h - yscale(d);
                        })
                        .attr('fill', barColor)
                        .attr('data-key', function(d, i) {
                            return dataKeys[i];
                        });
            });
        };

        return bar;
    };
});
