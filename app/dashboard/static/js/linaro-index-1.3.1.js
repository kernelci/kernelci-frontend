function tableErrorDefconfigFunction() {
    'use strict';

    var staticContent = '<tr>' +
        '<td colspan="5" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    JSBase.replaceContentByID('#failed-builds-body', staticContent);
}

function tableErrorJobFunction() {
    'use strict';

    var staticContent = '<tr>' +
        '<td colspan="3" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    JSBase.replaceContentByID('#failed-jobs-body', staticContent);
}

function tableErrorBootFunction() {
    'use strict';

    var staticContent = '<tr>' +
        '<td colspan="8" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    JSBase.replaceContentByID('#failed-boots-body', staticContent);
}

// Just a wrapper around the real function.
// Used for being passed to the deferred creation.
function countErrorFunction() {
    'use strict';
    JSBase.replaceContentByClass('.fail-badge', '&infin;');
}

// Function to be called after countig all the failed defconfigs.
function countDoneCallback(data) {
    'use strict';

    var localData = data.result,
        len = localData.length,
        i = 0,
        batchResult = null;

    if (len > 0) {
        if (len === 1) {
            $('#fail-count0').empty().append(localData[0].count);
        } else {
            for (i; i < len; i = i + 1) {
                batchResult = localData[i].result[0];
                $(localData[i].operation_id).empty().append(
                    batchResult.count
                );
            }
        }
    } else {
        countErrorFunction();
    }
}

// Count all the failed defconfigs we have in the page.
function countFailedDefconfigs(data) {
    'use strict';
    var localData = data.result,
        i = 0,
        len = localData.length,
        ajaxDeferredCall = null,
        ajaxData = null,
        errorReason = '',
        batchQueries = new Array(len);

    if (len > 0) {
        if (len === 1) {
            // Perform a normal GET.
            errorReason = 'Defconfig data call failed';
            ajaxData = {
                'status': 'FAIL',
                'job': localData[0].job,
                'kernel': localData[0].kernel
            };
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/count/defconfig',
                'GET',
                ajaxData,
                null,
                countErrorFunction,
                errorReason,
                null,
                'failed-count'
            );
        } else {
            // Perform POST on batch API.
            for (i; i < len; i = i + 1) {
                batchQueries[i] = {
                    'method': 'GET',
                    'operation_id': '#fail-count' + i,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=FAIL&job=' + localData[i].job +
                        '&kernel=' + localData[i].kernel
                };
            }

            errorReason = 'Batch count failed';
            ajaxData = JSON.stringify({
                'batch': batchQueries
            });
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/batch',
                'POST',
                ajaxData,
                null,
                countErrorFunction,
                errorReason,
                {'Content-Type': 'application/json'}
            );
        }

        $.when(ajaxDeferredCall).done(countDoneCallback);
    }
}

// Populate the defconfigs table.
function populateDefconfigsTable(data) {
    'use strict';

    var localData = data.result,
        row = '',
        job,
        created,
        col1,
        col2,
        col3,
        col4,
        col5,
        href,
        kernel,
        gitBranch,
        failedDefconf,
        i = 0,
        len = localData.length;

    if (len === 0) {
        row = '<tr><td colspan="5" align="center" valign="middle">' +
            '<h4>No failed builds.</h4></td></tr>';
        $('#failed-builds-body').empty().append(row);
    } else {
        for (i; i < len; i = i + 1) {
            failedDefconf = localData[i];
            job = failedDefconf.job;
            kernel = failedDefconf.kernel;
            gitBranch = failedDefconf.git_branch;
            created = new Date(failedDefconf.created_on.$date);
            href = '/build/' + job + '/kernel/' + kernel + '/';

            col1 = '<td><a class="table-link" href="/job/' + job +
                '/">' + job + '&nbsp;&dash;&nbsp;<small>' +
                gitBranch + '</small></td>';
            col2 = '<td>' + kernel + '</a></td>';
            col3 = '<td class="pull-center">' +
                '<span class="badge alert-danger">' +
                '<span id="fail-count' + i + '" ' +
                'class="fail-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '</td>';
            col4 = '<td class="pull-center">' +
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

        $('#failed-builds-body').empty().append(row);
    }
}

function populateJobsTalbe(data) {
    'use strict';

    var localData = data.result,
        row = '',
        created,
        col1,
        col2,
        col3,
        href,
        job,
        gitBranch,
        failedJob,
        i = 0,
        len = localData.length;

    if (len === 0) {
        row = '<tr><td colspan="4" align="center" valign="middle"><h4>' +
            'No failed jobs.</h4></td></tr>';
        $('#failed-jobs-body').empty().append(row);
    } else {
        for (i; i < len; i = i + 1) {
            failedJob = localData[i];
            created = new Date(failedJob.created_on.$date);
            job = failedJob.job;
            gitBranch = failedJob.git_branch;
            href = '/job/' + job + '/';

            col1 = '<td><a class="table-link" href="' + href + '">' +
                job + '&nbsp;&dash;&nbsp;<small>' +
                gitBranch + '</small>' + '</a></td>';
            col2 = '<td class="pull-center">' +
                created.getCustomISODate() + '</td>';
            col3 = '<td class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for job&nbsp;' + job + '">' +
                '<a href="' + href + '">' +
                '<i class="fa fa-search"></i></a>' +
                '</span></td>';
            row = '<tr data-url="' + href + '">' +
                col1 + col2 + col3 + '</tr>';
        }

        $('#failed-jobs-body').empty().append(row);
    }
}

function populateBootsTable(data) {
    'use strict';
    var localData = data.result,
        row = '',
        created,
        board,
        job,
        kernel,
        defconfigFull,
        labName,
        bootId,
        col1,
        col2,
        col3,
        col4,
        col5,
        col6,
        col7,
        col8,
        href,
        len = localData.length,
        col6Content,
        failureReason = null,
        failedBoot,
        i = 0;

    if (len === 0) {
        row = '<tr><td colspan="8" align="center" valign="middle"><h4>' +
            'No failed boot reports.</h4></td></tr>';
        $('#failed-boots-body').empty().append(row);
    } else {
        for (i; i < len; i = i + 1) {
            failedBoot = localData[i];
            failureReason = failedBoot.boot_result_description;
            if (failureReason === null) {
                col6Content = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="Failure reason unknown">' +
                    '<i class="fa fa-question-circle"></i>' +
                    '</span></td>';
            } else {
                col6Content = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip"' +
                    'title="' + failureReason + '">' +
                    '<i class="fa fa-exclamation-triangle red-font">' +
                    '</i></span></td>';
            }

            created = new Date(failedBoot.created_on.$date);
            job = failedBoot.job;
            kernel = failedBoot.kernel;
            board = failedBoot.board;
            defconfigFull = failedBoot.defconfig_full;
            labName = failedBoot.lab_name;
            bootId = failedBoot._id;
            href = '/boot/' + board + '/job/' + job + '/kernel/' +
                kernel + '/defconfig/' + defconfigFull +
                '/lab/' + labName +
                '/?_id=' + bootId.$oid;

            if (defconfigFull.length > 33) {
                defconfigFull = '<span rel="tooltip" ' +
                    'data-toggle="tooltip" ' +
                    'title="' + defconfigFull + '">' +
                    defconfigFull.slice(0, 33) + '&hellip;</span>';
            }

            col1 = '<td><a class="table-link" href="/job/' + job + '/">' +
                job + '</a></td>';
            col2 = '<td>' + kernel + '</td>';
            col3 = '<td>' + board + '</td>';
            col4 = '<td>' + defconfigFull + '</td>';
            col5 = '<td><small>' + labName + '</small></td>';
            col6 = col6Content;
            col7 = '<td class="pull-center">' +
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

        $('#failed-boots-body').empty().append(row);
    }
}

$(document).ready(function() {
    'use strict';

    $('#li-home').addClass('active');

    var errorReason = '',
        ajaxDeferredCall = null,
        ajaxData = null,
        dateRange = $('#date-range').val();

    // Get failed defconfigs.
    errorReason = 'Defconfig data call failed';
    ajaxData = {
        'aggregate': 'kernel',
        'status': 'FAIL',
        'sort': 'created_on',
        'sort_order': -1,
        'limit': 25,
        'date_range': dateRange,
        'field': ['job', 'kernel', 'created_on', 'git_branch']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/defconf',
        'GET',
        ajaxData,
        populateDefconfigsTable,
        tableErrorDefconfigFunction,
        errorReason,
        null,
        'failed-defconf'
    );

    $.when(ajaxDeferredCall)
        .then(countFailedDefconfigs, countErrorFunction);

    // Get failed boot reports.
    errorReason = 'Boot data call failed';
    ajaxData = {
        'status': 'FAIL',
        'sort_order': -1,
        'sort': 'created_on',
        'limit': 25,
        'date_range': dateRange,
        'field': [
            'board', 'job', 'kernel', 'defconfig', 'created_on',
            'boot_result_description', 'lab_name', '_id',
            'defconfig_full'
        ]
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        ajaxData,
        null,
        tableErrorBootFunction,
        errorReason,
        null,
        'failed-boot'
    );

    $.when(ajaxDeferredCall).done(populateBootsTable);

    // Get failed jobs.
    errorReason = 'Job data call failed';
    ajaxData = {
        'status': 'FAIL',
        'sort': 'created_on',
        'sort_order': -1,
        'limit': 25,
        'date_range': dateRange,
        'field': ['job', 'git_branch', 'created_on']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/job',
        'GET',
        ajaxData,
        null,
        tableErrorJobFunction,
        errorReason,
        null,
        'failed-job'
    );

    $.when(ajaxDeferredCall).done(populateJobsTalbe);
});
