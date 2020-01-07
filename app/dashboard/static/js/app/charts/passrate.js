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
    'charts/rate'
], function(d3, k, html) {
    'use strict';
    var passrate;

    passrate = {};

    function countBDReports(response) {
        var count,
            dataObj,
            kernel,
            results,
            status;

        function _count(result) {
            kernel = result.kernel;
            status = result.status;

            if (!dataObj.hasOwnProperty(kernel)) {
                dataObj[kernel] = {};
                dataObj[kernel].job = result.job;
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
                    dataObj[kernel].other = (dataObj[kernel].other || 0) + 1;
                    break;
            }

            dataObj[kernel].total = (dataObj[kernel].total || 0) + 1;
        }

        dataObj = null;
        count = response.count;

        if (count > 0) {
            dataObj = {};
            results = response.result;
            results.forEach(_count);
        }

        return dataObj;
    }

    function createGraph(data, settings) {
        if (data) {
            settings.values = data;
            settings.chart = k.charts.rate();

            html.removeChildren(document.getElementById(settings.element));

            d3.select('#' + settings.element)
                .data([settings])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        } else {
            html.replaceContent(
                document.getElementById(settings.element),
                html.errorDiv('No data available to show.'));
        }
    }

    function countWorkerResponse(response) {
        createGraph(response.data, this);
    }

    function prepareGraph(response, settings) {
        var worker;

        if (window.Worker) {
            worker = new Worker('/static/js/worker/count-status-rate.js');

            worker.onmessage = countWorkerResponse.bind(settings);
            worker.postMessage(response);
        } else {
            createGraph(countBDReports(response), settings);
        }
    }

    passrate.testpassrate = function(element, response) {
        prepareGraph(response, {
            element: element,
            graphType: 'test',
            dataAttributes: ['job', 'kernel', 'pass', 'total'],
            clickFunction: k.toBootLinkClick
        });
    };

    passrate.buildpassrate = function(element, response) {
        prepareGraph(response, {
            element: element,
            graphType: 'build',
            dataAttributes: ['job', 'kernel', 'pass', 'total'],
            clickFunction: k.toBuildLinkClick
        });
    };

    return passrate;
});
