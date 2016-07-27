/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'utils/request',
    'components/boot/regressions'
], function($, html, request, bootRegressions) {
    'use strict';
    var gRegressions;

    gRegressions = {};

    function getRegressionsFail() {
        html.replaceContent(
            document.getElementById('regressions-container'),
            html.errorDiv('Error loading regressions data.')
        );
    }

    function showRegressions(message) {
        var docFrag;
        var div;
        var node;
        var newRegr;
        var newRegrKeys;
        var recurringRegr;
        var recurringRegrKeys;
        var regrNode;

        newRegr = message.data[0];
        newRegrKeys = Object.keys(newRegr);
        recurringRegr = message.data[1];
        recurringRegrKeys = Object.keys(recurringRegr);

        docFrag = document.createDocumentFragment();

        div = docFrag.appendChild(document.createElement('div'));
        div.className = 'sub-header';

        node = div.appendChild(document.createElement('h4'));
        node.appendChild(document.createTextNode('New'));

        if (newRegrKeys.length === 0) {
            docFrag.appendChild(html.errorDiv('No new regressions found.'));
        } else {
            regrNode = docFrag.appendChild(document.createElement('div'));
            regrNode.id = 'new-regressions-accordion';

            newRegrKeys.forEach(function(k) {
                var regrResult;
                var accordion;

                regrResult = bootRegressions.createSection(k);
                accordion = regrResult[1];

                recurringRegr[k].forEach(function(d, idx) {
                    accordion.appendChild(bootRegressions.createPanel(d, idx));
                });

                regrNode.appendChild(regrResult[0]);
            });
        }

        div = docFrag.appendChild(document.createElement('div'));
        div.className = 'sub-header';

        node = div.appendChild(document.createElement('h4'));
        node.appendChild(document.createTextNode('Recurring'));

        if (recurringRegrKeys.length === 0) {
            docFrag.appendChild(
                html.errorDiv('No recurring regressions found.'));
        } else {
            regrNode = docFrag.appendChild(document.createElement('div'));
            regrNode.id = 'recurring-regressions-accordion';

            recurringRegrKeys.forEach(function(k) {
                var accordion;
                var regrResult;

                regrResult = bootRegressions.createSection(k);
                accordion = regrResult[1];

                recurringRegr[k].forEach(function(d, idx) {
                    accordion.appendChild(bootRegressions.createPanel(d, idx));
                });

                regrNode.appendChild(regrResult[0]);
            });
        }

        html.replaceContent(
            document.getElementById('regressions-container'), docFrag);
    }

    function getRegressionsDone(response) {
        var results;
        var worker;

        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('regressions-container'),
                html.errorDiv('No regressions found.')
            );
        } else {
            if (window.Worker) {
                worker = new Worker(
                    '/static/js/worker/boot-regressions.2016.7.js');

                worker.onmessage = showRegressions;
                worker.postMessage(results[0].regressions);
            } else {
                html.replaceContent(
                    document.getElementById('regressions-container'),
                    html.errorDiv('Unable to calculate regressions.'));
            }
        }
    }

    gRegressions.get = function(job, kernel) {
        var deferred;

        if (job && kernel) {
            deferred = request.get(
                '/_ajax/boot/regressions', {'job': job, 'kernel': kernel});

            $.when(deferred)
                .fail(getRegressionsFail)
                .done(getRegressionsDone);
        } else {
            html.replaceContent(
                document.getElementById('regressions-container'),
                html.errorDiv('Unable to retrieve regressions data.')
            );
        }

    };

    return gRegressions;
});
