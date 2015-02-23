// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var KG = (function() {
    'use strict';
    var defWidth = 800,
        defHeight = 250,
        margins = {top: 20, right: 10, bottom: 80, left: 60},
        statusTooltip = '%.1f%%<br />(%d&nbsp;/&nbsp;%d)',
        styles = {};

    // Common styles data structure.
    // This is used since most of the mouse events are handled via JS code
    // and we need an easy way to set/unset CSS attributes.
    styles = {
        'transparent': 0,
        'full': 1,
        'strokeNormal': 1.5,
        'strokeOver': 4
    };

    // Count the status of kernel for the provided data.
    // This is useful to count all the passed/failed defconfigs for a single
    // job.
    // Return an object with keys the kernel names, and attributes:
    // kernel := the kernel name
    // pass := the total number of PASS status
    // fail := the total number of FAIL status
    // other := the total number of other status found
    // total := the total number of element parsed
    function countKernelStatus(data) {
        var dataObj = null,
            localData,
            localLen,
            localResult,
            kernel,
            status,
            i = 0;

        if (data !== null || data !== undefined) {
            dataObj = {};
            localData = data.result;
            localLen = localData.length;

            for (i; i < localLen; i = i + 1) {
                localResult = localData[i];
                kernel = localResult.kernel;
                status = localResult.status;

                if (!dataObj.hasOwnProperty(kernel)) {
                    dataObj[kernel] = {};
                    dataObj[kernel].kernel = kernel;
                }

                switch (status) {
                    case 'PASS':
                        dataObj[kernel].pass = (dataObj[kernel].pass || 0) + 1;
                        break;
                    case 'FAIL':
                        dataObj[kernel].fail = (dataObj[kernel].fail || 0) + 1;
                        break;
                    default:
                        dataObj[kernel].other =
                            (dataObj[kernel].other || 0) + 1;
                        break;
                }

                dataObj[kernel].total = (dataObj[kernel].total || 0) + 1;
            }
        }

        return dataObj;
    }

    // Calculate precentage based on numerator and denominator passed.
    function statusRate(num, den) {
        return (num / den) * 100;
    }

    // data := the data to graph
    // job := the name of the job
    // root := the ID of the element where the graph should be displayed
    // w := the width of the SVG canvas
    // h := the height of the SVG canvas
    function jobStatusRate(data, job, root, w, h) {
        var retVal = 0,
            i = 0,
            padW,
            padH,
            graphData,
            dataSet,
            dataSetLen,
            xScale,
            yScale,
            calcY,
            svg,
            xAxis,
            yAxis,
            lineFunc,
            lineGroup,
            lineObj,
            gridY,
            hoverGroup;

        graphData = countKernelStatus(data);
        if (graphData !== null) {
            dataSet = Object.keys(graphData);
            dataSetLen = dataSet.length;

            if (w === undefined || w === null) {
                w = defWidth;
            }
            if (h === undefined || h === null) {
                h = defHeight;
            }

            padW = w - margins.left - margins.right;
            padH = h - margins.bottom - margins.top;

            svg = d3.select(JSBase.checkIfID(root))
                .append('svg:svg')
                    .attr('height', h)
                    .attr('width', w)
                .append('g')
                    .attr(
                        'transform',
                        'translate(' + margins.left + ',' + margins.top + ')');

            yScale = d3.scale.linear()
                .domain([0, 100])
                .range([padH, 0]);

            calcY = function(kernel) {
                lineObj = graphData[kernel];
                return yScale(statusRate(lineObj.pass, lineObj.total));
            };

            xScale = d3.scale.linear()
                .domain([0, dataSetLen - 1])
                .range([0, padW]);

            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left')
                .ticks(3)
                .innerTickSize(-padW)
                .outerTickSize(0)
                .tickFormat(function(d) {
                    return d + '%';
                });

            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .ticks(dataSetLen)
                .tickFormat(function(d) {
                    return dataSet[d];
                });

            // Add the axis to the canvas
            gridY = svg.append('g')
                .attr('class', 'y-axis axis')
                .call(yAxis);
            gridY.selectAll('g').filter(function(d) {return d;})
                .classed('minor', true);

            svg.append('g')
                .attr('class', 'x-axis axis')
                .attr(
                    'transform',
                    'translate(0,' + padH + ')')
                .call(xAxis)
                .selectAll('text')
                    .attr('class', 'x-tick')
                    .attr('data-kernel', function(d) {
                        return dataSet[d];
                    })
                    .attr('data-job', job)
                    .style('text-anchor', 'end')
                    .attr('transform', 'translate(-5,2) rotate(-45)')
                    .on('click', function() {
                        var el = $(this),
                            kernel = el.data('kernel');
                        window.location = '/build/' + job + '/kernel/' + kernel;
                    })
                    .on('mouseover', function(d, i) {
                        var tick = $(this),
                            hLine = svg.selectAll(
                                '.hover-group .hover-line')[0][i],
                            dot = svg.selectAll('.pass-dot')[0][i];

                        tick.css('font-weight', 'bolder');
                        $(hLine).css('opacity', styles.full);
                        $(dot).tooltip('show');
                        $(dot).css('stroke-width', styles.strokeOver);
                    })
                    .on('mouseout', function(d, i) {
                        var tick = $(this),
                            hLine = svg.selectAll(
                                '.hover-group .hover-line')[0][i],
                            dot = svg.selectAll('.pass-dot')[0][i];

                        tick.css('font-weight', 'normal');
                        $(hLine).css('opacity', styles.transparent);
                        $(dot).tooltip('hide');
                        $(dot).css('stroke-width', styles.strokeNormal);
                    });

            hoverGroup = svg.append('g').attr('class', 'hover-group');
            hoverGroup.selectAll('polyline')
                .data(dataSet)
                .enter()
                .append('svg:polyline')
                    .attr('class', 'hover-line')
                    .style('opacity', styles.transparent)
                    .attr('points', function(d, i) {
                        var x1 = 0,
                            y1 = calcY(d),
                            x2 = xScale(i),
                            y2 = y1,
                            x3 = x2,
                            y3 = padH - y1,
                            points = '%f,%f %f,%f %f,%f';

                        return sprintf(points, x1, y1, x2, y2, x3, y3);
                    });

            // Draw the rate line.
            lineFunc = d3.svg.line()
                .x(function(d, i) {
                    return xScale(i);
                })
                .y(function(d) {
                    return calcY(d);
                });

            lineGroup = svg.append('g').attr('class', 'line');
            lineGroup.append('path').attr('d', lineFunc(dataSet));

            for (i; i < dataSetLen - 1; i = i + 1) {
                lineGroup.append('svg:line')
                    .attr('class', 'pass-line')
                    .attr('x1', xScale(i))
                    .attr('y1', calcY(dataSet[i]))
                    .attr('x2', xScale(i + 1))
                    .attr('y2', calcY(dataSet[i + 1]));
            }

            // Add the pass circles to the graph.
            svg.selectAll('circle')
                .data(dataSet)
                .enter()
                .append('circle')
                    .attr('class', 'pass-dot graph-dot')
                    .style('stroke-width', 1.5)
                    .attr('r', 3)
                    .attr('data-kernel', function(d) {
                        return d;
                    })
                    .attr('data-pass', function(d) {
                        return graphData[d].pass;
                    })
                    .attr('data-total', function(d) {
                        return graphData[d].total;
                    })
                    .attr('cx', function(d, i) {
                        return xScale(i);
                    })
                    .attr('cy', function(d) {
                        return calcY(d);
                    })
                    .on('mouseover', function(d, i) {
                        var tick = svg.selectAll('.x-tick')[0][i],
                            hLine = svg.selectAll(
                                '.hover-group .hover-line')[0][i];

                        $(tick).css('font-weight', 'bolder');
                        $(hLine).css('opacity', styles.full);
                        $(this).css('stroke-width', styles.strokeOver);
                    })
                    .on('mouseout', function(d, i) {
                        var tick = svg.selectAll('.x-tick')[0][i],
                            hLine = svg.selectAll(
                                '.hover-group .hover-line')[0][i];

                        $(tick).css('font-weight', 'normal');
                        $(hLine).css('opacity', styles.transparent);
                        $(this).css('stroke-width', styles.strokeNormal);
                    })
                    .on('click', function(d) {
                        var url = '/build/' + job + '/kernel/' + d + '/';
                        window.location = url;
                    });

            // Add tooltip to the pass circles.
            $('svg .pass-dot').tooltip({
                'html': true,
                'trigger': 'hover',
                'container': 'body',
                'placement': 'top',
                'title': function() {
                    var el = $(this),
                        pass = el.data('pass'),
                        total = el.data('total'),
                        rate = statusRate(pass, total);
                    return sprintf(statusTooltip, rate, pass, total);
                }
            });

            retVal = 1;
        }

        return retVal;
    }

    return {
        jobStatusRate: jobStatusRate
    };
}());
