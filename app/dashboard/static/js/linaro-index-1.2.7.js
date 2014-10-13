var csrftoken = $('meta[name=csrf-token]').attr('content');

function setXhrHeader (xhr) {
    'use strict';
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
}


function emptyTableOnError (tableId, colspan) {
    'use strict';

    var localId = tableId;
    if (tableId[0] !== '#') {
        localId = '#' + tableId;
    }

    $(localId).empty().append(
        '<tr><td colspan="' + colspan +
        '" align="center" valign="middle">' +
        '<h4>Error loading data.</h4></td></tr>'
    );
}

$(document).ready(function () {
    'use strict';

    $('#li-home').addClass('active');
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
});

$(document).ready(function () {
    'use strict';

    var errorReason = '',
        ajaxDeferredCall = null;

    function countFailCallback () {
        $('.fail-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    function countDoneCallback(data) {
        var localData = data.result,
            len = localData.length,
            i = 0,
            batchResult = null;

        if (len > 0) {
            if (len === 1) {
                $('#fail-count0').empty().append(localData.count);
            } else {
                for (i; i < len; i++) {
                    batchResult = localData[i].result[0];
                    $(localData[i].operation_id).empty().append(
                        batchResult.count
                    );
                }
            }
        } else {
            countFailCallback();
        }
    }

    function countFailedDefconfigs(data) {
        var localData = data.result,
            i = 0,
            len = localData.length,
            deferredCall = null,
            batchQueries = new Array(len);

        if (len > 0) {
            if (len === 1) {
                // Peform normal GET.
                deferredCall = $.ajax({
                    'url': '/_ajax/count/defconfig',
                    'traditional': true,
                    'cache': true,
                    'dataType': 'json',
                    'data': {
                        'status': 'FAIL',
                        'job': localData[0].job,
                        'kernel': localData[0].kernel
                    },
                    'beforeSend': setXhrHeader,
                    'error': countFailCallback,
                    'timeout': 6000,
                    'statusCode': {
                        404: function () {
                            setErrorAlert('batch-404-error', 404, errorReason);
                        },
                        500: function () {
                            setErrorAlert('batch-500-error', 500, errorReason);
                        }
                    }
                });
            } else {
                // Perform POST on batch API.
                for (i; i < len; i++) {
                    batchQueries[i] = {
                        'method': 'GET',
                        'operation_id': '#fail-count' + i,
                        'collection': 'count',
                        'document_id': 'defconfig',
                        'query': 'status=FAIL&job=' + localData[i].job +
                            '&kernel=' + localData[i].kernel
                    };
                }

                deferredCall = $.ajax({
                    'url': '/_ajax/batch',
                    'type': 'POST',
                    'traditional': true,
                    'dataType': 'json',
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    'beforeSend': setXhrHeader,
                    'data': JSON.stringify({
                        'batch': batchQueries
                    }),
                    'error': countFailCallback,
                    'timeout': 10000,
                    'statusCode': {
                        404: function () {
                            setErrorAlert('batch-404-error', 404, errorReason);
                        },
                        500: function () {
                            setErrorAlert('batch-500-error', 500, errorReason);
                        }
                    }
                });
            }

            $.when(deferredCall).then(countDoneCallback, countFailCallback);
        }
    }

    errorReason = 'Defconfig data call failed.';
    ajaxDeferredCall = $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'context': $('#failed-builds-body'),
        'data': {
            'aggregate': 'kernel',
            'status': 'FAIL',
            'sort': 'created_on',
            'sort_order': -1,
            'limit': 25,
            'date_range': $('#date-range').val(),
            'field': ['job', 'kernel', 'metadata', 'created_on']
        },
        'beforeSend': setXhrHeader,
        'timeout': 6000,
        'error': emptyTableOnError('#failed-builds-body', 5),
        'statusCode': {
            403: function () {
                setErrorAlert('defconfs-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('defconfs-404-error', 404, errorReason);
            },
            500: function () {
                setErrorAlert('defconfs-500-error', 500, errorReason);
            }
        }
    }).done(function (data) {
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
            git_branch,
            i = 0,
            len = localData.length;

        if (len === 0) {
            row = '<tr><td colspan="5" align="center" valign="middle"><h4>' +
                'No failed builds.</h4></td></tr>';
            $(this).empty().append(row);
        } else {
            for (i; i < len; i++) {
                job = localData[i].job;
                kernel = localData[i].kernel;
                git_branch = localData[i].metadata.git_branch;
                created = new Date(localData[i].created_on['$date']);
                href = '/build/' + job + '/kernel/' + kernel + '/';

                col1 = '<td><a class="table-link" href="/job/' + job + '/">' + job + '&nbsp;&dash;&nbsp;<small>' +
                    git_branch + '</small></td>';
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

            $(this).empty().append(row);
        }
    });

    $.when(ajaxDeferredCall).then(countFailedDefconfigs, countFailCallback);
});

$(document).ready(function () {
    "use strict";

    var errorReason = 'Job data call failed.';

    $.ajax({
        'url': '/_ajax/job',
        'dataType': 'json',
        'traditional': true,
        'cache': true,
        'context': $('#failed-jobs-body'),
        'data': {
            'status': 'FAIL',
            'sort': 'created_on',
            'sort_order': -1,
            'limit': 25,
            'date_range': $('#date-range').val(),
            'field': ['job', 'created_on', 'metadata']
        },
        'beforeSend': setXhrHeader,
        'error': emptyTableOnError('#failed-jobs-body', 3),
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('jobs-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('jobs-404-error', 404, errorReason);
            },
            500: function () {
                setErrorAlert('jobs-500-error', 500, errorReason);
            }
        }
    }).done(function (data) {
        var localData = data.result,
            row = '',
            created, col1, col2, col3, href,
            job, git_branch,
            i = 0,
            len = localData.length;

        if (len === 0) {
            row = '<tr><td colspan="4" align="center" valign="middle"><h4>' +
                'No failed jobs.</h4></td></tr>';
            $(this).empty().append(row);
        } else {
            for (i; i < len; i++) {
                created = new Date(localData[i].created_on['$date']);
                job = localData[i].job;
                git_branch = localData[i].metadata.git_branch;
                href = '/job/' + job + '/';

                col1 = '<td><a class="table-link" href="' + href + '">' +
                    job + '&nbsp;&dash;&nbsp;<small>' +
                    git_branch + '</small>' + '</a></td>';
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

            $(this).empty().append(row);
        }
    });
});

$(document).ready(function () {
    "use strict";

    var errorReason = 'Boot data call failed.';

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'context': $('#failed-boots-body'),
        'data': {
            'status': 'FAIL',
            'sort_order': -1,
            'sort': 'created_on',
            'limit': 25,
            'date_range': $('#date-range').val(),
            'field': ['board', 'job', 'kernel', 'defconfig', 'created_on']
        },
        'beforeSend': setXhrHeader,
        'timeout': 6000,
        'error': emptyTableOnError('#failed-boots-body', 6),
        'statusCode': {
            403: function () {
                setErrorAlert('boots-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('boots-404-error', 404, errorReason);
            },
            500: function () {
                setErrorAlert('boots-500-error', 500, errorReason);
            }
        }
    }).done(function (data) {
        var localData = data.result,
            row = '',
            created, board, job, kernel, defconfig,
            col1, col2, col3, col4, col5, col6, href,
            len = localData.length,
            i = 0;

        if (len === 0) {
            row = '<tr><td colspan="6" align="center" valign="middle"><h4>' +
                'No failed boot reports.</h4></td></tr>';
            $(this).empty().append(row);
        } else {
            for (i; i < len; i++) {
                created = new Date(localData[i].created_on['$date']);
                job = localData[i].job;
                kernel = localData[i].kernel;
                board = localData[i].board;
                defconfig = localData[i].defconfig;
                href = '/boot/' + board + '/job/' + job + '/kernel/' +
                    kernel + '/defconfig/' + defconfig + '/';

                col1 = '<td><a class="table-link" href="/job/' + job + '/">' +
                    job + '</a></td>';
                col2 = '<td>' + kernel + '</td>';
                col3 = '<td>' + board + '</td>';
                col4 = '<td>' + defconfig + '</td>';
                col5 = '<td class="pull-center">' +
                    created.getCustomISODate() + '</td>';
                col6 = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for board&nbsp;' + board + '">' +
                    '<a href="' + href + '">' +
                    '<i class="fa fa-search"></i></a>' +
                    '</span></td>';
                row += '<tr data-url="' + href + '">' +
                    col1 + col2 + col3 + col4 + col5 + col6 + '</tr>';
            }

            $(this).empty().append(row);
        }
    });
});
