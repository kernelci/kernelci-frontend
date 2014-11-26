function showHideBoots(element) {
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
        dataset = null,
        svg = null,
        radius = Math.min(width, height) / 2,
        // success, fail and unknown status colors.
        color = ['#5cb85c', '#d9534f', '#f0ad4e'],
        pie = d3.layout.pie().sort(null),
        arc = d3.svg.arc().innerRadius(radius - 30).outerRadius(radius - 50);

    for (i; i < len; i++) {
        switch (data[i].status) {
            case 'FAIL':
                fail++;
                break;
            case 'PASS':
                success++;
                break;
            default:
                unknown++;
                break;
        }
    }

    dataset = [success, fail, unknown];
    svg = d3.select('#pie-chart').append('svg')
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

    $('#success-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Successful boot">' + success + '</span>'
        ).css('border-bottom-color', color[0]);
    $('#fail-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Failed boot">' + fail + '</span>'
        ).css('border-bottom-color', color[1]);
    $('#unknown-cell')
        .empty()
        .append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Unknown status">' + unknown + '</span>'
        ).css('border-bottom-color', color[2]);
}

function populateBootsPage(data) {
    'use strict';

    var fileServer = $('#file-server').val(),
        panel = '',
        cls,
        dataUrl,
        defconfigFull,
        job,
        kernel,
        board,
        metadata,
        label,
        arch,
        i = 0,
        len = data.length,
        bootObj = null,
        bootObjId,
        hasFailed = false,
        hasSuccess = false,
        hasUnknown = false,
        bootTime = null,
        labName,
        allLabs = {},
        lab,
        labLinks,
        sidebarNav,
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>',
        failLabel = '<span class="pull-right label label-danger">' +
            '<li class="fa fa-exclamation-triangle"></li></span>',
        successLabel = '<span class="pull-right label label-success">' +
            '<li class="fa fa-check"></li></span>',
        unknownLabel = '<span class="pull-right label label-warning">' +
            '<li class="fa fa-question"></li></span>',
        toAppend;

    if (len > 0) {
        for (i; i < len; i++) {
            bootObj = data[i];
            defconfigFull = bootObj.defconfig_full;
            metadata = bootObj.metadata;
            job = bootObj.job;
            kernel = bootObj.kernel;
            board = bootObj.board;
            labName = bootObj.lab_name;
            bootObjId = bootObj._id;
            arch = bootObj.arch;

            dataUrl = fileServer + job + '/' + kernel + '/' + arch + '-' +
                defconfigFull + '/';

            switch (bootObj.status) {
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

            panel = '<div class="panel panel-default ' + cls + '">' +
                '<div class="panel-heading" data-toggle="collapse" ' +
                    'id="panel-boots' + i + '" ' +
                    'data-parent="accordion' + labName + '" ' +
                    'data-target="#collapse-boots' + i + '">' +
                    '<h4 class="panel-title">' +
                    '<a data-toggle="collapse" ' +
                    'data-parent="#accordion' + labName + '" ' +
                    'href="#collapse-boots' + i + '">' +
                    board + '&nbsp;<small>' + defconfigFull + '</small>' +
                    '</a>' + label + '</h4></div>' +
                    '<div id="collapse-boots' + i +
                    '" class="panel-collapse collapse">' +
                    '<div class="panel-body">';

            panel += '<div class="row">';
            panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
            panel += '<dl class="dl-horizontal">';

            panel += '<dt>Endianness</dt>';
            if (bootObj.endian !== null) {
                panel += '<dd>' + bootObj.endian + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '<dt>Kernel image</dt>';
            if (bootObj.kernel_image !== null) {
                panel += '<dd>' + bootObj.kernel_image + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '</dl></div>';
            panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
            panel += '<dl class="dl-horizontal">';

            panel += '<dt>Warnings</dt>';
            if (bootObj.warnings !== null) {
                panel += '<dd>' + bootObj.warnings + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '<dt>Boot time</dt>';
            if (bootObj.time !== null) {
                bootTime = new Date(bootObj.time.$date);
                panel += '<dd>' + bootTime.getCustomTime() + '</dd>';
            } else {
                panel += '<dd>' + nonAvail + '</dd>';
            }

            panel += '</dl></div>';

            panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
            panel += '<div class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for this boot report">' +
                '<a href="/boot/' + board +
                '/job/' + job +
                '/kernel/' + kernel +
                '/defconfig/' + defconfigFull +
                '/lab/' + labName + '/' +
                '?_id=' + bootObjId.$oid +
                '">More info&nbsp;<i class="fa fa-search"></i>' +
                '</a></span>';
            panel += '</div></div>';

            panel += '</div>';
            panel += '</div></div></div>\n';

            if (allLabs.hasOwnProperty(labName)) {
                allLabs[labName].push(panel);
            } else {
                allLabs[labName] = [];
                allLabs[labName].push(panel);
            }
        }

        // Make sure it is clean.
        labLinks = '';
        toAppend = '';
        Object.keys(allLabs).sort().forEach(function(element, index, array) {
            lab = allLabs[element];
            len = lab.length;

            labLinks += '<li><a href="#' +
                element + '">' + element + '</a></li>';

            toAppend += '<div id="' + element + '">' +
                '<h3>Lab&nbsp;&#171;' + element + '&#187;</h3>' +
                '<div class="panel-group" id="accordion' + element + '">';

            for (i = 0; i < len; i++) {
                toAppend += lab[i];
            }
            toAppend += '</div></div>';
        });

        $('#accordion-container').empty().append(toAppend);
        // Append the stuff only if we have the element.
        // On mobile platform the element is not available.
        if ($('#sidebar-nav').length !== 0) {
            sidebarNav = '<ul class="nav sidenav">' +
                '<li class="active"><a href="#top">Top</a></li>' +
                '<li><a href="#details">Details</a></li>' +
                '<li><a href="#tested-boards">Boards</a></li>' +
                '<li><a href="#labs">Labs</a><ul class="nav">' +
                labLinks +
                '</ul></li>' +
                '</ul>';
            $('#sidebar-nav').empty().append(sidebarNav);
        }

        $('[data-spy="scroll"]').each(function() {
          var $spy = $(this).scrollspy('refresh');
        });

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
        if (!loadFromSessionStorage($('#storage-id').val())) {
            if (hasFailed) {
                // If there is no saved session, show only the failed ones.
                $('.df-failed').show();
                $('.df-success').hide();
                $('.df-unknown').hide();
                $('#fail-btn').addClass('active').siblings()
                    .removeClass('active');
            } else {
                $('#all-btn').addClass('active');
            }
        }
    } else {
        $('#accordion-container').empty().append(
            '<div class="pull-center"><strong>No boards tested.' +
            '<strong></div>'
        );
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
    // Just a wrapper function calling jQuery 'when' with multiple functions.
    'use strict';

    var localData = data.result;
    $.when(populateBootsPage(localData), createPieChart(localData));
}

$(document).ready(function() {
    'use strict';

    $('body').scrollspy({
        target: '#sidebar-nav'
    });

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-boot').addClass('active');

    $('.btn-group > .btn').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
    });

    var errorReason = 'Boot data call failed.',
        ajaxCall,
        data = {
            'sort': ['status', '_id'],
            'sort_order': 1
        },
        jobId = $('#job-id').val(),
        kernelName = $('#kernel-name').val(),
        jobName = $('#job-name').val();

    if (jobId !== 'None') {
        data.job_id = jobId;
    } else {
        data.job = jobName;
        data.kernel = kernelName;
    }

    ajaxCall = $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': data,
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            ajaxCallFailed();
        },
        'timeout': 6000,
        'statusCode': {
            403: function() {
                setErrorAlert('boots-403-error', 403, errorReason);
            },
            400: function() {
                setErrorAlert('boots-400-error', 400, errorReason);
            },
            404: function() {
                setErrorAlert('boots-404-error', 404, errorReason);
            },
            408: function() {
                errorReason = 'Boot data call failed:  timeout.';
                setErrorAlert('boots-408-error', 408, errorReason);
            },
            500: function() {
                setErrorAlert('boots-500-error', 500, errorReason);
            }
        }
    });

    $.when(ajaxCall).then(parseData, ajaxCallFailed);
});

$(document).ready(function() {
    // No use strict here, or onbeforeunload is not recognized.
    var session_state = new SessionState($('#storage-id').val());
    onbeforeunload = function() {

        var panel_state = {},
            page_state;

        $('[id^="panel-boots"]').each(function(id) {
            panel_state['#panel-boots' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#panel-boots' + id).attr('class')
            };
        });

        $('[id^="collapse-boots"]').each(function(id) {
            panel_state['#collapse-boots' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#collapse-boots' + id).attr('class')
            };
        });

        page_state = {
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

        session_state.objects = collectObjects(panel_state, page_state);
        saveToSessionStorage(session_state);
    };
});
