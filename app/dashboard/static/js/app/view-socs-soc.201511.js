/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error',
    'utils/tables',
    'utils/const',
    'utils/html'
], function($, init, b, r, e, tables, appconst, html) {
    'use strict';
    var gPageLen,
        gSearchFilter,
        gDateRange,
        gBoardsTable,
        gSoc;

    document.getElementById('li-soc').setAttribute('class', 'active');
    gDateRange = appconst.MAX_DATE_RANGE;
    gPageLen = null;
    gSearchFilter = null;

    function getDistinctBoardsTable(response) {
        var columns,
            results,
            tableResults,
            dom;

        function _tableRowClick(event) {
            var target,
                text;

            target = event.target || event.srcElement;
            text = target.textContent || target.innerText;

            if (text) {
                window.location = '/boot/' + text + '/';
            }
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
                    title: 'Board'
                },
                {
                    title: '',
                    orderable: false,
                    searchable: false,
                    className: 'select-column pull-center',
                    render: function(data, type) {
                        var rendered;

                        rendered = data;
                        if (type === 'display') {
                            rendered = '';
                        }
                        return rendered;
                    }
                }
            ];

            tableResults = results.map(function(element) {
                return [element, element];
            });

            gBoardsTable
                .dom(dom)
                .clickFunction(_tableRowClick)
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
        var bootCount,
            results;

        results = response.result;
        if (results.length > 0) {
            bootCount = parseInt(results[0].count, 10);
            html.replaceContent(
                document.getElementById('boots-count'),
                document.createTextNode(b.formatNumber(bootCount)));
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

    init.hotkeys();
    init.tooltip();

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

    // buildsTable = t(['jobstable', 'table-loading', 'table-div'], true);
    gBoardsTable = tables(
        ['boards-table', 'boards-table-loading', 'boards-table-div'], false);
    getDetails();
    // getBuilds();
});
