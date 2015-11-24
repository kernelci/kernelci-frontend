/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/format',
    'utils/error',
    'utils/request',
    'charts/statsbar',
    'utils/html',
    'utils/date'
], function($, init, format, e, r, chart, html) {
    'use strict';
    var dateFormat,
        oneDay,
        startDate;

    oneDay = 86400000;
    startDate = null;

    dateFormat = new Intl.DateTimeFormat(
        ['en-US'], {month: 'long', year: 'numeric'});

    function getStatsFail() {
        html.replaceByClass('loading-stats', '&infin;');
        html.replaceByClassNode(
            'stat-graph', html.errorDiv('Error loading data'));
    }

    function createGraphs(response) {
        var bootData,
            bootDiffs,
            buildData,
            buildDiffs,
            createdOn,
            jobData,
            jobDiffs,
            localResult,
            oneWeek,
            resLen,
            results,
            twoWeeks,
            yesterday;

        results = response.result;
        resLen = results.length;
        jobData = {};
        buildData = {};
        bootData = {};
        jobDiffs = {};
        buildDiffs = {};
        bootDiffs = {};

        if (resLen === 0) {
            html.replaceByClassNode(
                'stat-graph',
                html.errorDiv('No data available'));
        } else {
            localResult = results[0];
            createdOn = new Date(localResult.created_on.$date);
            yesterday = new Date(createdOn - oneDay);
            oneWeek = new Date(createdOn - (oneDay * 7));
            twoWeeks = new Date(createdOn - (oneDay * 14));

            createdOn = createdOn.toCustomISODate();
            yesterday = yesterday.toCustomISODate();
            oneWeek = oneWeek.toCustomISODate();
            twoWeeks = twoWeeks.toCustomISODate();

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
        var createdOn,
            localResult,
            resLen,
            results,
            startNode,
            totalBoots,
            totalBuilds,
            totalDays,
            totalJobs;

        results = response.result;
        resLen = results.length;

        if (resLen === 0) {
            html.replaceByClass('loading-stats', '?');
        } else {
            localResult = results[0];
            startDate = new Date(localResult.start_date.$date);
            createdOn = new Date(localResult.created_on.$date);
            totalDays = (createdOn - startDate) / oneDay;

            totalJobs = localResult.total_jobs;
            totalBuilds = localResult.total_builds;
            totalBoots = localResult.total_boots;

            startNode = document.createElement('time');
            startNode.setAttribute('datetime', startDate.toISOString());
            startNode.appendChild(
                document.createTextNode(dateFormat.format(startDate)));

            html.replaceContent(
                document.getElementById('start-date'), startNode);

            html.replaceContent(
                document.getElementById('total-jobs'),
                document.createTextNode(format.number(totalJobs)));

            html.replaceContent(
                document.getElementById('total-trees'),
                document.createTextNode(
                    format.number(localResult.total_unique_trees))
            );

            html.replaceContent(
                document.getElementById('total-kernels'),
                document.createTextNode(
                    format.number(localResult.total_unique_kernels))
            );

            html.replaceContent(
                document.getElementById('total-builds'),
                document.createTextNode(format.number(totalBuilds)));

            html.replaceContent(
                document.getElementById('total-defconfigs'),
                document.createTextNode(
                    format.number(localResult.total_unique_defconfigs))
            );

            html.replaceContent(
                document.getElementById('total-boots'),
                document.createTextNode(format.number(totalBoots)));

            html.replaceContent(document.getElementById('total-boards'),
                document.createTextNode(
                    format.number(localResult.total_unique_boards))
            );

            html.replaceContent(document.getElementById('total-archs'),
                document.createTextNode(
                    format.number(localResult.total_unique_archs))
            );

            html.replaceContent(document.getElementById('total-socs'),
                document.createTextNode(
                    format.number(localResult.total_unique_machs))
            );

            html.replaceContent(
                document.getElementById('jobs-avg'),
                document.createTextNode(
                    format.number(Math.round(totalJobs / totalDays)))
            );

            html.replaceContent(document.getElementById('builds-avg'),
                document.createTextNode(
                    format.number(Math.round(totalBuilds / totalDays)))
            );

            html.replaceContent(
                document.getElementById('boots-avg'),
                document.createTextNode(
                    format.number(Math.round(totalBoots / totalDays)))
            );
        }
    }

    function getStats() {
        var data,
            deferred;

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

    document.getElementById('li-info').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    getStats();
});
