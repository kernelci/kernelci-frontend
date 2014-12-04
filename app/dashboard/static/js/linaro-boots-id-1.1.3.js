var boardName = $('#board-name').val();
var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();
var defconfName = $('#defconfig-name').val();
var labName = $('#lab-name').val();
var bootId = $('#boot-id').val();
var fileServer = $('#file-server').val();

function populateOtherBootTable(data) {
    'use strict';

    var localData = data.result,
        localDataLen = localData.length,
        validReports = 0,
        i = 0,
        localReport = null,
        localLabName,
        createdOn,
        resultDescription,
        fileServerUrl,
        fileServerUri,
        fileServerResource,
        statusDisplay,
        pathUrl = '',
        uriPath = '',
        rowHref = '',
        defconfigFull,
        arch,
        bootLog,
        bootLogHtml,
        allRows = '',
        row = '',
        col0,
        col1,
        col2,
        col3,
        col4,
        col5;

    $('#boot-reports-loading-content')
        .empty()
        .append('analyzing boot reports data&hellip;');

    if (localDataLen > 0) {
        for (i; i < localDataLen; i = i + 1) {
            localReport = localData[i];
            localLabName = localReport.lab_name;

            if (localLabName !== labName) {
                validReports = validReports + 1;

                createdOn = new Date(localReport.created_on.$date);
                resultDescription = localReport.boot_result_description;
                fileServerUrl = localReport.file_server_url;
                fileServerResource = localReport.file_server_resource;
                arch = localReport.arch;
                bootLog = localReport.boot_log;
                bootLogHtml = localReport.boot_log_html;
                defconfigFull = localReport.defconfig_full;

                if (fileServerUrl !== null &&
                        typeof(fileServerUrl) !== 'undefined') {
                    fileServer = fileServerUrl;
                }

                if (fileServerResource !== null &&
                        typeof(fileServerResource) !== 'undefined') {
                    pathUrl = fileServerResource;
                } else {
                    pathUrl = jobName + '/' + kernelName + '/' + arch + '-' +
                        defconfigFull + '/' + localLabName + '/';
                }

                fileServerUri = new URI(fileServer);
                uriPath = fileServerUri.path() + '/' + pathUrl;

                switch (localReport.status) {
                    case 'PASS':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Boot completed"><span class="label ' +
                            'label-success"><i class="fa fa-check">' +
                            '</i></span></span>';
                        break;
                    case 'FAIL':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Boot failed">' +
                            '<span class="label label-danger">' +
                            '<i class="fa fa-exclamation-triangle"></i>' +
                            '</span></span>';
                        break;
                    case 'OFFLINE':
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Board offline" ' +
                            '<span class="label label-info">' +
                            '<i class="fa fa-power-off"></i></span></span>';
                        break;
                    default:
                        statusDisplay = '<span rel="tooltip" ' +
                            'data-toggle="tooltip"' +
                            'title="Unknown status"><span class="label ' +
                            'label-warning"><i class="fa fa-question"></i>' +
                            '</span></span>';
                        break;
                }

                col0 = '<td>' + localLabName + '</td>';
                if (resultDescription !== null) {
                    if (resultDescription.length > 64) {
                        col1 = '<td>' +
                            '<span rel="tooltip" data-toggle="tooltip"' +
                            'title="' + resultDescription + '">' +
                            resultDescription.slice(0, 65) + '&hellip;' +
                            '</span></td>';
                    } else {
                        col1 = '<td>' + resultDescription + '</td>';
                    }
                } else {
                    col1 = '<td>&nbsp;</td>';
                }

                col2 = '<td class="pull-center">';
                if (bootLog !== null || bootLogHtml !== null) {
                    if (bootLog !== null) {
                        col2 += '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="View raw text boot log"><a href="' +
                            fileServerUri.path(uriPath + '/' + bootLog)
                                .normalizePath().href() +
                            '">txt' +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></span>';
                    }

                    if (bootLogHtml !== null) {
                        if (bootLog !== null) {
                            col2 += '&nbsp;&mdash;&nbsp;';
                        }
                        col2 += '<span rel="tooltip" data-toggle="tooltip" ' +
                            'title="View HTML boot log"><a href="' +
                            fileServerUri.path(
                                    uriPath + '/' + bootLogHtml)
                                .normalizePath().href() +
                            '">html&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></span>';
                    }
                } else {
                    col2 += '&nbsp;';
                }
                col2 += '</td>';

                col3 = '<td class="pull-center">' +
                    createdOn.getCustomISODate() + '</td>';
                col4 = '<td class="pull-center">' + statusDisplay + '</td>';

                rowHref = '/boot/' + boardName + '/job/' + jobName +
                    '/kernel/' + kernelName + '/defconfig/' + defconfigFull +
                    '/lab/' + localLabName + '/?_id=' + localReport._id.$oid;

                col5 = '<td><span rel="tooltip" data-toggle="tooltip"' +
                    'title="Details for board&nbsp;' + boardName +
                    'with&nbsp;' +
                    jobName + '&dash;' + kernelName + '&dash;' +
                    defconfigFull +
                    '&nbsp;&dash;&nbsp;(' + localLabName + ')' +
                    '"><a href="' + rowHref + '">' +
                    '<i class="fa fa-search"></i></a></span></td>';

                allRows += '<tr data-url="' + rowHref + '">' +
                    col0 + col1 + col2 + col3 + col4 + col5 + '</tr>';
            }
        }

        if (validReports === 0) {
            $('#other-reports-table-div')
                .empty()
                .addClass('pull-center')
                .append(
                    '<strong>No similar boot reports found.</strong>'
                );
        } else {
            $('#boot-reports-loading-div').remove();
            $('#boot-reports-table-body').empty().append(allRows);
            $('#multiple-labs-table')
                .removeClass('hidden')
                .fadeIn('slow', 'linear');
        }
    } else {
        $('#other-reports-table-div')
            .empty()
            .addClass('pull-center')
            .append('<strong>No data available.</strong>');
    }
}

function populatePage(data) {
    'use strict';

    var localData = data.result[0],
        bootTime,
        displ = '',
        job,
        kernel,
        defconfig,
        arch,
        defconfigFull,
        localLabName,
        fileServer = $('#file-server').val(),
        fileServerUri = null,
        fileServerUrl = null,
        fileServerResource = null,
        pathUrl = null,
        uriPath = null,
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>';

    bootTime = new Date(localData.time.$date);

    job = localData.job;
    kernel = localData.kernel;
    defconfig = localData.defconfig;
    defconfigFull = localData.defconfig_full;
    arch = localData.arch;
    localLabName = localData.lab_name;
    fileServerUrl = localData.file_server_url;
    fileServerResource = localData.file_server_resource;

    $('#dd-board-board').empty().append(localData.board);
    $('#dd-board-arch').empty().append(arch);

    $('#dd-board-defconfig').empty().append(
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Boot reports for&nbsp;' + boardName +
        '&nbsp;&dash;&nbsp;' + jobName +
        '&nbsp;&dash;&nbsp;' + kernelName +
        '&nbsp;&dash;&nbsp;' + defconfigFull + '">' +
        '<a href="/boot/' + boardName + '/job/' + jobName + '/kernel/' +
        kernelName + '/defconfig/' + defconfigFull + '">' +
        defconfigFull + '</a></span>' +
        '&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Details for build&nbsp;' + job +
        '&nbsp;&dash;&nbsp;' + kernel +
        '&nbsp;&dash;&nbsp;' + defconfigFull +
        '"><a href="/build/' + job + '/kernel/' +
        kernel + '/defconfig/' + defconfigFull +
        '"><i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-kernel').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot reports for&nbsp;' + job +
            '&nbsp;&dash;&nbsp;' +
            kernel + '"><a href="/boot/all/job/' + job +
            '/kernel/' + kernel + '">' + kernel +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + job +
            '&nbsp;&dash;&nbsp;' +
            kernel + '"><a href="/build/' + job +
            '/kernel/' + kernel +
            '"><i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-tree').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + job + '">' +
            '<a href="/boot/all/job/' + job + '">' + job +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + job +
            '"><a href="/job/' + job +
            '"><i class="fa fa-sitemap"></i></a></span>'
    );

    if (localData.endian !== null) {
        $('#dd-board-endianness').empty().append(localData.endian);
    } else {
        $('#dd-board-endianness').empty().append(nonAvail);
    }

    if (fileServerUrl !== null &&
            typeof(fileServerUrl) !== 'undefined') {
        fileServer = fileServerUrl;
    }

    if (fileServerResource !== null &&
            typeof(fileServerResource) !== 'undefined') {
        pathUrl = fileServerResource;
    } else {
        pathUrl = job + '/' + kernel + '/' +
            arch + '-' + defconfigFull + '/';
    }

    fileServerUri = new URI(fileServer);
    uriPath = fileServerUri.path() + '/' + pathUrl;

    if (localData.boot_log !== null || localData.boot_log_html !== null) {
        $('#dd-board-boot-log').empty();

        if (localData.boot_log !== null) {
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View raw text boot log"><a href="' +
                fileServerUri.path(uriPath + '/' +
                    localLabName + '/' + localData.boot_log)
                    .normalizePath().href() +
                '">txt' +
                '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }

        if (localData.boot_log_html !== null) {
            if (localData.boot_log !== null) {
                $('#dd-board-boot-log').append('&nbsp;&mdash;&nbsp;');
            }
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View HTML boot log"><a href="' +
                fileServerUri.path(uriPath + '/' +
                    localLabName + '/' + localData.boot_log_html)
                    .normalizePath().href() +
                '">html&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }
    } else {
        $('#dd-board-boot-log').empty().append(nonAvail);
    }

    switch (localData.status) {
        case 'PASS':
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Boot completed"><span class="label ' +
                    'label-success"><i class="fa fa-check">' +
                    '</i></span></span>';
            break;
        case 'FAIL':
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Boot failed"><span class="label label-danger">' +
                    '<i class="fa fa-exclamation-triangle"></i>' +
                    '</span></span>';
            break;
        case 'OFFLINE':
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Board offline" <span class="label label-info">' +
                '<i class="fa fa-power-off"></i></span></span>';
            break;
        default:
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Unknown status"><span class="label ' +
                    'label-warning"><i class="fa fa-question"></i>' +
                    '</span></span>';
            break;
    }

    if (localData.boot_result_description !== null) {
        displ += '&nbsp;<small>' + localData.boot_result_description +
            '</small>';
    }

    $('#dd-board-status').empty().append(displ);
    $('#dd-board-boot-time').empty().append(bootTime.getCustomTime());

    if (localData.warnings !== null) {
        $('#dd-board-warnings').empty().append(localData.warnings);
    } else {
        $('#dd-board-warnings').empty().append(0);
    }

    if (localData.dtb !== null && localData.dtb !== '') {
        $('#dd-board-dtb').empty().append(
            '<a href="' +
            fileServerUri.path(uriPath + '/' + localData.dtb)
                .normalizePath().href() +
            '">' + localData.dtb +
            '&nbsp;<i class="fa fa-external-link"></i></a>');
    } else {
        $('#dd-board-dtb').empty().append(nonAvail);
    }

    if (localData.dtb_addr !== null && localData.dtb_addr !== '') {
        $('#dd-board-dtb-address').empty().append(localData.dtb_addr);
    } else {
        $('#dd-board-dtb-address').empty().append(nonAvail);
    }

    if (localData.initrd_addr !== null && localData.initrd_addr !== '') {
        $('#dd-board-initrd-address').empty().append(localData.initrd_addr);
    } else {
        $('#dd-board-initrd-address').empty().append(nonAvail);
    }

    if (localData.load_addr !== null && localData.load_addr !== '') {
        $('#dd-board-load-address').empty().append(localData.load_addr);
    } else {
        $('#dd-board-load-address').empty().append(nonAvail);
    }

    if (localData.kernel_image !== null && localData.kernel_image !== '') {
        $('#dd-board-kernel-image').empty().append(
            '<a href="' +
            fileServerUri.path(uriPath + '/' + localData.kernel_image)
                .normalizePath().href() +
            '">' + localData.kernel_image +
            '&nbsp;<i class="fa fa-external-link"></i></a>');
    } else {
        $('#dd-board-kernel-image').empty().append(nonAvail);
    }
}

function createBootBisectTable(data) {
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
        bootStatus,
        tableRows,
        tooltipLink,
        tooltipTitle,
        gitURLs,
        gitDescribeVal,
        badCommit = null,
        goodCommit = null;

    badCommit = localResult.bad_commit;
    goodCommit = localResult.good_commit;

    for (i; i < localLen; i++) {
        bisectData = localData[i];
        bootStatus = bisectData.boot_status;
        gitDescribeVal = bisectData.git_describe;

        tooltipLink = '<a href="/boot/all/job/' + jobName +
            '/kernel/' + gitDescribeVal + '">' +
            gitDescribeVal + '</a>';

        tooltipTitle = 'Boot report details for&nbsp;' + jobName +
            '&nbsp;&dash;&nbsp;' + gitDescribeVal;

        gitDescribeCell = '<td><span class="bisect-tooltip">' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="' + tooltipTitle + '">' +
            '<span class="bisect-text">' + tooltipLink +
            '</span></span></span></td>';

        gitURLs = JSBase.translateCommitURL(
            bisectData.git_url, bisectData.git_commit);

        switch (bootStatus) {
            case 'PASS':
                goodCommitCell = '<td class="bg-success"><a href="' +
                    gitURLs[1] + '">' + bisectData.git_commit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            case 'FAIL':
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"><a href="' +
                    gitURLs[1] + '">' + bisectData.git_commit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            default:
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"><a href="' +
                    gitURLs[1] + '">' + bisectData.git_commit +
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
            'title="Download boot bisect script">' +
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

function bisectAjaxCallFailed(data) {
    'use strict';
    $('#bisect-loading-div').remove();
    $('#bisect-content')
        .removeClass('hidden')
        .empty()
        .append('<strong>Error loading bisect data from server.</strong>')
        .addClass('pull-center');
}

function getBisectData(data) {
    'use strict';

    var localData = data.result[0],
        status = localData.status,
        docId,
        bisectAjaxCall,
        errorReason;

    errorReason = 'Bisect data call failed';

    if (status === 'FAIL') {
        $('#bisect-div').removeClass('hidden');
        if (bootId === 'None') {
            bootId = data.result[0]._id.$oid;
        }

        bisectAjaxCall = JSBase.createDeferredCall(
            '/_ajax/bisect/boot/' + bootId,
            'GET',
            null,
            null,
            bisectAjaxCallFailed,
            errorReason,
            null,
            'bisect-call'
        );

        $.when(bisectAjaxCall).done(createBootBisectTable);
    } else {
        $('#bisect-div').remove();
    }
}

function multipleBootReportsFailed() {
    'use strict';
    $('#other-reports-table-div')
        .empty()
        .addClass('pull-center')
        .append('<strong>Error loading data.</strong>');
}

function bootIdAjaxFailed() {
    'use strict';

    $('.loading-content').each(function() {
        $(this).empty().append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>'
        );
    });
}

$(document).ready(function() {
    'use strict';

    $('#li-boot').addClass('active');

    var errorReason = 'Boot data call failed',
        data = {},
        multiLabData = {},
        deferredAjaxCall;

    if (bootId !== 'None') {
        data.id = bootId;
    } else {
        data.kernel = kernelName;
        data.job = jobName;
        data.defconfig_full = defconfName;
        data.lab = labName;
        data.board = boardName;
    }

    multiLabData.kernel = kernelName;
    multiLabData.job = jobName;
    multiLabData.defconfig_full = defconfName;
    multiLabData.board = boardName;
    multiLabData.field = [
        '_id', 'lab_name', 'boot_log', 'boot_log_html',
        'boot_result_description', 'defconfig', 'defconfig_full',
        'created_on', 'status', 'arch'
    ];

    deferredAjaxCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        data,
        null,
        bootIdAjaxFailed,
        errorReason
    );

    $.when(deferredAjaxCall).done(populatePage, getBisectData);

    deferredAjaxCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        multiLabData,
        null,
        multipleBootReportsFailed,
        errorReason,
        null,
        'multilab'
    );

    $.when(deferredAjaxCall).done(populateOtherBootTable);
});
