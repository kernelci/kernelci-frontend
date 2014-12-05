var jobId = $('#job-id').val();
var dateRange = $('#date-range').val();

function emptyTableOnError() {
    'use strict';
    var staticContent = '<tr>' +
        '<td colspan="6" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    $('#builds-body').empty().append(staticContent);
}

function countFailBatchCallback() {
    'use strict';
    JSBase.replaceContentByClass('.count-list-badge', '&infin;');
}

function countFailDefconfigCallback() {
    'use strict';
    JSBase.replaceContentByClass('.count-badge', '&infin;');
}

function countDoneBatchCallback(data) {
    'use strict';
    var localData = data.result,
        dataLen = localData.length,
        firstResult = null,
        secondResult = null,
        firstCount = 0,
        secondCount = 0;

    if (dataLen === 2) {
        firstResult = localData[0];
        secondResult = localData[1];

        firstCount = firstResult.result[0].count;
        secondCount = secondResult.result[0].count;

        $(firstResult.operation_id).empty().append(firstCount);
        $(secondResult.operation_id).empty().append(secondCount);
    } else {
        JSBase.replaceContentByClass('.count-list-badge', '?');
    }
}

function countDoneDefconfigCallback(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        i = 0,
        batchResult = null,
        count = 0;

    if (len > 0) {
        if (len === 1) {
            count = localData[0].count;
            $('#fail-count0').empty().append(count);

            if (count === 0) {
                $('#span-id0').addClass('alert-success');
            } else {
                $('#span-id0').addClass('alert-danger');
            }
        } else {
            for (i; i < len; i = i + 1) {
                batchResult = localData[i].result[0];
                count = batchResult.count;
                $(localData[i].operation_id).empty().append(count);

                if (count === 0) {
                    $('#span-id' + i).addClass('alert-success');
                } else {
                    $('#span-id' + i).addClass('alert-danger');
                }
            }
        }
    } else {
        JSBase.replaceContentByClass('.count-badge', '?');
    }
}

function countFailedDefconfigs(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        ajaxDeferredCall = null,
        ajaxData = null,
        errorReason = '',
        i = 0,
        batchQueries = new Array(len);

    if (len > 0) {
        if (len === 1) {
            // Peform normal GET.
            errorReason = 'Defconfig count failed';
            ajaxData = {
                'status': 'FAIL',
                'job': jobId,
                'kernel': localData[0].kernel
            };
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/count/defconfig',
                'GET',
                ajaxData,
                null,
                countFailDefconfigCallback,
                errorReason,
                null,
                'defconfig-count'
            );
        } else {
            // Perform POST on batch API.
            for (i; i < len; i = i + 1) {
                batchQueries[i] = {
                    'method': 'GET',
                    'operation_id': '#fail-count' + i,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=FAIL&job=' + jobId +
                        '&kernel=' + localData[i].kernel
                };
            }

            errorReason = 'Batch build count failed';
            ajaxData = JSON.stringify({
                'batch': batchQueries
            });
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/batch',
                'POST',
                ajaxData,
                null,
                countFailDefconfigCallback,
                errorReason,
                {'Content-Type': 'application/json'},
                'batch-defconfig-count'
            );
        }

        $.when(ajaxDeferredCall).done(countDoneDefconfigCallback);
    } else {
        JSBase.replaceContentByClass('.count-badge', '?');
    }
}

function defconfigAggregateDone(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        row = '',
        created,
        col1,
        col2,
        col3,
        col4,
        col5,
        col6,
        href,
        kernel,
        gitBranch,
        gitCommit,
        localDefconf,
        i = 0,
        htmlElement = $('#builds-body');

    if (len === 0) {
        row = '<tr><td colspan="6" align="center" valign="middle"><h4>' +
            'No builds available.</h4></td></tr>';
        htmlElement.empty().append(row);
    } else {
        for (i; i < len; i = i + 1) {
            localDefconf = localData[i];
            kernel = localDefconf.kernel;
            gitBranch = localDefconf.git_branch;
            gitCommit = localDefconf.git_commit;
            created = new Date(localDefconf.created_on.$date);
            href = '/build/' + jobId + '/kernel/' + kernel + '/';

            col1 = '<td>' + kernel + '</td>';
            col2 = '<td>' + gitBranch + '</td>';
            col3 = '<td>' + gitCommit + '</td>';
            col4 = '<td><div class="pull-center">' +
                '<span id="span-id' + i + '" ' +
                'class="badge">' +
                '<span id="fail-count' + i + '" class="count-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '<div></td>';
            col5 = '<td><div class="pull-center">' +
                created.getCustomISODate() +
                '</div></td>';
            col6 = '<td class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build&nbsp;' + jobId +
                '&nbsp;&dash;&nbsp;' + kernel + '">' +
                '<a href="' + href + '">' +
                '<i class="fa fa-search"></i></a>' +
                '</span></td>';
            row += '<tr data-url="' + href + '">' +
                col1 + col2 + col3 + col4 + col5 + col6 + '</tr>';
        }

        htmlElement.empty().append(row);
    }
}

$(document).ready(function() {
    'use strict';
    $('#li-job').addClass('active');

    var ajaxDeferredCall = null,
        ajaxData = null,
        batchQueries = new Array(2),
        errorReason = '';

    batchQueries[0] = {
        'operation_id': '#builds-count',
        'method': 'GET',
        'collection': 'count',
        'document_id': 'job',
        'query': 'job=' + jobId + '&date_range=' + dateRange
    };

    batchQueries[1] = {
        'operation_id': '#defconfs-count',
        'method': 'GET',
        'collection': 'count',
        'document_id': 'defconfig',
        'query': 'job=' + jobId + '&date_range=' + dateRange
    };

    errorReason = 'Batch count failed';
    ajaxData = JSON.stringify({
        'batch': batchQueries
    });
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/batch',
        'POST',
        ajaxData,
        null,
        countFailBatchCallback,
        errorReason,
        {'Content-Type': 'application/json'},
        'batch-failed'
    );

    $.when(ajaxDeferredCall).done(countDoneBatchCallback);

    errorReason = 'Defconfig data call failed';
    ajaxData = {
        'aggregate': 'kernel',
        'job': jobId,
        'sort': 'created_on',
        'sort_order': -1,
        'date_range': dateRange,
        'field': ['kernel', 'created_on', 'git_branch', 'git_commit']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/defconf',
        'GET',
        ajaxData,
        defconfigAggregateDone,
        emptyTableOnError,
        errorReason,
        null,
        'aggregate-defconfig'
    );

    $.when(ajaxDeferredCall).done(countFailedDefconfigs);
});
