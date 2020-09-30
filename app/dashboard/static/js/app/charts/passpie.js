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
    'charts/pie'
], function(d3, k, html) {
    'use strict';
    var passpie = {};

    /**
     * Count the elements by their status.
     *
     * @param {Object} response: The response object that contains the results
     * to count. This is received by the backend.
     * @return {Array} A 2-elements array with the total number of elements,
     * and an array with the counts for passed/failed/unknown (in that order).
    **/
    function countStatus(response) {
        var counted;
        var failed;
        var passed;
        var warning;
        var results;
        var unknown;

        failed = 0;
        passed = 0;
        warning = 0;
        unknown = 0;
        counted = null;

        results = response.result;
        if (results.length > 0) {
            results.forEach(function(result) {
                var status;

                if ((result.status == "PASS") && result.warnings)
                    status = 'WARNING';
                else
                    status = result.status;

                switch (status) {
                    case 'FAIL':
                        failed += 1;
                        break;
                    case 'PASS':
                        passed += 1;
                        break;
                    case 'WARNING':
                        warning += 1;
                        break;
                    default:
                        unknown += 1;
                        break;
                }
            });

            counted = [results.length, [passed, warning, failed, unknown]];
        }

        return counted;
    }

    function createGraph(data, settings) {
        var chart;
        var setup;

        if (data !== null) {
            chart = k.charts
                .piechart()
                .settings(settings);

            setup = {
                values: data[1],
                total: data[0],
                chart: chart,
            };

            html.removeChildren(document.getElementById(settings.element));
            d3.select('#' + settings.element)
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        }
    }

    function prepareGraph(settings) {
        var worker;
        if (!settings.countFunc) {
            if (window.Worker) {
                worker = new Worker('/static/js/worker/count-status.js');
                worker.onmessage = function(response) {
                    createGraph(response.data, settings);
                };
                worker.postMessage(settings.response);
            } else {
                createGraph(countStatus(settings.response), settings);
            }
        } else {
            createGraph(settings.countFunc(settings.response), settings);
        }
    }

    passpie.buildpie = function(settings) {
        settings.text = 'total builds';
        prepareGraph(settings);
    };

    passpie.bootpie = function(settings) {
        settings.text = 'total boots';
        prepareGraph(settings);
    };

    passpie.testpie = function(settings) {
        settings.text = 'test results';
        prepareGraph(settings);
    };

    return passpie;
});
