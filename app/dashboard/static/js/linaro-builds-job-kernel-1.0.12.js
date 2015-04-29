var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();

function showHideWarnErr(element) {
    'use strict';
    var view = $(element).data('view');

    function checkButtonStatus() {
        if ($('#success-btn').hasClass('active')) {
            $('.df-success').show();
        } else if ($('#fail-btn').hasClass('active')) {
            $('.df-failed').show();
        } else if ($('#unknown-btn').hasClass('active')) {
            $('.df-unknown').show();
        } else {
            $('.df-failed').show();
            $('.df-success').show();
            $('.df-unknown').show();
        }
    }

    switch (view) {
        case 'warnings':
            checkButtonStatus();
            $('.df-w :visible').show();
            $('.df-e').hide();
            $('.df-w-e').hide();
            $('.df-no-w-no-e').hide();
            break;
        case 'errors':
            checkButtonStatus();
            $('.df-w').hide();
            $('.df-e :visible').show();
            $('.df-w-e').hide();
            $('.df-no-w-no-e').hide();
            break;
        case 'warnings-errors':
            checkButtonStatus();
            $('.df-w').hide();
            $('.df-e').hide();
            $('.df-w-e :visible').show();
            $('.df-no-w-no-e').hide();
            break;
        case 'no-warnings-no-errors':
            checkButtonStatus();
            $('.df-w').hide();
            $('.df-e').hide();
            $('.df-w-e').hide();
            $('.df-no-w-no-e :visible').show();
            break;
        default:
            checkButtonStatus();
            break;
    }
}

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
    var result = data.result,
        len = result.length,
        success = 0,
        fail = 0,
        unknown = 0,
        i = 0,
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
            switch (result[i].status) {
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

        svg.append('text')
            .attr('dy', '0em')
            .style('text-anchor', 'middle')
            .attr('class', 'pie-chart-inside')
            .text(function(d) {
                return len;
            });

        svg.append('text')
            .attr('dy', '1.5em')
            .style('text-anchor', 'middle')
            .attr('class', 'pie-chart-data')
            .text(function(d) {
                return 'total builds';
            });
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
    var result = data.result,
        len = result.length,
        fileServer = $('#file-server').val(),
        fileServerUrl = null,
        fileServerResource = null,
        pathUrl = '',
        fileServerUri = null,
        uriPath = '',
        panel = '',
        cls,
        job,
        kernel,
        defconfigFull,
        localData,
        label,
        arch,
        i = 0,
        hasFailed = false,
        hasSuccess = false,
        hasUnknown = false,
        failLabel = '<span class="pull-right label label-danger">' +
            '<li class="fa fa-exclamation-triangle"></li></span>',
        successLabel = '<span class="pull-right label label-success">' +
            '<li class="fa fa-check"></li></span>',
        unknownLabel = '<span class="pull-right label label-warning">' +
            '<li class="fa fa-question"></li></span>',
        archLabel = '',
        warnErrCount = '',
        warnErrLabel = '',
        warnErrTooltip = '',
        warnErrString = '',
        buildLogUri = '',
        errorsCount,
        warningsCount,
        warningString = '',
        errorString = '',
        metadata;

    for (i; i < len; i = i + 1) {
        localData = result[i];

        defconfigFull = localData.defconfig_full;
        job = localData.job;
        kernel = localData.kernel;
        arch = localData.arch;
        fileServerUrl = localData.file_server_url;
        fileServerResource = localData.file_server_resource;
        errorsCount = localData.errors;
        warningsCount = localData.warnings;
        metadata = localData.metadata;

        if (fileServerUrl !== null && fileServerUrl !== undefined) {
            fileServer = fileServerUrl;
        }

        if (fileServerResource !== null && fileServerResource !== undefined) {
            pathUrl = fileServerResource;
        } else {
            pathUrl = job + '/' + kernel + '/' + arch + '-' +
                defconfigFull + '/';
        }

        fileServerUri = new URI(fileServer);
        uriPath = fileServerUri.path() + '/' + pathUrl;

        switch (result[i].status) {
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

        if (errorsCount === undefined) {
            errorsCount = 0;
        }
        if (warningsCount === undefined) {
            warningsCount = 0;
        }

        if (warningsCount > 0 && errorsCount > 0) {
            cls += ' df-w-e';
        } else if (warningsCount > 0 && errorsCount === 0) {
            cls += ' df-w';
        } else if (warningsCount === 0 && errorsCount > 0) {
            cls += ' df-e';
        } else if (warningsCount === 0 && errorsCount === 0) {
            cls += ' df-no-w-no-e';
        }

        if (warningsCount === 1) {
            warningString = sprintf('%d&nbsp;warning', warningsCount);
        } else {
            warningString = sprintf('%d&nbsp;warnings', warningsCount);
        }

        if (errorsCount === 1) {
            errorString = sprintf('%d&nbsp;error', errorsCount);
        } else {
            errorString = sprintf('%d&nbsp;errors', errorsCount);
        }

        warnErrString = 'Build warnings and errors';
        warnErrCount = sprintf(
            '%s&nbsp;&mdash;&nbsp;%s', warningString, errorString);
        if (localData.build_log !== null) {
            buildLogUri = fileServerUri.path(uriPath +
                '/' + localData.build_log).normalizePath().href();
            warnErrTooltip = sprintf(
                '%s&nbsp;&mdash;&nbsp;%s',
                warnErrString, 'Click to view the build log');
            warnErrLabel = '<small>' +
                '<span class="build-warnings">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="' + warnErrTooltip + '"><a href="' + buildLogUri +
                '">' + warnErrCount + '</a></span><span></small>';
        } else {
            warnErrLabel = '<small>' +
                '<span class="build-warnings">' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="' + warnErrString + '">' + warnErrCount +
                '</span><span></small>';
        }

        if (localData.arch !== null) {
            archLabel = '&nbsp;&dash;&nbsp;' +
                '<span class="arch-label">' + localData.arch + '</span>';
        }

        panel += '<div class="panel panel-default ' + cls + '">' +
            '<div class="panel-heading" data-toggle="collapse" ' +
                'id="panel-defconf' + i + '"' +
                'data-parent="accordion" data-target="#collapse-defconf' +
                i + '">' +
                '<h4 class="panel-title">' +
                '<a data-toggle="collapse" data-parent="#accordion" ' +
                'href="#collapse-defconf' + i + '">' + defconfigFull +
                '</a>' + archLabel + label +
                 warnErrLabel + '</h4></div>' +
                 '<div id="collapse-defconf' + i +
                '" class="panel-collapse collapse"><div class="panel-body">';

        panel += '<div class="row">';
        panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
        panel += '<dl class="dl-horizontal">';

        if (localData.dtb_dir !== null) {
            panel += '<dt>Dtb directory</dt>' +
                '<dd><a href="' +
                fileServerUri.path(uriPath + '/' + localData.dtb_dir + '/')
                    .normalizePath().href() +
                '">' +
                localData.dtb_dir +
                '&nbsp;<i class="fa fa-external-link">' +
                '</i></a></dd>';
        }

        if (localData.modules !== null) {
            panel += '<dt>Modules</dt>' +
                '<dd><a href="' +
                fileServerUri.path(uriPath + '/' + localData.moduels)
                    .normalizePath().href() +
                '">' +
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
                fileServerUri.path(uriPath + '/' + localData.kernel_image)
                    .normalizePath().href() +
                '">' +
                localData.kernel_image +
                '&nbsp;<i class="fa fa-external-link">' +
                '</i></a></dd>';
        }

        if (localData.kernel_config !== null) {
            panel += '<dt>Kernel config</dt>' +
                '<dd><a href="' +
                fileServerUri.path(uriPath + '/' + localData.kernel_config)
                    .normalizePath().href() +
                '">' +
                localData.kernel_config +
                '&nbsp;<i class="fa fa-external-link">' +
                '</i></a></dd>';
        }

        if (localData.build_log !== null) {
            panel += '<dt>Build log</dt>' +
                '<dd><a href="' + buildLogUri + '">' +
                localData.build_log +
                '&nbsp;<i class="fa fa-external-link">' +
                '</i></a></dd>';
        }

        panel += '</dl></div>';

        panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
        panel += '<dl class="dl-horizontal">';

        panel += '<dt>Build errors</dt>';
        panel += '<dd>' + errorsCount + '</dd>';

        panel += '<dt>Build warnings</dt>';
        panel += '<dd>' + warningsCount + '</dd>';

        if (localData.build_time !== null) {
            panel += '<dt>Build time</dt>';
            panel += '<dd>' + localData.build_time + '&nbsp;sec.</dd>';
        }

        panel += '</dl></div>';

        if (metadata !== undefined && metadata !== null) {
            panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
            panel += '<dl class="dl-horizontal">';
            if (metadata.hasOwnProperty('cross_compile')) {
                panel += '<dt>Cross-compile</dt>';
                panel += '<dd>' + metadata.cross_compile + '</dd>';
                panel += '</dt>';
            }
            if (metadata.hasOwnProperty('compiler_version')) {
                panel += '<dt>Compiler</dt>';
                panel += '<dd>' + metadata.compiler_version + '</dd>';
                panel += '</dt>';
            }
            panel += '</dl></div>';
        }

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
    if (!WebStorage.load('build' + jobName + kernelName)) {
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

function ajaxDefconfigGetFailed() {
    'use strict';
    JSBase.replaceContentByID(
        '#accordion-container',
        '<div class="text-center">' +
        '<h3>Error loading data.</h3>' +
        '</div>'
    );
}

function ajaxJobGetFailed() {
    'use strict';
    JSBase.replaceContentByClass(
        '.loading-content',
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>'
    );
}

function populateJobData(data) {
    'use strict';
    var localData = data.result,
        localResult = null,
        dataLen = localData.length,
        gitCommit = null,
        gitUrl = null,
        gitUrls = null,
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>';

    if (dataLen > 0) {
        localResult = localData[0];
        gitCommit = localResult.git_commit;
        gitUrl = localResult.git_url;

        gitUrls = JSBase.translateCommitURL(gitUrl, gitCommit);

        $('#tree').empty().append(
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for tree ' + jobName + '">' +
            '<a href="/job/' + jobName + '/">' + jobName + '</a>' +
            '</span>&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot reports details for ' + jobName + '">' +
            '<a href="/boot/all/job/' + jobName + '/">' +
            '<i class="fa fa-hdd-o"></i>' +
            '</a></span>'
        );

        $('#git-branch').empty().append(localResult.git_branch);

        $('#git-describe').empty().append(
            kernelName +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="All boot reports for ' + jobName + '&nbsp;&dash;&nbsp;' +
            kernelName + '">' +
            '<a href="/boot/all/job/' + jobName + '/kernel/' + kernelName +
            '/">' +
            '<i class="fa fa-hdd-o"></i></a></span>'
        );

        if (gitUrls[0] !== null) {
            $('#git-url').empty().append(
                '<a href="' + gitUrls[0] + '">' + gitUrl +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (gitUrl !== null) {
                $('#git-url').empty().append(gitUrl);
            } else {
                $('#git-url').empty().append(nonAvail);
            }
        }

        if (gitUrls[1] !== null) {
            $('#git-commit').empty().append(
                '<a href="' + gitUrls[1] + '">' + gitCommit +
                '&nbsp;<i class="fa fa-external-link"></i></a>'
            );
        } else {
            if (gitCommit !== null) {
                $('#git-commit').empty().append(gitCommit);
            } else {
                $('#git-commit').empty().append(nonAvail);
            }
        }
    } else {
        ajaxJobGetFailed();
    }
}

function getDefconfigData(data) {
    'use strict';
    var localData = data.result,
        localResult = null,
        dataLen = localData.length,
        ajaxData,
        ajaxDeferredCall,
        errorReason = 'Build data call failed';

    if (dataLen > 0) {
        localResult = localData[0];

        ajaxData = {
            'job_id': localResult._id.$oid,
            'job': jobName,
            'kernel': kernelName,
            'sort': ['defconfig_full', 'arch'],
            'sort_order': 1
        };
        ajaxDeferredCall = JSBase.createDeferredCall(
            '/_ajax/defconf',
            'GET',
            ajaxData,
            null,
            ajaxDefconfigGetFailed,
            errorReason
        );

        $.when(ajaxDeferredCall)
            .done(createBuildsPage)
            .done(createPieChart);
    } else {
        ajaxDefconfigGetFailed();
    }
}

$(document).ready(function() {
    'use strict';
    $('#li-build').addClass('active');

    var ajaxDeferredCall = null,
        ajaxData = null,
        errorReason = 'Job data call failed';

    ajaxData = {
        'job': jobName,
        'kernel': kernelName
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/job',
        'GET',
        ajaxData,
        null,
        ajaxJobGetFailed,
        errorReason
    );

    $.when(ajaxDeferredCall)
        .done(populateJobData)
        .done(getDefconfigData);
});

$(document).ready(function() {
    // No use strict here or onbeforeunload is not recognized.
    var sessionState = new WebStorage.SessionState(
        'build' + jobName + kernelName);
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

        sessionState.objects = JSBase.collectObjects(panelState, pageState);
        WebStorage.save(sessionState);
    };
});
