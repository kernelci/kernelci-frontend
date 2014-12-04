var jobId = $('#job-id').val();
var dateRange = $('#date-range').val();

function countFailCallback() {
    'use strict';
    JSBase.replaceContentByClass('.badge-count', '&infin;');
}

function failedMainAjaxCall() {
    'use strict';
    var staticContent = '<tr>' +
        '<td colspan="4" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>';
    JSBase.replaceContentByID('#boot-reports-body', staticContent);
}

function populateBootReports(data) {
    'use strict';

    var localData = data.result,
        row = '',
        job = jobId,
        created,
        col1,
        col2,
        col3,
        col4,
        href,
        kernel,
        i = 0,
        len = localData.length;

    if (len === 0) {
        row = '<tr><td colspan="4" align="center" valign="middle"><h4>' +
            'No boot reports available.</h4></td></tr>';
        JSBase.replaceContentByID('#boot-reports-body', row);
    } else {
        for (i; i < len; i++) {
            kernel = localData[i].kernel;
            created = new Date(localData[i].created_on.$date);
            href = '/boot/all/job/' + job + '/kernel/' + kernel + '/';

            col1 = '<td>' + kernel + '</td>';
            col2 = '<td class="pull-center"><span id="span-id' + i +
                '" class="badge">' +
                '<span id="fail-count' + i + '" ' +
                'class="badge-count">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '</td>';
            col3 = '<td class="pull-center">' + created.getCustomISODate() +
                '</td>';
            col4 = '<td class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for boot reports&nbsp;' + job +
                '&nbsp;&dash;&nbsp;' + kernel + '">' +
                '<a href="' + href + '">' +
                '<i class="fa fa-search"></i></a>' +
                '</span></td>';
            row += '<tr data-url="' + href + '">' +
                col1 + col2 + col3 + col4 + '</tr>';
        }

        JSBase.replaceContentByID('#boot-reports-body', row);
    }
}

function countFailedDoneCallback(data) {
    'use strict';

    var localData = data.result,
        len = localData.length,
        i = 0,
        batchResult = null,
        count;

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
            for (i; i < len; i++) {
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
    }
}

function countFailedErrorCallback() {
    'use strict';
    JSBase.replaceContentByClass('.badge-count', '&infin;');
}

function countFailedBootReports(data) {
    'use strict';

    var localData = data.result,
        i = 0,
        len = localData.length,
        ajaxDeferredCall = null,
        ajaxData = null,
        batchQueris = new Array(len),
        errorReason;

    if (len > 0) {
        if (len === 1) {
            // Perform normal GET.
            errorReason = 'Boot count data call failed';
            ajaxData = {
                'status': 'FAIL',
                'job': jobId,
                'kernel': localData[0].kernel
            };
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/count/boot',
                'GET',
                ajaxData,
                null,
                countFailedErrorCallback,
                errorReason,
                null,
                'failed-count'
            );
        } else {
            // Perform POST on batch API.
            for (i; i < len; i++) {
                batchQueris[i] = {
                    'method': 'GET',
                    'operation_id': '#fail-count' + i,
                    'collection': 'count',
                    'document_id': 'boot',
                    'query': 'status=FAIL&job=' + jobId + '&kernel=' +
                        localData[i].kernel
                };
            }

            errorReason = 'Batch count failed';
            ajaxData = JSON.stringify({
                    'batch': batchQueris
            });
            ajaxDeferredCall = JSBase.createDeferredCall(
                '/_ajax/batch',
                'POST',
                ajaxData,
                null,
                countFailedErrorCallback,
                errorReason,
                {'Content-Type': 'application/json'},
                'failed-count'
            );
        }

        $.when(ajaxDeferredCall).done(countFailedDoneCallback);
    }
}

function countBootDetails(data) {
    'use strict';
    var localData = data.result,
        bootReportsCount,
        bootBoardsCount;

    if (localData[0].operation_id === '#boot-reports-count') {
        bootReportsCount = localData[0].result[0].count;
        bootBoardsCount = localData[1].result.length;
    } else {
        bootBoardsCount = localData[0].result.length;
        bootReportsCount = localData[1].result[0].count;
    }

    JSBase.replaceContentByID('#boot-reports-count', bootReportsCount);
    JSBase.replaceContentByID('#boot-boards-count', bootBoardsCount);
}

function failedCountBootDetails() {
    'use strict';
    JSBase.replaceContentByID('#boot-reports-count', '&infin;');
    JSBase.replaceContentByID('#boot-boards-count', '&infin;');
}

$(document).ready(function() {
    'use strict';

    $('#li-boot').addClass('active');

    var batchQueries = new Array(2),
        errorReason = 'Batch data call failed',
        ajaxDeferredCall = null,
        ajaxData = null;

    batchQueries[0] = {
        'method': 'GET',
        'operation_id': '#boot-reports-count',
        'collection': 'count',
        'document_id': 'boot',
        'query': 'job=' + jobId + '&date_range=' + dateRange
    };

    batchQueries[1] = {
        'method': 'GET',
        'operation_id': '#boot-boards-count',
        'collection': 'boot',
        'query': 'job=' + jobId + '&date_range=' + dateRange +
            '&aggregate=board&field=board'
    };

    ajaxData = JSON.stringify({
        'batch': batchQueries
    });
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/batch',
        'POST',
        ajaxData,
        null,
        failedCountBootDetails,
        errorReason,
        {'Content-Type': 'application/json'},
        'batch-count'
    );

    $.when(ajaxDeferredCall).then(countBootDetails, failedCountBootDetails);

    errorReason = 'Boot data call failed';
    ajaxData = {
        'aggregate': 'kernel',
        'job': jobId,
        'sort': 'created_on',
        'sort_order': -1,
        'date_range': dateRange,
        'field': ['job', 'kernel', 'created_on']
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        ajaxData,
        populateBootReports,
        failedMainAjaxCall,
        errorReason,
        null,
        'boot-report'
    );

    $.when(ajaxDeferredCall).then(countFailedBootReports, countFailCallback);
});
