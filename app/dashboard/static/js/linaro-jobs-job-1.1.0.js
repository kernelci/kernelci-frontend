var jobName = $('#job-name').val();
var dateRange = $('#date-range').val();

function emptyTableOnError() {
    'use strict';
    var staticContent = '<tr>' +
        '<td colspan="7" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    $('#builds-body').empty().append(staticContent);
}

function countFailBatchCallback() {
    'use strict';
    JSBase.replaceContentByClass('.count-list-badge', '&infin;');
}

function countDoneBatchCallback(data) {
    'use strict';
    var localData = data.result,
        dataLen = localData.length,
        firstResult = null,
        secondResult = null,
        thirdResult = null,
        firstCount = 0,
        secondCount = 0,
        thirdCount = 0;

    if (dataLen === 3) {
        firstResult = localData[0];
        secondResult = localData[1];
        thirdResult = localData[2];

        firstCount = firstResult.result[0].count;
        secondCount = secondResult.result[0].count;
        thirdCount = thirdResult.result[0].count;

        $(firstResult.operation_id).empty().append(firstCount);
        $(secondResult.operation_id).empty().append(secondCount);
        $(thirdResult.operation_id).empty().append(thirdCount);
    } else {
        JSBase.replaceContentByClass('.count-list-badge', '?');
    }
}

function countBuildBootFailCallback() {
    'use strict';
    JSBase.replaceContentByClass('.count-badge', '&infin;');
}

function countBuilBootStatus(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        queriesLen = len * 4,
        batchElements = 4,
        deferredAjaxCall = null,
        ajaxData = null,
        errorReason = 'Batch count failed',
        kernelName = null,
        i = 0,
        j = 0,
        k = 0,
        batchQueries = new Array(queriesLen);

    if (len > 0) {
        for (i; i < queriesLen; i += batchElements) {
            j = i;
            k = i / batchElements;
            kernelName = localData[k].kernel;

            // Get successful defconfig count.
            batchQueries[i] = {
                'method': 'GET',
                'operation_id': '#build-success-count-' + k,
                'collection': 'count',
                'document_id': 'defconfig',
                'query': 'status=PASS&date_range=' + dateRange +
                    '&job=' + jobName + '&kernel=' + kernelName
            };

            // Get failed defconfig count.
            batchQueries[j + 1] = {
                'method': 'GET',
                'operation_id': '#build-fail-count-' + k,
                'collection': 'count',
                'document_id': 'defconfig',
                'query': 'status=FAIL&date_range=' + dateRange +
                    '&job=' + jobName + '&kernel=' + kernelName
            };

            // Get successful boot reports count.
            batchQueries[j + 2] = {
                'method': 'GET',
                'operation_id': '#boot-success-count-' + k,
                'collection': 'count',
                'document_id': 'boot',
                'query': 'status=PASS&date_range=' + dateRange +
                    '&job=' + jobName + '&kernel=' + kernelName
            };

            // Get failed boot reports count.
            batchQueries[j + 3] = {
                'method': 'GET',
                'operation_id': '#boot-fail-count-' + k,
                'collection': 'count',
                'document_id': 'boot',
                'query': 'status=FAIL&date_range=' + dateRange +
                    '&job=' + jobName + '&kernel=' + kernelName
            };
        }

        ajaxData = JSON.stringify({
            'batch': batchQueries
        });

        deferredAjaxCall = JSBase.createDeferredCall(
            '/_ajax/batch',
            'POST',
            ajaxData,
            null,
            countBuildBootFailCallback,
            errorReason,
            {'Content-Type': 'application/json'},
            'batch-failed'
        );

        $.when(deferredAjaxCall).done(function(data) {
            var batchData = data.result,
                batchLen = batchData.length,
                batchResult = null,
                idx = 0;

            if (batchLen > 0) {
                for (idx; idx < batchLen; idx = idx + 1) {
                    batchResult = batchData[idx].result[0];
                    $(batchData[idx].operation_id).empty().append(
                        batchResult.count);
                }
            }
        });
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
        col7,
        href,
        kernel,
        gitBranch,
        gitCommit,
        localDefconf,
        i = 0,
        htmlElement = $('#builds-body');

    if (len === 0) {
        row = '<tr><td colspan="7" align="center" valign="middle"><h4>' +
            'No builds available.</h4></td></tr>';
        htmlElement.empty().append(row);
    } else {
        for (i; i < len; i = i + 1) {
            localDefconf = localData[i];
            kernel = localDefconf.kernel;
            gitBranch = localDefconf.git_branch;
            gitCommit = localDefconf.git_commit;
            created = new Date(localDefconf.created_on.$date);
            href = '/build/' + jobName + '/kernel/' + kernel + '/';

            col1 = '<td>' + kernel + '</td>';
            col2 = '<td>' + gitBranch + '</td>';
            col3 = '<td>' + gitCommit + '</td>';

            col4 = '<td class="pull-center">' +
                '<span class="badge alert-success extra-margin">' +
                '<span id="build-success-count-' + i +
                '" class="count-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '<span class="badge alert-danger">' +
                '<span id="build-fail-count-' + i +
                '" class="count-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '</td>';

            col5 = '<td class="pull-center">' +
                '<a href="/boot/all/job/' + jobName + '/kernel/' +
                kernel + '/">' +
                '<span class="badge alert-success extra-margin">' +
                '<span id="boot-success-count-' + i +
                '" class="count-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '<span class="badge alert-danger">' +
                '<span id="boot-fail-count-' + i +
                '" class="count-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '</a></td>';

            col6 = '<td><div class="pull-center">' +
                created.getCustomISODate() +
                '</div></td>';
            col7 = '<td class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build&nbsp;' + jobName +
                '&nbsp;&dash;&nbsp;' + kernel + '">' +
                '<a href="' + href + '">' +
                '<i class="fa fa-search"></i></a>' +
                '</span></td>';
            row += '<tr data-url="' + href + '">' +
                col1 + col2 + col3 + col4 + col5 + col6 + col7 + '</tr>';
        }

        htmlElement.empty().append(row);
    }
}

function createJobTrends(defconfData) {
    'use strict';
    KG.jobStatusRate(defconfData, jobName, 'pass-rate-graph');
}

$(document).ready(function() {
    'use strict';
    $('#li-job').addClass('active');

    var ajaxDeferredCall,
        ajaxData = null,
        batchQueries = new Array(2),
        errorReason = '',
        query = 'job=' + jobName + '&date_range=' + dateRange;

    batchQueries[0] = {
        'operation_id': '#builds-count',
        'method': 'GET',
        'collection': 'count',
        'document_id': 'job',
        'query': query
    };

    batchQueries[1] = {
        'operation_id': '#defconfs-count',
        'method': 'GET',
        'collection': 'count',
        'document_id': 'defconfig',
        'query': query
    };

    batchQueries[2] = {
        'operation_id': '#boot-reports-count',
        'method': 'GET',
        'collection': 'count',
        'document_id': 'boot',
        'query': query
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
        'job': jobName,
        'sort': 'created_on',
        'sort_order': -1,
        'date_range': dateRange,
        'field': ['kernel', 'created_on', 'git_branch', 'git_commit']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/defconf',
        'GET',
        ajaxData,
        null,
        emptyTableOnError,
        errorReason,
        null,
        'aggregate-defconfig'
    );

    $.when(ajaxDeferredCall)
        .done(defconfigAggregateDone)
        .done(countBuilBootStatus);

    ajaxData = {
        job: jobName,
        sort: 'created_on',
        sort_order: 1,
        date_range: 30,
        field: ['status', 'kernel', 'created_on']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/defconf', 'GET', ajaxData);

    $.when(ajaxDeferredCall).done(createJobTrends);
});
