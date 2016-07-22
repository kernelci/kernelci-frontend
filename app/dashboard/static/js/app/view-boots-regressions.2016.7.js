/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'utils/request'
], function($, html, request) {
    'use strict';
    var regressions;

    regressions = {};

    function getRegressionsFail() {
        html.replaceContent(
            document.getElementById('regressions-container'),
            html.errorDiv('Error loading regressions data.')
        );
    }

    function getRegressionsDone(response) {
        var results;

        console.log(response);
        results = response.result;
        if (results.length === 0) {
            html.replaceContent(
                document.getElementById('regressions-container'),
                html.errorDiv('No regressions found.')
            );
        } else {
            var docFrag;
            var div;
            var node;

            docFrag = document.createDocumentFragment();

            div = docFrag.appendChild(document.createElement('div'));
            div.className = 'sub-header';
            node = div.appendChild(document.createElement('h4'));
            node.appendChild(document.createTextNode('New Failures'));

            div = docFrag.appendChild(document.createElement('div'));
            div.className = 'sub-header';
            node = div.appendChild(document.createElement('h4'));
            node.appendChild(document.createTextNode('Recurring Failures'));

            html.replaceContent(
                document.getElementById('regressions-container'), docFrag);
        }
    }

    regressions.get = function(job, kernel) {
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

    return regressions;
});
