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
            'col3' : '<div class="col-xs-4 col-sm-4 col-md-4 ' +
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
                '/defconfig/' + colData.defconfig +
                '/lab/' + colData.lab_name +
                '?_id=' + colData._id['$oid'] + '">' +
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

function ajaxCallFailed() {
    'use strict';
    $('#boot-report').empty().append(
        '<div class="text-center">' +
        '<h3>Error loading data.</h3>' +
        '</div>'
    );
}

$(document).ready(function() {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-build').addClass('active');

    var errorReason = 'Boot data call failed.',
        job = $('#job').val(),
        kernel = $('#kernel').val(),
        defconfig = $('#defconfig').val(),
        defconfigId = $('#defconfig-id').val(),
        data = {
            'field': [
                '_id', 'board', 'job', 'kernel', 'defconfig', 'lab_name'
            ]
        };

    if (defconfigId !== 'None') {
        data.defconfig_id = defconfigId;
    } else {
        data.job = job;
        data.kernel = kernel;
        data.defconfig = defconfig;
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
        'error': function() {
            ajaxCallFailed();
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
    }).done(populateBootSection);
});
