/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
        var counted,
            failed,
            passed,
            results,
            total,
            unknown;

        total = 0;
        failed = 0;
        passed = 0;
        unknown = 0;
        counted = null;

        results = response.result;
        if (results.length > 0) {
            results.forEach(function(result) {
                switch (result.status) {
                    case 'FAIL':
                        failed = failed + 1;
                        break;
                    case 'PASS':
                        passed = passed + 1;
                        break;
                    default:
                        unknown = unknown + 1;
                        break;
                }
            });

            total = passed + failed + unknown;
            counted = [total, [passed, failed, unknown]];
        }

        return counted;
    }

    function createGraph(data, element, text) {
        var chart,
            setup;

        if (data !== null) {
            chart = k.charts
                .piechart()
                .innerText(text);

            setup = {
                values: data[1],
                total: data[0],
                chart: chart
            };

            html.removeChildren(document.getElementById(element));
            d3.select('#' + element)
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        }
    }

    function countWorkerResponse(response) {
        createGraph(response.data, this.element, this.text);
    }

    function prepareGraph(element, response, text, countFunc) {
        var boundData,
            worker;

        if (!countFunc) {
            if (window.Worker) {
                worker = new Worker('/static/js/worker/count-status.js');
                boundData = {
                    element: element,
                    text: text
                };

                worker.onmessage = countWorkerResponse.bind(boundData);
                worker.postMessage(response);
            } else {
                createGraph(countStatus(response), element, text);
            }
        } else {
            createGraph(countFunc(response), element, text);
        }
    }

    passpie.buildpie = function(element, response, countFunc) {
        prepareGraph(element, response, 'total builds', countFunc);
    };

    passpie.bootpie = function(element, response, countFunc) {
        prepareGraph(element, response, 'total boots', countFunc);
    };

    return passpie;
});
