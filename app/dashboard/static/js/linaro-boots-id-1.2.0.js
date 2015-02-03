var boardName = $('#board-name').val();
var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();
var defconfName = $('#defconfig-name').val();
var labName = $('#lab-name').val();
var bootId = $('#boot-id').val();
var fileServer = $('#file-server').val();
var dateRange = $('#date-range').val();

function createBootTableRow(data) {
    'use strict';
    var createdOn = new Date(data.created_on.$date),
        resultDescription = data.boot_result_description,
        fileServerUrl = data.file_server_url,
        fileServerResource = data.file_server_resource,
        arch = data.arch,
        bootLog = data.boot_log,
        bootLogHtml = data.boot_log_html,
        defconfigFull = data.defconfig_full,
        lab = data.lab_name,
        job = data.job,
        kernel = data.kernel,
        statusDisplay = '',
        pathUrl = null,
        uriPath = null,
        logPath = null,
        fileServerUri = null,
        rowHref = '',
        col0,
        col1,
        col2,
        col3,
        col4,
        col5;

    if (fileServerUrl !== null && fileServerUrl !== undefined) {
        fileServer = fileServerUrl;
    }

    if (fileServerResource !== null &&
            fileServerResource !== undefined) {
        pathUrl = fileServerResource;
    } else {
        pathUrl = job + '/' + kernel + '/' + arch + '-' +
            defconfigFull + '/';
        fileServerResource = null;
    }

    fileServerUri = new URI(fileServer);
    uriPath = fileServerUri.path() + '/' + pathUrl;

    switch (data.status) {
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

    col0 = '<td>' + lab + '</td>';
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
            if (bootLog.search(lab) === -1) {
                logPath = uriPath + '/' + lab + '/' +
                    bootLog;
            } else {
                logPath = uriPath + '/' + bootLog;
            }
            col2 += '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View raw text boot log"><a href="' +
                fileServerUri.path(logPath)
                    .normalizePath().href() +
                '">txt' +
                '&nbsp;<i class="fa fa-external-link">' +
                '</i></a></span>';
        }

        if (bootLogHtml !== null) {
            if (bootLog !== null) {
                col2 += '&nbsp;&mdash;&nbsp;';
            }
            if (bootLogHtml.search(lab) === -1) {
                logPath = uriPath + '/' + lab + '/' +
                    bootLogHtml;
            } else {
                logPath = uriPath + '/' + bootLogHtml;
            }
            col2 += '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View HTML boot log"><a href="' +
                fileServerUri.path(logPath)
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

    rowHref = '/boot/' + boardName + '/job/' + job +
        '/kernel/' + kernel + '/defconfig/' + defconfigFull +
        '/lab/' + lab + '/?_id=' + data._id.$oid;

    col5 = '<td><span rel="tooltip" data-toggle="tooltip"' +
        'title="Details for board&nbsp;' + boardName +
        'with&nbsp;' +
        job + '&dash;' + kernel + '&dash;' +
        defconfigFull +
        '&nbsp;&dash;&nbsp;(' + lab + ')' +
        '"><a href="' + rowHref + '">' +
        '<i class="fa fa-search"></i></a></span></td>';

    return '<tr data-url="' + rowHref + '">' +
        col0 + col1 + col2 + col3 + col4 + col5 + '</tr>';
}

function populateCompareTables(data, tableId, tableBodyId) {
    'use strict';
    var localData = data.result,
        dataLen = localData.length,
        i = 0,
        rows = '',
        tableBody = $(tableBodyId),
        table = $(tableId);

    if (dataLen > 0) {
        for (i; i < dataLen; i = i + 1) {
            rows += createBootTableRow(localData[i]);
        }
        tableBody.empty().append(rows);
        table.removeClass('hidden').fadeIn('slow', 'linear');
    } else {
        tableBody.empty()
            .append(
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No recent results found.</strong>' +
                '</td></tr>');
        table.removeClass('hidden').fadeIn('slow', 'linear');
    }
}

function compareToMainlineFailed() {
    'use strict';
    $('#compare-to-mainline-div').empty().append(
        '<div class="pull-center"><p>' +
        '<strong>Error comparing with mainline.</strong>' +
        '</p></div>');
}

function populateCompareToMainline(data) {
    'use strict';
    populateCompareTables(
        data, '#compare-to-mainline-table', '#compare-to-mainline-table-body');
}

function compareToNextFailed() {
    'use strict';
    $('#compare-to-next-div').empty().append(
        '<div class="pull-center"><p>' +
        '<strong>Error comparing with mainline.</strong>' +
        '</p></div>');
}

function populateCompareToNext(data) {
    'use strict';
    populateCompareTables(
        data, '#compare-to-next-table', '#compare-to-next-table-body');
}

function populateOtherBootTable(data) {
    'use strict';
    var localData = data.result,
        localDataLen = localData.length,
        validReports = 0,
        i = 0,
        localReport = null,
        localLabName,
        allRows = '',
        loadingDiv = $('#boot-reports-loading-div'),
        tableBody = $('#boot-reports-table-body');

    loadingDiv.empty()
        .append(
            '<i class="fa fa-cog fa-spin fa-2x"></i>&nbsp;' +
            '<span>analyzing boot reports data&hellip;</span>');

    if (localDataLen > 0) {
        for (i; i < localDataLen; i = i + 1) {
            localReport = localData[i];
            localLabName = localReport.lab_name;

            if (localLabName !== labName) {
                validReports = validReports + 1;
                allRows += createBootTableRow(localReport);
            }
        }

        if (validReports === 0) {
            tableBody.empty()
                .append(
                    '<tr><td colspan="6" class="pull-center">' +
                    '<strong>No similar boot reports found.</strong>' +
                    '</td></tr>');
        } else {
            tableBody.empty().append(allRows);
        }
    } else {
        tableBody.empty()
            .append(
                '<tr><td colspan="6" class="pull-center">' +
                '<strong>No data available.</strong>' +
                '</td></tr>');
    }

    loadingDiv.remove();
    $('#multiple-labs-table')
        .removeClass('hidden')
        .fadeIn('slow', 'linear');
}

function populatePage(data) {
    'use strict';
    var localData = data.result[0],
        bootTime,
        displ = '',
        job,
        kernel,
        arch,
        defconfigFull,
        localLabName,
        localBoard,
        fileServer = $('#file-server').val(),
        fileServerUri = null,
        fileServerUrl = null,
        fileServerResource = null,
        pathUrl = null,
        uriPath = null,
        logPath = null,
        createdOn = null,
        bootLog,
        bootLogHtml,
        status,
        retries,
        otherDetails = null,
        otherDetailsTxt = '',
        otherTxt = '',
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>';

    bootTime = new Date(localData.time.$date);

    localBoard = localData.board;
    job = localData.job;
    kernel = localData.kernel;
    defconfigFull = localData.defconfig_full;
    arch = localData.arch;
    localLabName = localData.lab_name;
    fileServerUrl = localData.file_server_url;
    fileServerResource = localData.file_server_resource;
    bootLog = localData.boot_log;
    bootLogHtml = localData.boot_log_html;
    createdOn = new Date(localData.created_on.$date);
    status = localData.status;
    retries = localData.retries;

    $('#dd-date').empty().append(createdOn.getCustomISODate());

    $('#dd-retries').empty().append(
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="How many times the boot has been attempted">' +
        retries + '</span>');

    $('#dd-lab-name').empty().append(
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="All boot reports for lab&nbsp;&#171;' + localLabName +
        '&#187;">' +
        '<a href="/boot/all/lab/' + localLabName + '/">' + localLabName +
        '&nbsp;<i class="fa fa-search"></i></a></span>');

    $('#dd-board-board').empty().append(
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="All boot reports for board&nbsp;&#171;' + localBoard +
        '&#187;"><a href="/boot/' + localBoard + '/">' + localBoard +
        '&nbsp;<i class="fa fa-search"></i></a></span>');

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

    if (fileServerUrl !== null && fileServerUrl !== undefined) {
        fileServer = fileServerUrl;
    }

    if (fileServerResource !== null && fileServerResource !== undefined) {
        pathUrl = fileServerResource;
    } else {
        pathUrl = job + '/' + kernel + '/' + arch + '-' +
            defconfigFull + '/';
        fileServerResource = null;
    }

    fileServerUri = new URI(fileServer);
    uriPath = fileServerUri.path() + '/' + pathUrl;

    if (bootLog !== null || bootLogHtml !== null) {
        $('#dd-board-boot-log').empty();

        if (bootLog !== null) {
            if (bootLog.search(localLabName) === -1) {
                logPath = uriPath + '/' + localLabName + '/' + bootLog;
            } else {
                logPath = uriPath + '/' + bootLog;
            }
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View raw text boot log"><a href="' +
                fileServerUri.path(logPath).normalizePath().href() +
                '">txt' +
                '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }

        if (bootLogHtml !== null) {
            if (bootLog !== null) {
                $('#dd-board-boot-log').append('&nbsp;&mdash;&nbsp;');
            }
            if (bootLogHtml.search(localLabName) === -1) {
                logPath = uriPath + '/' + localLabName + '/' + bootLogHtml;
            } else {
                logPath = uriPath + '/' + bootLogHtml;
            }
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View HTML boot log"><a href="' +
                fileServerUri.path(logPath).normalizePath().href() +
                '">html&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }
    } else {
        $('#dd-board-boot-log').empty().append(nonAvail);
    }

    switch (status) {
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

    if (localData.boot_result_description !== null && status !== 'PASS') {
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

    otherDetails = $('#other-details-div');
    if (localData.qemu !== null && localData.qemu !== '') {
        otherTxt = '';
        otherDetailsTxt = '<div id="qemu-details" class="row">' +
            '<div class="page-header"><h4>Qemu details</h4></div>' +
            '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
        if (localData.qemu_command !== null && localData.qemu_command !== '') {
            otherTxt = '<dt>Command</dt><dd>';
            if (localData.qemu_command.length > 99) {
                otherTxt += '<span class="command">' +
                    localData.qemu_command.slice(0, 99).trimRight() +
                    '&hellip;</span>&nbsp;' +
                    '<span class="pointer details" ' +
                    'rel="tooltip" data-toggle="tooltip" ' +
                    'title="View full qemu command"> ' +
                    '<i class="fa fa-eye" ' +
                    'data-toggle="modal" ' +
                    'data-target="#qemu-command"></i></span>';
                otherDetailsTxt += JSBase.createLargeModalDialog(
                    'qemu-command',
                    'Qemu Command Line',
                    '<div class="row"><p><span class="command">' +
                        localData.qemu_command +
                        '</p></span></div>');
            } else {
                otherTxt += '<span class="command">' + localData.qemu_command +
                    '</span></dd>';
            }
        }
        otherDetailsTxt += '<dl class="dl-horizontal">' +
            '<dt>Binary</dt><dd>' + localData.qemu + '</dd>' +
            otherTxt +
            '</dl></div></div>';
        otherDetails.append(otherDetailsTxt);
        otherDetails.removeClass('hidden');
    }
}

function bisectCompareToAjaxCallFailed() {
    'use strict';
    $('#bisect-compare-loading-div').remove();
    $('#bisect-compare-content')
        .removeClass('hidden')
        .empty()
        .append('<strong>Error loading bisect data from server.</strong>')
        .addClass('pull-center');
}

function bisectComparedToMainline(data) {
    'use strict';
    var bisectData = data.result[0],
        bootId,
        ajaxDeferredCall,
        bisectElements = null,
        errorReason = 'Error loading bisect data compared to mainline';

    if (bisectData.job !== 'mainline') {
        $('#bisect-compare-div').removeClass('hidden');
        bootId = bisectData.boot_id.$oid;
        ajaxDeferredCall = JSBase.createDeferredCall(
            '/_ajax/bisect?collection=boot&compare_to=mainline&' +
                'boot_id=' + bootId,
            'GET',
            null,
            null,
            bisectCompareToAjaxCallFailed,
            errorReason,
            null,
            'bisect-call-compare-to'
        );

        bisectElements = {
            showHideID: '#bootb-compare-showhide',
            tableDivID: '#table-compare-div',
            tableID: '#bisect-compare-table',
            tableBodyID: '#bisect-compare-table-body',
            contentDivID: '#bisect-compare-content',
            loadingDivID: '#bisect-compare-loading-div',
            loadingContentID: '#bisect-compare-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: null,
            goodCommitID: null,
            bisectScriptContainerID: '#dl-bisect-compare-script',
            bisectScriptContentID: '#bisect-compare-script',
            bisectCompareDescriptionID: '#bisect-compare-description',
            prevBisect: bisectData
        };

        $.when(ajaxDeferredCall).done(function(data) {
            Bisect.initBisect(
                data,
                bisectElements,
                true
            );
        });
    } else {
        JSBase.removeElementByID('#bisect-compare-div');
    }
}

function bisectAjaxCallFailed() {
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
        bisectElements = null,
        bisectAjaxCall,
        errorReason;

    errorReason = 'Bisect data call failed';

    if (status === 'FAIL') {
        $('#bisect-div').removeClass('hidden');
        if (bootId === 'None') {
            bootId = data.result[0]._id.$oid;
        }

        bisectAjaxCall = JSBase.createDeferredCall(
            '/_ajax/bisect?collection=boot&boot_id=' + bootId,
            'GET',
            null,
            null,
            bisectAjaxCallFailed,
            errorReason,
            null,
            'bisect-call'
        );

        bisectElements = {
            showHideID: '#bootb-showhide',
            tableDivID: '#table-div',
            tableID: '#bisect-table',
            tableBodyID: '#bisect-table-body',
            contentDivID: '#bisect-content',
            loadingDivID: '#bisect-loading-div',
            loadingContentID: '#bisect-loading-content',
            loadingContentText: 'loading bisect data&hellip;',
            badCommitID: '#bad-commit',
            goodCommitID: '#good-commit',
            bisectScriptContainerID: '#dl-bisect-script',
            bisectScriptContentID: '#bisect-script',
            bisectCompareDescriptionID: null,
            prevBisect: null
        };

        $.when(bisectAjaxCall)
            .done(bisectComparedToMainline)
            .done(function(data) {
                Bisect.initBisect(
                    data,
                    bisectElements,
                    false
                );
            });
    } else {
        $('#bisect-div').remove();
    }
}

function removeCompareToLoadingContent() {
    'use strict';
    $('#boot-reports-compared-to-load').remove();
}

function compareToOtherTrees(data) {
    'use strict';
    $('#boot-reports-compared-to-load').empty().append(
        '<i class="fa fa-cog fa-spin fa-2x"></i>&nbsp;' +
        '<span id="boot-reports-loading-content">' +
        'searching for similar boot reports&hellip;</span>'
    );

    var ajaxData = null,
        ajaxDeferredCall = null,
        errorReason = '',
        localData = data.result,
        dataLen = localData.length,
        createdOn = null;

    if (dataLen > 0) {
        createdOn = new Date(localData[0].created_on.$date);
        ajaxData = {
            'created_on': createdOn.getCustomISODate(),
            'board': boardName,
            'date_range': dateRange,
            'sort': 'created_on',
            'defconfig_full': defconfName,
            'sort_order': -1,
            'limit': 3
        };
    }

    // Execute the comparison with mainline if it is not mainline.
    if (jobName !== 'mainline') {
        errorReason = 'Retrieving compare data ' +
            'with &#171;mainline&#187; failed';

        ajaxData.job = 'mainline';
        ajaxDeferredCall = JSBase.createDeferredCall(
            '/_ajax/boot',
            'GET',
            ajaxData,
            null,
            compareToMainlineFailed,
            errorReason,
            null,
            'compare-to-mainline'
        );

        $.when(ajaxDeferredCall)
            .done(populateCompareToMainline, removeCompareToLoadingContent);
    } else {
        $('#compare-to-mainline-div').remove();
    }

    if (jobName !== 'next' && dataLen === 1) {
        errorReason = 'Retrieving compare data ' +
            'with &#171;next&#187; failed';

        ajaxData.job = 'next';
        ajaxDeferredCall = JSBase.createDeferredCall(
            '/_ajax/boot',
            'GET',
            ajaxData,
            null,
            compareToNextFailed,
            errorReason,
            null,
            'compare-to-next'
        );

        $.when(ajaxDeferredCall)
            .done(populateCompareToNext, removeCompareToLoadingContent);
    } else {
        $('#compare-to-next-div').remove();
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

    JSBase.replaceContentByClass(
        '.loading-content',
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>'
    );
}

$(document).ready(function() {
    'use strict';
    $('#li-boot').addClass('active');

    var errorReason = 'Boot data call failed',
        ajaxData = {},
        multiLabData = {},
        deferredAjaxCall;

    if (bootId !== 'None') {
        ajaxData.id = bootId;
    } else {
        ajaxData.kernel = kernelName;
        ajaxData.job = jobName;
        ajaxData.defconfig_full = defconfName;
        ajaxData.lab = labName;
        ajaxData.board = boardName;
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
        ajaxData,
        null,
        bootIdAjaxFailed,
        errorReason
    );

    $.when(deferredAjaxCall)
        .done(populatePage, getBisectData, compareToOtherTrees);

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
