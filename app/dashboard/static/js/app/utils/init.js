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
    'utils/const',
    'bootstrap',
    'jquery.hotkeys',
    'jquery.hotkeymap'
], function($ , appconst) {
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

    init.tooltip = function () {
        $('body').tooltip({
            selector: '[rel=tooltip]',
            html: true
        });
    }

    init.activeElement = function(id) {
        setTimeout(function() {
            document.getElementById(id).setAttribute('class', 'active');
        }, 15);
    }

    init.init = function(page) {

        setTimeout( function( ) {
            document.getElementById('li-'+ page ).setAttribute('class', 'active');
        } , 15 );

        this.hotkeys();
        this.tooltip();
        return this.domElements();
    }

    init.domElements = function() {

        var gDateRange , gSearchFilter , gPageLen;

        if (document.getElementById('date-range') !== null) {
            gDateRange = document.getElementById('date-range').value = appconst.MAX_DATE_RANGE;
        }
        if (document.getElementById('search-filter') !== null) {
            gSearchFilter = document.getElementById('search-filter').value || '';
        }
        if (document.getElementById('page-len') !== null) {
            gPageLen = document.getElementById('page-len').value || 25;
        }

        return [ gDateRange , gSearchFilter , gPageLen ]
    }

    init.setPopover = function() {
        $('[data-toggle="popover"]').popover({
            html: true
        });
    }

    init.hotkeys = function() {
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

    init.all = function() {
        init.hotkeys();
        init.tooltip();
        init.setPopover();
    };

    return init;
});
