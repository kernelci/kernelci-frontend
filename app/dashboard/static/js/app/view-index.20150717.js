/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require([
    'jquery',
    'sprintf',
    'utils/base',
    'utils/error',
    'utils/init',
    'utils/request'
], function($, p, b, e, i, r) {
    'use strict';
    var numberRange = 20,
        buildColumns = 5,
        bootColumns = 8,
        errorData,
        noBoots,
        noBuilds,
        tooltipFmt,
        kernelBootLinkFmt,
        defconfigBootLinkFmt,
        boardBootLinkFmt,
        fullBootLinkFmt,
        jobBootLinkFmt,
        fullBuildLinkFmt,
        jobBuildLinkFmt;

    errorData = '<tr><td colspan="%d" align="center" valign="middle">' +
        '<strong>Error loading data.</strong></td></tr>';
    noBoots = '<tr><td colspan="%d" align="center" valign="middle"><h4>' +
        'No failed boot reports.</h4></td></tr>';
    noBuilds = '<tr><td colspan="%d" align="center" valign="middle"><h4>' +
        'No failed build reports.</h4></td></tr>';
    tooltipFmt = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="%s">%s</span>';
    kernelBootLinkFmt = '<a class="table-link" ' +
        'href="/boot/all/job/%s/kernel/%s/">%s</a>';
    defconfigBootLinkFmt = '<a class="table-link" ' +
        'href="/boot/%s/job/%s/kernel/%s/defconfig/%s/">%s</a>';
    boardBootLinkFmt = '<a class="table-link" ' +
        'href="/boot/%s/job/%s/kernel/%s/">%s</a>';
    jobBootLinkFmt = '<a class="table-link" href="/boot/all/job/%s/">%s</a>';
    fullBootLinkFmt = '/boot/%s/job/%s/kernel/%s/defconfig/%s/lab/%s/?_id=%s';
    fullBuildLinkFmt = '/build/%s/kernel/%s/';
    jobBuildLinkFmt = '<a class="table-link" href="/job/%s/">%s</a>';

    function getDefconfigsCountFail() {
        b.replaceByClass('fail-badge', '&infin;');
    }

    function getDefconfigsCountDone(response) {
        var results = response.result,
            resLen = results.length,
            idx = 0,
            batchRes = null;

        if (resLen > 0) {
            if (resLen === 1) {
                b.replaceById('fail-count-0', results[0].count);
            } else {
                for (idx; idx < resLen; idx = idx + 1) {
                    batchRes = results[idx].result[0];
                    b.replaceById(results[idx].operation_id, batchRes.count);
                }
            }
        } else {
            b.replaceByClass('fail-badge', '?');
        }
    }

    function getDefconfigsCount(defconfigResponse) {
        var results = defconfigResponse.result,
            resLen = results.length,
            idx = 0,
            deferred,
            data,
            batchOps = new Array(resLen);

        if (resLen > 0) {
            if (resLen === 1) {
                data = {
                    'status': 'FAIL',
                    'job': results[0].job,
                    'kernel': results[0].kernel
                };
                deferred = r.get('/_ajax/count/defconfig', data);
            } else {
                for (idx; idx < resLen; idx = idx + 1) {
                    batchOps[idx] = {
                        'method': 'GET',
                        'operation_id': 'fail-count-' + idx,
                        'collection': 'count',
                        'document_id': 'defconfig',
                        'query': 'status=FAIL&job=' + results[idx].job +
                            '&kernel=' + results[idx].kernel
                    };
                }
                data = JSON.stringify({'batch': batchOps});
                deferred = r.post('/_ajax/batch', data);
            }

            $.when(deferred)
                .fail(e.error, getDefconfigsCountFail)
                .done(getDefconfigsCountDone);
        }
    }

    function getDefconfigsFail() {
        b.replaceById(
            'failed-builds-body', p.sprintf(errorData, buildColumns));
    }

    function getDefconfigsDone(defconfigResponse) {
        var results = defconfigResponse.result,
            resLen = results.length,
            idx = 0,
            defconf = null,
            job,
            kernel,
            branch,
            created,
            href,
            col1,
            col2,
            col3,
            col4,
            col5,
            jobDispl,
            kernelDispl,
            row = '';

        if (resLen === 0) {
            b.replaceById(
                'failed-builds-body', p.sprintf(noBuilds, buildColumns));
        } else {
            for (idx; idx < resLen; idx = idx + 1) {
                defconf = results[idx];
                job = defconf.job;
                kernel = defconf.kernel;
                branch = defconf.git_branch;
                created = new Date(defconf.created_on.$date);
                href = p.sprintf(fullBuildLinkFmt, job, kernel);

                jobDispl = p.sprintf(
                    tooltipFmt,
                    job + ' &dash; ' + branch,
                    p.sprintf(
                        jobBuildLinkFmt,
                        job,
                        job +
                        '&nbsp;&dash;&nbsp;<small>' + branch + '</small>')
                );

                kernelDispl = p.sprintf(tooltipFmt, kernel, kernel);

                col1 = '<td class="tree-column">' + jobDispl + '</td>';
                col2 = '<td class="kernel-column">' + kernelDispl + '</td>';
                col3 = '<td class="pull-center">' +
                    '<span class="badge alert-danger">' +
                    '<span id="fail-count-' + idx + '" ' +
                    'class="fail-badge">' +
                    '<i class="fa fa-cog fa-spin"></i></span></span>' +
                    '</td>';
                col4 = '<td class="date-column pull-center">' +
                    created.getCustomISODate() + '</td>';
                col5 = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for job&nbsp;' + job +
                    '&nbsp;&dash;&nbsp;' + kernel + '">' +
                    '<a href="' + href + '">' +
                    '<i class="fa fa-search"></i></a>' +
                    '</span></td>';
                row += '<tr data-url="' + href + '">' +
                    col1 + col2 + col3 + col4 + col5 + '</tr>';
            }
            b.replaceById('failed-builds-body', row);
        }
    }

    function getBootsFail() {
        b.replaceById('failed-boots-body', p.sprintf(errorData, bootColumns));
    }

    function getBootsDone(bootResponse) {
        var results = bootResponse.result,
            resLen = results.length,
            row = '',
            idx = 0,
            boot = null,
            failReason = null,
            col6Content,
            created,
            job,
            kernel,
            board,
            defconfigFull,
            labName,
            bootId,
            branch,
            kernelDispl,
            defconfigDispl,
            boardDispl,
            jobDispl,
            href,
            col1,
            col2,
            col3,
            col4,
            col5,
            col6,
            col7,
            col8;

        if (resLen === 0) {
            b.replaceById(
                'failed-boots-body', p.sprintf(noBoots, bootColumns));
        } else {
            for (idx; idx < resLen; idx = idx + 1) {
                boot = results[idx];
                failReason = boot.boot_result_description;
                if (failReason === null) {
                    col6Content = '<td class="pull-center">' +
                        '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Failure reason unknown">' +
                        '<i class="fa fa-question-circle"></i>' +
                        '</span></td>';
                } else {
                    col6Content = '<td class="pull-center">' +
                        '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="' + failReason + '">' +
                        '<i class="fa fa-exclamation-triangle red-font">' +
                        '</i></span></td>';
                }

                created = new Date(boot.created_on.$date);
                branch = boot.git_branch;
                job = boot.job;
                kernel = boot.kernel;
                board = boot.board;
                defconfigFull = boot.defconfig_full;
                labName = boot.lab_name;
                bootId = boot._id;
                href = p.sprintf(
                    fullBootLinkFmt,
                    board,
                    job, kernel, defconfigFull, labName, bootId.$oid);

                jobDispl = p.sprintf(
                    tooltipFmt,
                    job + ' &dash; ' + branch,
                    p.sprintf(
                        jobBootLinkFmt,
                        job,
                        job +
                        '&nbsp;&dash;&nbsp;<small>' + branch + '</small>')
                );

                kernelDispl = p.sprintf(
                    tooltipFmt,
                    kernel,
                    p.sprintf(kernelBootLinkFmt, job, kernel, kernel));

                defconfigDispl = p.sprintf(
                    tooltipFmt,
                    defconfigFull,
                    p.sprintf(
                        defconfigBootLinkFmt,
                        board, job, kernel, defconfigFull, defconfigFull));

                boardDispl = p.sprintf(
                    tooltipFmt,
                    board,
                    p.sprintf(boardBootLinkFmt, board, job, kernel, board));

                col1 = '<td class="tree-column">' + jobDispl + '</td>';
                col2 = '<td class="kernel-column">' + kernelDispl + '</td>';
                col3 = '<td class="board-column">' + boardDispl + '</a></td>';
                col4 = '<td class="defconfig-column">' +
                    defconfigDispl + '</td>';
                col5 = '<td class="lab-column"><small>' +
                    labName + '</small></td>';
                col6 = col6Content;
                col7 = '<td class="date-column pull-center">' +
                    created.getCustomISODate() + '</td>';
                col8 = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for board&nbsp;' + board + '">' +
                    '<a href="' + href + '">' +
                    '<i class="fa fa-search"></i></a>' +
                    '</span></td>';
                row += '<tr data-url="' + href + '">' +
                    col1 + col2 + col3 + col4 + col5 + col6 + col7 + col8 +
                    '</tr>';
            }
            b.replaceById('failed-boots-body', row);
        }
    }

    $(document).ready(function() {
        var deferred1,
            deferred2,
            data1,
            data2;
        document.getElementById('li-home').setAttribute('class', 'active');
        // Setup and perform base operations.
        i();

        if (document.getElementById('number-range') !== null) {
            numberRange = document.getElementById('number-range').value;
        }

        data1 = {
            'aggregate': 'kernel',
            'status': 'FAIL',
            'sort': 'created_on',
            'sort_order': -1,
            'limit': numberRange,
            'field': ['job', 'kernel', 'created_on', 'git_branch']
        };
        deferred1 = r.get('/_ajax/defconf', data1);
        $.when(deferred1)
            .fail(e.error, getDefconfigsFail, getDefconfigsCountFail)
            .done(getDefconfigsDone, getDefconfigsCount);

        data2 = {
            'status': 'FAIL',
            'sort_order': -1,
            'sort': 'created_on',
            'limit': numberRange
        };
        deferred2 = r.get('/_ajax/boot', data2);
        $.when(deferred2)
            .fail(e.error, getBootsFail)
            .done(getBootsDone);
    });
});
