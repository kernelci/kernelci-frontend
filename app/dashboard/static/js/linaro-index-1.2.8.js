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
                $('#fail-count0').empty().append(localData[0].count);
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
                errorReason = 'Defconfig data call failed.';
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
                    'beforeSend': function(jqXHR) {
                        setXhrHeader(jqXHR);
                    },
                    'error': function() {
                        countFailCallback();
                    },
                    'timeout': 6000,
                    'statusCode': {
                        404: function () {
                            setErrorAlert('batch-404-error', 404, errorReason);
                        },
                        408: function () {
                            errorReason = 'Defconfing data call failed: timeout.';
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
                    batchQueries[i] = {
                        'method': 'GET',
                        'operation_id': '#fail-count' + i,
                        'collection': 'count',
                        'document_id': 'defconfig',
                        'query': 'status=FAIL&job=' + localData[i].job +
                            '&kernel=' + localData[i].kernel
                    };
                }

                errorReason = 'Batch count failed.';
                deferredCall = $.ajax({
                    'url': '/_ajax/batch',
                    'type': 'POST',
                    'traditional': true,
                    'dataType': 'json',
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    'beforeSend': function(jqXHR) {
                        setXhrHeader(jqXHR);
                    },
                    'data': JSON.stringify({
                        'batch': batchQueries
                    }),
                    'error': function() {
                        countFailCallback();
                    },
                    'timeout': 10000,
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

            $.when(deferredCall).then(countDoneCallback, countFailCallback);
        }
    }

    function populateFailedDefconfigTable(data) {
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
            $('#failed-builds-body').empty().append(row);
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

            $('#failed-builds-body').empty().append(row);
        }
    }

    errorReason = 'Defconfig data call failed.';
    ajaxDeferredCall = $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': {
            'aggregate': 'kernel',
            'status': 'FAIL',
            'sort': 'created_on',
            'sort_order': -1,
            'limit': 25,
            'date_range': $('#date-range').val(),
            'field': ['job', 'kernel', 'metadata', 'created_on']
        },
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            emptyTableOnError('#failed-builds-body', 5);
        },
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('defconfs-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('defconfs-404-error', 404, errorReason);
            },
            408: function () {
                errorReason = 'Defconfing data call failed: timeout.';
                setErrorAlert('defconfs-408-error', 408, errorReason);
            },
            500: function () {
                setErrorAlert('defconfs-500-error', 500, errorReason);
            }
        }
    }).done(populateFailedDefconfigTable);

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
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            emptyTableOnError('#failed-jobs-body', 3);
        },
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('jobs-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('jobs-404-error', 404, errorReason);
            },
            408: function () {
                errorReason = 'Job data call failed: timeout.';
                setErrorAlert('jobs-408-error', 408, errorReason);
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
    'use strict';

    var errorReason = 'Boot data call failed.',
        colSpan = 7;

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
            'field': ['board', 'job', 'kernel', 'defconfig', 'created_on', 'metadata']
        },
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            emptyTableOnError('#failed-boots-body', colSpan);
        },
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('boots-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('boots-404-error', 404, errorReason);
            },
            408: function () {
                errorReason = 'Boot data call failed: timeout.';
                setErrorAlert('boots-408-error', 408, errorReason);
            },
            500: function () {
                setErrorAlert('boots-500-error', 500, errorReason);
            }
        }
    }).done(function (data) {
        var localData = data.result,
            row = '',
            created,
            board,
            job,
            kernel,
            defconfig,
            col1,
            col2,
            col3,
            col4,
            col5,
            col6,
            col7,
            href,
            len = localData.length,
            col5Content,
            failureReason = null,
            i = 0;

        if (len === 0) {
            row = '<tr><td colspan="' + colSpan +
                '" align="center" valign="middle"><h4>' +
                'No failed boot reports.</h4></td></tr>';
            $(this).empty().append(row);
        } else {
            for (i; i < len; i++) {
                if (localData[i].boot_result_description !== undefined) {
                    failureReason = localData[i].boot_result_description;
                } else if (localData[i].metadata !== undefined) {
                    if (localData[i].metadata.hasOwnProperty('boot_result_description')) {
                        failureReason = localData[i].metadata.boot_result_description;
                    }
                }

                if (failureReason === null) {
                    col5Content = '<td class="pull-center">' +
                        '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Not available"><i class="fa fa-ban"></i>' +
                        '</span></td>';
                } else {
                    col5Content = '<td class="pull-center">' +
                        '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="' + failureReason + '">' +
                        '<i class="fa fa-question-circle"></i>' +
                        '</span></td>';
                }

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
                col5 = col5Content;
                col6 = '<td class="pull-center">' +
                    created.getCustomISODate() + '</td>';
                col7 = '<td class="pull-center">' +
                    '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="Details for board&nbsp;' + board + '">' +
                    '<a href="' + href + '">' +
                    '<i class="fa fa-search"></i></a>' +
                    '</span></td>';
                row += '<tr data-url="' + href + '">' +
                    col1 + col2 + col3 + col4 + col5 + col6 + col7 + '</tr>';
            }

            $(this).empty().append(row);
        }
    });
});
