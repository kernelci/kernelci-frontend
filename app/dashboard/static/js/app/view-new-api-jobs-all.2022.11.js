/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2022 Collabora Limited
 * Author: Alexandra Pereira <alexandra.pereira@collabora.com>
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
    'utils/error',
    'utils/request',
    'utils/table',
    'utils/html',
    'utils/const',
    'tables/job',
], function($, init, e, r, table, html, appconst, jobt) {
    'use strict';
    var gDateRange;
    var gJobsTable;
    var gPageLen;
    var gSearchFilter;

    setTimeout(function() {
        document.getElementById('li-job').setAttribute('class', 'active');
    }, 15);

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    function getJobsFail() {
        html.replaceContent(
            document.getElementById('table-loading'),
            html.errorDiv('Error loading data.'));
    }

    function getJobsDone(response){
        var columns;
        var results;

        function filterByDate(created){
            var dateNow = new Date();
            var dateReference = new Date(created);
            dateNow.setDate(dateNow.getDate()-gDateRange);
            return dateReference >= dateNow;
        }

        results = Object.values(response.items).filter(item => item.parent === null && filterByDate(item.created)).map((item) => {
            var revision = item.revision;
            revision.status = String(item.state).toUpperCase();
            revision.created = item.created;
            return revision
        });

        if (results.length === 0) {
            html.removeElement(document.getElementById('table-loading'));
            html.replaceContent(
                document.getElementById('table-div'),
                html.errorDiv('No jobs data available.'));
        } else {
            columns = [
                {
                    data: 'tree',
                    title: 'Tree',
                    type: 'string',
                    className: 'tree-column'
                },
                {
                    data: 'branch',
                    title: 'Branch',
                    type: 'string',
                    className: 'branch-column'
                },
                {
                    data: 'describe',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column'
                },
                {
                    data: 'created',
                    title: 'Date',
                    type: 'date',
                    className: 'pull-center',
                    render: jobt.renderDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: jobt.renderStatus
                },
                {
                    data: 'tree',
                    title: '',
                    type: 'string',
                    searchable: false,
                    orderable: false,
                    className: 'select-column pull-center'
                }
            ];

            gJobsTable
                .data(results)
                .columns(columns)
                .order([3, 'desc'])
                .languageLengthMenu('jobs per page')
                .draw();
        }
    }

    function getJobs() {
        var dateNow = new Date();
        dateNow.setDate(dateNow.getDate()-gDateRange);
        var data;
        var deferred;

        data = {
            limit: 100000,
            offset: 0,
            created__gte: dateNow.toISOString().replace('Z', '000'),
        };

        deferred = r.get('/_ajax/nodes', data);
        $.when(deferred)
            .fail(e.error, getJobsFail)
            .done(getJobsDone);
    }

    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }

    gJobsTable = table({
        tableId: 'jobstable',
        tableDivId: 'table-div',
        tableLoadingDivId: 'table-loading'
    });

    setTimeout(getJobs, 10);

    setTimeout(init.hotkeys, 50);
    setTimeout(init.tooltip, 50);
});
