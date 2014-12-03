var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();
var defconfigId = $('#defconfig-id').val();
var defconfigFull = $('#defconfig-full').val();

function createBisectScriptURI(badCommit, goodCommit) {
    'use strict';
    var bisectScript = '#!/bin/bash\n' +
        'git bisect start ' + badCommit + ' ' + goodCommit + '\n';

    return 'data:text/plain;charset=UTF-8,' + encodeURIComponent(bisectScript);
}

function populateDefconfigData(data) {
    'use strict';

    var job = data.job,
        kernel = data.kernel,
        gitUrl = data.git_url,
        gitCommit = data.git_commit,
        gitUrls = null,
        arch = data.arch,
        defconfig = data.defconfig,
        defconfigFull = data.defconfig_full,
        metadata = data.metadata,
        buildTime = data.build_time,
        statusDisplay = '',
        dtbDirectory = data.dtb_dir,
        buildModules = data.modules,
        modulesDirectory = data.modules_dir,
        textOffset = data.text_offset,
        configFragments = data.kconfig_fragments,
        kernelImage = data.kernel_image,
        kernelConfig = data.kernel_config,
        buildLog = data.build_log,
        buildPlatform = data.build_platform,
        fileServerUrl = data.file_server_url,
        fileServerResource = data.file_server_resource,
        pathUrl = '',
        fileServerUri = null,
        uriPath = '',
        fileServer = $('#file-server').val(),
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>';

    $('#details').append('&nbsp<small>(' + defconfig + ')</small>');

    if (fileServerUrl !== null && typeof(fileServerUrl) !== 'undefined') {
        fileServer = fileServerUrl;
    }

    if (fileServerResource !== null &&
        typeof(fileServerResource) !== 'undefined') {
        pathUrl = fileServerResource;
    } else {
        pathUrl = job + '/' + kernel + '/' + arch + '-' + defconfigFull + '/';
    }

    fileServerUri = new URI(fileServer);
    uriPath = fileServerUri.path() + '/' + pathUrl;

    $('#tree').empty().append(
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Details for tree ' + job + '">' +
        '<a href="/job/' + job + '/">' + job + '</a>' +
        '</span>&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Boot reports details for ' + job + '">' +
        '<a href="/boot/all/job/' + job + '/">' +
        '<i class="fa fa-hdd-o"></i>' +
        '</a></span>'
    );

    $('#git-branch').empty().append(data.git_branch);

    $('#git-describe').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Details for build ' + job + '&nbsp;&dash;&nbsp;' +
        kernel + '">' +
        '<a href="/build/' + job + '/kernel/' + kernel + '/">' + kernel +
        '</a>' +
        '</span>&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="All boot reports for ' + job + '&nbsp;&dash;&nbsp;' +
        kernel + '">' +
        '<a href="/boot/all/job/' + job + '/kernel/' + kernel + '/">' +
        '<i class="fa fa-hdd-o"></i></a></span>'
    );

    gitUrls = translateCommitURL(gitUrl, gitCommit);

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

    if (metadata.hasOwnProperty('cross_compile')) {
        $('#build-cross-compile').empty().append(metadata.cross_compile);
    } else {
        $('#build-cross-compile').empty().append(nonAvail);
    }

    if (metadata.hasOwnProperty('compiler_version')) {
        $('#build-compiler').empty().append(metadata.compiler_version);
    } else {
        $('#build-compiler').empty().append(nonAvail);
    }

    if (arch !== null) {
        $('#build-arch').empty().append(arch);
    } else {
        $('#build-arch').empty().append(nonAvail);
    }

    $('#build-errors').empty().append(data.errors);
    $('#build-warnings').empty().append(data.warnings);

    if (buildTime !== null) {
        $('#build-time').empty().append(buildTime + '&nbsp;sec.');
    } else {
        $('#build-time').empty().append(nonAvail);
    }

    switch (data.status) {
        case 'PASS':
            statusDisplay = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Build completed"><span class="label ' +
                'label-success"><i class="fa fa-check">' +
                '</i></span></span>';
            break;
        case 'FAIL':
            statusDisplay = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Build failed"><span class="label label-danger">' +
                '<i class="fa fa-exclamation-triangle"></i>' +
                '</span></span>';
            break;
        default:
            statusDisplay = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Unknown status"><span class="label ' +
                'label-warning"><i class="fa fa-question"></i>' +
                '</span></span>';
            break;
    }

    $('#build-status').empty().append(statusDisplay);

    if (dtbDirectory !== null) {
        $('#dtb-dir').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + dtbDirectory + '/')
            .normalizePath().href() +
            '">' + dtbDirectory +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#dtb-dir').empty().append(nonAvail);
    }

    if (buildModules !== null) {
        $('#build-modules').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + buildModules)
            .normalizePath().href() +
            '">' + buildModules +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#build-modules').empty().append(nonAvail);
    }

    if (modulesDirectory !== null) {
        $('#modules-directory').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + modulesDirectory + '/')
            .normalizePath().href() +
            '">' + modulesDirectory +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#modules-directory').empty().append(nonAvail);
    }

    if (textOffset !== null) {
        $('#text-offset').empty().append(textOffset);
    } else {
        $('#text-offset').empty().append(nonAvail);
    }

    if (configFragments !== null) {
        if (configFragments.length > 45) {
            configFragments = '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="' + configFragments + '">' +
                configFragments.slice(0, 46) + '&hellip;</span>';
        }
        $('#config-fragments').empty().append(configFragments);
    } else {
        $('#config-fragments').empty().append(nonAvail);
    }

    if (kernelImage !== null) {
        $('#kernel-image').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + kernelImage)
            .normalizePath().href() +
            '">' + kernelImage +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#kernel-image').empty().append(nonAvail);
    }

    if (kernelConfig !== null) {
        $('#kernel-config').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + kernelConfig)
            .normalizePath().href() +
            '">' + kernelConfig +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#kernel-config').empty().append(nonAvail);
    }

    if (buildLog !== null) {
        $('#build-log').empty().append('<a href="' +
            fileServerUri.path(uriPath + '/' + buildLog)
            .normalizePath().href() +
            '">' + buildLog +
            '&nbsp;<i class="fa fa-external-link"></i></a>'
        );
    } else {
        $('#build-log').empty().append(nonAvail);
    }

    if (buildPlatform !== null && buildPlatform.length === 6) {
        $('#platform-system').empty().append(buildPlatform[0]);
        $('#platform-node').empty().append(buildPlatform[1]);
        $('#platform-release').empty().append(buildPlatform[2]);
        $('#platform-full-release').empty().append(buildPlatform[3]);
        $('#platform-machine').empty().append(buildPlatform[4]);
        $('#platform-cpu').empty().append(buildPlatform[5]);
    } else {
        $('#build-platform').empty().append(
            '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
            '<div class="pull-center">' +
            '<h5><strong>No data available.</strong></h5>' +
            '</div></div>'
        );
    }
}

function populateBootSection(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
        colData,
        i = 0,
        totalColumns = 3,
        columnIndex = 1,
        columns = {
            'col1': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">',
            'col2': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4">' + '<ul class="list-unstyled">',
            'col3': '<div class="col-xs-4 col-sm-4 col-md-4 ' +
                'col-lg-4"><ul class="list-unstyled">'
        };

    if (len > 0) {
        for (i; i < len; i++) {
            columnIndex = (i % totalColumns) + 1;
            colData = localData[i];

            columns['col' + columnIndex] += '<li>' +
                '<a href="/boot/' + colData.board +
                '/job/' + colData.job + '/kernel/' +
                colData.kernel +
                '/defconfig/' + colData.defconfig_full +
                '/lab/' + colData.lab_name +
                '?_id=' + colData._id.$oid + '">' +
                colData.board +
                '&nbsp;<i class="fa fa-search"></i></a></li>';
        }

        columns.col1 += '</ul></div>';
        columns.col2 += '</ul></div>';
        columns.col3 += '</ul></div>';

        $('#boot-report').empty().append(
            columns.col1 + columns.col2 + columns.col3);
    } else {
        $('#boot-report').empty().append(
            '<div class="text-center">' +
            '<h5><strong>No boot reports available.</strong></h5>' +
            '</div>'
        );
    }
}

function ajaxBootCallFailed() {
    'use strict';
    $('#boot-report').empty().append(
        '<div class="text-center">' +
        '<h3>Error loading data.</h3>' +
        '</div>'
    );
}

function ajaxDefconfigCallFailed() {
    'use strict';
    $('.loading-content').each(function() {
        $(this).empty().append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>'
        );
    });
    ajaxBootCallFailed();
    $('#bisect-div').remove();
}

function getBootReports(data) {
    'use strict';

    var errorReason = 'Boot data call failed.',
        ajaxBoot,
        bootData = {
            'field': [
                '_id', 'board', 'job', 'kernel', 'lab_name', 'defconfig_full'
            ]
        };

    if (data._id !== null) {
        bootData.defconfig_id = data._id.$oid;
    } else {
        bootData.defconfig = data.defconfig;
        bootData.defconfig_full = data.defconfig_full;
        bootData.job = data.job;
        bootData.kernel = data.kernel;
    }

    ajaxBoot = $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': bootData,
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            ajaxBootCallFailed();
        },
        'timeout': 6000,
        'statusCode': {
            403: function() {
                setErrorAlert('boot-403-error', 403, errorReason);
            },
            404: function() {
                setErrorAlert('boot-404-error', 404, errorReason);
            },
            408: function() {
                errorReason = 'Boot data call failed: timeout.';
                setErrorAlert('boot-408-error', 408, errorReason);
            },
            500: function() {
                setErrorAlert('boot-500-error', 500, errorReason);
            }
        }
    }).done(populateBootSection);
}

function bisectAjaxCallFailed(data) {
    'use strict';
    $('#bisect-loading-div').remove();
    $('#bisect-content')
        .removeClass('hidden')
        .empty()
        .append('<strong>Error loading bisect data from server.</strong>')
        .addClass('pull-center');
}

function createBisectTable(data) {
    'use strict';
    $('#bisect-loading-content').empty().append('loading bisect data&hellip;');

    var localResult = data.result[0],
        localData = localResult.bisect_data,
        localLen = localData.length,
        i = 0,
        bisectData,
        gitDescribeCell,
        badCommitCell,
        unknownCommitCell,
        goodCommitCell,
        buildStatus,
        tableRows = '',
        tooltipLink,
        tooltipTitle,
        defconfig,
        gitURLs,
        gitDescribeVal,
        gitCommit,
        gitURL,
        docId,
        badCommit = null,
        goodCommit = null;

    badCommit = localResult.bad_commit;
    goodCommit = localResult.good_commit;

    for (i; i < localLen; i++) {
        bisectData = localData[i];
        buildStatus = bisectData.status;
        gitDescribeVal = bisectData.git_describe;
        gitURL = bisectData.git_url;
        gitCommit = bisectData.git_commit;
        defconfig = bisectData.defconfig_full;
        docId = bisectData._id.$oid;

        tooltipLink = '<a href="/build/' + jobName +
            '/kernel/' + gitDescribeVal + '">' +
            gitDescribeVal + '</a>';

        tooltipTitle = 'Build details for&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' + gitDescribeVal;

        gitDescribeCell = '<td><span class="bisect-tooltip">' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="' + tooltipTitle + '">' +
            '<span class="bisect-text">' + tooltipLink +
            '</span></span></span></td>';

        gitURLs = translateCommitURL(gitURL, gitCommit);

        switch (buildStatus) {
            case 'PASS':
                goodCommitCell = '<td class="bg-success"><a href="' +
                    gitURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            case 'FAIL':
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"><a href="' +
                    gitURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            default:
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"><a href="' +
                    gitURLs[1] + '">' + gitCommit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                break;
        }

        tableRows += '<tr>' + gitDescribeCell + badCommitCell +
            unknownCommitCell + goodCommitCell + '</tr>';
    }

    $('#bisect-loading-div').remove();
    $('#bad-commit').empty().append(
        '<span class="text-danger">' + badCommit + '</span>');
    if (goodCommit !== null) {
        $('#good-commit').empty().append(
            '<span class="text-success">' + goodCommit + '</span>');
    } else {
        $('#good-commit').empty().append(
            '<span class="text-warning">No good commit found</span>');
    }

    if (badCommit !== null && goodCommit !== null) {
        $('#dl-bisect-script').removeClass('hidden');
        $('#bisect-script').append(
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Download defconfig bisect script">' +
            '<a download="bisect.sh" href="' +
            createBisectScriptURI(badCommit, goodCommit) +
            '"><i class="fa fa-download"></i></a></span>'
        );
    } else {
        $('#dl-bisect-script').remove();
    }

    $('#bisect-table-body').empty().append(tableRows);
    $('#bisect-content')
        .removeClass('hidden')
        .fadeIn('slow', 'linear');
}

function getBisectData(data) {
    'use strict';

    var status = data.status,
        bisectAjaxCall,
        errorReason;

    errorReason = 'Bisect data call failed.';

    if (status === 'FAIL') {
        $('#bisect-div').removeClass('hidden');
        if (defconfigId === 'None') {
            defconfigId = data._id.$oid;
        }

        bisectAjaxCall = $.ajax({
            'url': '/_ajax/bisect/defconfig/' + defconfigId,
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'beforeSend': function(jqXHR) {
                setXhrHeader(jqXHR);
            },
            'timeout': 12000,
            'error': function() {
                bisectAjaxCallFailed();
            },
            'statusCode': {
                400: function() {
                    setErrorAlert('bisect-400-error', 400, errorReason);
                },
                404: function() {
                    setErrorAlert('bisect-404-error', 404, errorReason);
                },
                408: function() {
                    errorReason = 'Bisect data call failed: timeout'.
                    setErrorAlert('bisect-408-error', 408, errorReason);
                },
                500: function() {
                    setErrorAlert('bisect-500-error', 500, errorReason);
                }
            }
        });

        $.when(bisectAjaxCall).done(createBisectTable);
    } else {
        $('#bisect-div').remove();
    }
}

function populateDefconfigAndBoot(data) {
    // Just a wrapper function calling jQuery 'when' with multiple functions.
    'use strict';

    var result = data.result[0];

    $.when(
        populateDefconfigData(result),
        getBootReports(result),
        getBisectData(result)
    );
}

$(document).ready(function() {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-build').addClass('active');
    // $('#bisect-content').hide();

    var errorReason = 'Defconfig data call failed.',
        defconfigData = {};

    if (defconfigId !== 'None') {
        defconfigData.id = defconfigId;
    } else {
        defconfigData.job = jobName;
        defconfigData.kernel = kernelName;
        defconfigData.defconfig_full = defconfigFull;
    }

    $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': defconfigData,
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            ajaxDefconfigCallFailed();
        },
        'timeout': 6000,
        'statusCode': {
            403: function() {
                setErrorAlert('boot-403-error', 403, errorReason);
            },
            404: function() {
                setErrorAlert('boot-404-error', 404, errorReason);
            },
            408: function() {
                errorReason = 'Defconfing data call failed: timeout.';
                setErrorAlert('boot-408-error', 408, errorReason);
            },
            500: function() {
                setErrorAlert('boot-500-error', 500, errorReason);
            }
        }
    }).done(populateDefconfigAndBoot);
});
