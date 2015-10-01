/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'sprintf',
    'utils/base',
    'datatables',
    'datatables.bootstrap'
], function($, s, b) {
    'use strict';
    var table,
        tableDom,
        lengthMenu = null,
        lengthChange = true,
        paging = true,
        info = true,
        menu,
        menuFmt,
        zeroRec,
        columns,
        order,
        tTable,
        tElement,
        tLoading = null,
        tDiv = null,
        rowURL = '/build/%(job)s/kernel/%(kernel)s/',
        rowURLElements,
        tableData = [],
        searchLanguage,
        searchType,
        oldSearch = null,
        disableIn = false,
        noIDUrl = false,
        elementsPerPage = [25, 50, 75, 100];

    tableDom = '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

    searchLanguage = '<div id="search-area" class="input-group pull-right">' +
        '<span class="input-group-addon">' +
        '<i class="fa fa-search"></i></span>_INPUT_</div>';

    menuFmt = '_MENU_&nbsp;<strong>%s</strong>';
    menu = 'reports per page';
    zeroRec = '<strong>No reports to display.</strong>';

    order = [1, 'desc'];
    searchType = {
        regex: true,
        smart: true
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
        var target,
            that = this;
        function stateLoad(s, d) {
            if (disableIn && d.search.search.length > 0) {
                oldSearch = d.search.search;
                d.search.search = '';
            }
        }

        tTable = $(tElement[1]).DataTable({
            dom: that.dom(),
            paging: paging,
            info: info,
            language: {
                lengthMenu: that.lengthMenu(),
                zeroRecords: that.zeroRecords(),
                search: that.searchLanguage(),
                searchPlaceholder: 'Filter the results'
            },
            lengthMenu: that.elementsLength(),
            order: order,
            deferRender: true,
            ordering: true,
            stateSave: true,
            stateDuration: -1,
            processing: true,
            search: that.searchType(),
            initComplete: function() {
                if (tLoading !== null) {
                    $(tLoading[1]).remove();
                }
                if (tDiv !== null) {
                    $(tDiv[1]).fadeIn('slow', 'linear');
                }
            },
            data: that.tableData(),
            columns: that.columns(),
            stateLoadParams: stateLoad
        });

        target = document.querySelector('input.input-sm');

        // Remove focus from input when Esc is pressed.
        target.addEventListener('keyup', function(event) {
            if (event.keyCode === 27) {
                this.blur();
            }
        });

        // Remove focus from the table length selection on Esc.
        document.querySelector('select.input-sm').addEventListener(
            'keyup', function(event) {
                if (event.keyCode === 27) {
                    this.blur();
                }
            }
        );

        if (disableIn) {
            target.setAttribute('disabled', true);
        }

        tTable.on('click', 'tbody tr', function() {
            var localTable = tTable.row(this).data(),
                location = '#',
                substitutions = {};
            if (localTable) {
                rowURLElements.forEach(function(value) {
                    substitutions[value] = localTable[value] || null;
                });

                location = s.sprintf(rowURL, substitutions);
                if (!noIDUrl && localTable._id !== null) {
                    location += '?_id=' + localTable._id.$oid;
                }
            }
            window.location = location;
        });

        tTable.on('search.dt', function() {
            var obs,
                obsCfg;
            if (disableIn && oldSearch !== null) {
                if (window.MutationObserver) {
                    if (target.getAttribute('disabled')) {
                        obs = new MutationObserver(function(muts) {
                            muts.forEach(function(mut) {
                                if (mut.target === target) {
                                    if (mut.attributeName === 'disabled') {
                                        if (oldSearch !== null) {
                                            tTable
                                                .search(oldSearch, true, true)
                                                .draw();
                                            oldSearch = null;
                                        }
                                    }
                                }
                            });
                            obs.disconnect();
                        });
                        obsCfg = {
                            attributes: true,
                            attributeOldValue: true
                        };
                        obs.observe(target, obsCfg);
                    }
                } else {
                    // No support for MutationObserver.
                    tTable.search(oldSearch, true, true).draw();
                }
            }
        });
        return table;
    };

    table.search = function(value) {
        document.querySelector('input.input-sm').removeAttribute('disabled');
        if (arguments.length) {
            if (value !== null && value !== undefined) {
                if (value.length > 0) {
                    oldSearch = null;
                    tTable.search(value, true, true).draw();
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

    table.searchLanguage = function(value) {
        var returnData = searchLanguage;
        if (arguments.length) {
            searchLanguage = value;
            returnData = table;
        }
        return returnData;
    };

    table.zeroRecords = function(value) {
        var returnData = zeroRec;
        if (arguments.length) {
            zeroRec = value;
            returnData = table;
        }
        return returnData;
    };

    table.lengthMenu = function(value) {
        var returnData = table;
        if (arguments.length) {
            lengthMenu = value;
            returnData = table;
        } else {
            if (lengthMenu !== null) {
                returnData = lengthMenu;
            } else {
                returnData = s.sprintf(menuFmt, menu);
            }
        }
        return returnData;
    };

    table.noIDUrl = function(value) {
        var returnData = noIDUrl;
        if (arguments.length) {
            noIDUrl = value;
            returnData = table;
        }
        return returnData;
    };

    table.lengthChange = function(value) {
        var returnData = lengthChange;
        if (arguments.length) {
            lengthChange = value;
            returnData = table;
        }
        return returnData;
    };

    table.paging = function(value) {
        var returnData = paging;
        if (arguments.length) {
            paging = value;
            returnData = table;
        }
        return returnData;
    };

    table.info = function(value) {
        var returnData = paging;
        if (arguments.length) {
            info = value;
            returnData = table;
        }
        return returnData;
    };

    table.elementsLength = function(value) {
        var returnData = elementsPerPage;
        if (arguments.length) {
            elementsPerPage = value;
            returnData = table;
        }
        return returnData;
    };

    table.dom = function(value) {
        var returnData = tableDom;
        if (arguments.length) {
            tableDom = value;
            returnData = table;
        }
        return returnData;
    };

    return table;
});
