var csrftoken = $('meta[name=csrf-token]').attr('content');

$(document).ready(function () {
    "use strict";

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
});

$(document).ready(function () {
    "use strict";

    $.ajax({
        'url': '/_ajax/count/boot',
        'traditional': true,
        'cache': true,
        'context': $('#boot-reports-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': $('#date-range').val()
        },
        'dataFilter': function (data, type) {
            if (type === 'json') {
                return JSON.parse(data).result;
            }
            return data;
        },
        'beforeSend': function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        'statusCode': {
            404: function () {
                $(this).empty().append('&infin;');
            },
            500: function () {
                $(this).empty().append('&infin;');
            }
        }
    }).done(function (data) {
        $(this).empty().append(data.count);
    });
});

$(document).ready(function () {
    "use strict";

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'context': $('#boot-boards-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': $('#date-range').val(),
            'aggregate': 'board',
            'field': 'board'
        },
        'dataFilter': function (data, type) {
            if (type === 'json') {
                return JSON.parse(data).result;
            }
            return data;
        },
        'beforeSend': function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        'statusCode': {
            404: function () {
                $(this).empty().append('&infin;');
            },
            500: function () {
                $(this).empty().append('&infin;');
            }
        }
    }).done(function (data) {
        $(this).empty().append(data.length);
    });
});

$(document).ready(function () {
    "use strict";

    function countFailedBootReports (data) {
        var i = 0,
            len = data.length,
            deferredCalls = new Array(len);

        if (len > 0) {
            for (i; i < len; i++) {
                deferredCalls[i] = $.ajax({
                    'url': '/_ajax/count/boot',
                    'traditional': true,
                    'cache': true,
                    'dataType': 'json',
                    'data': {
                        'status': 'FAIL',
                        'job': $('#job-id').val(),
                        'kernel': data[i].kernel
                    },
                    'dataFilter': function (data, type) {
                        if (type === 'json') {
                            return JSON.parse(data).result;
                        }
                        return data;
                    },
                    'beforeSend': function (xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    }
                });
            }

            $.when.apply($, deferredCalls).then(function () {
                var count = '&infin;',
                    first = null;
                len = arguments.length;

                if (len > 0) {
                    // This is the case when we have only one build and the
                    // deferred call returns just the plain object not in an
                    // Array like way.
                    first = arguments[0];
                    if (! Array.isArray(first)) {
                        count = first.count;
                        $('#fail-count0').empty().append(count);
                    } else {
                        for (i = 0; i < len; i++) {
                            if (arguments[i] !== null) {
                                count = arguments[i][0].count;
                                $('#fail-count' + i).empty().append(count);
                            }
                        }
                    }
                }
            });
        }
    }

    function countFailCallback () {
        $('.fail-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    $.when(
        $.ajax({
            'url': '/_ajax/boot',
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'context': $('#boot-reports-body'),
            'data': {
                'aggregate': 'kernel',
                'job': $('#job-id').val(),
                'sort': 'created_on',
                'sort_order': -1,
                'date_range': $('#date-range').val(),
                'field': ['job', 'kernel', 'created_on']
            },
            'dataFilter': function (data, type) {
                if (type === 'json') {
                    return JSON.parse(data).result;
                }
                return data;
            },
            'beforeSend': function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
            'statusCode': {
                404: function () {
                    $('#failed-builds-body').empty().append(
                        '<tr><td colspan="4" align="center" valign="middle">' +
                        '<h4>Error loading data.</h4></td></tr>'
                    );
                    var text = '<div id="boots-404-error" ' +
                        'class="alert alert-danger alert-dismissable">' +
                        '<button type="button" class="close" ' +
                        'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                        '404 error while loading defconfigs from the server.\n' +
                        'Please contact the website administrators.' +
                        '</div>';
                    $('#errors-container').append(text);
                    $('#boots-404-error').alert();
                },
                500: function () {
                    $('#failed-builds-body').empty().append(
                        '<tr><td colspan="4" align="center" valign="middle">' +
                        '<h4>Error loading data.</h4></td></tr>'
                    );
                    var text = '<div id="boots-500-error" ' +
                        'class="alert alert-danger alert-dismissable">' +
                        '<button type="button" class="close" ' +
                        'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                        '500 error while loading defconfigs from the server.\n' +
                        'Please contact the website administrators.' +
                        '</div>';
                    $('#errors-container').append(text);
                    $('#boots-500-error').alert();
                }
            }
        }).done(function (data) {
            console.log(data);
            var row = '',
                job = $('#job-id').val(),
                created, col1, col2, col3, col4, href,
                kernel,
                i = 0,
                len = data.length;

            if (len === 0) {
                row = '<tr><td colspan="4" align="center" valign="middle"><h4>' +
                    'No builds available.</h4></td></tr>';
                $(this).empty().append(row);
            } else {
                for (i; i < len; i++) {
                    kernel = data[i].kernel;
                    created = new Date(data[i].created_on['$date']);
                    href = '/boot/all/job/' + job + '/kernel/' + kernel + '/';

                    col1 = '<td>' + kernel + '</td>';
                    col2 = '<td><span class="badge alert-danger">' +
                        '<span id="fail-count' + i + '" ' +
                        'class="fail-badge">' +
                        '<i class="fa fa-cog fa-spin"></i></span></span>' +
                        '</td>';
                    col3 = '<td>' + created.getCustomISODate() + '</td>';
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

                $(this).empty().append(row);
            }
        })
    ).then(countFailedBootReports, countFailCallback);
});