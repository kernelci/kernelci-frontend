/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
        var dataObj = null,
            i = 0,
            count,
            tData,
            dataLength,
            lData,
            kernel,
            status;

        count = response.count;
        if (count > 0) {
            dataObj = {};
            tData = response.result;
            dataLength = tData.length;

            for (i; i < dataLength; i = i + 1) {
                lData = tData[i];
                kernel = lData.kernel;
                status = lData.status;

                if (!dataObj.hasOwnProperty(kernel)) {
                    dataObj[kernel] = {};
                    dataObj[kernel].job = lData.job;
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

    passrate.bootpassrate = function(element, response) {
        var chart,
            setup,
            datat = null;

        datat = countBDReports(response);

        if (datat !== null) {
            chart = k.charts.rate();
            setup = {
                'values': datat,
                'chart': chart,
                'graphType': 'boot',
                'dataAttributes': ['job', 'kernel', 'pass', 'total'],
                'clickFunction': k.toBootLinkClick
            };

            html.removeChildren(document.getElementById(element));

            d3.select('#' + element)
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        } else {
            html.replaceContent(
                document.getElementById(element),
                html.errorDiv('No data available to show.'));
        }
    };

    passrate.buildpassrate = function(element, response) {
        var chart,
            setup,
            datat = null;

        datat = countBDReports(response);

        if (datat !== null) {
            chart = k.charts.rate();
            setup = {
                'values': datat,
                'chart': chart,
                'graphType': 'build',
                'dataAttributes': ['job', 'kernel', 'pass', 'total'],
                'clickFunction': k.toBuildLinkClick
            };

            html.removeChildren(document.getElementById(element));

            d3.select('#' + element)
                .data([setup])
                .each(function(datum) {
                    d3.select(this).call(datum.chart);
                });
        } else {
            html.replaceContent(
                document.getElementById(element),
                html.errorDiv('No data available to show.'));
        }
    };

    return passrate;
});

