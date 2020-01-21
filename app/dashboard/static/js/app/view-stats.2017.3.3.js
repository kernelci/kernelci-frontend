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
    var oneDay;
    var startDate;

    setTimeout(function() {
        document.getElementById('li-info').setAttribute('class', 'active');
    }, 15);

    oneDay = 86400000;
    startDate = null;

    function getStatsFail() {
        html.replaceByClass('loading-stats', '&infin;');
        html.replaceByClassNode(
            'stat-graph', html.errorDiv('Error loading data'));
    }

    function createGraphs(response) {
        var bootData;
        var bootDiffs;
        var buildData;
        var buildDiffs;
        var createdOn;
        var jobData;
        var jobDiffs;
        var localResult;
        var oneWeek;
        var resLen;
        var results;
        var twoWeeks;
        var yesterday;

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

            setTimeout(function() {
                chart.jobs('job-trends', jobData, jobDiffs);
            }, 25);
            setTimeout(function() {
                chart.builds('build-trends', buildData, buildDiffs);
            }, 25);
            setTimeout(function() {
                chart.boots('boot-trends', bootData, bootDiffs);
            }, 25);
        }
    }

    function getStatsDone(response) {
        var createdOn;
        var localResult;
        var resLen;
        var results;
        var startNode;
        var totalBoots;
        var totalBuilds;
        var totalDays;
        var totalJobs;

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
                document.createTextNode(format.date(startDate)));

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
        var data;

        data = {
            sort: 'created_on',
            sort_order: -1,
            limit: 1
        };
        $.when(r.get('/_ajax/statistics', data))
            .fail(e.error, getStatsFail)
            .done(getStatsDone, createGraphs);
    }

    getStats();

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
