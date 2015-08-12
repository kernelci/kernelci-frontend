/*! Kernel CI Dashboard v2015.8.2 | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'bootstrap',
    'jquery.hotkeys',
    'jquery.hotkeymap'
], function($) {
    'use strict';
    var start;

    function setHotKeys() {
        var selectSearch,
            selectTableLength,
            goToHome,
            goToJob,
            goToBuild,
            goToBoot,
            goToInfo,
            showHelp;

        selectTableLength = function() {
            $('.length-menu .input-sm').focus();
        };

        goToHome = function() {
            window.location = document.getElementById('home-l').href;
        };

        goToJob = function() {
            window.location = document.getElementById('job-l').href;
        };

        goToBuild = function() {
            window.location = document.getElementById('build-l').href;
        };

        goToBoot = function() {
            window.location = document.getElementById('boot-l').href;
        };

        goToInfo = function() {
            window.location = document.getElementById('info-l').href;
        };

        showHelp = function() {
            $('#modal-hotkeys').modal('show');
        };

        selectSearch = function() {
            $('.input-sm').focus();
        };

        $(document).mapHotKeys(
            [{
                    key: '/',
                    action: selectSearch
                }, {
                    key: 'l',
                    action: selectTableLength
                },
                $.mapHotKeys.createSequence('s', 'h', $(document), showHelp),
                $.mapHotKeys.createSequence('g', 'o', $(document), goToHome),
                $.mapHotKeys.createSequence('g', 'j', $(document), goToJob),
                $.mapHotKeys.createSequence('g', 'b', $(document), goToBuild),
                $.mapHotKeys.createSequence('g', 't', $(document), goToBoot),
                $.mapHotKeys.createSequence('g', 'i', $(document), goToInfo)
            ]
        );
    }

    start = function() {
        setHotKeys();

        $('body').tooltip({
            'selector': '[rel=tooltip]',
            'placement': 'auto top'
        });

        $('.clickable-table tbody').on('click', 'tr', function() {
            var url = $(this).data('url');
            if (url) {
                window.location = url;
            }
        });
    };

    return start;
});
