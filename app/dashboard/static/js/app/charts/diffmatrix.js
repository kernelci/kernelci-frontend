/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'd3',
    'charts/base',
    'utils/html',
    'charts/matrix'
], function(d3, k, html) {
    'use strict';
    var diffmatrix;

    diffmatrix = {};

    // Dimensions of the legend element.
    diffmatrix.legend = {
        width: 17.5,
        height: 17.5,
        rx: 1
    };

    // Dimensions of the rectangle to represent the 'status'.
    diffmatrix.status = {
        height: 35,
        rx: 2.5,
        ry: 2.5,
        width: 35
    };

    diffmatrix.colors = {
        fail: '#d9534f',
        pass: '#5cb85c',
        unavail: '#7f7e7e',
        unknown: '#f0ad4e'
    };

    diffmatrix.icons = {
        fail: '\uf071',
        pass: '\uf00c',
        unknown: '?',
        default: '\uf05e'
    };

    diffmatrix.build_status = {
        fail: 'Build failed',
        pass: 'Build successful',
        unavail: 'Build not available',
        unknown: 'Build status unknown'
    };

    diffmatrix.symbols = {
        minus: '\u2212',
        plus: '\u002B',
        plus_minus: '\u00B1'
    };

    /**
     * Check if the passed argument is a function.
    **/
    function isFunc(toCheck) {
        return toCheck && typeof(toCheck) === 'function';
    }

    diffmatrix.create = function(args) {
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

    return diffmatrix;
});
