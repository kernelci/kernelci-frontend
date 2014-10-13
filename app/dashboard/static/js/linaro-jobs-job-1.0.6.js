var csrftoken = $('meta[name=csrf-token]').attr('content');
var jobId= $('#job-id').val();
var dateRange = $('#date-range').val();

function setXhrHeader (xhr) {
    "use strict";
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
}

$(document).ready(function () {
    "use strict";

    $('#li-job').addClass('active');

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

$(document).ready(function() {
    "use strict";

    var deferredCall = null,
        batchQueries = new Array(2);

    function countFailCallback () {
        $('.count-list-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    function countDoneCallback (data) {
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
            $('.count-list-badge').each(function () {
                $(this).empty().append('?');
            });
        }
    }

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
        'timeout': 5000,
        'statusCode': {
            404: function () {
                countFailCallback();
            },
            500: function () {
                countFailCallback();
            }
        }
    });

    $.when(deferredCall).then(countDoneCallback, countFailCallback);
});

$(document).ready(function () {
    "use strict";

    function countFailCallback () {
        $('.count-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    function countDoneCallback (data) {
        var localData = data.result,
            len = localData.length,
            i = 0,
            batchResult = null,
            count = 0;

        if (len > 0) {
            if (len === 1) {
                count = localData.count;
                $('#fail-count0').empty().append(count);

                if (count === 0) {
                    $('#span-id0').addClass('alert-success');
                } else {
                    $('#span-id0'   ).addClass('alert-danger');
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
        } else {
            countFailCallback();
        }
    }

    function countFailedDefconfigs (data) {
        var i = 0,
            localData = data.result,
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
                        'job': jobId,
                        'kernel': localData[0].kernel
                    },
                    'beforeSend': setXhrHeader,
                    'error': countFailCallback,
                    'timeout': 6000
                });
            } else {
                // Perform POST on batch API.
                for (i; i < len; i++) {
                    batchQueries[i] = {
                        'method': 'GET',
                        'operation_id': '#fail-count' + i,
                        'collection': 'count',
                        'document_id': 'defconfig',
                        'query': 'status=FAIL&job=' + jobId +
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
                    'timeout': 10000
                });
            }

            $.when(deferredCall).then(countDoneCallback, countFailCallback);
        } else {
            countFailCallback();
        }
    }

    var ajaxDefconCall = $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'context': $('#builds-body'),
        'data': {
            'aggregate': 'kernel',
            'job': jobId,
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': dateRange,
            'field': ['kernel', 'metadata', 'created_on']
        },
        'beforeSend': setXhrHeader,
        'statusCode': {
            404: function () {
                $('#failed-builds-body').empty().append(
                    '<tr><td colspan="6" align="center" valign="middle">' +
                    '<h4>Error loading data.</h4></td></tr>'
                );
                var text = '<div id="defconfs-404-error" ' +
                    'class="alert alert-danger alert-dismissable">' +
                    '<button type="button" class="close" ' +
                    'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                    '404 error while loading defconfigs from the server.\n' +
                    'Please contact the website administrators.' +
                    '</div>';
                $('#errors-container').append(text);
                $('#defconfs-404-error').alert();
            },
            500: function () {
                $('#failed-builds-body').empty().append(
                    '<tr><td colspan="6" align="center" valign="middle">' +
                    '<h4>Error loading data.</h4></td></tr>'
                );
                var text = '<div id="defconfs-500-error" ' +
                    'class="alert alert-danger alert-dismissable">' +
                    '<button type="button" class="close" ' +
                    'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                    '500 error while loading defconfigs from the server.\n' +
                    'Please contact the website administrators.' +
                    '</div>';
                $('#errors-container').append(text);
                $('#defconfs-500-error').alert();
            }
        }
    }).done(function (data) {
        data = data.result;

        var row = '',
            created, col1, col2, col3, col4, col5, col6, href,
            kernel, git_branch, git_commit,
            i = 0,
            len = data.length;

        if (len === 0) {
            row = '<tr><td colspan="6" align="center" valign="middle"><h4>' +
                'No builds available.</h4></td></tr>';
            $(this).empty().append(row);
        } else {
            for (i; i < len; i++) {
                kernel = data[i].kernel;
                git_branch = data[i].metadata.git_branch;
                git_commit = data[i].metadata.git_commit;
                created = new Date(data[i].created_on['$date']);
                href = '/build/' + jobId + '/kernel/' + kernel + '/';

                col1 = '<td>' + kernel + '</td>';
                col2 = '<td>' + git_branch + '</td>';
                col3 = '<td>' + git_commit + '</td>';
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

            $(this).empty().append(row);
        }
    });

    $.when(ajaxDefconCall).then(countFailedDefconfigs, countFailCallback);
});
