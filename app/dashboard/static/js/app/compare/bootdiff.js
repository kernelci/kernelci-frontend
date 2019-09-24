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
    'utils/html',
    'charts/diffmatrix',
    'compare/diffcommon',
    'compare/utils'
], function($, html, diffmatrix, common, utils) {
    'use strict';
    var gBootDiff;
    var yData;

    gBootDiff = {};

    // Contains mappings between JSON data keys, labels for display and
    // render function. If the render function is null the default text render
    // will be used.
    // This is used to provide the y-axis labels, along with the keys to use
    // to retrieve data from the binded JSON data.
    yData = [
        ['job', 'Tree', null],
        ['kernel', 'Kernel', utils.renderTextLong],
        ['arch', 'Architecture', null],
        ['mach', 'SoC', null],
        ['lab_name', 'Lab', null],
        ['board_instance', 'Board instance', null],
        ['endian', 'Endianness', null],
        ['status', 'Status', utils.renderBootStatus],
        ['retries', 'Boot retries', utils.renderNumber],
        ['warnings', 'Warnings', utils.renderNumber],
        ['time', 'Boot time (seconds)', utils.renderBootTime],
        ['compiler_version_ext', 'Compiler / Version', utils.renderCompiler],
        ['kernel_image_size', 'Kernel image size', utils.renderBytes],
        ['fastboot', 'Fastboot', utils.renderFastBoot],
        ['load_addr', 'Load address', null],
        ['initrd_addr', 'Initrd address', null],
        ['uimage_addr', 'Uimage address', null],
        ['dtb_addr', 'Dtb address', null],
        ['dtb_append', 'Dtb append', utils.renderBoolean],
        ['bootloader', 'Bootloader / Version', utils.renderBootLoader],
        ['chainloader', 'Chainloader', null],
        ['filesystem', 'File system', null]
    ];

    function setupMatrix(chart, data) {
        var yDataIdx = {};

        function matrixHead(datum, idx) {
            /* jshint validthis: true */
            var defconfig;
            var text;
            var tspan;

            text = document.createElement('text');

            tspan = document.createElement('tspan');
            tspan.appendChild(document.createTextNode(datum.board));
            tspan.setAttribute('y', chart.xScale(idx));
            tspan.setAttribute('x', '0');
            text.appendChild(tspan);

            tspan = document.createElement('tspan');
            tspan.appendChild(document.createTextNode(datum.defconfig));
            tspan.setAttribute('y', chart.xScale(idx));
            tspan.setAttribute('x', '0');
            tspan.setAttribute('dy', '1.2em');
            tspan.className = 'diff-text-head-other';
            text.appendChild(tspan);

            if (datum.defconfig !== datum.defconfig_full) {
                if (datum.defconfig_full.indexOf(datum.defconfig) !== -1) {
                    defconfig =
                        datum.defconfig_full.slice(datum.defconfig.length);

                    if (defconfig[0] === '+') {
                        defconfig = defconfig.slice(1);
                    }
                } else {
                    defconfig = datum.defconfig_full;
                }

                tspan = document.createElement('tspan');
                if (defconfig.length > 24) {
                    $(this).tooltip({
                        html: true,
                        trigger: 'hover',
                        container: 'body',
                        placement: 'bottom',
                        title: defconfig
                    });

                    tspan.appendChild(
                        document.createTextNode(html.sliceText(defconfig, 24)));
                } else {
                    tspan.appendChild(
                        document.createTextNode(defconfig));
                }
                tspan.setAttribute('y', chart.xScale(idx));
                tspan.setAttribute('x', '0');
                tspan.setAttribute('dy', '1.2em');
                tspan.className = 'diff-text-head-other';

                text.appendChild(tspan);
            }

            return text.innerHTML;
        }

        function diffValues(datum, idx) {
            /* jshint validthis: true */
            var args;
            var attrIdx;
            var func;
            var key;
            var rendered;

            key = this.getAttribute('data-key');
            attrIdx = parseInt(this.getAttribute('data-idx'), 10);
            func = yData[yDataIdx[key]][2];

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

            if (common.isValidData(datum[key])) {
                if (func) {
                    rendered = func(args).outerHTML;
                } else {
                    rendered = utils.renderText(args).outerHTML;
                }
            } else {
                args.value = common.icons.default;
                rendered = utils.renderText(args);
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

    gBootDiff.create = function(element, data) {
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
                groupPosition: {top: 175, right: 0, bottom: 2, left: 150}
            }
        };

        diffmatrix.create(args);
    };

    return gBootDiff;
});
