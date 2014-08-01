var csrftoken = $('meta[name=csrf-token]').attr('content');

$(document).ready(function () {
    "use strict";

    $('#li-job').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    var table = $('#jobstable').dataTable({
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
        'lengthMenu': [25, 50, 75, 100],
        'deferRender': true,
        'ordering': true,
        'processing': true,
        'stateDuration': -1,
        'stateSave': true,
        'order': [1, 'desc'],
        'search': {
            'regex': true
        },
        'ajax': {
            'url': '/_ajax/job',
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'dataSrc': 'result',
            'dataFilter': function (data, type) {
                if (type === 'json') {
                    data.result = JSON.stringify(data.result)
                    return data;
                }
                return data;
            },
            'beforeSend': function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
            'data': {
                'aggregate': 'job',
                'sort': 'created_on',
                'sort_order': -1,
                'date_range': $('#date-range').val(),
                'field': [
                    'job', 'created_on', 'status', 'metadata'
                ]
            }
        },
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
        var data = table.fnGetData(this);
        if (data) {
            window.location = '/job/' + data.job + '/';
        }
    });

    $('#search-area > .input-sm').attr('placeholder', 'Filter the results');
    $('.input-sm').keyup(function (key) {
        // Remove focus from input when Esc is pressed.
        if (key.keyCode === 27) {
            $(this).blur();
        }
    });
});
