/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'utils/format',
    'charts/diffmatrix'
], function($, html, format, diffmatrix) {
    'use strict';
    var gBuildDiff;
    var yData;

    gBuildDiff = {};

    function isValidData(val) {
        var isValid;
        var toCheck;

        isValid = false;
        toCheck = String(val).toLowerCase();

        if (val !== null && val !== undefined) {
            if (isFinite(val) || !isNaN(val) || toCheck.length > 0) {
                if (toCheck !== 'null' &&
                        toCheck !== 'undefined' && toCheck !== 'none') {
                    isValid = true;
                }
            }
        }

        return isValid;
    }

    function isNumber(number) {
        if (number !== null &&
                number !== undefined && !isNaN(number) && isFinite(number)) {
            return true;
        }
        return false;
    }

    function renderText(args) {
        var text;

        text = document.createElement('text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('transform', 'translate(0,4)');
        text.setAttribute('x', args.chart.square().width / 2);
        text.setAttribute('y', args.chart.square().height / 2);
        text.className = 'diff-text';

        text.appendChild(document.createTextNode(args.value));

        return text;
    }

    function renderTextLong(args) {
        var rendered;
        var old;

        if (args.value.length > 14) {
            old = args.value;
            args.value = html.sliceText(args.value, 14);

            rendered = renderText(args);

            $(args.parent.parentNode).tooltip({
                html: true,
                trigger: 'hover',
                container: 'body',
                placement: 'top',
                title: old
            });
        } else {
            rendered = renderText(args);
        }

        return rendered;
    }

    function renderStatus(args) {
        var rect;
        var status;
        var tooltip;

        status = args.value.toLowerCase();

        rect = document.createElement('rect');
        rect.setAttribute(
            'x',
            (args.chart.square().width / 2) - (diffmatrix.status.width / 2));
        rect.setAttribute(
            'y',
            (args.chart.square().height / 2) - (diffmatrix.status.height / 2));
        rect.setAttribute('rx', 2.5);
        rect.setAttribute('ry', 2.5);
        rect.setAttribute('width', diffmatrix.status.width);
        rect.setAttribute('height', diffmatrix.status.height);

        if (diffmatrix.colors.hasOwnProperty(status)) {
            rect.setAttribute('fill', diffmatrix.colors[status]);
        } else {
            rect.setAttribute('fill', diffmatrix.colors.unavail);
        }

        if (diffmatrix.build_status.hasOwnProperty(status)) {
            tooltip = diffmatrix.build_status[status];
        } else {
            tooltip = diffmatrix.build_status.unavail;
        }

        $(args.parent).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: tooltip
        });

        return rect;
    }

    function renderFormat(args) {
        var diff;
        var diffNumber;
        var height;
        var text;
        var tspan;
        var width;

        if (!args.format) {
            args.format = function(value) {
                return value;
            };
        }

        width = args.chart.square().width;
        height = args.chart.square().height;

        text = document.createElement('text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('transform', 'translate(0,4)');
        text.setAttribute('x', width / 2);
        text.setAttribute('y', height / 2);
        text.className = 'diff-text';

        tspan = document.createElement('tspan');
        tspan.setAttribute('x', width / 2);

        tspan.appendChild(document.createTextNode(args.format(args.value)));
        text.appendChild(tspan);

        if (args.valueIdx !== 0) {
            if (isNumber(args.baseNumber) && isNumber(args.value)) {
                diffNumber = args.value - args.baseNumber;

                // Reset the text container position and y-translation.
                text.setAttribute('y', height / 4);
                text.setAttribute('transform', 'translate(0,10)');

                tspan = document.createElement('tspan');
                tspan.setAttribute('x', width / 2);
                tspan.setAttribute('dy', '1.2em');

                if (diffNumber === 0) {
                    diff = '(' + diffmatrix.symbols.plus_minus +
                        args.format(diffNumber) + ')';
                } else if (diffNumber > 0) {
                    diff = '(' + diffmatrix.symbols.plus +
                        args.format(diffNumber) + ')';
                } else {
                    diff = '(' + diffmatrix.symbols.minus +
                        args.format(Math.abs(diffNumber)) + ')';
                }

                tspan.innerHTML = diff;
                text.appendChild(tspan);
            }
        }

        return text;
    }

    function renderNumber(args) {
        args.value = parseInt(args.value, 10);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseInt(args.baseline[args.key], 10);
        } else {
            args.baseNumber = 0;
        }

        args.format = format.number;

        return renderFormat(args);
    }

    function renderBytes(args) {
        var title;
        args.value = parseInt(args.value, 10);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseInt(args.baseline[args.key], 10);
        } else {
            args.baseNumber = Math.NaN;
        }

        args.format = format.bytes;
        if (args.valueIdx === 0) {
            title = format.bytesToBytes(args.baseNumber);
        } else {
            title = format.bytesToBytes(args.value);
        }

        $(args.parent).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: title
        });

        return renderFormat(args);
    }

    function renderBuildTime(args) {
        args.value = parseFloat(args.value);

        if (args.baseline.hasOwnProperty(args.key)) {
            args.baseNumber = parseFloat(args.baseline[args.key]);
        } else {
            args.baseNumber = Math.NaN;
        }

        args.format = format.number;

        return renderFormat(args);
    }

    function renderCompiler(args) {
        var compiler;
        var rendered;

        compiler = args.datum.compiler_version_full;

        args.parent
            .parentNode.setAttribute('data-compiler', compiler);

        $(args.parent.parentNode).tooltip({
            html: true,
            trigger: 'hover',
            container: 'body',
            placement: 'top',
            title: compiler
        });

        rendered = renderText(args);

        return rendered;
    }

    // Contains mappings between JSON data keys, labels for display and
    // render function. If the render function is null the default text render
    // will be used.
    // This is used to provide the y-axis labels, along with the keys to use
    // to retrieve data from the binded JSON data.
    yData = [
        ['job', 'Tree', null],
        ['kernel', 'Kernel', renderTextLong],
        ['arch', 'Architecture', null],
        ['status', 'Status', renderStatus],
        ['errors', 'Errors', renderNumber],
        ['warnings', 'Warnings', renderNumber],
        ['mismatches', 'Mistmatches', renderNumber],
        ['compiler_version_ext', 'Compiler / Version', renderCompiler],
        ['text_offset', 'Text offset', null],
        ['build_time', 'Build time', renderBuildTime],
        ['build_log_size', 'Build log size', renderBytes],
        ['kernel_config_size', 'Config file size', renderBytes],
        ['dtb_dir_data', 'Number of dtb files', renderNumber],
        ['kernel_image_size', 'Kernel image size', renderBytes],
        ['modules_size', 'Modules file size', renderBytes],
        ['system_map_size', 'System.map file size', renderBytes]
    ];

    function setupMatrix(chart, data) {
        var yDataIdx = {};

        function matrixHead(datum, idx) {
            var text;
            var tspan;

            text = document.createElement('text');
            tspan = document.createElement('tspan');

            tspan.appendChild(document.createTextNode(datum.defconfig));
            tspan.setAttribute('y', chart.xScale(idx));
            tspan.setAttribute('x', '0');
            text.appendChild(tspan);

            if (datum.defconfig !== datum.defconfig_full) {
                tspan = document.createElement('tspan');
                tspan.appendChild(
                    document.createTextNode(datum.defconfig_full));
                tspan.setAttribute('y', chart.xScale(idx));
                tspan.setAttribute('x', '0');
                tspan.setAttribute('dy', '1.2em');
                tspan.className = 'diff-text-head-other';

                text.appendChild(tspan);
            }

            return text.innerHTML;
        }

        function diffValues(datum, idx) {
            var args;
            var attrIdx;
            var func;
            var key;
            var rendered;

            key = this.getAttribute('data-key');
            func = yData[yDataIdx[key]][2];
            attrIdx = parseInt(this.getAttribute('data-idx'), 10);

            args = {
                attrIdx: attrIdx,
                baseline: data.xdata[0],
                chart: chart,
                datum: datum,
                key: key,
                value: datum[key],
                valueIdx: idx,
                parent: this
            };

            if (isValidData(datum[key])) {
                if (func) {
                    rendered = func(args).outerHTML;
                } else {
                    rendered = renderText(args).outerHTML;
                }
            } else {
                args.value = diffmatrix.icons.default;
                rendered = renderText(args);
                html.addClass(rendered, 'font-awe');

                $(this.parentNode).tooltip({
                    html: true,
                    trigger: 'hover',
                    container: 'body',
                    placement: 'top',
                    title: 'Not available'
                });

                rendered = rendered.outerHTML;
            }

            return rendered;
        }

        chart.matrixCells()
            .append('rect')
            .attr('width', chart.square().width)
            .attr('height', chart.square().height)
            .attr('rx', chart.square().rx)
            .attr('class', 'matrix-background');

        chart.xTextGroup()
            .selectAll('text')
            .data(data.xdata)
            .enter()
            .append('text')
            .html(matrixHead)
            .attr('y', function(ignore, idx) {
                return chart.xScale(idx);
            })
            .attr('transform', 'rotate(-90) translate(6)')
            .attr('class', 'diff-text-head');

        chart.yTextGroup()
            .selectAll('text')
            .data(data.ydata)
            .enter()
            .append('text')
            .text(function(datum, idx) {
                // Map keys to their index for later use.
                yDataIdx[datum[0]] = idx;
                return datum[1];
            })
            .attr('y', function(ignore, idx) {
                var yDx = chart.yScale(idx);
                if (isNaN(yDx)) {
                    yDx = chart.square().height / 2;
                }
                return yDx;
            })
            .attr('transform', 'translate(0,4)');

        chart.matrixLines()
            .selectAll('g.matrix-cell-group')
            .attr('transform', function(ignore, idx) {
                return 'translate(' +
                    (chart.square().width * idx) + ',0)';
            })
            .append('g')
            .attr('data-key', function(datum) {
                return datum;
            })
            .attr('data-idx', function(ignore, idx) {
                return idx;
            })
            .attr('class', 'diff-values');

        chart.matrixLines()
            .selectAll('g.diff-values')
            .data(data.xdata)
            .html(diffValues);
    }

    gBuildDiff.create = function(element, data) {
        var args;
        var i;
        var newData;
        var tData;
        var xLen;

        newData = [];
        xLen = data.xdata.length;

        function _cellDataFunc(ignore, idx) {
            return newData[idx];
        }

        // Create the data structure used to populate the matrix based
        // solely on the keys from the JSON data.
        yData.forEach(function(ydata) {
            i = xLen;
            tData = [];

            while (i > 0) {
                tData.push(ydata[0]);
                i = i - 1;
            }

            newData.push(tData);
        });

        // Inject the yData here since we handle it in a very special way.
        data.ydata = yData;

        args = {
            element: element,
            data: data,
            setupFunc: setupMatrix,
            cellDataFunc: _cellDataFunc,
            options: {
                square: {width: 95, height: 45, rx: 0},
                groupPosition: {top: 180, right: 0, bottom: 2, left: 150}
            }
        };

        diffmatrix.create(args);
    };

    return gBuildDiff;
});
