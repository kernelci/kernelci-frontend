var jobName = $('#job-name').val();
var jobId = $('#job-id').val();

function showHideDefconfs(element) {
    'use strict';

    switch (element.id) {
        case 'success-cell':
            if ($('#success-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').hide();
                $('.df-success').show();
                $('.df-unknown').hide();
                $('#success-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'success-btn':
            $('.df-failed').hide();
            $('.df-success').show();
            $('.df-unknown').hide();
            break;
        case 'fail-cell':
            if ($('#fail-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').show();
                $('.df-success').hide();
                $('.df-unknown').hide();
                $('#fail-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'fail-btn':
            $('.df-failed').show();
            $('.df-success').hide();
            $('.df-unknown').hide();
            break;
        case 'unknown-cell':
            if ($('#unknown-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').hide();
                $('.df-success').hide();
                $('.df-unknown').show();
                $('#unknown-btn').addClass('active').siblings()
                    .removeClass('active');
            }
            break;
        case 'unknown-btn':
            $('.df-failed').hide();
            $('.df-success').hide();
            $('.df-unknown').show();
            break;
        default:
            $('.df-failed').show();
            $('.df-success').show();
            $('.df-unknown').show();
            break;
    }
}

function createPieChart(data) {
    'use strict';

    var success = 0,
        fail = 0,
        unknown = 0,
        i = 0,
        len = data.length,
        width = 200,
        height = 200,
        radius = Math.min(width, height) / 2,
        dataset = null,
        svg = null,
        // success, fail and unknown status colors.
        color = ['#5cb85c', '#d9534f', '#f0ad4e'],
        pie = d3.layout.pie().sort(null),
        arc = d3.svg.arc().innerRadius(radius - 30).outerRadius(radius - 50);

    if (len > 0) {
        for (i; i < len; i = i + 1) {
            switch (data[i].status) {
                case 'FAIL':
                    fail = fail + 1;
                    break;
                case 'PASS':
                    success = success + 1;
                    break;
                default:
                    unknown = unknown + 1;
                    break;
            }
        }

        dataset = [success, fail, unknown];
        svg = d3.select('#builds-chart').append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' +
                height / 2 + ')'
            );

        svg.selectAll('path')
            .data(pie(dataset))
            .enter().append('path')
            .attr('fill', function(d, i) {
                return color[i];
            })
            .attr('d', arc);
    }

    $('#success-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Successful defconfigs built">' + success + '</span>'
        ).css('border-bottom-color', color[0]);
    $('#fail-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Failed defconfigs built">' + fail + '</span>'
        ).css('border-bottom-color', color[1]);
    $('#unknown-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Unknown status">' + unknown + '</span>'
        ).css('border-bottom-color', color[2]);
}

function createBuildsPage(data) {
    'use strict';

    var fileServer = $('#file-server').val(),
        panel = '',
        cls,
        dataUrl,
        job,
        kernel,
        defconfigFull,
        localData,
        label,
        arch,
        i = 0,
        len = data.length,
        hasFailed = false,
        hasSuccess = false,
        hasUnknown = false,
        failLabel = '<span class="pull-right label label-danger">' +
            '<li class="fa fa-exclamation-triangle"></li></span>',
        successLabel = '<span class="pull-right label label-success">' +
            '<li class="fa fa-check"></li></span>',
        unknownLabel = '<span class="pull-right label label-warning">' +
            '<li class="fa fa-question"></li></span>',
        archLabel = '';

    for (i; i < len; i = i + 1) {
        localData = data[i];

        defconfigFull = localData.defconfig_full;
        job = localData.job;
        kernel = localData.kernel;
        arch = localData.arch;

        dataUrl = fileServer + job + '/' + kernel + '/' + arch + '-' +
            defconfigFull + '/';

        switch (data[i].status) {
            case 'FAIL':
                hasFailed = true;
                label = failLabel;
                cls = 'df-failed';
                break;
            case 'PASS':
                hasSuccess = true;
                label = successLabel;
                cls = 'df-success';
                break;
            default:
                hasUnknown = true;
                label = unknownLabel;
                cls = 'df-unknown';
                break;
        }

        if (localData.arch !== null) {
            archLabel = '<small>' +
                '<span class="pull-right" style="padding: 3px">' +
                localData.arch + '</span></small>';
        }

        panel += '<div class="panel panel-default ' + cls + '">' +
            '<div class="panel-heading" data-toggle="collapse" ' +
                'id="panel-defconf' + i + '"' +
                'data-parent="accordion" data-target="#collapse-defconf' +
                i + '">' +
                '<h4 class="panel-title">' +
                '<a data-toggle="collapse" data-parent="#accordion" ' +
                'href="#collapse-defconf' + i + '">' + defconfigFull +
                '</a>' + label + archLabel + '</h4></div>' +
                '<div id="collapse-defconf' + i +
                '" class="panel-collapse collapse"><div class="panel-body">';

        panel += '<div class="row">';
        panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
        panel += '<dl class="dl-horizontal">';

        if (localData.dtb_dir !== null) {
            panel += '<dt>Dtb directory</dt>' +
                '<dd><a href="' +
                    dataUrl + localData.dtb_dir + '/' + '">' +
                    localData.dtb_dir +
                    '&nbsp;<i class="fa fa-external-link">' +
                    '</i></a></dd>';
        }

        if (localData.modules !== null) {
            panel += '<dt>Modules</dt>' +
                '<dd><a href="' +
                    dataUrl + localData.modules + '/' + '">' +
                    localData.modules +
                    '&nbsp;<i class="fa fa-external-link">' +
                    '</i></a></dd>';
        }

        if (localData.text_offset !== null) {
            panel += '<dt>Text offset</dt>' +
                '<dd>' + localData.text_offset + '</dd>';
        }

        if (localData.kernel_image !== null) {
            panel += '<dt>Kernel image</dt>' +
                '<dd><a href="' +
                    dataUrl + localData.kernel_image + '">' +
                    localData.kernel_image +
                    '&nbsp;<i class="fa fa-external-link">' +
                    '</i></a></dd>';
        }

        if (localData.kernel_config !== null) {
            panel += '<dt>Kernel config</dt>' +
                '<dd><a href="' +
                    dataUrl + localData.kernel_config + '">' +
                    localData.kernel_config +
                    '&nbsp;<i class="fa fa-external-link">' +
                    '</i></a></dd>';
        }

        if (localData.build_log !== null) {
            panel += '<dt>Build log</dt>' +
                '<dd><a href="' +
                    dataUrl + localData.build_log + '">' +
                    localData.build_log +
                    '&nbsp;<i class="fa fa-external-link">' +
                    '</i></a></dd>';
        }

        panel += '</dl></div>';

        panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
        panel += '<dl class="dl-horizontal">';

        panel += '<dt>Build errors</dt>';
        panel += '<dd>' + localData.errors + '</dd>';

        panel += '<dt>Build warnings</dt>';
        panel += '<dd>' + localData.warnings + '</dd>';

        if (localData.build_time !== null) {
            panel += '<dt>Build time</dt>';
            panel += '<dd>' + localData.build_time + '&nbsp;sec.</dd>';
        }

        panel += '</dl></div>';

        panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
        panel += '<div class="pull-center">' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build with defconfig&nbsp;' +
            defconfigFull + '">' +
            '<a href="/build/' + job +
            '/kernel/' + kernel +
            '/defconfig/' + defconfigFull + '/' +
            '?_id=' + localData._id.$oid +
            '">More info&nbsp;<i class="fa fa-search"></i>' +
            '</a></span>';
        panel += '</div></div>';

        panel += '</div>';
        panel += '</div></div></div>\n';
    }

    $('#accordion').empty().append(panel);

    if (hasFailed) {
        $('#fail-btn').removeAttr('disabled');
    }

    if (hasSuccess) {
        $('#success-btn').removeAttr('disabled');
    }

    if (hasUnknown) {
        $('#unknown-btn').removeAttr('disabled');
    }

    $('#all-btn').removeAttr('disabled');
    if (!loadFromSessionStorage(jobId)) {
        if (hasFailed) {
            // If there is no saved session, show only the failed ones.
            $('.df-failed').show();
            $('.df-success').hide();
            $('.df-unknown').hide();
            $('#fail-btn').addClass('active').siblings().removeClass('active');
        } else {
            $('#all-btn').addClass('active');
        }
    }
}

function ajaxCallFailed() {
    'use strict';

    $('#accordion-container').empty().append(
        '<div class="text-center">' +
        '<h3>Error loading data.</h3>' +
        '</div>'
    );
}

function parseData(data) {
    'use strict';

    // Just a wrapper function calling jQuery 'when' with multiple functions.
    var localData = data.result;
    $.when(createBuildsPage(localData), createPieChart(localData));
}

$(document).ready(function() {
    'use strict';

    $('#li-build').addClass('active');

    var ajaxDeferredCall = null,
        ajaxData = null,
        errorReason = 'Defconfig data call failed';

    ajaxData = {
        'job_id': jobId,
        'sort': ['status', '_id'],
        'sort_order': 1
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/defconf',
        'GET',
        ajaxData,
        null,
        ajaxCallFailed,
        errorReason
    );

    $.when(ajaxDeferredCall).done(parseData);

});

$(document).ready(function() {
    // No use strict here, or onbeforeunload is not recognized.
    var sessionState = new SessionState(jobId);
    onbeforeunload = function() {

        var panelState = {},
            pageState;

        $('[id^="panel-defconf"]').each(function(id) {
            panelState['#panel-defconf' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#panel-defconf' + id).attr('class')
            };
        });

        $('[id^="collapse-defconf"]').each(function(id) {
            panelState['#collapse-defconf' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#collapse-defconf' + id).attr('class')
            };
        });

        pageState = {
            '.df-success': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-success').attr('style')
            },
            '.df-failed': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-failed').attr('style')
            },
            '.df-unknown': {
                'type': 'attr',
                'name': 'style',
                'value': $('.df-unknown').attr('style')
            },
            '#all-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#all-btn').attr('class')
            },
            '#success-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#success-btn').attr('class')
            },
            '#fail-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#fail-btn').attr('class')
            },
            '#unknown-btn': {
                'type': 'class',
                'name': 'class',
                'value': $('#unknown-btn').attr('class')
            }
        };

        sessionState.objects = collectObjects(panelState, pageState);
        saveToSessionStorage(sessionState);
    };
});
