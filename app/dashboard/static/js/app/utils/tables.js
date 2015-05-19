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
        tTable,
        tElement,
        tLoading = null,
        tDiv = null,
        rowURL = '/build/%(job)s/kernel/%(kernel)s/',
        rowURLElements,
        tableData = [],
        searchLanguage,
        searchType,
        disableIn = false;

    dom = '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-6"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

    searchLanguage = '<div id="search-area" class="input-group pull-right">' +
        '<span class="input-group-addon">' +
        '<i class="fa fa-search"></i></span>_INPUT_</div>';

    menuFmt = '_MENU_&nbsp;<strong>%s</strong>';
    zeroRFmt = '<h4>%s</h4>';

    menu = 'reports per page';
    zeroR = 'No reports to display';

    order = [1, 'desc'];
    searchType = {
        'regex': true,
        'smart': true
    };

    table = function(elements, d) {
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

        if (d !== null && d !== undefined) {
            disableIn = d;
        }
        return table;
    };

    table.draw = function() {
        tTable = $(tElement[1]).DataTable({
            'dom': dom,
            'language': {
                'lengthMenu': s.sprintf(menuFmt, menu),
                'zeroRecords': s.sprintf(zeroRFmt, zeroR),
                'search': searchLanguage,
                'searchPlaceholder': 'Filter the results'
            },
            'lengthMenu': [25, 50, 75, 100],
            'order': order,
            'deferRender': true,
            'ordering': true,
            'stateSave': true,
            'stateDuration': -1,
            'processing': true,
            'search': searchType,
            'initComplete': function() {
                if (tLoading !== null) {
                    $(tLoading[1]).remove();
                }
                if (tDiv !== null) {
                    $(tDiv[1]).fadeIn('slow', 'linear');
                }
            },
            'data': tableData,
            'columns': columns
        });

        $(document).on('click', tElement[1] + ' tbody tr', function() {
            var localTable = tTable.row(this).data(),
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

        if (disableIn) {
            $('.input-sm').prop('disabled', true);
        }
    };

    table.search = function(value) {
        $('.input-sm').prop('disabled', false);
        if (arguments.length) {
            if (value !== null && value !== undefined) {
                if (value.length > 0) {
                    tTable.search(value, true).draw();
                }
            }
        }
        return table;
    };

    table.pageLen = function(value) {
        var pLen;
        if (arguments.length) {
            if (value !== undefined && value !== null) {
                if (value.length > 0) {
                    pLen = Number(value);
                    if (isNaN(pLen)) {
                        pLen = 25;
                    }
                    tTable.page.len(pLen).draw();
                }
            }
        }
        return table;
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

    table.searchType = function(value) {
        var returnData = searchType;
        if (arguments.length) {
            searchType = value;
            returnData = table;
        }
        return returnData;
    };

    return table;
});
