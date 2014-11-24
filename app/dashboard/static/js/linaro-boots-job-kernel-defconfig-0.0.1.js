var fileServer = $('#file-server').val();
var boardName = $('#board-name').val();
var jobName = $('#job-name').val();
var kernelName = $('#kernel-name').val();
var defconfigName = $('#defconfig-name').val();

function populateBootPage(data) {
    'use strict';

    console.log(data);
}

$(document).ready(function() {
    'use strict';

    $('body').tooltip({
        'selector': '[rel=tooltip]',
        'placement': 'auto top'
    });

    var ajaxCall = $.ajax({
        'url': '/_ajax/defconf',
        'traditional': true,
        'cache': true,
        'dataType': 'json',
        'beforeSend': function(jqXHR) {
            setXhrHeader(jqXHR);
        },
        'data': {
            'board': boardName,
            'job': jobName,
            'kernel': kernelName,
            'defconfig': defconfigName
        }
    });

    $.when(ajaxCall).done(populateBootPage);
});
