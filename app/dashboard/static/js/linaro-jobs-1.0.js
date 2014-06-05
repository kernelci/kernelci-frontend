$(document).ready(function() {
    $('#li-job').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    $('#jobstable').dataTable({
        'dom': '<"row"<"col-lg-6"<"length-menu"l>>' +
            '<"col-lg-4 col-lg-offset-2"f>r<"col-lg-12"t>>' +
            '<"row"<"col-lg-6"i><"col-lg-6"p>>',
        'language': {
            'lengthMenu': '_MENU_&nbsp;<strong>jobs per page</strong>',
            'zeroRecords': '<strong>No jobs to display.<strong>',
            'search': '<div id="search-area" class="input-group"><span class="input-group-addon"><i class="fa fa-search"></i></span>_INPUT_</div>'
        },
        'lengthMenu': [25, 50, 75, 100],
        'ordering': true,
        'processing': true,
        'stateDuration': -1,
        'stateSave': true,
        'order': [2, 'desc'],
        'search': {
            'regex': true
        },
        'ajax': {
            'url': '/_ajax/job',
            'traditional': true,
            'dataType': 'json',
            'dataSrc': 'result',
            'dataFilter': function(data, type) {
                if (type === 'json') {
                    var parsed = JSON.parse(data);
                    parsed.result = JSON.parse(parsed.result);
                    return JSON.stringify(parsed);
                } 
                return data;
            },
            'data': {
                'aggregate': 'job',
                'sort': 'created_on',
                'sort_order': -1,
                'date_range': 15,
                'field': [
                    'job', 'kernel', 'created_on', 'status', 'metadata'
                ]
            }
        },
        'columns': [
            {
                'data': 'job',
                'title': 'Tree &dash; Branch',
                'render': function(data, type, object) {
                    return data + '&nbsp;&dash;&nbsp;<small>' +
                        object.metadata.git_branch + '</small>';
                }
            },
            {
                'data': 'kernel',
                'title': 'Kernel'
            },
            {
                'data': 'created_on',
                'title': 'Date',
                'type': 'date',
                'render': function(data, type, object) {
                    var created = new Date(data['$date']);
                    return created.getCustomISODate();
                }
            },
            {
                'data': 'status',
                'title': 'Status',
                'type': 'string',
                'render': function(data, type, object) {
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
                'render': function(data, type, object) {
                    return '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Details for&nbsp;' + data +
                        '&nbsp;&dash;&nbsp;' + object.kernel + '">' +
                        '<a href="/job/' + data +
                        '/kernel/' + object.kernel + '">' +
                        '<i class="fa fa-search"></i></a></span>';
                }
            }
        ]
    });

    $('#search-area > .input-sm').attr('placeholder', 'Filter the results');
    $('.input-sm').keyup(function(key) {
        // Remove focus from input when Esc is pressed.
        if (key.keyCode === 27) {
            $(this).blur();
        }
    });
});
