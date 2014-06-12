$(document).ready(function() {
    $('#li-job').addClass('active');

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto'
    });

    var table = $('#jobstable').dataTable({
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
        'order': [3, 'desc'],
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
                'sort': 'created_on',
                'job': $('#job-id').val(),
                'sort_order': -1,
                'date_range': 15,
                'field': [
                    'job', 'kernel', 'created_on', 'metadata'
                ]
            }
        },
        'columns': [
            {
                'data': 'kernel',
                'title': 'Kernel'
            },
            {
                'data': 'metadata',
                'defaultContent': '',
                'title': 'Branch',
                'render': function(data, type, object) {
                    return object.metadata.git_branch;
                }
            },
            {
                'data': 'metadata',
                'defaultContent': '',
                'title': 'Commit',
                'render': function(data, type, object) {
                    return object.metadata.git_commit;
                }
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
                'data': 'job',
                'title': '',
                'searchable': false,
                'orderable': false,
                'width': '50px',
                'className': 'pull-center',
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

    $(document).on("click", "#jobstable tbody tr", function() {
        var data = table.fnGetData(this);
        if (data) {
            window.location = '/job/' + data.job + '/kernel/' + data.kernel + '/';
        }
    });

    $('#search-area > .input-sm').attr('placeholder', 'Filter the results');
    $('.input-sm').keyup(function(key) {
        // Remove focus from input when Esc is pressed.
        if (key.keyCode === 27) {
            $(this).blur();
        }
    });
});

$(document).ready(function() {
    $.ajax({
        'url': '/_ajax/count/job',
        'traditional': true,
        'context': $('#builds-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': 15
        },
        'dataFilter': function(data, type) {
            if (type === 'json') {
                return JSON.parse(data).result;
            }
            return data;
        },
        'statusCode': {
            404: function() {
                $(this).empty().append('&infin;');
            },
            500: function() {
                $(this).empty().append('&infin;');
            }
        }
    }).done(function(data) {
        $(this).empty().append(data.count);
    });
});

$(document).ready(function() {
    $.ajax({
        'url': '/_ajax/count/defconfig',
        'traditional': true,
        'context': $('#defconfs-count'),
        'dataType': 'json',
        'data': {
            'job': $('#job-id').val(),
            'date_range': 15
        },
        'dataFilter': function(data, type) {
            if (type === 'json') {
                return JSON.parse(data).result;
            }
            return data;
        },
        'statusCode': {
            404: function() {
                $(this).empty().append('&infin;');
            },
            500: function() {
                $(this).empty().append('&infin;');
            }
        }
    }).done(function(data) {
        $(this).empty().append(data.count);
    });
});
