/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
require([
    'jquery',
    'utils/error',
    'utils/init',
    'utils/request',
    'utils/html',
    'utils/date'
], function($, e, init, r, html) {
    'use strict';
    var bootColumns,
        bootsTable,
        bootsTableBody,
        buildColumns,
        buildsTable,
        buildsTableBody,
        data,
        deferred,
        numberRange;

    numberRange = 20;
    buildColumns = 5;
    bootColumns = 8;

    document.getElementById('li-home').setAttribute('class', 'active');

    function registerRowEvent(element) {
        [].forEach.call(element.getElementsByTagName('tr'), function(row) {
            row.addEventListener('click', function() {
                var dataURL;

                dataURL = this.getAttribute('data-url');
                if (dataURL !== null) {
                    window.location = dataURL;
                }
            });
        });
    }

    function getBuildsCountFail() {
        html.replaceByClass('fail-badge', '&infin;');
    }

    function getBuildsCountDone(response) {
        var batchRes,
            resLen,
            results;

        results = response.result;
        resLen = results.length;
        batchRes = null;
        if (resLen > 0) {
            if (resLen === 1) {
                html.replaceContent(
                    document.getElementById('fail-count-0'),
                    document.createTextNode(results[0].count));
            } else {
                results.forEach(function(batch) {
                    batchRes = batch.result[0];
                    html.replaceContent(
                        document.getElementById(batch.operation_id),
                        document.createTextNode(batchRes.count));
                });
            }
        } else {
            html.replaceByClass('fail-badge', '?');
        }
    }

    function getBuildsCount(defconfigResponse) {
        var batchOps,
            resLen,
            results;

        results = defconfigResponse.result;
        resLen = results.length;
        if (resLen > 0) {
            if (resLen === 1) {
                data = {
                    status: 'FAIL',
                    job: results[0].job,
                    kernel: results[0].kernel
                };
                deferred = r.get('/_ajax/count/build', data);
            } else {
                batchOps = new Array(resLen);
                results.forEach(function(value, idx) {
                    batchOps[idx] = {
                        method: 'GET',
                        operation_id: 'fail-count-' + idx,
                        resource: 'count',
                        document: 'build',
                        query: 'status=FAIL&job=' + value.job +
                            '&kernel=' + value.kernel
                    };
                });
                data = JSON.stringify({batch: batchOps});
                deferred = r.post('/_ajax/batch', data);
            }

            $.when(deferred)
                .fail(e.error, getBuildsCountFail)
                .done(getBuildsCountDone);
        }
    }

    function getBuildsFail() {
        var cellNode,
            noDataNode,
            rowNode;

        buildsTableBody.deleteRow(0);

        rowNode = buildsTableBody.insertRow();
        cellNode = rowNode.insertCell();
        cellNode.setAttribute('colspan', buildColumns);
        cellNode.setAttribute('align', 'center');
        cellNode.setAttribute('valign', 'middle');

        noDataNode = html.strong();
        noDataNode.appendChild(
            document.createTextNode('Error loading data.'));

        cellNode.appendChild(noDataNode);
    }

    function getBuildsDone(defconfigResponse) {
        var aNode,
            badgeNode,
            branch,
            branchNode,
            cellNode,
            countNode,
            created,
            iNode,
            job,
            kernel,
            noDataNode,
            resLen,
            results,
            rowHref,
            rowNode,
            tooltipNode;

        results = defconfigResponse.result;
        resLen = results.length;

        buildsTableBody.deleteRow(0);

        if (resLen === 0) {
            rowNode = buildsTableBody.insertRow();
            cellNode = rowNode.insertCell();
            cellNode.setAttribute('colspan', buildColumns);
            cellNode.setAttribute('align', 'center');
            cellNode.setAttribute('valign', 'middle');

            noDataNode = html.strong();
            noDataNode.appendChild(
                document.createTextNode('No failed build reports.'));

            cellNode.appendChild(noDataNode);
        } else {
            results.forEach(function(build, idx) {
                job = build.job;
                kernel = build.kernel;
                branch = build.git_branch;
                created = new Date(build.created_on.$date);

                rowHref = '/build/' + job + '/kernel/' + kernel + '/';

                rowNode = buildsTableBody.insertRow();
                rowNode.setAttribute('data-url', rowHref);

                cellNode = rowNode.insertCell();
                cellNode.className = 'tree-column';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', job + '&nbsp;&dash;&nbsp;' + branch);

                branchNode = html.small();
                branchNode.appendChild(document.createTextNode(branch));

                aNode = html.a();
                aNode.className = 'table-link';
                aNode.setAttribute('href', '/job/' + job + '/');
                aNode.innerHTML = job + '&nbsp;&dash;&nbsp;';

                aNode.appendChild(branchNode);
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'kernel-column';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', kernel);
                tooltipNode.appendChild(document.createTextNode(kernel));

                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'pull-center';

                badgeNode = html.span();
                badgeNode.className = 'badge alert-danger';

                countNode = html.span();
                countNode.className = 'fail-count';
                countNode.id = 'fail-count-' + idx;

                iNode = html.i();
                iNode.className = 'fa fa-cog fa-spin';

                countNode.appendChild(iNode);
                badgeNode.appendChild(countNode);
                cellNode.appendChild(badgeNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'date-column pull-center';
                cellNode.appendChild(
                    document.createTextNode(created.toCustomISODate()));

                cellNode = rowNode.insertCell();
                cellNode.className = 'pull-center';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title',
                    'Details for job&nbsp;' + job +
                    '&nbsp;&dash;&nbsp;' + kernel);

                aNode = html.a();
                aNode.setAttribute('href', rowHref);

                iNode = html.i();
                iNode.className = 'fa fa-search';

                aNode.appendChild(iNode);
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);
            });

            registerRowEvent(buildsTableBody);
        }
    }

    function getBootsFail() {
        var cellNode,
            noDataNode,
            rowNode;

        bootsTableBody.deleteRow(0);

        rowNode = bootsTableBody.insertRow();
        cellNode = rowNode.insertCell();
        cellNode.setAttribute('colspan', bootColumns);
        cellNode.setAttribute('align', 'center');
        cellNode.setAttribute('valign', 'middle');

        noDataNode = html.strong();
        noDataNode.appendChild(
            document.createTextNode('Error loading data.'));

        cellNode.appendChild(noDataNode);
    }

    function getBootsDone(response) {
        var aNode,
            board,
            bootId,
            branch,
            branchNode,
            cellNode,
            created,
            defconfigFull,
            failReason,
            iNode,
            job,
            kernel,
            labName,
            labNode,
            noDataNode,
            resLen,
            results,
            rowHref,
            rowNode,
            tooltipNode;

        results = response.result;
        resLen = results.length;

        bootsTableBody.deleteRow(0);

        if (resLen === 0) {
            rowNode = bootsTableBody.insertRow();
            cellNode = rowNode.insertCell();
            cellNode.setAttribute('colspan', bootColumns);
            cellNode.setAttribute('align', 'center');
            cellNode.setAttribute('valign', 'middle');

            noDataNode = html.strong();
            noDataNode.appendChild(
                document.createTextNode('No failed boot reports.'));

            cellNode.appendChild(noDataNode);
        } else {
            results.forEach(function(boot) {
                board = boot.board;
                bootId = boot._id;
                branch = boot.git_branch;
                created = new Date(boot.created_on.$date);
                defconfigFull = boot.defconfig_full;
                failReason = boot.boot_result_description;
                job = boot.job;
                kernel = boot.kernel;
                labName = boot.lab_name;

                rowHref = '/boot/' + board + '/job/' + job + '/kernel/' +
                    kernel + '/defconfig/' + defconfigFull + '/lab/' +
                    labName + '/?_id=' + bootId.$oid;

                rowNode = bootsTableBody.insertRow();
                rowNode.setAttribute('data-url', rowHref);

                cellNode = rowNode.insertCell();
                cellNode.className = 'tree-column';
                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', job + '&nbsp;&dash;&nbsp;' + branch);

                aNode = html.a();
                aNode.className = 'table-link';
                aNode.setAttribute('href',
                    '/boot/all/job/' + job + '/kernel/' + kernel + '/');

                aNode.appendChild(document.createTextNode(job));
                aNode.innerHTML = aNode.innerHTML + '&nbsp;&dash;&nbsp;';

                branchNode = html.small();
                branchNode.appendChild(document.createTextNode(branch));

                aNode.appendChild(branchNode);
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'kernel-column';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', kernel);

                aNode = html.a();
                aNode.className = 'table-link';
                aNode.setAttribute('href', '/boot/all/job/' + job + '/');

                aNode.appendChild(document.createTextNode(kernel));
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'board-column';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', board);

                aNode = html.a();
                aNode.className = 'table-link';
                aNode.setAttribute(
                    'href',
                    '/boot/' + board + '/job/' + job + '/kernel/' +
                    kernel + '/'
                );

                aNode.appendChild(document.createTextNode(board));
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'defconfig-column';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute('title', defconfigFull);

                aNode = html.a();
                aNode.className = 'table-link';
                aNode.setAttribute(
                    'href',
                    '/boot/' + board + '/job/' + job + '/kernel/' +
                    kernel + '/defconfig/' + defconfigFull + '/'
                );

                aNode.appendChild(document.createTextNode(defconfigFull));
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'lab-column';

                labNode = html.small();

                labNode.appendChild(document.createTextNode(labName));
                cellNode.appendChild(labNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'pull-center';

                tooltipNode = html.tooltip();

                if (failReason === null || failReason === undefined) {
                    tooltipNode.setAttribute('title', 'Failure reason unknown');

                    iNode = html.i();
                    iNode.className = 'fa fa-question-circle';

                    tooltipNode.appendChild(iNode);
                } else {
                    tooltipNode.setAttribute('title', html.escape(failReason));
                    iNode = html.i();
                    iNode.className = 'fa fa-exclamation-triangle red-font';

                    tooltipNode.appendChild(iNode);
                }

                cellNode.appendChild(tooltipNode);

                cellNode = rowNode.insertCell();
                cellNode.className = 'date-column pull-center';

                cellNode.appendChild(
                    document.createTextNode(created.toCustomISODate()));

                cellNode = rowNode.insertCell();
                cellNode.className = 'pull-center';

                tooltipNode = html.tooltip();
                tooltipNode.setAttribute(
                    'title', 'Details for board&nbsp;' + board);

                aNode = html.a();
                aNode.setAttribute('href', rowHref);

                iNode = html.i();
                iNode.className = 'fa fa-search';

                aNode.appendChild(iNode);
                tooltipNode.appendChild(aNode);
                cellNode.appendChild(tooltipNode);
            });

            registerRowEvent(bootsTableBody);
        }
    }

    init();

    if (document.getElementById('number-range') !== null) {
        numberRange = document.getElementById('number-range').value;
    }

    buildsTable = document.getElementById('failed-builds');
    buildsTableBody = buildsTable.tBodies[0];

    bootsTable = document.getElementById('failed-boots');
    bootsTableBody = bootsTable.tBodies[0];

    data = {
        aggregate: 'kernel',
        status: 'FAIL',
        sort: 'created_on',
        sort_order: -1,
        limit: numberRange,
        field: ['job', 'kernel', 'created_on', 'git_branch']
    };
    deferred = r.get('/_ajax/build', data);
    $.when(deferred)
        .fail(e.error, getBuildsFail, getBuildsCountFail)
        .done(getBuildsDone, getBuildsCount);

    data = {
        status: 'FAIL',
        sort_order: -1,
        sort: 'created_on',
        limit: numberRange
    };
    deferred = r.get('/_ajax/boot', data);
    $.when(deferred)
        .fail(e.error, getBootsFail)
        .done(getBootsDone);
});
