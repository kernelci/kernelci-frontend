/*!
 * Copyright (C) Linaro Limited 2015,2017,2019
 * Author: Matt Hart <matthew.hart@linaro.org>
 * Author: Milo Casagrande <milo.casagrande@linaro.org>
 *
 * kernelci dashboard.
 * 
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
define([
    'jquery',
    'bootstrap',
    'jquery.hotkeys',
    'jquery.hotkeymap'
], function($) {
    'use strict';
    var init;

    init = {};

    // Polyfill for Element.remove().
    if (!('remove' in Element.prototype)) {
        Element.prototype.remove = function() {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }

    function setTooltip() {
        $('body').tooltip({
            selector: '[rel=tooltip]',
            html: true
        });
    }

    function setPopover() {
        $('[data-toggle="popover"]').popover({
            html: true
        });
    }

    function setHotKeys() {
        var goToBoot,
            goToBuild,
            goToCompare,
            goToHome,
            goToInfo,
            goToJob,
            goToSoc,
            selectSearch,
            selectTableLength,
            showHelp;

        selectTableLength = function() {
            document.querySelector('select.input-sm').focus();
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

        goToSoc = function() {
            window.location = document.getElementById('soc-l').href;
        };

        goToCompare = function() {
            window.location = document.getElementById('compare-l').href;
        };

        goToInfo = function() {
            window.location = document.getElementById('info-l').href;
        };

        showHelp = function() {
            $('#modal-hotkeys').modal('show');
        };

        selectSearch = function() {
            document.querySelector('input.input-sm').focus();
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
                $.mapHotKeys.createSequence('g', 's', $(document), goToSoc),
                $.mapHotKeys.createSequence('g', 'c', $(document), goToCompare),
                $.mapHotKeys.createSequence('g', 'i', $(document), goToInfo)
            ]
        );
    }

    init.hotkeys = function() {
        setHotKeys();
    };

    init.tooltip = function() {
        setTooltip();
    };

    init.popover = function() {
        setPopover();
    };

    init.all = function() {
        setHotKeys();
        setTooltip();
        setPopover();
    };

    return init;
});
