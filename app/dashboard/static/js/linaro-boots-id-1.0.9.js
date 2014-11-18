var boardId = $('#board-id').val();
var jobId = $('#job-id').val();
var kernelId = $('#kernel-id').val();
var defconfId = $('#defconfig-id').val();
var labName = $('#lab-name').val();
var bootId = $('#boot-id').val();

function populatePage(data) {
    'use strict';

    var localData = data.result[0],
        bootTime,
        displ = '',
        fileServer = $('#file-server').val(),
        metadata,
        nonAvail = '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>';

    bootTime = new Date(localData.time['$date']);
    metadata = localData.metadata;

    $('#dd-board-board').empty().append(localData.board);
    $('#dd-board-defconfig').empty().append(
        localData.defconfig + '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for build&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' + localData.kernel +
            '&nbsp;&dash;&nbsp;' + localData.defconfig +
            '"><a href="/build/' + localData.job + '/kernel/' +
            localData.kernel + '/defconfig/' + localData.defconfig +
            '"><i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-kernel').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot report details for&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' +
            localData.kernel + '"><a href="/boot/all/job/' + localData.job +
            '/kernel/' + localData.kernel + '">' + localData.kernel +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' +
            localData.kernel + '"><a href="/build/' + localData.job +
            '/kernel/' + localData.kernel +
            '"><i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-tree').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + localData.job + '">' +
            '<a href="/boot/all/job/' + localData.job + '">' + localData.job +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + localData.job +
            '"><a href="/job/' + localData.job +
            '"><i class="fa fa-sitemap"></i></a></span>'
    );

    if (localData.endian !== null) {
        $('#dd-board-endianness').empty().append(localData.endian);
    } else {
        $('#dd-board-endianness').empty().append(nonAvail);
    }

    if (localData.boot_log !== null || localData.boot_log_html !== null) {
        $('#dd-board-boot-log').empty();

        if (localData.boot_log !== null) {
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View raw text boot log"><a href="' + fileServer +
                localData.job + '/' + localData.kernel + '/' +
                localData.defconfig + '/' + localData.boot_log + '">txt' +
                '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }

        if (localData.boot_log_html !== null) {
            if (localData.boot_log !== null) {
                $('#dd-board-boot-log').append('&nbsp;&mdash;&nbsp;');
            }
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="View HTML boot log"><a href="' + fileServer +
                localData.job + '/' + localData.kernel + '/' +
                localData.defconfig + '/' + localData.boot_log_html +
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
        $('#dd-board-dtb').empty().append(localData.dtb);
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
        $('#dd-board-kernel-image').empty().append(localData.kernel_image);
    } else {
        $('#dd-board-kernel-image').empty().append(nonAvail);
    }
}

function createBisectScriptURI(badCommit, goodCommit) {
    'use strict';
    var bisectScript = '#!/bin/bash\n' +
        'git bisect start ' + badCommit + ' ' + goodCommit + '\n';

    return 'data:text/plain;charset=UTF-8,' + encodeURIComponent(bisectScript);
}

function createBootBisectTable(data) {
    'use strict';
    $('#loading-content').empty().append('loading bisect data&hellip;');

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
        bisectDefMetadata,
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
        bisectDefMetadata = bisectData.defconfig_metadata;
        gitDescribeVal = bisectDefMetadata.git_describe;

        tooltipLink = '<a href="/boot/all/job/' + jobId +
            '/kernel/' + gitDescribeVal + '">' +
            gitDescribeVal + '</a>';

        tooltipTitle = 'Boot report details for&nbsp;' + jobId +
            '&nbsp;&dash;&nbsp;' + gitDescribeVal;

        gitDescribeCell = '<td><span class="bisect-tooltip">' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="' + tooltipTitle + '">' +
            '<span class="bisect-text">' + tooltipLink +
            '</span></span></span></td>';

        gitURLs = translateCommitURL(
            bisectDefMetadata.git_url, bisectDefMetadata.git_commit);

        switch (bootStatus) {
            case 'PASS':
                goodCommitCell = '<td class="bg-success"><a href="' +
                    gitURLs[1] + '">' + bisectDefMetadata.git_commit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            case 'FAIL':
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"><a href="' +
                    gitURLs[1] + '">' + bisectDefMetadata.git_commit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                unknownCommitCell = '<td class="bg-warning"></td>';
                break;
            default:
                goodCommitCell = '<td class="bg-success"></td>';
                badCommitCell = '<td class="bg-danger"></td>';
                unknownCommitCell = '<td class="bg-warning"><a href="' +
                    gitURLs[1] + '">' + bisectDefMetadata.git_commit +
                    '&nbsp;<i class="fa fa-external-link"></i></a></td>';
                break;
        }

        tableRows += '<tr>' + gitDescribeCell + badCommitCell +
            unknownCommitCell + goodCommitCell + '</tr>';
    }

    $('#loading-div').remove();
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
    $('#boot-bisect-table-body').empty().append(tableRows);
    $('#bisect-content').fadeIn('slow', 'linear');
}

function bisectAjaxCallFailed(data) {
    'use strict';
    $('#loading-div').remove();
    $('#loading-content').empty().append(
        '<h4>Error loading bisect data from server.</h4>'
    );
}

function getBisectData(data) {
    'use strict';

    var localData = data.result[0],
        status = localData.status,
        docId,
        bisectAjaxCall,
        errorReason;

    errorReason = 'Bisect data call failed.';

    if (status === 'FAIL') {
        $('#bisect-div').removeClass('hidden');
        docId = boardId + '-' + jobId + '-' + kernelId + '-' + defconfId;

        bisectAjaxCall = $.ajax({
            'url': '/_ajax/bisect/boot/' + docId,
            'traditional': true,
            'cache': true,
            'dataType': 'json',
            'beforeSend': function(jqXHR) {
                setXhrHeader(jqXHR);
            },
            'timeout': 8000,
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

        $.when(bisectAjaxCall).done(createBootBisectTable);
    } else {
        $('#bisect-div').remove();
    }
}

$(document).ready(function() {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-boot').addClass('active');
    $('#bisect-content').hide();

    var errorReason = 'Data call failed.',
        data = {};

    if (bootId !== 'None') {
        data.id = bootId;
    } else {
        data.kernel = kernelId;
        data.job = jobId;
        data.defconfig = defconfId;
        data.lab = labName;
        data.board = boardId;
    }

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': data,
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'statusCode': {
            400: function() {
                loadContent(
                    '#container-content', '/static/html/400-content.html'
                );
                setErrorAlert('data-400-error', 400, errorReason);
            },
            404: function() {
                loadContent(
                    '#container-content', '/static/html/404-content.html'
                );
                setErrorAlert('data-404-error', 404, errorReason);
            },
            408: function() {
                loadContent(
                    '#container-content', '/static/html/408-content.html'
                );
                setErrorAlert('data-408-error', 408, errorReason);
            },
            500: function() {
                loadContent(
                    '#container-content', '/static/html/500-content.html'
                );
                setErrorAlert('data-500-error', 500, errorReason);
            }
        }
    }).done(function(data) {
        populatePage(data);
        getBisectData(data);
    });
});
