var csrftoken = $('meta[name=csrf-token]').attr('content');

function showHideDefconfs (element) {
    "use strict";

    switch (element.id) {
        case 'success-cell':
            if ($('#success-btn').attr('disabled') !== 'disabled') {
                $('.df-failed').hide();
                $('.df-success').show();
                $('.df-unknown').hide();
                $('#success-btn').addClass('active').siblings().removeClass('active');
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
                $('#fail-btn').addClass('active').siblings().removeClass('active');
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
                $('#unknown-btn').addClass('active').siblings().removeClass('active');
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

$(document).ready(function () {
    "use strict";

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-build').addClass('active');

    $('.btn-group > .btn').click(function () {
        $(this).addClass('active').siblings().removeClass('active');
    });

    $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': {
            'job_id': $('#job-id').val(),
            'field': 'status',
            'nfield': '_id'
        },
        'beforeSend': function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }).done(function (data) {
        data = data.result;

        var success = 0,
            fail = 0,
            unknown = 0,
            i = 0,
            len = data.length,
            width = 200,
            height = 200,
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

        var dataset = [success, fail, unknown],
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
    });

    $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'context': $('#accordion'),
        'data': {
            'job_id': $('#job-id').val(),
            'sort': ['status', '_id'],
            'sort_order': 1
        },
        'beforeSend': function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        'statusCode': {
            404: function () {
                $('#accordion-container').empty().append(
                    '<div class="text-center">' +
                    '<h3>Error loading data.</h3>' +
                    '</div>'
                );
                var text = '<div id="defconfs-404-error" ' +
                    'class="alert alert-danger alert-dismissable">' +
                    '<button type="button" class="close" ' +
                    'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                    'Error while loading defconfigs from the server.\n' +
                    'Please contact the website administrators.&nbsp;' +
                    'Error code was: 404' +
                    '</div>';
                $('#errors-container').append(text);
                $('#defconfs-404-error').alert();
            },
            500: function () {
                $('#accordion-container').empty().append(
                    '<div class="text-center">' +
                    '<h3>Error loading data.</h3>' +
                    '</div>'
                );
                var text = '<div id="defconfs-500-error" ' +
                    'class="alert alert-danger alert-dismissable">' +
                    '<button type="button" class="close" ' +
                    'data-dismiss="alert" aria-hidden="true">&times;</button>' +
                    'Error while loading defconfigs from the server.\n' +
                    'Please contact the website administrators.&nbsp;' +
                    'Error code was: 500' +
                    '</div>';
                $('#errors-container').append(text);
                $('#defconfs-500-error').alert();
            }
        }
    }).done(function (data) {
        data = data.result;

        var file_server = $('#file-server').val(),
            panel = '',
            cls,
            data_url,
            defconfig,
            metadata,
            label,
            i = 0,
            len = data.length,
            hasFailed = false,
            hasSuccess = false,
            hasUnknown = false,
            fail_label = '<span class="pull-right label label-danger">' +
                '<li class="fa fa-exclamation-triangle"></li></span>',
            success_label = '<span class="pull-right label label-success">' +
                '<li class="fa fa-check"></li></span>',
            unknown_label = '<span class="pull-right label label-warning">' +
                '<li class="fa fa-question"></li></span>',
            architecture_label = '';

        for (i; i < len; i++) {
            metadata = data[i].metadata;
            data_url = file_server + data[i].job + '/' + data[i].kernel +
                '/' + data[i].dirname + '/';

            switch (data[i].status) {
                case 'FAIL':
                    hasFailed = true;
                    label = fail_label;
                    cls = 'df-failed';
                    break;
                case 'PASS':
                    hasSuccess = true;
                    label = success_label;
                    cls = 'df-success';
                    break;
                default:
                    hasUnknown = true;
                    label = unknown_label;
                    cls = 'df-unknown';
                    break;
            }

            defconfig = data[i].defconfig;
            if (!$.isEmptyObject(metadata)) {
                if (metadata.hasOwnProperty('kconfig_fragments') &&
                    metadata.kconfig_fragments !== null) {
                        defconfig = data[i].defconfig + '&nbsp;<small>' +
                        metadata.kconfig_fragments + '</small>';
                }

                if (metadata.hasOwnProperty('arch') &&
                    metadata.arch !== null) {
                        architecture_label = '<small>' +
                            '<span class="pull-right" style="padding: 3px">' +
                            metadata.arch + '</span></small>';
                }
            }

            panel += '<div class="panel panel-default ' + cls + '">' +
                '<div class="panel-heading" data-toggle="collapse" ' +
                    'id="panel-defconf' + i + '"' +
                    'data-parent="accordion" data-target="#collapse-defconf' +
                    i + '">' +
                    '<h4 class="panel-title">' +
                    '<a data-toggle="collapse" data-parent="#accordion" href="#collapse-defconf' + i + '">' +
                    defconfig +
                    '</a>' + label + architecture_label + '</h4></div>' +
                    '<div id="collapse-defconf' + i + '" class="panel-collapse collapse">' +
                    '<div class="panel-body">';

            panel += '<div class="row">';

            if ($.isEmptyObject(metadata)) {
                panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
                    '<div class="pull-center">' +
                    '<strong>No data to show.</strong>' +
                    '</div></div>\n';
            } else {
                panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
                panel += '<dl class="dl-horizontal">';

                if (metadata.hasOwnProperty('dtb_dir') &&
                        metadata.dtb_dir !== null) {
                    panel += '<dt>Dtb directory</dt>' +
                        '<dd><a href="' +
                            data_url + metadata.dtb_dir + '/' + '">' +
                            metadata.dtb_dir +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></dd>';
                }

                if (metadata.hasOwnProperty('modules_dir') &&
                        metadata.modules_dir !== null) {
                    panel += '<dt>Modules directory</dt>' +
                        '<dd><a href="' +
                            data_url + metadata.modules_dir + '/' + '">' +
                            metadata.modules_dir +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></dd>';
                }

                if (metadata.hasOwnProperty('text_offset') &&
                        metadata.text_offset !== null) {
                    panel += '<dt>Text offset</dt>' +
                        '<dd>' + metadata.text_offset + '</dd>';
                }

                if (metadata.hasOwnProperty('kernel_image') &&
                        metadata.kernel_image !== null) {
                    panel += '<dt>Kernel image</dt>' +
                        '<dd><a href="' +
                            data_url + metadata.kernel_image + '">' +
                            metadata.kernel_image +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></dd>';
                }

                if (metadata.hasOwnProperty('kernel_config') &&
                        metadata.kernel_config !== null) {
                    panel += '<dt>Kernel config</dt>' +
                        '<dd><a href="' +
                            data_url + metadata.kernel_config + '">' +
                            metadata.kernel_config +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></dd>';
                }

                if (metadata.hasOwnProperty('build_log') &&
                        metadata.build_log !== null) {
                    panel += '<dt>Build log</dt>' +
                        '<dd><a href="' +
                            data_url + metadata.build_log + '">' +
                            metadata.build_log +
                            '&nbsp;<i class="fa fa-external-link">' +
                            '</i></a></dd>';
                }

                panel += '</dl></div>';

                panel += '<div class="col-xs-6 col-sm-6 col-md-6 col-lg-6">';
                panel += '<dl class="dl-horizontal">';

                if (metadata.hasOwnProperty('build_errors') &&
                        metadata.build_errors !== null) {
                    panel += '<dt>Build errors</dt>';
                    panel += '<dd>' + metadata.build_errors + '</dd>';
                }

                if (metadata.hasOwnProperty('build_warnings') &&
                        metadata.build_warnings !== null) {
                    panel += '<dt>Build warnings</dt>';
                    panel += '<dd>' + metadata.build_warnings + '</dd>';
                }

                if (metadata.hasOwnProperty('build_time') &&
                        metadata.build_time !== null) {
                    panel += '<dt>Build time</dt>';
                    panel += '<dd>' + metadata.build_time + '&nbsp;sec.</dd>';
                }

                panel += '</dl></div>';
            }

            panel += '<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">';
            panel += '<div class="pull-center">' +
                '<span rel="tooltip" data-toggle="tooltip" title="Details for&nbsp;' +
                'build with defconfig&nbsp;' + data[i].defconfig + '">' +
                '<a href="/build/' + data[i].job + '/kernel/' + data[i].kernel +
                '/defconfig/' + data[i].dirname + '/' +
                '">More info&nbsp;<i class="fa fa-search"></i>' +
                '</a></span>';
            panel += '</div></div>';

            panel += '</div>';
            panel += '</div></div></div>\n';
        }
        $(this).empty().append(panel);

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
        if (!loadFromSessionStorage($('#job-id').val())) {
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
    });
});

$(document).ready(function () {
    // No use strict here, or onbeforeunload is not recognized.
    var session_state = new SessionState($('#job-id').val());
    onbeforeunload = function () {

        var panel_state = {},
            page_state;

        $('[id^="panel-defconf"]').each(function (id) {
            panel_state['#panel-defconf' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#panel-defconf' + id).attr('class')
            };
        });

        $('[id^="collapse-defconf"]').each(function (id) {
            panel_state['#collapse-defconf' + id] = {
                'type': 'class',
                'name': 'class',
                'value': $('#collapse-defconf' + id).attr('class')
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
