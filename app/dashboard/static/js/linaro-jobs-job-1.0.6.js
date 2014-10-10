var csrftoken = $('meta[name=csrf-token]').attr('content');

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

$(document).ready(function () {
    "use strict";

    $.ajax({
        'url': '/_ajax/count/job',
        'traditional': true,
        'cache': true,
        'context': $('#builds-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': $('#date-range').val()
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
        var localData = data.result;

        if (localData.length === 1) {
            $(this).empty().append(localData[0].count);
        } else {
            $(this).empty().append("?");
        }
    });
});

$(document).ready(function () {
    "use strict";

    $.ajax({
        'url': '/_ajax/count/defconfig',
        'traditional': true,
        'cache': true,
        'context': $('#defconfs-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': $('#date-range').val()
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
        var localData = data.result;

        if (localData.length === 1) {
            $(this).empty().append(localData[0].count);
        } else {
            $(this).empty().append("?");
        }
    });
});

$(document).ready(function () {
    "use strict";

    function setXhrHeader (xhr) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }

    function countFailedDefconfigs (data) {
        var i = 0,
            localData = data.result,
            len = localData.length,
            deferredCalls = new Array(len);

        if (len > 0) {
            for (i; i < len; i++) {
                deferredCalls[i] = $.ajax({
                    'url': '/_ajax/count/defconfig',
                    'traditional': true,
                    'cache': true,
                    'dataType': 'json',
                    'data': {
                        'status': 'FAIL',
                        'job': $('#job-id').val(),
                        'kernel': localData[i].kernel
                    },
                    'beforeSend': setXhrHeader
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
                        count = first.result[0].count;
                        $('#fail-count0').empty().append(count);
                        if (count === 0) {
                            $('#span-id0').addClass('alert-success');
                        } else {
                            $('#span-id0').addClass('alert-danger');
                        }
                    } else {
                        for (i = 0; i < len; i++) {
                            if (arguments[i] !== null) {
                                count = arguments[i][0].result[0].count;
                                $('#fail-count' + i).empty().append(count);
                                if (count === 0) {
                                    $('#span-id' + i).addClass('alert-success');
                                } else {
                                    $('#span-id' + i).addClass('alert-danger');
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function countFailCallback () {
        $('.count-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    $.when(
        $.ajax({
            'url': '/_ajax/defconf',
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'context': $('#builds-body'),
            'data': {
                'aggregate': 'kernel',
                'job': $('#job-id').val(),
                'sort': 'created_on',
                'sort_order': -1,
                'date_range': $('#date-range').val(),
                'field': ['kernel', 'metadata', 'created_on']
            },
            'beforeSend': function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
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
                job = $('#job-id').val(),
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
                    href = '/build/' + job + '/kernel/' + kernel + '/';

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
                        'title="Details for build&nbsp;' + job +
                        '&nbsp;&dash;&nbsp;' + kernel + '">' +
                        '<a href="' + href + '">' +
                        '<i class="fa fa-search"></i></a>' +
                        '</span></td>';
                    row += '<tr data-url="' + href + '">' +
                        col1 + col2 + col3 + col4 + col5 + col6 + '</tr>';
                }

                $(this).empty().append(row);
            }
        })
    ).then(countFailedDefconfigs, countFailCallback);
});
