/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error',
    'utils/tables',
    'utils/const',
    'utils/html',
    'tables/boot',
    'utils/table'
], function($, init, b, r, e, tables, appconst, html, boot, table) {
    'use strict';
    var gBoardsTable,
        gBootsTable,
        gDateRange,
        gPageLen,
        gSearchFilter,
        gSoc;

    document.getElementById('li-soc').setAttribute('class', 'active');
    init.hotkeys();
    init.tooltip();

    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    function _renderBoardDetail(board, type) {
        var aNode,
            tooltipNode,
            rendered;

        if (type === 'display') {
            tooltipNode = html.tooltip();
            tooltipNode.setAttribute(
                'title', 'Boot reports for&nbsp;' + board);

            aNode = document.createElement('a');
            aNode.setAttribute('href', '/boot/' + board + '/');

            aNode.appendChild(html.search());
            tooltipNode.appendChild(aNode);

            rendered = tooltipNode.outerHTML;
        } else {
            rendered = board;
        }

        return rendered;
    }

    function getDistinctBoardsTable(response) {
        var columns,
            dom,
            results,
            tableResults;

        /**
         * Internally used to remap an array of strings into an array of
         * objects whose key is 'board'.
         *
         * @param {string} element: The element from the array.
         * @return {object} An object with key 'board' and value the passed
         * one.
        **/
        function _remapResults(element) {
            return {board: element};
        }

        results = response.result;
        if (results.length > 0) {
            dom = '<"row"<"col-xs-12 col-sm-12 col-md-4 col-lg-4"' +
                '<"length-menu"l>>' +
                '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"<"table-process">>' +
                '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
                '<"row paging"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
                '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

            columns = [
                {
                    data: 'board',
                    title: 'Board'
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: _renderBoardDetail
                }
            ];

            // Remap the distinct results into an array of objets.
            tableResults = results.map(_remapResults);

            gBoardsTable
                .dom(dom)
                .noIdURL(true)
                .rowURL('/boot/%(board)s/')
                .rowURLElements(['board'])
                .data(tableResults)
                .columns(columns)
                .lengthMenu([5, 10, 25, 50])
                .languageLengthMenu('boards per page')
                .order([0, 'asc'])
                .draw();

        } else {
            html.removeElement(
                document.getElementById('boards-table-loading'));
            html.replaceContent(
                document.getElementById('boards-table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getDistinctBoardsFail() {
        html.replaceContentHTML(
            document.getElementById('boards-count'), '&infin;');
    }

    function getDistinctBoardsCount(response) {
        html.replaceContent(
            document.getElementById('boards-count'),
            document.createTextNode(b.formatNumber(response.result.length)));
    }

    function getBootsCountFail() {
        html.replaceContentHTML(
            document.getElementById('boots-count'), '&infin;');
    }

    function getBootsCountDone(response) {
        var results;

        results = response.result;
        if (results.length > 0) {
            html.replaceContent(
                document.getElementById('boots-count'),
                document.createTextNode(
                    b.formatNumber(parseInt(results[0].count, 10))));
        } else {
            html.replaceConten(
                document.getElementById('boots-count'),
                document.createTextNode('?'));
        }
    }

    function getDetails() {
        var data,
            deferred;

        data = {mach: gSoc};

        deferred = r.get('/_ajax/count/boot', data);

        $.when(deferred)
            .fail(e.error, getBootsCountFail)
            .done(getBootsCountDone);

        deferred = r.get('/_ajax/boot/distinct/board', data);

        $.when(deferred)
            .fail(e.error, getDistinctBoardsFail)
            .done(getDistinctBoardsCount, getDistinctBoardsTable);
    }

    function getBootsFail() {
        html.removeElement(document.getElementById('boots-table-loading'));
        html.replaceContent(
            document.getElementById('boots-table-div'),
            html.errorDiv('Error loading data.'));
    }

    function getBootsDone(response) {
        var columns,
            results,
            rowURL;

        results = response.result;
        if (results.length > 0) {
            columns = [
                {
                    data: '_id',
                    visible: false,
                    searchable: false,
                    orderable: false
                },
                {
                    data: 'job',
                    title: 'Tree',
                    type: 'string',
                    className: 'tree-column',
                    render: boot.renderTableTreeAll
                },
                {
                    data: 'git_branch',
                    title: 'Branch',
                    className: 'branch-column'
                },
                {
                    data: 'kernel',
                    title: 'Kernel',
                    type: 'string',
                    className: 'kernel-column',
                    render: boot.renderTableKernel
                },
                {
                    data: 'defconfig_full',
                    title: 'Defconfig',
                    className: 'defconfig-column',
                    render: boot.renderTableDefconfig
                },
                {
                    data: 'board',
                    title: 'Board',
                    className: 'board-column'
                },
                {
                    data: 'arch',
                    title: 'Arch.',
                    className: 'arch-column'
                },
                {
                    data: 'lab_name',
                    title: 'Lab Name',
                    className: 'lab-column'
                },
                {
                    data: 'created_on',
                    title: 'Date',
                    type: 'date',
                    className: 'date-column pull-center',
                    render: boot.renderTableDate
                },
                {
                    data: 'status',
                    title: 'Status',
                    type: 'string',
                    className: 'pull-center',
                    render: boot.renderTableStatus
                },
                {
                    data: 'board',
                    title: '',
                    orderable: false,
                    searchable: false,
                    width: '30px',
                    className: 'pull-center',
                    render: boot.renderTableDetail
                }
            ];

            rowURL = '/boot/%(board)s/job/%(job)s/kernel/%(kernel)s' +
                '/defconfig/%(defconfig_full)s/lab/%(lab_name)s/';

            gBootsTable
                .data(results)
                .columns(columns)
                .order([8, 'desc'])
                .languageLengthMenu('boot reports per page')
                .rowURL(rowURL)
                .rowURLElements(
                    ['board', 'job', 'kernel', 'defconfig_full', 'lab_name']
                )
                .draw();

            gBootsTable
                .pageLen(gPageLen)
                .search(gSearchFilter);
        } else {
            html.removeElement(document.getElementById('boots-table-loading'));
            html.replaceContent(
                document.getElementById('boots-table-div'),
                html.errorDiv('No data found.'));
        }
    }

    function getBoots() {
        var deferred;

        deferred = r.get(
            '/_ajax/boot',
            {
                date_range: gDateRange,
                mach: gSoc,
                sort: 'created_on',
                sort_order: -1,
                field: [
                    '_id',
                    'arch',
                    'board',
                    'created_on',
                    'defconfig_full',
                    'git_branch',
                    'job',
                    'kernel',
                    'lab_name',
                    'status'
                ]
            }
        );

        $.when(deferred)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    }

    if (document.getElementById('date-range') !== null) {
        gDateRange = document.getElementById('date-range').value;
    }
    if (document.getElementById('soc') !== null) {
        gSoc = document.getElementById('soc').value;
    }
    if (document.getElementById('page-len') !== null) {
        gPageLen = document.getElementById('page-len').value;
    }
    if (document.getElementById('search-filter') !== null) {
        gSearchFilter = document.getElementById('search-filter').value;
    }

    gBoardsTable = table({
        tableId: 'boards-table',
        tableDivId: 'boards-table-div',
        tableLoadingDivId: 'boards-table-loading'
    });

    gBootsTable = table({
        tableId: 'boots-table',
        tableDivId: 'boots-table-div',
        tableLoadingDivId: 'boots-table-loading',
        disableSearch: true
    });

    getDetails();
    getBoots();
});
