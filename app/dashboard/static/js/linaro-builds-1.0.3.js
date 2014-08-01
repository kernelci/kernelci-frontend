var csrftoken = $('meta[name=csrf-token]').attr('content');

$(document).ready(function () {
    "use strict";

    $('#li-build').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    var table = $('#defconfstable').dataTable({
        'dom': '<"row"<"col-xs-6 col-sm-6 col-md-6 col-lg-6"<"length-menu"l>>' +
            '<"col-xs-4 col-sm-4 col-md-4 col-lg-4 col-lg-offset-2"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row"<"col-xs-6 col-sm-6 col-md-6 col-lg-6"i>' +
            '<"col-xs-6 col-sm-6 col-md-6 col-lg-6"p>>',
        'language': {
            'lengthMenu': '_MENU_&nbsp;<strong>builds per page</strong>',
            'zeroRecords': '<h4>No builds to display.</h4>',
            'search': '<div id="search-area" class="input-group"><span class="input-group-addon"><i class="fa fa-search"></i></span>_INPUT_</div>'
        },
        'lengthMenu': [25, 50, 75, 100],
        'deferRender': true,
        'ordering': true,
        'processing': true,
        'stateDuration': -1,
        'stateSave': true,
        'order': [4, 'desc'],
        'search': {
            'regex': true
        },
        'ajax': {
            'url': '/_ajax/defconf',
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'dataSrc': 'result',
            'dataFilter': function (data, type) {
                if (type === 'json') {
                    data.result = JSON.stringify(data.result);
                    return data;
                }
                return data;
            },
            'beforeSend': function (xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
            'data': {
                'sort': 'created_on',
                'sort_order': -1,
                'date_range': $('#date-range').val(),
                'field': [
                    '_id', 'job', 'kernel', 'defconfig', 'status',
                    'metadata', 'arch', 'created_on', 'dirname'
                ]
            }
        },
        'columns': [
            {
                'data': 'job',
                'title': 'Tree &dash; Branch',
                'render': function (data, type, object) {
                    var display =  '<a class="table-link" href="/job/' +
                        data + '/">' + data;

                    if (!$.isEmptyObject(object.metadata) &&
                            object.metadata.hasOwnProperty('git_branch') &&
                            object.metadata.git_branch !== null) {
                        display += '&nbsp;&dash;&nbsp;<small>' +
                            object.metadata.git_branch + '</small>';
                    }
                    return display + '</a>';
                }
            },
            {
                'data': 'kernel',
                'title': 'Kernel'
            },
            {
                'data': 'defconfig',
                'title': 'Defconfig',
                'render': function (data, type, object) {
                    var display = data;

                    if (!$.isEmptyObject(object.metadata) &&
                            object.metadata.hasOwnProperty('kconfig_fragments') &&
                            object.metadata.kconfig_fragments !== null) {
                        display = data + '&nbsp<small>' +
                            object.metadata.kconfig_fragments + '</small>';
                    }
                    return display;
                }
            },
            {
                'data': 'arch',
                'title': 'Arch.'
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
                        case 'PASS':
                            displ = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Build completed">' +
                                '<span class="label label-success">' +
                                '<li class="fa fa-check"></li></span></span>';
                            break;
                        case 'FAIL':
                            displ = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Build failed">' +
                                '<span class="label label-danger">' +
                                '<li class="fa fa-exclamation-triangle">' +
                                '</li></span></span>';
                            break;
                        default:
                            displ = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Unknown status">' +
                                '<span class="label label-warning">' +
                                '<li class="fa fa-question">' +
                                '</li></span></span>';
                            break;
                    }
                    return displ;
                }
            },
            {
                'data': 'job',
                'title': '',
                'orderable': false,
                'searchable': false,
                'className': 'pull-center',
                'render': function (data, type, object) {
                    return '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Details for&nbsp;' + data +
                        '&nbsp;&dash;&nbsp;' + object.kernel +
                        '&nbsp;&dash;&nbsp;' + object.defconfig +
                        '">' +
                        '<a href="/build/' + data +
                        '/kernel/' + object.kernel + '/defconfig/' +
                        object.dirname + '/">' +
                        '<i class="fa fa-search"></i></a></span>';
                }
            }
        ]
    });

    $(document).on("click", "#defconfstable tbody tr", function () {
        var data = table.fnGetData(this);
        if (data) {
            window.location = '/build/' + data.job +
                '/kernel/' + data.kernel + '/defconfig/' + data.dirname;
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
