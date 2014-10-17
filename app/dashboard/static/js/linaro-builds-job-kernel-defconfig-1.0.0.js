function populatePage(data) {
    'use strict';
    var localData = data.result,
        len = localData.length,
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
            columnIndex = (i + 1) % totalColumns;
            columns['col' + columnIndex] += '<li>' +
                '<a href="/boot/' + localData[i].board +
                '/job/' + localData[i].job + '/kernel/' +
                localData[i].kernel +
                '/defconfig/' + localData[i].defconfig + '">' +
                localData[i].board +
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
    $("#boot-report").empty().append(
        '<div class="text-center">' +
        '<h3>Error loading data.</h3>' +
        '</div>'
    );
}

$(document).ready(function () {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    $('#li-build').addClass('active');

    var errorReason = 'Builds data call failed.';

    $.ajax({
        'url': '/_ajax/boot',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'data': {
            'field': ['board', 'job', 'kernel', 'defconfig', 'created_on'],
            'job': '{{ job }}',
            'kernel': '{{ result.kernel }}',
            'defconfig': '{{ result.dirname }}'
        },
        'beforeSend': function (jqXHR) {
            setXhrHeader(jqXHR);
        },
        'error': function() {
            ajaxCallFailed();
        },
        'timeout': 6000,
        'statusCode': {
            403: function () {
                setErrorAlert('build-403-error', 403, errorReason);
            },
            404: function () {
                setErrorAlert('build-404-error', 404, errorReason);
            },
            408: function () {
                errorReason = 'Defconfing data call failed: timeout.';
                setErrorAlert('build-408-error', 408, errorReason);
            },
            500: function () {
                setErrorAlert('build-500-error', 500, errorReason);
            }
        }
    }).done(populatePage);
});