var fileServer = $('#file-server').val();
var boardName = $('#board-name').val();
var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();
var defconfigFull = $('#defconfig-full').val();

function populateBootPage(data) {
    'use strict';

    var localData = data.result,
        dataLen = localData.length,
        i = 0,
        allRows = '',
        col0,
        col1,
        col2,
        col3,
        col4,
        col5,
        rowHref,
        statusDisplay,
        createdOn,
        resultDescription,
        labName,
        arch,
        bootLog,
        bootLogHtml,
        fileServerUrl,
        fileServerResource,
        pathUrl = '',
        fileServerUri = null,
        uriPath = '';

    if (dataLen > 0) {
        for (i; i < dataLen; i = i + 1) {
            labName = localData[i].lab_name;
            createdOn = new Date(localData[i].created_on.$date);
            resultDescription = localData[i].boot_result_description;
            fileServerUrl = localData[i].file_server_url;
            fileServerResource = localData[i].file_server_resource;
            arch = localData[i].arch;
            bootLog = localData[i].boot_log;
            bootLogHtml = localData[i].boot_log_html;

            if (fileServerUrl !== null && fileServerUrl !== undefined) {
                fileServer = fileServerUrl;
            }

            if (fileServerResource !== null &&
                    fileServerResource !== undefined) {
                pathUrl = fileServerResource;
            } else {
                pathUrl = jobName + '/' + kernelName + '/' + arch + '-' +
                    defconfigFull + '/' + labName + '/';
            }

            fileServerUri = new URI(fileServer);
            uriPath = fileServerUri.path() + '/' + pathUrl;

            switch (localData[i].status) {
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

            col0 = '<td>' + labName + '</td>';
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
                '/lab/' + labName + '/?_id=' + localData[i]._id.$oid;

            col5 = '<td><span rel="tooltip" data-toggle="tooltip"' +
                'title="Details for board&nbsp;' + boardName + 'with&nbsp;' +
                jobName + '&dash;' + kernelName + '&dash;' + defconfigFull +
                '&nbsp;&dash;&nbsp;(' + labName + ')' +
                '"><a href="' + rowHref + '">' +
                '<i class="fa fa-search"></i></a></span></td>';

            allRows += '<tr data-url="' + rowHref + '">' +
                col0 + col1 + col2 + col3 + col4 + col5 + '</tr>';
        }

        $('#boot-reports-loading-div').remove();
        $('#boot-reports-table-body').empty().append(allRows);
        $('#multiple-labs-table')
            .removeClass('hidden')
            .fadeIn('slow', 'linear');
    } else {
        $('#other-reports-table-div')
            .empty()
            .addClass('pull-center')
            .append('<strong>No data available.</strong>');
    }
}

function ajaxCallFailed() {
    'use strict';

    var staticContent = '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Not available"><i class="fa fa-ban"></i>' +
        '</span>';
    JSBase.replaceContentByClass('.loading-content', staticContent);

    $('#other-reports-table-div')
        .empty()
        .addClass('pull-center')
        .append('<strong>Error loading data.</strong>');
}

$(document).ready(function() {
    'use strict';

    $('#li-boot').addClass('active');

    $('#dd-tree').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Boot details for&nbsp;' + jobName + '">' +
        '<a href="/boot/all/job/' + jobName + '">' + jobName +
        '</a></span>' +
        '&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Details for job&nbsp;' + jobName +
        '"><a href="/job/' + jobName +
        '"><i class="fa fa-sitemap"></i></a></span>'
    );
    $('#dd-git-describe').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Boot report details for&nbsp;' + jobName +
        '&nbsp;&dash;&nbsp;' +
        kernelName + '"><a href="/boot/all/job/' + jobName +
        '/kernel/' + kernelName + '">' + kernelName +
        '</a></span>' +
        '&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip" ' +
        'title="Details for build&nbsp;' + jobName +
        '&nbsp;&dash;&nbsp;' +
        kernelName + '"><a href="/build/' + jobName +
        '/kernel/' + kernelName +
        '"><i class="fa fa-cube"></i></a></span>'

    );
    $('#dd-defconfig').empty().append(
        defconfigFull + '&nbsp;&mdash;&nbsp;' +
        '<span rel="tooltip" data-toggle="tooltip"' +
        'title="Details for build&nbsp;' + jobName +
        '&nbsp;&dash;&nbsp;' + kernelName +
        '&nbsp;&dash;&nbsp;' + defconfigFull +
        '"><a href="/build/' + jobName + '/kernel/' +
        kernelName + '/defconfig/' + defconfigFull +
        '"><i class="fa fa-cube"></i></a></span>'
    );

    var errorReason = 'Boot reports data call failed',
        ajaxData,
        ajaxDeferredCall = null;

    ajaxData = {
        'board': boardName,
        'job': jobName,
        'kernel': kernelName,
        'defconfig_full': defconfigFull,
        'field': [
            '_id', 'status', 'created_on', 'lab_name', 'file_server_url',
            'file_server_resource', 'boot_log', 'boot_log_html',
            'boot_result_description', 'arch'
        ]
    };
    ajaxDeferredCall = JSBase.createDeferredCall(
        '/_ajax/boot',
        'GET',
        ajaxData,
        null,
        ajaxCallFailed,
        errorReason
    );

    $.when(ajaxDeferredCall).done(populateBootPage);
});
