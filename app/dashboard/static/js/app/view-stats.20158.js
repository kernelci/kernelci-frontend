/*! Kernel CI Dashboard v2015.8.2 | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/error',
    'utils/request',
    'charts/statsbar'
], function($, i, b, e, r, chart) {
    'use strict';
    var oneDay = 86400000,
        startDate = null,
        numFormat,
        dateFormat;

    numFormat = new Intl.NumberFormat(['en-US']);
    dateFormat = new Intl.DateTimeFormat(
        ['en-US'], {month: 'long', year: 'numeric'});

    function getStatsFail() {
        b.replaceByClass('loading-stats', '&infin;');
        b.replaceByClass(
            'stat-graph',
            '<div class="pull-center">' +
            '<strong>Error loading data.</strong></div>'
        );
    }

    function createGraphs(response) {
        var results = response.result,
            resLen = results.length,
            localResult,
            createdOn,
            yesterday,
            oneWeek,
            twoWeeks,
            jobData = {},
            buildData = {},
            bootData = {},
            jobDiffs = {},
            buildDiffs = {},
            bootDiffs = {};

        if (resLen === 0) {
            b.replaceByClass(
                'stat-graph',
                '<div class="pull-center">' +
                '<strong>No data available.</strong></div>'
            );
        } else {
            localResult = results[0];
            createdOn = new Date(localResult.created_on.$date);
            yesterday = new Date(createdOn - oneDay);
            oneWeek = new Date(createdOn - (oneDay * 7));
            twoWeeks = new Date(createdOn - (oneDay * 14));

            createdOn = createdOn.getCustomISODate();
            yesterday = yesterday.getCustomISODate();
            oneWeek = oneWeek.getCustomISODate();
            twoWeeks = twoWeeks.getCustomISODate();

            jobDiffs[createdOn] = localResult.total_jobs -
                localResult.daily_total_jobs;
            jobDiffs[yesterday] = localResult.daily_total_jobs -
                localResult.weekly_total_jobs;
            jobDiffs[oneWeek] = localResult.weekly_total_jobs -
                    localResult.biweekly_total_jobs;

            jobData[createdOn] = localResult.total_jobs;
            jobData[yesterday] = localResult.daily_total_jobs;
            jobData[oneWeek] = localResult.weekly_total_jobs;
            jobData[twoWeeks] = localResult.biweekly_total_jobs;

            buildDiffs[createdOn] = localResult.total_builds -
                localResult.daily_total_builds;
            buildDiffs[yesterday] = localResult.daily_total_builds -
                localResult.weekly_total_builds;
            buildDiffs[oneWeek] = localResult.weekly_total_builds -
                    localResult.biweekly_total_builds;

            buildData[createdOn] = localResult.total_builds;
            buildData[yesterday] = localResult.daily_total_builds;
            buildData[oneWeek] = localResult.weekly_total_builds;
            buildData[twoWeeks] = localResult.biweekly_total_builds;

            bootDiffs[createdOn] = localResult.total_boots -
                localResult.daily_total_boots;
            bootDiffs[yesterday] = localResult.daily_total_boots -
                localResult.weekly_total_boots;
            bootDiffs[oneWeek] = localResult.weekly_total_boots -
                    localResult.biweekly_total_boots;

            bootData[createdOn] = localResult.total_boots;
            bootData[yesterday] = localResult.daily_total_boots;
            bootData[oneWeek] = localResult.weekly_total_boots;
            bootData[twoWeeks] = localResult.biweekly_total_boots;

            chart.jobs('job-trends', jobData, jobDiffs);
            chart.builds('build-trends', buildData, buildDiffs);
            chart.boots('boot-trends', bootData, bootDiffs);
        }
    }

    function getStatsDone(response) {
        var results = response.result,
            resLen = results.length,
            localResult,
            createdOn,
            totalDays,
            totalJobs,
            totalBuilds,
            totalBoots;
        if (resLen === 0) {
            b.replaceByClass('loading-stats', '?');
        } else {
            localResult = results[0];
            startDate = new Date(localResult.start_date.$date);
            createdOn = new Date(localResult.created_on.$date);
            totalDays = (createdOn - startDate) / oneDay;

            totalJobs = localResult.total_jobs;
            totalBuilds = localResult.total_builds;
            totalBoots = localResult.total_boots;

            b.replaceById(
                'start-date',
                '<time datetime="' + startDate.toISOString() + '">' +
                    dateFormat.format(startDate) + '<time>'
            );

            b.replaceById(
                'total-jobs', numFormat.format(totalJobs));
            b.replaceById(
                'total-trees',
                numFormat.format(localResult.total_unique_trees));
            b.replaceById(
                'total-kernels',
                numFormat.format(localResult.total_unique_kernels));

            b.replaceById(
                'total-builds', numFormat.format(totalBuilds));
            b.replaceById(
                'total-defconfigs',
                numFormat.format(localResult.total_unique_defconfigs));

            b.replaceById(
                'total-boots', numFormat.format(totalBoots));
            b.replaceById(
                'total-boards',
                numFormat.format(localResult.total_unique_boards));
            b.replaceById(
                'total-archs',
                numFormat.format(localResult.total_unique_archs));
            b.replaceById(
                'total-socs',
                numFormat.format(localResult.total_unique_machs));

            b.replaceById(
                'jobs-avg',
                numFormat.format(Math.round(totalJobs / totalDays))
            );
            b.replaceById(
                'builds-avg',
                numFormat.format(Math.round(totalBuilds / totalDays))
            );
            b.replaceById(
                'boots-avg',
                numFormat.format(Math.round(totalBoots / totalDays))
            );
        }
    }

    function getStats() {
        var deferred,
            data;
        data = {
            sort: 'created_on',
            sort_order: -1,
            limit: 1
        };
        deferred = r.get('/_ajax/statistics', data);
        $.when(deferred)
            .fail(e.error, getStatsFail)
            .done(getStatsDone, createGraphs);
    }

    $(document).ready(function() {
        document.getElementById('li-info').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        getStats();
    });
});
