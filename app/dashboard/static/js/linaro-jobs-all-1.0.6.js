$(document).ready(function () {
    "use strict";

    $('#li-job').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    $('#table-div').hide();

    var errorReason = '',
        getDataAjax = null;

    function failedAjaxCall () {
        $("#table-loading").remove();
    }

    function countFailCallback () {
        $('.count-badge').each(function () {
            $(this).empty().append('&infin;');
        });
    }

    function batchCountElements (data) {
        var localData = data.result,
            i = 0,
            j = 0,
            batchElements = 4,
            jobName = '',
            dateRange = $('#date-range').val(),
            len = localData.length,
            queriesLen = len * 4,
            batchQueries = new Array(queriesLen);

        errorReason = 'Batch count failed.';

        if (len > 0) {
            for (i; i < queriesLen; i += batchElements) {
                j = i;
                jobName = localData[i / batchElements].job;

                // Get successful defconfig count.
                batchQueries[i] = {
                    'method': 'GET',
                    'operation_id': '#defconf-success-count-' + jobName,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=PASS&date_range=' + dateRange +
                        '&job=' + jobName
                };

                // Get failed defconfig count.
                batchQueries[j + 1] = {
                    'method': 'GET',
                    'operation_id': '#defconf-fail-count-' + jobName,
                    'collection': 'count',
                    'document_id': 'defconfig',
                    'query': 'status=FAIL&date_range=' + dateRange +
                        '&job=' + jobName
                };

                // Get successful boot reports count.
                batchQueries[j + 2] = {
                    'method': 'GET',
                    'operation_id': '#boot-success-count-' + jobName,
                    'collection': 'count',
                    'document_id': 'boot',
                    'query': 'status=FAIL&date_range=' + dateRange +
                        '&job=' + jobName
                };

                // Get failed boot reports count.
                batchQueries[j + 3] = {
                    'method': 'GET',
                    'operation_id': '#boot-fail-count-' + jobName,
                    'collection': 'count',
                    'document_id': 'boot',
                    'query': 'status=FAIL&date_range=' + dateRange +
                        '&job=' + jobName
                };
            }

            $.ajax({
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
                'timeout': 10000,
                'error': function() {
                    countFailCallback();
                },
                'statusCode': {
                    403: function () {
                        setErrorAlert('batch-403-error', 403, errorReason);
                    },
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
            }).done(function (data) {
                var batchData = data.result,
                    batchLen = batchData.length,
                    batchResult = null,
                    idx = 0;

                if (batchLen > 0) {                
                    for (idx; idx < batchLen; idx++) {
                        batchResult = batchData[idx].result[0];
                        $(batchData[idx].operation_id).empty().append(
                            batchResult.count);
                    }
                }
            });
        }
    }

    function createJobsTable(data) {
        var localData = data.result,
            table = $('#jobstable').dataTable({
            'dom': '<"row"<"col-xs-6 col-sm-6 col-md-6 col-lg-6"<"length-menu"l>>' +
                '<"col-xs-4 col-sm-4 col-md-4 col-lg-4 col-lg-offset-2"f>r' +
                '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
                '<"row"<"col-xs-6 col-sm-6 col-md-6 col-lg-6"i>' +
                '<"col-xs-6 col-sm-6 col-md-6 col-lg-6"p>>',
            'language': {
                'lengthMenu': '_MENU_&nbsp;<strong>jobs per page</strong>',
                'zeroRecords': '<h4>No jobs to display.</h4>',
                'search': '<div id="search-area" class="input-group"><span class="input-group-addon"><i class="fa fa-search"></i></span>_INPUT_</div>'
            },
            'initComplete': function () {
                $('#table-loading').remove();
                $('#table-div').fadeIn('slow', 'linear');

                var searchFilter = $('#search-filter').val(),
                    api;

                if (searchFilter !== null && searchFilter.length > 0) {
                    api = this.api();
                    api.search(searchFilter, true).draw();
                }
            },
            'lengthMenu': [25, 50, 75, 100],
            'deferRender': true,
            'ordering': true,
            'processing': true,
            'stateDuration': -1,
            'stateSave': true,
            'order': [3, 'desc'],
            'search': {
                'regex': true
            },
            'data': localData,
            'columns': [
                {
                    'data': 'job',
                    'title': 'Tree &dash; Branch',
                    'type': 'string',
                    'render': function (data, type, object) {
                        return '<a class="table-link" href="/job/' + data + '/">' +
                            data + '&nbsp;&dash;&nbsp;<small>' +
                            object.metadata.git_branch + '</small></a>';
                    }
                },
                {
                    'data': 'job',
                    'title': '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Successful/Failed defconfigs built">' +
                        'Build Status</span>',
                    'type': 'String',
                    'searchable': false,
                    'orderable': false,
                    'className': 'pull-center',
                    'render': function (data) {
                        return '<span class="badge alert-success">' +
                            '<span id="defconf-success-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>' +
                            '<span>&nbsp;</span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="defconf-fail-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>';
                    }
                },
                {
                    'data': 'job',
                    'title': '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Successful/Failed boot reports">' +
                        'Boot Status</span>',
                    'type': 'string',
                    'searchable': false,
                    'orderable': false,
                    'className': 'pull-center',
                    'render': function (data) {
                        return '<span class="badge alert-success">' +
                            '<span id="boot-success-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>' +
                            '<span>&nbsp;</span>' +
                            '<span class="badge alert-danger">' +
                            '<span id="boot-fail-count-' + data +
                            '" class="count-badge">' +
                            '<i class="fa fa-cog fa-spin"></i>' +
                            '</span></span>';
                    }
                },
                {
                    'data': 'created_on',
                    'title': 'Date',
                    'type': 'date',
                    'render': function (data) {
                        var created = new Date(data['$date']);
                        return created.getCustomISODate();
                    }
                },
                {
                    'data': 'status',
                    'title': 'Status',
                    'type': 'string',
                    'className': 'pull-center',
                    'render': function (data) {
                        var displ;
                        switch (data) {
                            case 'BUILD':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Building">' +
                                    '<span class="label label-info">' +
                                    '<i class="fa fa-cogs"></i></span></span>';
                                break;
                            case 'PASS':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Build completed">' +
                                    '<span class="label label-success">' +
                                    '<i class="fa fa-check"></i></span></span>';
                                break;
                            case 'FAIL':
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Build failed">' +
                                    '<span class="label label-danger">' +
                                    '<i class="fa fa-exclamation-triangle">' +
                                    '</i></span></span>';
                                break;
                            default:
                                displ = '<span rel="tooltip" ' +
                                    'data-toggle="tooltip"' +
                                    'title="Unknown status">' +
                                    '<span class="label label-warning">' +
                                    '<i class="fa fa-question">' +
                                    '</i></span></span>';
                                break;
                        }
                        return displ;
                    }
                },
                {
                    'data': 'job',
                    'title': '',
                    'searchable': false,
                    'orderable': false,
                    'width': '30px',
                    'className': 'pull-center',
                    'render': function (data) {
                        return '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="Details for&nbsp;' + data + '">' +
                            '<a href="/job/' + data + '">' +
                            '<i class="fa fa-search"></i></a></span>';
                    }
                }
            ]
        });

        $(document).on("click", "#jobstable tbody tr", function () {
            var tableData = table.fnGetData(this);
            if (tableData) {
                window.location = '/job/' + tableData.job + '/';
            }
        });

        $('#search-area > .input-sm').attr('placeholder', 'Filter the results');
        $('.input-sm').keyup(function (key) {
            // Remove focus from input when Esc is pressed.
            if (key.keyCode === 27) {
                $(this).blur();
            }
        });

        return data;
    }

    function updateJobsPage (data) {
        // Simple function needed to wrap another deferred call.
        // Create the table, then update it with the batch count operation.
        $.when(createJobsTable(data)).done(batchCountElements);
    }

    errorReason = 'Job data call failed.';
    getDataAjax = $.ajax({
        'url': '/_ajax/job',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'dataSrc': 'result',
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'data': {
            'aggregate': 'job',
            'sort': 'created_on',
            'sort_order': -1,
            'date_range': $('#date-range').val(),
            'field': [
                'job', 'created_on', 'status', 'metadata'
            ]
        },
        'error': function() {
            failedAjaxCall();
        },
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('job-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('job-404-error', 404, errorReason);
            },
            408: function () {
                errorReason = 'Job data call failed: timeout.';
                setErrorAlert('job-408-error', 408, errorReason);
            },
            500: function () {
                setErrorAlert('job-500-error', 500, errorReason);
            }
        }
    });

    $.when(getDataAjax).then(updateJobsPage, failedAjaxCall);
});
