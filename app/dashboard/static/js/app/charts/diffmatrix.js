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
    'charts/base',
    'utils/html',
    'charts/matrix'
], function(d3, k, html) {
    'use strict';
    var gDiffmatrix;

    gDiffmatrix = {};

    /**
     * Check if the passed argument is a function.
    **/
    function isFunc(toCheck) {
        return toCheck && typeof(toCheck) === 'function';
    }

    gDiffmatrix.create = function(args) {
        var chart = k.charts.matrix();

        function _callFunc(key) {
            if (chart.hasOwnProperty(key) && isFunc(chart[key])) {
                chart[key](args.options[key]);
            }
        }

        // Set the cell data function: mapping between the data and element.
        if (isFunc(args.cellDataFunc)) {
            chart.cellData(args.cellDataFunc);
        }

        if (args.hasOwnProperty('options') && args.options) {
            Object.keys(args.options).forEach(_callFunc);
        }

        html.removeChildren(document.getElementById(args.element));

        d3.select('#' + args.element)
            .data([args.data])
            .each(function() {
                d3.select(this).call(chart);
            });

        // Complete the graph setup.
        args.setupFunc(chart, args.data);
    };

    return gDiffmatrix;
});
