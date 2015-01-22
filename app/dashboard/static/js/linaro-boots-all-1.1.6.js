var searchFilter = $('#search-filter').val();
var pageLen = $('#page-len').val();

function createBootsTable(data) {
    'use strict';

    var localData = data.result,
        table = null;

    table = $('#bootstable').dataTable({
        'dom': '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-4 col-lg-offset-2"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>',
        'language': {
            'lengthMenu': '_MENU_&nbsp;<strong>boot reports per page</strong>',
            'zeroRecords': '<h4>No boot reports to display.</h4>',
            'search': '<div id="search-area" class="input-group">' +
                '<span class="input-group-addon">' +
                '<i class="fa fa-search"></i></span>_INPUT_</div>'
        },
        'initComplete': function(settings, data) {
            $('#table-loading').remove();
            $('#table-div').fadeIn('slow', 'linear');

            var api = this.api();

            if (pageLen !== undefined && pageLen !== null) {
                if (pageLen.length > 0) {
                    pageLen = Number(pageLen);
                    if (isNaN(pageLen)) {
                        pageLen = 25;
                    }

                    api.page.len(pageLen).draw();
                }
            }

            if (searchFilter !== null && searchFilter !== undefined) {
                if (searchFilter.length > 0) {
                    api.search(searchFilter, true).draw();
                }
            }
        },
        'lengthMenu': [25, 50, 75, 100],
        'deferRender': true,
        'ordering': true,
        'processing': true,
        'stateDuration': -1,
        'stateSave': true,
        'order': [7, 'desc'],
        'search': {
            'regex': true,
            'smart': true
        },
        'data': localData,
        'columns': [
            {
                'data': '_id',
                'visible': false,
                'searchable': false,
                'orderable': false
            },
            {
                'data': 'job',
                'title': 'Tree',
                'type': 'string',
                'render': function(data) {
                    return '<a class="table-link" href="/boot/all/job/' +
                        data + '/">' + data + '</a>';
                }
            },
            {
                'data': 'kernel',
                'title': 'Kernel',
                'type': 'string',
                'render': function(data, type, object) {
                    var display = '<a class="table-link" href="/boot/all/job/' +
                        object.job + '/kernel/' + data + '/">' + data +
                        '</a>';
                    if (data.length > 33) {
                        display = '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="/boot/all/job/' +
                            object.job + '/kernel/' + data + '/">' +
                            data.slice(0, 32) + '&hellip;</a></span>';
                    }
                    return display;
                }
            },
            {
                'data': 'board',
                'title': 'Board Model',
                'type': 'string',
                'render': function(data, type, object) {
                    var display = '<a class="table-link" href="/boot/' + data +
                        '/job/' + object.job + '/kernel/' +
                        object.kernel + '/">' + data + '</a>';
                    if (data.length > 19) {
                        display = '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="/boot/' + data +
                            '/job/' + object.job + '/kernel/' +
                            object.kernel + '/">' +
                            data.slice(0, 18) + '&hellip;</a></span>';
                    }
                    return display;
                }
            },
            {
                'data': 'defconfig_full',
                'title': 'Defconfig',
                'render': function(data, type, object) {
                    var display = null,
                        href = null,
                        linkEl = null,
                        board = object.board,
                        job = object.job,
                        kernel = object.kernel;

                    href = '/boot/' + board + '/job/' + job + '/kernel/' +
                        kernel + '/defconfig/' + data + '/';
                    linkEl = '<a class="table-link" href="' + href + '">' +
                        data + '</a>';

                    if (data.length > 33) {
                        display = '<span rel="tooltip" ' +
                            'data-toggle="tooltip" ' +
                            'title="' + data + '">' +
                            '<a class="table-link" href="' + href + '">' +
                            data.slice(0, 33) + '&hellip;</a></span>';
                    } else {
                        display = linkEl;
                    }
                    return display;
                }
            },
            {
                'data': 'arch',
                'title': 'Arch.',
                'type': 'string'
            },
            {
                'data': 'lab_name',
                'title': 'Lab Name',
                'render': function(data, type, object) {
                    return '<small>' + data + '</small>';
                }
            },
            {
                'data': 'created_on',
                'title': 'Date',
                'type': 'date',
                'className': 'pull-center',
                'render': function(data) {
                    var created = new Date(data.$date);
                    return created.getCustomISODate();
                }
            },
            {
                'data': 'status',
                'title': 'Status',
                'type': 'string',
                'className': 'pull-center',
                'render': function(data) {
                    var displ;
                    switch (data) {
                        case 'PASS':
                            displ = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Boot completed">' +
                                '<span class="label label-success">' +
                                '<i class="fa fa-check"></i></span></span>';
                            break;
                        case 'FAIL':
                            displ = '<span rel="tooltip" ' +
                                'data-toggle="tooltip"' +
                                'title="Boot failed">' +
                                '<span class="label label-danger">' +
                                '<i class="fa fa-exclamation-triangle">' +
                                '</i></span></span>';
                            break;
                        case 'OFFLINE':
                            displ = '<span rel="tooltip"' +
                                'data-toggle="tooltip"' +
                                'title="Board offline"' +
                                '<span class="label label-info">' +
                                '<i class="fa fa-power-off">' +
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
                'data': 'board',
                'title': '',
                'orderable': false,
                'searchable': false,
                'className': 'pull-center',
                'render': function(data, type, object) {
                    var defconfigFull = object.defconfig_full,
                        kernel = object.kernel,
                        job = object.job,
                        lab = object.lab_name;

                    return '<span rel="tooltip" data-toggle="tooltip"' +
                        'title="Details for board&nbsp;' + data + 'with&nbsp;' +
                        job + '&dash;' + kernel + '&dash;' + defconfigFull +
                        '&nbsp;&dash;&nbsp;(' + lab + ')' +
                        '"><a href="/boot/' + data + '/job/' + job +
                        '/kernel/' + kernel + '/defconfig/' + defconfigFull +
                        '/lab/' + lab + '/?_id=' + object._id.$oid + '">' +
                        '<i class="fa fa-search"></i></a></span>';
                }
            }
        ]
    });

    $(document).on('click', '#bootstable tbody tr', function() {
        var localTable = table.fnGetData(this),
            location = '#';
        if (localTable) {
            location = '/boot/' + localTable.board + '/job/' +
                localTable.job + '/kernel/' + localTable.kernel +
                '/defconfig/' + localTable.defconfig_full + '/lab/' +
                localTable.lab_name + '/';
            if (localTable._id !== null) {
                location += '?_id=' + localTable._id.$oid;
            }
            window.location = location;
        }
    });

    $('#search-area > .input-sm').attr('placeholder', 'Filter the results');
    $('.input-sm').keyup(function(key) {
        // Remove focus from input when Esc is pressed.
        if (key.keyCode === 27) {
            $(this).blur();
        }
    });
}

function failedAjaxCall() {
    'use strict';
    $('#table-loading').remove();
}

$(document).ready(function() {
    'use strict';

    $('#li-boot').addClass('active');
    $('#table-div').hide();

    var deferredAjaxCall = null,
        ajaxData = null,
        errorReason = 'Boot data call failed';

    ajaxData = {
        'sort': 'created_on',
        'sort_order': -1,
        'date_range': $('#date-range').val(),
        'field': [
            '_id', 'job', 'kernel', 'board', 'created_on',
            'status', 'lab_name', 'defconfig_full', 'arch'
        ]
    };
    deferredAjaxCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        ajaxData,
        null,
        failedAjaxCall,
        errorReason
    );

    $.when(deferredAjaxCall).then(createBootsTable, failedAjaxCall);
});
