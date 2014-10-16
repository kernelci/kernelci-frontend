var jobId = $('#job-id').val();
var dateRange = $('#date-range').val();

function countFailCallback () {
    'use strict';

    $('.fail-badge').each(function () {
        $(this).empty().append('&infin;');
    });
}

function failedMainAjaxCall () {
    'use strict';

    $('#failed-builds-body').empty().append(
        '<tr><td colspan="4" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>'
    );
}

function populateBootReports (data) {
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
        $('#boot-reports-body').empty().append(row);
    } else {
        for (i; i < len; i++) {
            kernel = localData[i].kernel;
            created = new Date(localData[i].created_on['$date']);
            href = '/boot/all/job/' + job + '/kernel/' + kernel + '/';

            col1 = '<td>' + kernel + '</td>';
            col2 = '<td class="pull-center"><span class="badge alert-danger">' +
                '<span id="fail-count' + i + '" ' +
                'class="fail-badge">' +
                '<i class="fa fa-cog fa-spin"></i></span></span>' +
                '</td>';
            col3 = '<td class="pull-center">' + created.getCustomISODate() + '</td>';
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

        $('#boot-reports-body').empty().append(row);
    }
}

function countFailedDoneCallback (data) {
    'use strict';

    var localData = data.result,
        len = localData.length,
        i = 0,
        batchResult = null;

    if (len > 0) {
        if (len === 1) {
            $('#fail-count0').empty().append(localData[0].count);
        } else {
            for (i; i < len; i++) {
                batchResult = localData[i].result[0];
                $(localData[i].operation_id).empty().append(batchResult.count);
            }
        }
    }
}

function countFailedErrorCallback () {
    'use strict';
    $('.fail-badge').each(function () {
        $(this).empty().append('&infin;');
    });
}

function countFailedBootReports (data) {
    'use strict';

    var localData = data.result,
        i = 0,
        len = localData.length,
        deferredCall = null,
        batchQueris = new Array(len),
        errorReason;

    if (len > 0) {
        if (len === 1) {
            errorReason = 'Boot count data call failed.';
            // Perform normal GET.
            deferredCall = $.ajax({
                'url': '/_ajax/count/boot',
                'traditional': true,
                'cache': true,
                'dataType': 'json',
                'data': {
                    'status': 'FAIL',
                    'job': jobId,
                    'kernel': localData[0].kernel
                },
                'beforeSend': setXhrHeader,
                'error': countFailedErrorCallback,
                'timeout': 6000,
                'statusCode': {
                    404: function () {
                        setErrorAlert('batch-404-error', 404, errorReason);
                    },
                    408: function () {
                        errorReason = 'Boot count data call failed: timeout.';
                        setErrorAlert('batch-408-error', 408, errorReason);
                    },
                    500: function () {
                        setErrorAlert('batch-500-error', 500, errorReason);
                    }
                }
            });
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
            deferredCall = $.ajax({
                'url': '/_ajax/batch',
                'type': 'POST',
                'traditional': true,
                'dataType': 'json',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'data': JSON.stringify({
                    'batch': batchQueris
                }),
                'beforeSend': setXhrHeader,
                'timeout': 10000,
                'error': countFailedErrorCallback,
                'statusCode': {
                    404: function () {
                        setErrorAlert('batch-404-error', 404, errorReason);
                    },
                    408: function () {
                        errorReason = 'Batch count failed: timeout.';
                        setErrorAlert('batch-408-error', 408, errorReason);
                    },
                    500: function () {
                        setErrorAlert('batch-500-error', 500, errorReason);
                    }
                }
            });
        }

        $.when(deferredCall).done(countFailedDoneCallback);
    }
}

function countBootDetails (data) {
    'use strict';
    var localData = data.result,
        bootReportsCount,
        bootBoardsCount;

    if (localData[0].operation_id === '#boot-reports-count') {
        console.log("WE ARE HERE");
        bootReportsCount = localData[0].result[0].count;
        bootBoardsCount = localData[1].result.length;
    } else {
        console.log("WE ARE HERE 2");
        bootBoardsCount = localData[0].result.length;
        bootReportsCount = localData[1].result[0].count;
    }

    $('#boot-reports-count').empty().append(bootReportsCount);
    $('#boot-boards-count').empty().append(bootBoardsCount);
 }

 function failedCountBootDetails () {
    'use strict';
    $('#boot-reports-count').empty().append('&infin;');
    $('#boot-boards-count').empty().append('&infin;');
 }


$(document).ready(function () {
    'use strict';

    var batchQueries = new Array(2),
        errorReason = 'Batch data call failed.',
        ajaxBatchCall;

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

    ajaxBatchCall = $.ajax({
        'url': '/_ajax/batch',
        'type': 'POST',
        'traditional': true,
        'dataType': 'json',
        'headers': {
            'Content-Type': 'application/json'
        },
        'data': JSON.stringify({
            'batch': batchQueries
        }),
        'beforeSend': setXhrHeader,
        'timeout': 10000,
        'statusCode': {
            404: function () {
                setErrorAlert('count-404-error', 404, errorReason);
            },
            500: function () {
                setErrorAlert('count-500-error', 500, errorReason);
            }
        }
    });

    $.when(ajaxBatchCall).then(countBootDetails, failedCountBootDetails);
});

$(document).ready(function () {
    'use strict';

    $('#li-boot').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    $('.clickable-table tbody').on("click", "tr", function () {
        var url = $(this).data('url');
        if (url) {
            window.location = url;
        }
    });

    var errorReason = 'Boot data call failed.',
        ajaxCall = null;

    ajaxCall = $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'context': $('#boot-reports-body'),
        'data': {
            'aggregate': 'kernel',
            'job': jobId,
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': ['job', 'kernel', 'created_on']
        },
        'beforeSend': setXhrHeader,
        'error': failedMainAjaxCall,
        'statusCode': {
            404: function () {
                setErrorAlert('boots-404-error', 404, errorReason);
            },
            500: function () {
                setErrorAlert('boots-500-error', 500, errorReason);
            }
        }
    }).done(populateBootReports);

    $.when(ajaxCall).then(countFailedBootReports, countFailCallback);
});