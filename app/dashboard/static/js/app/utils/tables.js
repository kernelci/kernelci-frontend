/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'sprintf',
    'utils/base',
    'datatables',
    'datatables.bootstrap'
], function($, s, b) {
    'use strict';
    var columns,
        disableIn,
        elementsPerPage,
        info,
        lengthChange,
        lengthMenu,
        menu,
        menuFmt,
        noIDUrl,
        oldSearch,
        order,
        paging,
        rowURL,
        rowURLElements,
        searchLanguage,
        searchType,
        tDiv,
        tElement,
        tLoading,
        tTable,
        table,
        tableData,
        tableDom,
        zeroRec;

    lengthMenu = null;
    lengthChange = true;
    paging = true;
    info = true;
    tLoading = null;
    tDiv = null;
    rowURL = '/build/%(job)s/kernel/%(kernel)s/';
    tableData = [];
    oldSearch = null;
    disableIn = false;
    noIDUrl = false;
    elementsPerPage = [25, 50, 75, 100];

    tableDom = '<"row"<"col-xs-12 col-sm-12 col-md-4 col-lg-4"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"<"table-process">>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row paging"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
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
        var selectNode,
            inputNode,
            that;

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

        inputNode = document.querySelector('input.input-sm');
        selectNode = document.querySelector('select.input-sm');

        if (inputNode !== null) {
            // Remove focus from input when Esc is pressed.
            inputNode.addEventListener('keyup', function(event) {
                if (event.keyCode === 27) {
                    this.blur();
                }
            });
        }

        if (selectNode !== null) {
            // Remove focus from the table length selection on Esc.
            selectNode.addEventListener(
                'keyup', function(event) {
                    if (event.keyCode === 27) {
                        this.blur();
                    }
                }
            );
        }

        if (disableIn && inputNode !== null) {
            inputNode.setAttribute('disabled', true);
        }

        tTable.on('click', 'tbody tr', function() {
            var localTable,
                location,
                substitutions;

            localTable = tTable.row(this).data();
            location = '#';
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
                    if (inputNode.getAttribute('disabled')) {
                        obs = new MutationObserver(function(muts) {
                            muts.forEach(function(mut) {
                                if (mut.target === inputNode) {
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
                        obs.observe(inputNode, obsCfg);
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
        var inputNode;
        inputNode = document.querySelector('input.input-sm');

        if (inputNode !== null) {
            inputNode.removeAttribute('disabled');
        }

        if (value !== null && value !== undefined) {
            if (value.length > 0) {
                oldSearch = null;
                tTable.search(value, true, true).draw();
            }
        }

        return table;
    };

    table.pageLen = function(value) {
        var pLen;
        if (value !== null && value !== undefined) {
            if (value.length > 0) {
                pLen = Number(value);
                if (isNaN(pLen)) {
                    pLen = 25;
                }
                tTable.page.len(pLen).draw();
            }
        }
        return table;
    };

    table.menu = function(value) {
        var returnData;

        returnData = menu;
        if (value !== null && value !== undefined) {
            menu = value;
            returnData = table;
        }

        return returnData;
    };

    table.columns = function(value) {
        var returnData;

        returnData = columns;
        if (value !== null && value !== undefined) {
            columns = value;
            returnData = table;
        }

        return returnData;
    };

    table.order = function(value) {
        var returnData;

        returnData = order;
        if (value !== null && value !== undefined) {
            order = value;
            returnData = table;
        }

        return returnData;
    };

    table.tableData = function(value) {
        var returnData;

        returnData = tableData;
        if (value !== null && value !== undefined) {
            tableData = value;
            returnData = table;
        }

        return returnData;
    };

    table.rowURL = function(value) {
        var returnData;

        returnData = rowURL;
        if (value !== null && value !== undefined) {
            rowURL = value;
            returnData = table;
        }

        return returnData;
    };

    table.rowURLElements = function(value) {
        var returnData;

        returnData = rowURLElements;
        if (value !== null && value !== undefined) {
            rowURLElements = value;
            returnData = table;
        }

        return returnData;
    };

    table.searchType = function(value) {
        var returnData;

        returnData = searchType;
        if (value !== null && value !== undefined) {
            searchType = value;
            returnData = table;
        }

        return returnData;
    };

    table.searchLanguage = function(value) {
        var returnData;

        returnData = searchLanguage;
        if (value !== null && value !== undefined) {
            searchLanguage = value;
            returnData = table;
        }

        return returnData;
    };

    table.zeroRecords = function(value) {
        var returnData;

        returnData = zeroRec;
        if (value !== null && value !== undefined) {
            zeroRec = value;
            returnData = table;
        }

        return returnData;
    };

    table.lengthMenu = function(value) {
        var returnData;

        returnData = table;
        if (value !== null && value !== undefined) {
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
        var returnData;

        returnData = noIDUrl;
        if (value !== null && value !== undefined) {
            noIDUrl = value;
            returnData = table;
        }

        return returnData;
    };

    table.lengthChange = function(value) {
        var returnData;

        returnData = lengthChange;
        if (value !== null && value !== undefined) {
            lengthChange = value;
            returnData = table;
        }

        return returnData;
    };

    table.paging = function(value) {
        var returnData;

        returnData = paging;
        if (value !== null && value !== undefined) {
            paging = value;
            returnData = table;
        }

        return returnData;
    };

    table.info = function(value) {
        var returnData = paging;

        returnData = paging;
        if (value !== null && value !== undefined) {
            info = value;
            returnData = table;
        }

        return returnData;
    };

    table.elementsLength = function(value) {
        var returnData;

        returnData = elementsPerPage;
        if (value !== null && value !== undefined) {
            elementsPerPage = value;
            returnData = table;
        }

        return returnData;
    };

    /**
     * Get or set the table-DOM: the HTML structure of the table itself.
     *
     * @param {string} value: The table-DOM.
    **/
    table.dom = function(value) {
        var returnData;

        returnData = tableDom;
        if (value !== null && value !== undefined) {
            tableDom = value;
            returnData = table;
        }

        return returnData;
    };

    /**
     * Add new rows to the table, updating and refreshing it.
     *
     * @param {object} value: The data that the rows will be built on.
     * It must be of the same type and with the same structure of the initial
     * data with which the table was populated.
    **/
    table.addRows = function(value) {
        tTable.rows.add(value).draw();
    }

    return table;
});
