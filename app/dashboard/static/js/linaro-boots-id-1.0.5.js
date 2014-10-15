function populatePage (data) {
    'use strict';

    var localData = data.result[0],
        boot_time = new Date(localData.time['$date']),
        displ = '',
        file_server = $('#file-server').val(),
        metadata,
        non_avail = '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Not available"><i class="fa fa-ban"></i>' +
            '</span>';

    metadata = localData.metadata;

    $('#dd-board-board').empty().append(localData.board);
    $('#dd-board-defconfig').empty().append(
        localData.defconfig + '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip"' +
            'title="Details for build&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' + localData.kernel +
            '&nbsp;&dash;&nbsp;' + localData.defconfig +
            '"><a href="/build/' + localData.job + '/kernel/' + localData.kernel +
            '/defconfig/' + localData.defconfig + '">' +
            '<i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-kernel').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot report details for&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' +
            localData.kernel + '"><a href="/boot/all/job/' + localData.job + '/kernel/' +
            localData.kernel + '">' + localData.kernel +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for build&nbsp;' + localData.job +
            '&nbsp;&dash;&nbsp;' +
            localData.kernel + '"><a href="/build/' + localData.job + '/kernel/' +
            localData.kernel + '"><i class="fa fa-cube"></i></a></span>'
    );
    $('#dd-board-tree').empty().append(
        '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Boot details for&nbsp;' + localData.job + '">' +
            '<a href="/boot/all/job/' + localData.job + '">' + localData.job +
            '</a></span>' +
            '&nbsp;&mdash;&nbsp;' +
            '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Details for job&nbsp;' + localData.job + '"><a href="/job/' +
            localData.job + '"><i class="fa fa-sitemap"></i></a></span>'
    );

    if (localData.endian !== null) {
        $('#dd-board-endianness').empty().append(localData.endian);
    } else {
        $('#dd-board-endianness').empty().append(non_avail);
    }

    if (localData.boot_log !== null || localData.boot_log_html !== null) {
        $('#dd-board-boot-log').empty();

        if (localData.boot_log !== null) {
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View raw text boot log"><a href="' + file_server +
                    localData.job + '/' + localData.kernel + '/' + localData.defconfig +
                    '/' + localData.boot_log + '">txt' +
                    '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }

        if (localData.boot_log_html !== null) {
            if (localData.boot_log !== null) {
                $('#dd-board-boot-log').append('&nbsp;&mdash;&nbsp;');
            }
            $('#dd-board-boot-log').append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View HTML boot log"><a href="' + file_server +
                    localData.job + '/' + localData.kernel + '/' + localData.defconfig +
                    '/' + localData.boot_log_html + '">html' +
                    '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        }
    } else {
        $('#dd-board-boot-log').empty().append(non_avail);
    }

    switch (localData.status) {
        case 'PASS':
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Boot completed"><span class="label ' +
                    'label-success"><i class="fa fa-check"></i></span></span>';
            break;
        case 'FAIL':
            displ = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Boot failed"><span class="label label-danger">' +
                    '<i class="fa fa-exclamation-triangle"></i></span></span>';
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

    // Do we have a description for the boot result?
    // We might have it directly in the json or in the metadata property.
    if (localData.hasOwnProperty('boot_result_description')) {
        displ += '&nbsp;<small>' + localData.boot_result_description +
            '</small>';
    } else if (! $.isEmptyObject(metadata) && metadata.hasOwnProperty('boot_result_description')) {
        displ += '&nbsp;<small>' + metadata.boot_result_description +
            '</small>';
    }

    $('#dd-board-status').empty().append(displ);
    $('#dd-board-boot-time').empty().append(boot_time.getCustomTime());

    if (localData.warnings !== null) {
        $('#dd-board-warnings').empty().append(localData.warnings);
    } else {
        $('#dd-board-warnings').empty().append(0);
    }

    if (localData.dtb !== null && localData.dtb !== '') {
        $('#dd-board-dtb').empty().append(localData.dtb);
    } else {
        $('#dd-board-dtb').empty().append(non_avail);
    }

    if (localData.dtb_addr !== null && localData.dtb_addr !== '') {
        $('#dd-board-dtb-address').empty().append(localData.dtb_addr);
    } else {
        $('#dd-board-dtb-address').empty().append(non_avail);
    }

    if (localData.initrd_addr !== null && localData.initrd_addr !== '') {
        $('#dd-board-initrd-address').empty().append(localData.initrd_addr);
    } else {
        $('#dd-board-initrd-address').empty().append(non_avail);
    }

    if (localData.load_addr !== null && localData.load_addr !== '') {
        $('#dd-board-load-address').empty().append(localData.load_addr);
    } else {
        $('#dd-board-load-address').empty().append(non_avail);
    }

    if (localData.kernel_image !== null && localData.kernel_image !== '') {
        $('#dd-board-kernel-image').empty().append(localData.kernel_image);
    } else {
        $('#dd-board-kernel-image').empty().append(non_avail);
    }
}

$(document).ready(function () {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-boot').addClass('active');

    var errorReason = 'Data call failed.';

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': {
            'id': $('#board-id').val() + '-' + $('#job-id').val() + '-' +
                $('#kernel-id').val() + '-' + $('#defconfig-id').val()
        },
        'beforeSend': setXhrHeader,
        'statusCode': {
            400: function () {
                $('#container-content').empty().load(
                    '/static/html/400-content.html'
                );
                setErrorAlert('data-400-error', 400, errorReason);
            },
            404: function () {
                $('#container-content').empty().load(
                    '/static/html/404-content.html'
                );
                setErrorAlert('data-404-error', 404, errorReason);
            },
            408: function () {
                $('#container-content').empty().load(
                    '/static/html/408-content.html'
                );
                setErrorAlert('data-408-error', 408, errorReason);
            },
            500: function () {
                $('#container-content').empty().load(
                    '/static/html/500-content.html'
                );
                setErrorAlert('data-500-error', 500, errorReason);
            }
        }
    }).done(populatePage);
});
