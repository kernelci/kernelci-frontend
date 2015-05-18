// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

define([
    'jquery',
    'sprintf',
    'utils/base',
    'datatables',
    'datatables.bootstrap'
], function($, s, b) {
    'use strict';
    var table,
        dom,
        menu,
        menuFmt,
        zeroR,
        zeroRFmt,
        columns,
        order,
        searchFilter = null,
        pageLen = null,
        tElement,
        tLoading = null,
        tDiv = null,
        rowURL = '/build/%(job)s/kernel/%(kernel)s/',
        rowURLElements,
        tableData = [],
        search;

    dom = '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-6"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

    search = '<div id="search-area" class="input-group pull-right">' +
        '<span class="input-group-addon">' +
        '<i class="fa fa-search"></i></span>_INPUT_</div>';

    menuFmt = '_MENU_&nbsp;<strong>%s</strong>';
    zeroRFmt = '<h4>%s</h4>';

    menu = 'reports per page';
    zeroR = 'No reports to display';

    order = [1, 'desc'];

    table = function(elements, f, l) {
        var len;
        if (elements.constructor === Array) {
            len = elements.length;
            switch (len) {
                case 1:
                    tElement = b.checkElement(elements[0]);
                    break;
                case 2:
                    tElement = b.checkElement(elements[0]);
                    tLoading = b.checkElement(elements[1]);
                    break;
                case 3:
                    tElement = b.checkElement(elements[0]);
                    tLoading = b.checkElement(elements[1]);
                    tDiv = b.checkElement(elements[2]);
                    break;
                default:
                    tElement = b.checkElement('tableid');
            }
        } else {
            tElement = b.checkElement(elements);
        }

        searchFilter = f || null;
        pageLen = l || null;
        return table;
    };

    table.draw = function() {
        var tTable;
        tTable = $(tElement[1]).dataTable({
            'dom': dom,
            'language': {
                'lengthMenu': s.sprintf(menuFmt, menu),
                'zeroRecords': s.sprintf(zeroRFmt, zeroR),
                'search': search,
                'searchPlaceholder': 'Filter the results'
            },
            'lengthMenu': [25, 50, 75, 100],
            'order': order,
            'deferRender': true,
            'ordering': true,
            'stateSave': true,
            'stateDuration': -1,
            'processing': true,
            'search': {
                'regex': true,
                'smart': true
            },
            'initComplete': function() {
                if (tLoading !== null) {
                    $(tLoading[1]).remove();
                }

                if (tDiv !== null) {
                    $(tDiv[1]).fadeIn('slow', 'linear');
                }

                var api = this.api();

                if (pageLen !== undefined && pageLen !== null) {
                    if (pageLen.length > 0) {
                        pageLen = Number(pageLen);
                        if (isNaN(pageLen)) {
                            pageLen = 25;
                        }

                        api.page.len(pageLen).draw();
                    }
                }

                if (searchFilter !== null && searchFilter !== undefined) {
                    if (searchFilter.length > 0) {
                        api.search(searchFilter, true).draw();
                    }
                }
            },
            'data': tableData,
            'columns': columns
        });

        $(document).on('click', tElement[1] + ' tbody tr', function() {
            var localTable = tTable.fnGetData(this),
                location = '#',
                substitutions = {};
            if (localTable) {
                rowURLElements.forEach(function(value) {
                    substitutions[value] = localTable[value] || null;
                });

                location = s.sprintf(rowURL, substitutions);
                if (localTable._id !== null) {
                    location += '?_id=' + localTable._id.$oid;
                }
            }
            window.location = location;
        });

        // Remove focus from input when Esc is pressed.
        $('.input-sm').keyup(function(key) {
            if (key.keyCode === 27) {
                $(this).blur();
            }
        });
    };

    table.menu = function(value) {
        var returnData = menu;
        if (arguments.length) {
            menu = value;
            returnData = table;
        }
        return returnData;
    };

    table.zeroR = function(value) {
        var returnData = zeroR;
        if (arguments.length) {
            zeroR = value;
            returnData = table;
        }
        return returnData;
    };

    table.columns = function(value) {
        var returnData = columns;
        if (arguments.length) {
            columns = value;
            returnData = table;
        }
        return returnData;
    };

    table.order = function(value) {
        var returnData = order;
        if (arguments.length) {
            order = value;
            returnData = table;
        }
        return returnData;
    };

    table.tableData = function(value) {
        var returnData = tableData;
        if (arguments.length) {
            tableData = value;
            returnData = table;
        }
        return returnData;
    };

    table.rowURL = function(value) {
        var returnData = rowURL;
        if (arguments.length) {
            rowURL = value;
            returnData = table;
        }
        return returnData;
    };

    table.rowURLElements = function(value) {
        var returnData = rowURLElements;
        if (arguments.length) {
            rowURLElements = value;
            returnData = table;
        }
        return returnData;
    };

    return table;
});
