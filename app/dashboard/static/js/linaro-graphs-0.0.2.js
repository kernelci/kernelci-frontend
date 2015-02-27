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
    var maxData = 45,
        defWidth = 880,
        defHeight = 200,
        defMargins = {top: 30, right: 110, bottom: 70, left: 50},
        statusTooltip = '%.1f%%<br />(%d&nbsp;/&nbsp;%d)',
        kernelStringFmt = 'Kernel:&nbsp;%s',
        translateFmt = 'translate(%f,%f)',
        bootURLFmt = '/boot/%s/job/%s/kernel/%s/defconfig/%s/lab/%s/',
        styles = {},
        GenericGraph,
        BootTimeGraph,
        PassFailGraph;

    // Common styles data structure.
    // This is used since most of the mouse events are handled via JS code
    // and we need an easy way to set/unset CSS attributes.
    styles = {
        'transparent': 0,
        'full': 1,
        'strokeNormal': 1.5,
        'strokeOver': 4
    };

    // Calculate precentage based on numerator and denominator passed.
    function statusRate(num, den) {
        if (num === Math.NaN) {
            num = 0;
        }
        return (num / den) * 100;
    }

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
                    dataObj[kernel].pass = 0;
                    dataObj[kernel].fail = 0;
                    dataObj[kernel].other = 0;
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

    function parseBootData(data) {
        var localData = data.result,
            localLen = localData.length,
            localResult = null,
            parsedResult = null,
            bootTimes = null,
            bootTime = null,
            i = 0,
            kernel,
            createdOn,
            dataObj = {};

        if (localLen > 0) {
            dataObj = [];
            bootTimes = [];
            for (i; i < localLen; i = i + 1) {
                localResult = localData[i];
                kernel = localResult.kernel;
                createdOn = new Date(localResult.created_on.$date);
                bootTime = new Date(localResult.time.$date);

                bootTimes.push(bootTime);
                if (!dataObj.hasOwnProperty(kernel)) {
                    dataObj[kernel] = {};
                    dataObj[kernel].id = localResult._id.$oid;
                    dataObj[kernel].job = localResult.job;
                    dataObj[kernel].defconfig = localResult.defconfig_full;
                    dataObj[kernel].board = localResult.board;
                    dataObj[kernel].lab_name = localResult.lab_name;
                    dataObj[kernel].created_on = createdOn;
                    dataObj[kernel].time = bootTime;
                }
            }
        }

        return [dataObj, bootTimes.sort()];
    }

    GenericGraph = function(elementId, w, h, margins) {
        var self = this;
        self.root = elementId;
        self.data = null;
        self.job = null;
        self.svg = null;
        self.svgGroup = null;
        self.dataSet = null;
        self.dataSetLen = null;
        self.width = w || defWidth;
        self.height = h || defHeight;
        self.margins = margins || defMargins;
        self.paddedW = self.width - self.margins.right - self.margins.left;
        self.paddedH = self.height - self.margins.top - self.margins.bottom;
        self.yScale = d3.scale.linear();
        self.xScale = d3.scale.linear();
        self.xMin = null;
        self.xMax = null;
        self.legend = null;
        self.xAxis = d3.svg.axis().orient('bottom');
        self.yAxis = d3.svg.axis().orient('left');
        self.defs = null;
        self.clipPath = null;

        self.yAxisGroup = null;
        self.xAxisGroup = null;

        self.zoom = null;

        self.yScale
            .domain([0, 100])
            .range([self.paddedH, 0]);

        self.yAxis
            .scale(self.yScale)
            .ticks(3)
            .innerTickSize(-self.paddedW)
            .outerTickSize(0)
            .tickFormat(function(d) {
                return d + '%';
            });
        return self;
    };

    GenericGraph.prototype.init = function() {
        var self = this;
        self.svg = d3.select(self.root)
            .append('svg:svg')
                .attr('width', self.width)
                .attr('height', self.height);

        self.legend = self.svg.append('g')
            .attr('class', 'legend');

        self.svgGroup = self.svg.append('g')
            .attr(
                'transform',
                sprintf(translateFmt, self.margins.left, self.margins.top));

        self.yAxisGroup = self.svgGroup.append('g')
            .attr('class', 'y-axis axis')
            .attr('pointer-events', 'none');

        self.xAxisGroup = self.svgGroup.append('g')
            .attr('class', 'x-axis axis')
            .attr('transform', sprintf(translateFmt, 0, self.paddedH));

        return self;
    };

    GenericGraph.prototype.bind = function(data) {
        var self = this;
        return self;
    };

    GenericGraph.prototype.draw = function() {
        var self = this;
        return self;
    };

    BootTimeGraph = function(elementId, w, h, margins) {
        var self = this;
        GenericGraph.call(self, elementId, w, h, margins);
        self.yScale = d3.time.scale();
        self.hoverGroup = null;
        self.timeGraphLine = null;
        self.bootLineGroup = null;
        self.bootLineFunc = d3.svg.line();
        self.tooltipTimeFormat = null;
        self.bootTooltip = null;
        self.bootSecondsTooltip = '%s seconds<br />Kernel: %s';
        self.bootMinutesTooltip = '%s minutes<br />Kernel: %s';
        self.prevIndex = -1;
        return self;
    };

    BootTimeGraph.prototype = Object.create(GenericGraph.prototype);
    BootTimeGraph.prototype.constructor = BootTimeGraph;

    BootTimeGraph.prototype.init = function() {
        var self = this;
        GenericGraph.prototype.init.call(self);
        self.hoverGroup = self.svgGroup.append('g')
            .attr('class', 'hover-group')
            .attr('pointer-events', 'visible');
        return self;
    };

    BootTimeGraph.prototype.bind = function(data) {
        var self = this,
            parsedResults = null,
            bootTimes = null,
            maxTime,
            maxRange,
            maxDate,
            timeInterval = null,
            interval,
            timeFormat;

        parsedResults = parseBootData(data);
        self.data = parsedResults[0];
        bootTimes = parsedResults[1];

        if (self.data !== null && bootTimes !== null) {
            self.dataSet = Object.keys(self.data);
            self.dataSetLen = self.dataSet.length;
            self.xMin = 0;
            self.xMax = self.dataSetLen - 1;
            maxTime = bootTimes.slice(-1)[0];

            if (maxTime.getMinutes() > 0) {
                maxRange = maxTime.getMinutes() + 1;
                maxDate = new Date(Date.UTC(70, 0, 1, 0, maxRange, 0, 0));
                timeInterval = d3.time.minute.utc;
                interval = maxRange / 2;
                timeFormat = d3.time.format('%Mm');
                self.tooltipTimeFormat = d3.time.format('%M:%S.%L');
                self.bootTooltip = self.bootMinutesTooltip;
            } else {
                maxRange = maxTime.getSeconds() + 1;
                maxDate = new Date(Date.UTC(70, 0, 1, 0, 0, maxRange, 0));
                timeInterval = d3.time.second.utc;
                interval = maxRange / 2;
                timeFormat = d3.time.format(':%Ss');
                self.tooltipTimeFormat = d3.time.format('%S.%L');
                self.bootTooltip = self.bootSecondsTooltip;
            }

            self.yScale
                .domain([bootTimes[0], maxDate])
                .range([self.paddedH, 0]);

            self.yAxis
                .scale(self.yScale)
                .innerTickSize(-self.paddedW)
                .outerTickSize(0)
                .ticks(timeInterval, interval)
                .tickFormat(timeFormat);

            self.xScale
                .domain([self.xMin, self.xMax])
                .rangeRound([0, self.paddedW]);

            self.xAxis
                .scale(self.xScale)
                .ticks(self.dataSetLen)
                .tickFormat(function(d, i) {
                    var kernel = self.dataSet[d];
                    if (self.dataSetLen > maxData) {
                        if (i !== 0 && i !== self.xMax) {
                            if (i % 3 !== 0) {
                                // u2026: unicode horizontal ellipsis
                                // http://unicode-table.com/en/2026/
                                kernel = '\u2026';
                            }
                        }
                    }
                    if (kernel.length > 12) {
                        kernel = kernel.slice(0, 12) + '\u2026';
                    }
                    return kernel;
                });
        }

        return self;
    };

    BootTimeGraph.prototype.calcBootTime = function(kernel) {
        var self = this;
        var bootReport = self.data[kernel];
        return self.yScale(bootReport.time);
    };

    BootTimeGraph.prototype.draw = function() {
        var self = this,
            i = 0;

        if (self.data !== null) {
            self.yAxisGroup.call(self.yAxis)
                .selectAll('g')
                    .filter(function(d) {
                        return d;
                    })
                    .classed('minor', true);

            self.xAxisGroup.call(self.xAxis);
            self.xAxisGroup
                .selectAll('text')
                    .attr('class', 'x-tick')
                    .attr('data-kernel', function(d) {
                        return self.dataSet[d];
                    })
                    .attr('data-job', function(d) {
                        return self.data[self.dataSet[d]].job;
                    })
                    .attr('data-lab', function(d) {
                        return self.data[self.dataSet[d]].lab_name;
                    })
                    .attr('data-defconfig', function(d) {
                        return self.data[self.dataSet[d]].defconfig;
                    })
                    .attr('data-board', function(d) {
                        return self.data[self.dataSet[d]].board;
                    })
                    .attr('data-id', function(d) {
                        return self.data[self.dataSet[d]].id;
                    })
                    .style('text-anchor', 'end')
                    .style('font-size', 'x-small')
                    .attr('transform', 'translate(-5,3) rotate(-45)')
                    .on('click', function() {
                        // this is the DOM element, not the instance!
                        self.xAxisClick(self, this);
                    })
                    .on('mouseover', function(d, i) {
                        self.xAxisMouseOver(self, this, i);
                    })
                    .on('mouseout', function(d, i) {
                        self.xAxisMouseOut(self, this, i);
                    });

            // Draw the lines for mouse over.
            self.hoverGroup.selectAll('polyline')
                .data(self.dataSet)
                .enter()
                .append('svg:polyline')
                    .attr('class', 'hover-line')
                    .style('opacity', styles.transparent)
                    .attr('points', function(d, i) {
                        var x1 = 0,
                            y1 = self.calcBootTime(d),
                            x2 = self.xScale(i),
                            y2 = y1,
                            x3 = x2,
                            y3 = self.paddedH - y1 || self.paddedH,
                            points = '%f,%f %f,%f %f,%f';

                        return sprintf(points, x1, y1, x2, y2, x3, y3);
                    });
            self.hoverGroup
                .on('mousemove', function() {
                    self.hoverGroupMouseMove(self);
                })
                .on('mouseout', function() {
                    self.hoverGroupMouseOut(self);
                });

            // Draw the rate line.
            self.bootLineFunc
                .x(function(d, i) {
                    return self.xScale(i);
                })
                .y(function(d) {
                    return self.calcBootTime(d);
                })
                .interpolate('linear');

            self.bootLineGroup = self.svgGroup.append('g')
                .attr('class', 'line');
            self.bootLineGroup.append('path')
                .attr('class', 'time-path')
                .attr('d', self.bootLineFunc(self.dataSet));

            for (i; i < self.dataSetLen - 1; i = i + 1) {
                self.bootLineGroup.append('svg:line')
                    .attr('class', 'hover-line time-line')
                    .attr('x1', self.xScale(i))
                    .attr('y1', self.calcBootTime(self.dataSet[i]))
                    .attr('x2', self.xScale(i + 1))
                    .attr('y2', self.calcBootTime(self.dataSet[i + 1]));
            }

            // Add the pass circles to the graph.
            self.bootLineGroup.selectAll('circle')
                .data(self.dataSet)
                .enter()
                .append('circle')
                    .attr('class', 'boot-dot graph-dot')
                    .style('stroke-width', styles.strokeNormal)
                    .attr('r', 2.5)
                    .attr('data-kernel', function(d) {
                        return d;
                    })
                    .attr('data-job', function(d) {
                        return self.data[d].job;
                    })
                    .attr('data-lab', function(d) {
                        return self.data[d].lab_name;
                    })
                    .attr('data-defconfig', function(d) {
                        return self.data[d].defconfig;
                    })
                    .attr('data-board', function(d) {
                        return self.data[d].board;
                    })
                    .attr('data-id', function(d) {
                        return self.data[d].id;
                    })
                    .attr('data-time', function(d) {
                        return self.data[d].time.getTime();
                    })
                    .attr('cx', function(d, i) {
                        return self.xScale(i);
                    })
                    .attr('cy', function(d) {
                        return self.calcBootTime(d);
                    })
                    .on('mouseover', function(d, i) {
                        self.timeDotMouseOver(self, i);
                    })
                    .on('mouseout', function(d, i) {
                        self.timeDotMouseOut(self, i);
                    })
                    .on('click', function(d, i) {
                        self.timeDotClick(self, this);
                    });

            self.addDotTooltip(self);
        }
    };

    BootTimeGraph.prototype.graphClick = function(self, element) {
        var el = $(element),
            id = el.data('id'),
            board = el.data('board'),
            kernel = el.data('kernel'),
            job = el.data('job'),
            lab = el.data('lab'),
            defconfig = el.data('defconfig'),
            url;
        url = sprintf(bootURLFmt, board, job, kernel, defconfig, lab);
        url = url + '?_id=' + id;
        window.location = url;
    };

    BootTimeGraph.prototype.timeDotClick = function(self, element) {
        self.graphClick(self, element);
    };

    BootTimeGraph.prototype.xAxisClick = function(self, element) {
        self.graphClick(self, element);
    };

    BootTimeGraph.prototype.hoverGroupMouseOut = function(self, i) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = i || Math.round(inverted),
            dot,
            tick,
            hoverLine;

        if (self.prevIndex !== -1) {
            idx = self.prevIndex;
            self.prevIndex = -1;
        }

        dot = self.svgGroup.selectAll('.boot-dot')[0][idx];
        tick = self.svg.selectAll('.x-tick')[0][idx];
        hoverLine = self.svg.selectAll('.hover-group .hover-line')[0][idx];

        $(tick).css('font-weight', 'normal');
        $(hoverLine).css('opacity', styles.transparent);
        $(dot).css('stroke-width', styles.strokeNormal);
        $(dot).tooltip('hide');
    };

    BootTimeGraph.prototype.hoverGroupMouseMove = function(self, i) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = Math.round(inverted),
            dot,
            tick,
            hoverLine;

        if (self.prevIndex !== idx) {
            if (self.prevIndex !== -1) {
                dot = self.svgGroup
                    .selectAll('.boot-dot')[0][self.prevIndex];
                tick = self.svg.selectAll('.x-tick')[0][self.prevIndex];
                hoverLine = self.svg.selectAll(
                    '.hover-group .hover-line')[0][self.prevIndex];

                $(tick).css('font-weight', 'normal');
                $(hoverLine).css('opacity', styles.transparent);
                $(dot).css('stroke-width', styles.strokeNormal);
                $(dot).tooltip('hide');
            }
            self.hoverGroupMouseOver(self, idx);
            self.prevIndex = idx;
        }
    };

    BootTimeGraph.prototype.hoverGroupMouseOver = function(self, i) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = i || Math.round(inverted),
            dot = self.svgGroup.selectAll('.boot-dot')[0][idx],
            tick = self.svg.selectAll('.x-tick')[0][idx],
            hoverLine = self.svg
                .selectAll('.hover-group .hover-line')[0][idx];

        $(tick).css('font-weight', 'bolder');
        $(hoverLine).css('opacity', styles.full);
        $(dot).css('stroke-width', styles.strokeOver);
        $(dot).tooltip('show');
    };

    BootTimeGraph.prototype.timeDotMouseOver = function(self, i) {
        var dot = self.svgGroup.selectAll('.boot-dot')[0][i],
            tick = self.svgGroup.selectAll('.x-tick')[0][i],
            hoverLine = self.svgGroup.selectAll(
                '.hover-group .hover-line')[0][i];

        $(tick).css('font-weight', 'bolder');
        $(dot).css('stroke-width', styles.strokeOver);
        $(hoverLine).css('opacity', styles.full);
    };

    BootTimeGraph.prototype.timeDotMouseOut = function(self, i) {
        var dot = self.svgGroup.selectAll('.boot-dot')[0][i],
            tick = self.svgGroup.selectAll('.x-tick')[0][i],
            hoverLine = self.svgGroup.selectAll(
                '.hover-group .hover-line')[0][i];

        $(tick).css('font-weight', 'normal');
        $(dot).css('stroke-width', styles.strokeNormal);
        $(hoverLine).css('opacity', styles.transparent);
    };

    BootTimeGraph.prototype.xAxisMouseOver = function(self, element, i) {
        var tick = $(element),
            dot = self.svgGroup.selectAll('.boot-dot')[0][i],
            hoverLine = self.svgGroup.selectAll(
                '.hover-group .hover-line')[0][i];

        tick.css('font-weight', 'bolder');
        $(hoverLine).css('opacity', styles.full);
        $(dot).tooltip('show');
        $(dot).css('stroke-width', styles.strokeOver);
    };

    BootTimeGraph.prototype.xAxisMouseOut = function(self, element, i) {
        var tick = $(element),
            dot = self.svgGroup.selectAll('.boot-dot')[0][i],
            hoverLine = self.svgGroup.selectAll(
                '.hover-group .hover-line')[0][i];

        tick.css('font-weight', 'normal');
        $(hoverLine).css('opacity', styles.transparent);
        $(dot).tooltip('hide');
        $(dot).css('stroke-width', styles.strokeNormal);
    };

    BootTimeGraph.prototype.addDotTooltip = function(self) {
        $('svg .boot-dot').tooltip({
            'html': true,
            'trigger': 'hover',
            'container': 'body',
            'placement': 'top',
            'title': function() {
                var el = $(this),
                    kernel = el.data('kernel'),
                    time = new Date(el.data('time'));

                return sprintf(
                    self.bootTooltip, self.tooltipTimeFormat(time), kernel);
            }
        });
    };

    PassFailGraph = function(elementId, w, h, margins) {
        var self = this;
        GenericGraph.call(self, elementId, w, h, margins);
        self.passLineGroup = null;
        self.passLineFunc = d3.svg.line();
        self.failLineGroup = null;
        self.failLineFunc = d3.svg.line();
        self.hoverGroup = null;
        self.failHoverGroup = null;
        // Prev index when hovering the mouse over the hoverGroup element.
        // This is used to provide show/hide of the elements.
        // Index will never be < 0.
        self.prevIndex = -1;
        self.passLegendText = 'Pass rate';
        self.failLegendText = 'Fail rate';
        return self;
    };

    PassFailGraph.prototype = Object.create(GenericGraph.prototype);
    PassFailGraph.prototype.constructor = PassFailGraph;

    PassFailGraph.prototype.init = function() {
        var self = this;
        GenericGraph.prototype.init.call(self);

        self.hoverGroup = self.svgGroup.append('g')
            .attr('class', 'hover-group pass-hover-group pass')
            .attr('pointer-events', 'visible');

        self.failHoverGroup = self.svgGroup.append('g')
            .attr('class', 'hover-group fail-hover-group fail')
            .attr('pointer-events', 'none');

        return self;
    };

    PassFailGraph.prototype.bind = function(data, job) {
        var self = this;
        self.data = countKernelStatus(data);
        self.job = job;

        if (self.data !== null) {
            self.dataSet = Object.keys(self.data);
            self.dataSetLen = self.dataSet.length;
            self.xMin = 0;
            self.xMax = self.dataSetLen - 1;
            self.xScale.domain([self.xMin, self.xMax]);
            self.xScale.rangeRound([0, self.paddedW]);

            self.xAxis
                .scale(self.xScale)
                .ticks(self.dataSetLen)
                .tickFormat(function(d, i) {
                    var kernel = self.dataSet[d];
                    if (self.dataSetLen > maxData) {
                        if (i !== 0 && i !== self.xMax) {
                            if (i % 3 !== 0) {
                                // u2026: unicode horizontal ellipsis
                                // http://unicode-table.com/en/2026/
                                kernel = '\u2026';
                            }
                        }
                    }
                    if (kernel.length > 12) {
                        kernel = kernel.slice(0, 12) + '\u2026';
                    }
                    return kernel;
                });
        }
        return self;
    };

    PassFailGraph.prototype.hideShowContent = function(self, element) {
        var selection = d3.select(element),
            type = selection.attr('data-type'),
            clicked = selection.attr('data-clicked');

        if (clicked === 'true') {
            selection.classed('legend-clicked', false);
            selection.attr('data-clicked', false);
            self.svg.selectAll('.' + type)
                .classed('hidden', false);
        } else {
            selection.classed('legend-clicked', true);
            selection.attr('data-clicked', true);
            self.svg.selectAll('.' + type)
                .classed('hidden', true);
        }
    };

    PassFailGraph.prototype.drawLegend = function(passText, failText) {
        var self = this;
        // Clean it up, and then fill it up.
        self.legend.selectAll('*').remove();
        self.legend
            .attr('transform',
                sprintf(
                    translateFmt,
                    (self.width - self.margins.right + 15),
                    self.margins.top
                ));
        self.legend.append('rect')
            .attr('class', 'pass-legend')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', 0)
            .attr('y', 0)
            .attr('data-type', 'pass')
            .attr('data-clicked', false)
            .on('click', function() {
                self.hideShowContent(self, this);
            });
        self.legend.append('text')
            .attr('x', 15)
            .attr('y', 10)
            .text(failText || self.passLegendText);
        self.legend.append('rect')
            .attr('class', 'fail-legend')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', 0)
            .attr('y', 20)
            .attr('data-type', 'fail')
            .attr('data-clicked', false)
            .on('click', function() {
                self.hideShowContent(self, this);
            });
        self.legend.append('text')
            .attr('x', 15)
            .attr('y', 30)
            .text(passText || self.failLegendText);

        return self;
    };

    PassFailGraph.prototype.draw = function() {
        var self = this,
            i = 0;

        if (self.data !== null) {
            // set tup the graph legend.
            self.drawLegend();

            self.yAxisGroup.call(self.yAxis)
                .selectAll('g')
                    .filter(function(d) {
                        return d;
                    })
                    .classed('minor', true);

            self.xAxisGroup.call(self.xAxis);
            self.xAxisGroup
                .selectAll('text')
                    .attr('class', 'x-tick')
                    .attr('data-kernel', function(d) {
                        return self.dataSet[d];
                    })
                    .attr('data-job', function() {
                        return self.job;
                    })
                    .style('text-anchor', 'end')
                    .style('font-size', 'x-small')
                    .attr('transform', 'translate(-5,3) rotate(-45)')
                    .on('click', function() {
                        // this is the DOM element, not the instance!
                        self.xAxisClick(this, self);
                    })
                    .on('mouseover', function(d, i) {
                        self.xAxisMouseOver(this, self, i);
                    })
                    .on('mouseout', function(d, i) {
                        self.xAxisMouseOut(this, self, i);
                    });

            // Draw the lines for mouse over.
            self.hoverGroup.selectAll('polyline')
                .data(self.dataSet)
                .enter()
                .append('svg:polyline')
                    .attr('class', 'hover-line pass-hover pass')
                    .style('opacity', styles.transparent)
                    .attr('points', function(d, i) {
                        var x1 = 0,
                            y1 = self.calcPassRate(self, d),
                            x2 = self.xScale(i),
                            y2 = y1,
                            x3 = x2,
                            y3 = self.paddedH - y1,
                            points = '%f,%f %f,%f %f,%f';

                        return sprintf(points, x1, y1, x2, y2, x3, y3);
                    });
            self.hoverGroup
                .on('mousemove', function() {
                    self.hoverGroupMouseMove(self);
                })
                .on('mouseout', function() {
                    self.hoverGroupMouseOut(self);
                });

            // Draw the rate line.
            self.passLineFunc
                .x(function(d, i) {
                    return self.xScale(i);
                })
                .y(function(d) {
                    return self.calcPassRate(self, d);
                })
                .interpolate('linear');

            self.passLineGroup = self.svgGroup.append('g')
                .attr('class', 'line');
            self.passLineGroup.append('path')
                .attr('class', 'pass-path')
                .attr('d', self.passLineFunc(self.dataSet));

            for (i; i < self.dataSetLen - 1; i = i + 1) {
                self.passLineGroup.append('svg:line')
                    .attr('class', 'pass-line pass')
                    .attr('x1', self.xScale(i))
                    .attr('y1', self.calcPassRate(self, self.dataSet[i]))
                    .attr('x2', self.xScale(i + 1))
                    .attr('y2', self.calcPassRate(self, self.dataSet[i + 1]));
            }

            // Add the pass circles to the graph.
            self.passLineGroup.selectAll('circle')
                .data(self.dataSet)
                .enter()
                .append('circle')
                    .attr('class', 'pass-dot graph-dot pass')
                    .style('stroke-width', styles.strokeNormal)
                    .attr('r', 2.5)
                    .attr('data-kernel', function(d) {
                        return d;
                    })
                    .attr('data-job', self.job)
                    .attr('data-pass', function(d) {
                        return self.data[d].pass;
                    })
                    .attr('data-total', function(d) {
                        return self.data[d].total;
                    })
                    .attr('cx', function(d, i) {
                        return self.xScale(i);
                    })
                    .attr('cy', function(d) {
                        return self.calcPassRate(self, d);
                    })
                    .on('mouseover', function(d, i) {
                        self.passDotMouseOver(self, i);
                    })
                    .on('mouseout', function(d, i) {
                        self.passDotMouseOut(self, i);
                    })
                    .on('click', function(d, i) {
                        self.passDotClick(this, self);
                    });

            // Draw the lines for mouse over on failed results.
            self.failHoverGroup.selectAll('polyline')
                .data(self.dataSet)
                .enter()
                .append('svg:polyline')
                    .attr('class', 'hover-line fail-hover fail')
                    .style('opacity', styles.transparent)
                    .attr('points', function(d, i) {
                        var x1 = 0,
                            y1 = self.calcFailRate(self, d),
                            x2 = self.xScale(i),
                            y2 = y1,
                            x3 = x2,
                            y3 = y1,
                            points = '%f,%f %f,%f %f,%f';

                        return sprintf(points, x1, y1, x2, y2, x3, y3);
                    });

            // Draw the rate line for failed results..
            self.failLineFunc
                .x(function(d, i) {
                    return self.xScale(i);
                })
                .y(function(d) {
                    return self.calcFailRate(self, d);
                })
                .interpolate('linear');

            self.failLineGroup = self.svgGroup.append('g')
                .attr('class', 'line');
            self.failLineGroup.append('path')
                .attr('class', 'fail-path')
                .attr('d', self.failLineFunc(self.dataSet));

            for (i = 0; i < self.dataSetLen - 1; i = i + 1) {
                self.failLineGroup.append('svg:line')
                    .attr('class', 'fail-line fail')
                    .attr('x1', self.xScale(i))
                    .attr('y1', self.calcFailRate(self, self.dataSet[i]))
                    .attr('x2', self.xScale(i + 1))
                    .attr('y2', self.calcFailRate(self, self.dataSet[i + 1]));
            }

            // Add the pass circles to the graph.
            self.failLineGroup.selectAll('circle')
                .data(self.dataSet)
                .enter()
                .append('circle')
                    .attr('class', 'fail-dot graph-dot fail')
                    .style('stroke-width', styles.strokeNormal)
                    .attr('r', 2.5)
                    .attr('data-kernel', function(d) {
                        return d;
                    })
                    .attr('data-job', self.job)
                    .attr('data-fail', function(d) {
                        return self.data[d].fail;
                    })
                    .attr('data-total', function(d) {
                        return self.data[d].total;
                    })
                    .attr('cx', function(d, i) {
                        return self.xScale(i);
                    })
                    .attr('cy', function(d) {
                        return self.calcFailRate(self, d);
                    })
                    .on('mouseover', function(d, i) {
                        self.failDotMouseOver(self, i);
                    })
                    .on('mouseout', function(d, i) {
                        self.failDotMouseOut(self, i);
                    })
                    .on('click', function(d, i) {
                        self.failDotClick(this, self);
                    });

            // Add the tooltip to each dots.
            self.addDotTooltip(self);
        }
        return self;
    };

    PassFailGraph.prototype.graphClick = function(element, self) {
        var el = $(element),
            kernel = el.data('kernel'),
            job = el.data('job');
        window.location = '/build/' + job + '/kernel/' + kernel;
    };

    PassFailGraph.prototype.failDotClick = function(element, self) {
        self.graphClick(element, self);
    };

    PassFailGraph.prototype.xAxisClick = function(element, self) {
        self.graphClick(element, self);
    };

    PassFailGraph.prototype.xAxisMouseOver = function(element, self, i) {
        var tick = $(element),
            passLine = self.svgGroup
                .selectAll('.hover-group .pass-hover')[0][i],
            failLine = self.svgGroup
                .selectAll('.hover-group .fail-hover')[0][i],
            passDot = self.svgGroup.selectAll('.pass-dot')[0][i],
            failDot = self.svgGroup.selectAll('.fail-dot')[0][i];

        tick.css('font-weight', 'bolder');
        $(passLine).css('opacity', styles.full);
        $(failLine).css('opacity', styles.full);
        $(passDot).tooltip('show');
        $(passDot).css('stroke-width', styles.strokeOver);
        $(failDot).tooltip('show');
        $(failDot).css('stroke-width', styles.strokeOver);
    };

    PassFailGraph.prototype.xAxisMouseOut = function(element, self, i) {
        var tick = $(element),
            passLine = self.svgGroup
                .selectAll('.hover-group .pass-hover')[0][i],
            failLine = self.svgGroup
                .selectAll('.hover-group .fail-hover')[0][i],
            passDot = self.svgGroup.selectAll('.pass-dot')[0][i],
            failDot = self.svgGroup.selectAll('.fail-dot')[0][i];

        tick.css('font-weight', 'normal');
        $(passLine).css('opacity', styles.transparent);
        $(failLine).css('opacity', styles.transparent);
        $(passDot).tooltip('hide');
        $(passDot).css('stroke-width', styles.strokeNormal);
        $(failDot).tooltip('hide');
        $(failDot).css('stroke-width', styles.strokeNormal);
    };

    PassFailGraph.prototype.calcPassRate = function(self, k) {
        var kernel = self.data[k];
        return self.yScale(statusRate(kernel.pass, kernel.total));
    };

    PassFailGraph.prototype.calcFailRate = function(self, k) {
        var kernel = self.data[k];
        return self.yScale(statusRate(kernel.fail, kernel.total));
    };

    PassFailGraph.prototype.addDotTooltip = function(self) {
        $('svg .pass-dot').tooltip({
            'html': true,
            'trigger': 'hover',
            'container': 'body',
            'placement': 'top',
            'title': function() {
                var el = $(this),
                    kernel = el.data('kernel'),
                    pass = el.data('pass'),
                    total = el.data('total'),
                    rate = statusRate(pass, total);

                return sprintf('%s<br />%s',
                    sprintf(statusTooltip, rate, pass, total),
                    sprintf(kernelStringFmt, kernel)
                );
            }
        });

        $('svg .fail-dot').tooltip({
            'html': true,
            'trigger': 'hover',
            'container': 'body',
            'placement': 'top',
            'title': function() {
                var el = $(this),
                    kernel = el.data('kernel'),
                    fail = el.data('fail'),
                    total = el.data('total'),
                    rate = statusRate(fail, total);

                return sprintf('%s<br />%s',
                    sprintf(statusTooltip, rate, fail, total),
                    sprintf(kernelStringFmt, kernel)
                );
            }
        });
    };

    PassFailGraph.prototype.failDotMouseOver = function(self, i) {
        var dot = self.svgGroup.selectAll('.fail-dot')[0][i],
            tick = self.svgGroup.selectAll('.x-tick')[0][i],
            failLine = self.svgGroup.selectAll(
                '.hover-group .fail-hover')[0][i];

        $(tick).css('font-weight', 'bolder');
        $(dot).css('stroke-width', styles.strokeOver);
        $(failLine).css('opacity', styles.full);
    };

    PassFailGraph.prototype.failDotMouseOut = function(self, i) {
        var dot = self.svgGroup.selectAll('.fail-dot')[0][i],
            tick = self.svgGroup.selectAll('.x-tick')[0][i],
            failLine = self.svgGroup.selectAll(
                '.hover-group .fail-hover')[0][i];

        $(tick).css('font-weight', 'normal');
        $(dot).css('stroke-width', styles.strokeNormal);
        $(failLine).css('opacity', styles.transparent);
    };

    PassFailGraph.prototype.passDotMouseOver = function(self, i) {
        var dot = self.svgGroup.selectAll('.pass-dot')[0][i],
            tick = self.svgGroup.selectAll('.x-tick')[0][i],
            passLine = self.svgGroup.selectAll(
                '.hover-group .pass-hover')[0][i];

        $(tick).css('font-weight', 'bolder');
        $(passLine).css('opacity', styles.full);
        $(dot).css('stroke-width', styles.strokeOver);
    };

    PassFailGraph.prototype.passDotMouseOut = function(self, i) {
        var dot = self.svgGroup.selectAll('.pass-dot')[0][i],
            tick = self.svg.selectAll('.x-tick')[0][i],
            passLine = self.svg.selectAll(
                '.hover-group .pass-hover')[0][i];

        $(tick).css('font-weight', 'normal');
        $(passLine).css('opacity', styles.transparent);
        $(dot).css('stroke-width', styles.strokeNormal);
    };

    PassFailGraph.prototype.passDotClick = function(element, self) {
        self.graphClick(element, self);
    };

    PassFailGraph.prototype.hoverGroupMouseOver = function(self, i) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = i || Math.round(inverted),
            passDot = self.svgGroup.selectAll('.pass-dot')[0][idx],
            failDot = self.svgGroup.selectAll('.fail-dot')[0][idx],
            tick = self.svg.selectAll('.x-tick')[0][idx],
            passLine = self.svg
                .selectAll('.hover-group .pass-hover')[0][idx],
            failLine = self.svgGroup
                .selectAll('.hover-group .fail-hover')[0][idx];

        $(tick).css('font-weight', 'bolder');
        $(passLine).css('opacity', styles.full);
        $(failLine).css('opacity', styles.full);
        $(passDot).css('stroke-width', styles.strokeOver);
        $(passDot).tooltip('show');
        $(failDot).css('stroke-width', styles.strokeOver);
        $(failDot).tooltip('show');
    };

    PassFailGraph.prototype.hoverGroupMouseOut = function(self, i) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = i || Math.round(inverted),
            passDot,
            failDot,
            tick,
            passLine,
            failLine;

        if (self.prevIndex !== -1) {
            idx = self.prevIndex;
            self.prevIndex = -1;
        }

        passDot = self.svgGroup.selectAll('.pass-dot')[0][idx];
        failDot = self.svgGroup.selectAll('.fail-dot')[0][idx];
        tick = self.svg.selectAll('.x-tick')[0][idx];
        passLine = self.svg.selectAll('.hover-group .pass-hover')[0][idx];
        failLine = self.svgGroup.selectAll('.hover-group .fail-hover')[0][idx];

        $(tick).css('font-weight', 'normal');
        $(passLine).css('opacity', styles.transparent);
        $(failLine).css('opacity', styles.transparent);
        $(passDot).css('stroke-width', styles.strokeNormal);
        $(passDot).tooltip('hide');
        $(failDot).css('stroke-width', styles.strokeNormal);
        $(failDot).tooltip('hide');
    };

    PassFailGraph.prototype.hoverGroupMouseMove = function(self) {
        var mXY = d3.mouse(self.hoverGroup.node()),
            inverted = self.xScale.invert(mXY[0]),
            idx = Math.round(inverted),
            passDot,
            failDot,
            tick,
            failLine,
            passLine;

        if (self.prevIndex !== idx) {
            if (self.prevIndex !== -1) {
                passDot = self.svgGroup
                    .selectAll('.pass-dot')[0][self.prevIndex];
                failDot = self.svgGroup
                    .selectAll('.fail-dot')[0][self.prevIndex];
                tick = self.svg.selectAll('.x-tick')[0][self.prevIndex];
                passLine = self.svg.selectAll(
                    '.hover-group .pass-hover')[0][self.prevIndex];
                failLine = self.svg.selectAll(
                    '.hover-group .fail-hover')[0][self.prevIndex];

                $(tick).css('font-weight', 'normal');
                $(passLine).css('opacity', styles.transparent);
                $(failLine).css('opacity', styles.transparent);
                $(passDot).css('stroke-width', styles.strokeNormal);
                $(passDot).tooltip('hide');
                $(failDot).css('stroke-width', styles.strokeNormal);
                $(failDot).tooltip('hide');
            }
            self.hoverGroupMouseOver(self, idx);
            self.prevIndex = idx;
        }
    };

    return {
        BootTimeGraph: BootTimeGraph,
        PassFailGraph: PassFailGraph
    };
}());
