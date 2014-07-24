var csrftoken = $('meta[name=csrf-token]').attr('content');

$(document).ready(function () {
    "use strict";

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-boot').addClass('active');

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': {
            'id': $('#board-id').val() + '-' + $('#job-id').val() + '-' +
                $('#kernel-id').val() + '-' + $('#defconfig-id').val()
        },
        'dataFilter': function (data, type) {
            if (type === 'json') {
                return JSON.parse(data).result;
            }
            return data;
        },
        'beforeSend': function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        'statusCode': {
            404: function () {
                $('#container-content').empty().load(
                    '/static/html/404-content.html'
                );
            },
            500: function () {
                $('#container-content').empty().load(
                    '/static/html/500-content.html'
                );
            }
        }
    }).done(function (data) {
        var boot_time = new Date(data.time['$date']),
            displ = '',
            file_server = $('#file-server').val(),
            non_avail = '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Not available"><i class="fa fa-ban"></i>' +
                '</span>';

        $('#dd-board-board').empty().append(data.board);
        $('#dd-board-defconfig').empty().append(
            data.defconfig + '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip"' +
                'title="Details for build&nbsp;' + data.job +
                '&nbsp;&dash;&nbsp;' + data.kernel +
                '&nbsp;&dash;&nbsp;' + data.defconfig +
                '"><a href="/build/' + data.job + '/kernel/' + data.kernel +
                '/defconfig/' + data.defconfig + '">' +
                '<i class="fa fa-cube"></i></a></span>'
        );
        $('#dd-board-kernel').empty().append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Boot report details for&nbsp;' + data.job +
                '&nbsp;&dash;&nbsp;' +
                data.kernel + '"><a href="/boot/all/job/' + data.job + '/kernel/' +
                data.kernel + '">' + data.kernel +
                '</a></span>' +
                '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for build&nbsp;' + data.job +
                '&nbsp;&dash;&nbsp;' +
                data.kernel + '"><a href="/build/' + data.job + '/kernel/' +
                data.kernel + '"><i class="fa fa-cube"></i></a></span>'
        );
        $('#dd-board-tree').empty().append(
            '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Boot details for&nbsp;' + data.job + '">' +
                '<a href="/boot/all/job/' + data.job + '">' + data.job +
                '</a></span>' +
                '&nbsp;&mdash;&nbsp;' +
                '<span rel="tooltip" data-toggle="tooltip" ' +
                'title="Details for job&nbsp;' + data.job + '"><a href="/job/' +
                data.job + '"><i class="fa fa-sitemap"></i></a></span>'
        );

        if (data.endian !== null) {
            $('#dd-board-endianness').empty().append(data.endian);
        } else {
            $('#dd-board-endianness').empty().append(non_avail);
        }

        if (data.boot_log !== null) {
            $('#dd-board-boot-log').empty().append(
                '<span rel="tooltip" data-toggle="tooltip" ' +
                    'title="View boot log"><a href="' + file_server +
                    data.job + '/' + data.kernel + '/' + data.defconfig +
                    '/' + data.boot_log + '">' + data.boot_log +
                    '&nbsp;<i class="fa fa-external-link"></i></a></span>'
            );
        } else {
            $('#dd-board-boot-log').empty().append(non_avail);
        }

        switch (data.status) {
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

        $('#dd-board-status').empty().append(displ);
        $('#dd-board-boot-time').empty().append(boot_time.getCustomTime());

        if (data.warnings !== null) {
            $('#dd-board-warnings').empty().append(data.warnings);
        } else {
            $('#dd-board-warnings').empty().append(0);
        }

        if (data.dtb !== null && data.dtb !== '') {
            $('#dd-board-dtb').empty().append(data.dtb);
        } else {
            $('#dd-board-dtb').empty().append(non_avail);
        }

        if (data.dtb_addr !== null && data.dtb_addr !== '') {
            $('#dd-board-dtb-address').empty().append(data.dtb_addr);
        } else {
            $('#dd-board-dtb-address').empty().append(non_avail);
        }

        if (data.initrd_addr !== null && data.initrd_addr !== '') {
            $('#dd-board-initrd-address').empty().append(data.initrd_addr);
        } else {
            $('#dd-board-initrd-address').empty().append(non_avail);
        }

        if (data.load_addr !== null && data.load_addr !== '') {
            $('#dd-board-load-address').empty().append(data.load_addr);
        } else {
            $('#dd-board-load-address').empty().append(non_avail);
        }

        if (data.kernel_image !== null && data.kernel_image !== '') {
            $('#dd-board-kernel-image').empty().append(data.kernel_image);
        } else {
            $('#dd-board-kernel-image').empty().append(non_avail);
        }
    });
});
