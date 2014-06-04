$(document).ready(function () {
    'use strict';

    var selectSearch = function () {
        $('.input-sm').focus();
    },
        selectTableLength = function () {
            $('.length-menu .input-sm').focus();
        },
        goToHome = function () {
            window.location = $('#home-l')[0].href;
        },
        goToJob = function () {
            window.location = $('#job-l')[0].href;
        },
        goToBuild = function () {
            window.location = $('#build-l')[0].href;
        },
        goToBoot = function () {
            window.location = $('#boot-l')[0].href;
        },
        goToInfo = function () {
            window.location = $('#info-l')[0].href;
        },
        showHelp = function () {
            $('#modal-hotkeys').modal('show');
        };

    $(document).mapHotKeys(
        [
            {key: '/', action: selectSearch},
            {key: 'l', action: selectTableLength},
            $.mapHotKeys.createSequence('s', 'h', $(document), showHelp),
            $.mapHotKeys.createSequence('g', 'h', $(document), goToHome),
            $.mapHotKeys.createSequence('g', 'j', $(document), goToJob),
            $.mapHotKeys.createSequence('g', 'b', $(document), goToBuild),
            $.mapHotKeys.createSequence('g', 't', $(document), goToBoot),
            $.mapHotKeys.createSequence('g', 'i', $(document), goToInfo)
        ]
    );
});
