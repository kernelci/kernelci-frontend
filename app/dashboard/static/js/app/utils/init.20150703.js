/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
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
