/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'sprintf',
    'datatables',
    'datatables.bootstrap'
], function($) {
    'use strict';
    var gMenuFmt,
        gSearchLanguage,
        gTable,
        gTableDom;

    gTableDom = '<"row"<"col-xs-12 col-sm-12 col-md-4 col-lg-4"' +
            '<"length-menu"l>>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"<"table-process">>' +
            '<"col-xs-12 col-sm-12 col-md-4 col-lg-4"f>r' +
            '<"col-xs-12 col-sm-12 col-md-12 col-lg-12"t>>' +
            '<"row paging"<"col-xs-12 col-sm-12 col-md-6 col-lg-6"i>' +
            '<"col-xs-12 col-sm-12 col-md-6 col-lg-6"p>>';

    gSearchLanguage = '<div id="search-area" class="input-group pull-right">' +
        '<span class="input-group-addon">' +
        '<i class="fa fa-search"></i></span>_INPUT_</div>';

    gMenuFmt = '_MENU_&nbsp;<strong>%s</strong>';

    /**
     * Remove the focus from the element that triggers the event.
     * Apply a blur() to the triggering element.
     *
     * @param {Event} event: The event triggering this function.
    **/
    function removeFocus(event) {
        var target;

        target = event.target || event.srcElement;
        if (event.keyCode === 27) {
            target.blur();
        }
    }

    gTable = function(elements, disabled) {
        // Set global settings.
        gTable.settings = {
            paging: true,
            info: true,
            order: [1, 'desc'],
            dom: gTableDom,
            search: {
                regex: true,
                smart: true
            },
            language: {
                lengthMenu: '_MENU_&nbsp;<strong>reports per page</strong>',
                zeroRecords: '<strong>No data found.</strong>',
                search: gSearchLanguage,
                searchPlaceholder: 'Filter the results'
            },
            noIdURL: false,
            lengthMenu: [25, 50, 75, 100],
            rowURL: '/build/%(job)s/kernel/%(kernel)s/'
        };

        if (elements.constructor === Array) {
            switch (elements.length) {
                case 1:
                    gTable.tableNode = document.getElementById(elements[0]);
                    if (!gTable) {
                        throw 'No node found';
                    }
                    gTable.settings.tableId = elements[0];
                    break;
                case 2:
                    gTable.settings.tableId = elements[0];
                    gTable.settings.tableLoadingDivId = elements[1];
                    break;
                case 3:
                    gTable.settings.tableId = elements[0];
                    gTable.settings.tableLoadingDivId = elements[1];
                    gTable.settings.tableDivId = elements[2];
                    break;
                default:
                    gTable.settings.tableId = 'tableid';
            }
        } else {
            gTable.settings.tableId = elements;
        }

        gTable.settings.disableSearch = Boolean(disabled);

        if (gTable.settings.tableId) {
            gTable.tableNode =
                document.getElementById(gTable.settings.tableId);

            if (!gTable.tableNode) {
                throw 'No table node found';
            }
        }

        if (gTable.settings.tableLoadingDivId) {
            gTable.tableLoadingNode =
                document.getElementById(gTable.settings.tableLoadingDivId);

            if (!gTable.tableLoadingNode) {
                throw 'No table laoding div node found';
            }
        }

        if (gTable.settings.tableDivId) {
            gTable.tableDivNode =
                document.getElementById(gTable.settings.tableDivId);

            if (!gTable.tableDivNode) {
                throw 'No table container node found';
            }
        }

        return gTable;
    };

    gTable.draw = function() {
        var inputNode,
            selectNode,
            settings;

        settings = gTable.settings;

        function _stateLoadFunc(s, d) {
            if (settings.disableSearch && d.search.search.length > 0) {
                gTable.oldSearch = d.search.search;
                d.search.search = '';
            }
        }

        function _observeMutations() {
            var observer,
                observerConfig,
                target;

            observer = new MutationObserver(function(events) {
                events.forEach(function(event) {
                    target = event.target || event.srcElement;
                    if (target === inputNode &&
                            event.attributeName === 'disabled') {

                        if (gTable.oldSearch) {
                            gTable.tTable
                                .search(gTable.oldSearch, true, true).draw();
                            gTable.oldSearch = null;
                        }
                    }
                });
                observer.disconnect();
            });
            observerConfig = {
                attributes: true,
                attributeOldValue: true
            };
            observer.observe(inputNode, observerConfig);
        }

        gTable.tTable = $('#' + settings.tableId).DataTable({
            dom: settings.dom,
            paging: settings.paging,
            info: settings.info,
            language: {
                lengthMenu: settings.language.lengthMenu,
                zeroRecords: settings.language.zeroRecords,
                search: settings.language.search,
                searchPlaceholder: 'Filter the results'
            },
            lengthMenu: settings.lengthMenu,
            order: settings.order,
            deferRender: true,
            ordering: true,
            stateSave: true,
            stateDuration: -1,
            processing: true,
            search: settings.search,
            initComplete: function() {
                if (gTable.tableLoadingNode) {
                    $(gTable.tableLoadingNode).remove();
                }
                if (gTable.tableDivNode) {
                    $(gTable.tableDivNode).fadeIn('slow', 'linear');
                }
            },
            data: settings.data,
            columns: settings.columns,
            stateLoadParams: _stateLoadFunc
        });

        inputNode = gTable.tableDivNode.querySelector('input.input-sm');
        selectNode = gTable.tableDivNode.querySelector('select.input-sm');

        if (inputNode) {
            // Remove focus from input when Esc is pressed.
            inputNode.addEventListener('keyup', removeFocus);

            // Disable search box.
            if (settings.disableSearch) {
                inputNode.setAttribute('disabled', true);
            }
        }

        if (selectNode) {
            // Remove focus from the table length selection on Esc.
            selectNode.addEventListener('keyup', removeFocus);
        }

        if (settings.clickFunc) {
            gTable.tTable.on('click', 'tbody tr', settings.clickFunc);
        } else {
            gTable.tTable.on('click', 'tbody tr', function() {
                var localTable,
                    location,
                    substitutions;

                localTable = gTable.tTable.row(this).data();
                location = '#';
                substitutions = {};

                if (localTable) {
                    settings.rowURLElements.forEach(function(value) {
                        substitutions[value] = localTable[value] || null;
                    });

                    location = sprintf(settings.rowURL, substitutions);
                    if (!settings.noIdURL && localTable._id !== null) {
                        location += '?_id=' + localTable._id.$oid;
                    }
                }
                window.location = location;
            });
        }

        gTable.tTable.on('search.dt', function() {
            if (settings.disableSearch && gTable.oldSearch !== null) {
                if (window.MutationObserver) {
                    if (inputNode.getAttribute('disabled')) {
                        _observeMutations();
                    }
                } else {
                    // No support for MutationObserver.
                    gTable.tTable.search(gTable.oldSearch, true, true).draw();
                }
            }
        });

        return gTable;
    };

    gTable.search = function(value) {
        var inputNode;

        inputNode =
            gTable.tableDivNode.querySelector('input.input-sm');

        if (inputNode && inputNode.disabled) {
            inputNode.removeAttribute('disabled');
        }

        if (value !== null && value !== undefined) {
            gTable.oldSearch = null;
            gTable.tTable.search(value, true, true).draw();
        }

        return gTable;
    };

    gTable.pageLen = function(value) {
        var len;

        if (value !== null && value !== undefined) {
            len = Number(value);
            if (isNaN(len)) {
                len = gTable.settings.lengthMenu[0];
            }
            gTable.tTable.page.len(len).draw();
        }

        return gTable;
    };

    gTable.columns = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.columns = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.columns;
        }

        return returnData;
    };

    gTable.order = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.order = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.order;
        }

        return returnData;
    };

    gTable.data = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.data = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.data;
        }

        return returnData;
    };

    gTable.rowURL = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.rowURL = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.rowURL;
        }

        return returnData;
    };

    gTable.rowURLElements = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.rowURLElements = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.rowURLElements;
        }

        return returnData;
    };

    gTable.languageLengthMenu = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.language.lengthMenu = sprintf(gMenuFmt, value);
            returnData = gTable;
        } else {
            returnData = gTable.settings.language.lengthMenu;
        }

        return returnData;
    };

    gTable.languageZeroRecords = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.language.zeroRecords = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.language.zeroRecords;
        }

        return returnData;
    };

    gTable.noIdURL = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.noIdURL = Boolean(value);
            returnData = gTable;
        } else {
            returnData = gTable.settings.noIdURL;
        }

        return returnData;
    };

    gTable.paging = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.paging = Boolean(value);
            returnData = gTable;
        } else {
            returnData = gTable.settings.paging;
        }

        return returnData;
    };

    gTable.info = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.info = Boolean(value);
            returnData = gTable;
        } else {
            returnData = gTable.settings.info;
        }

        return returnData;
    };

    gTable.lengthMenu = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.lengthMenu = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.lengthMenu;
        }

        return returnData;
    };

    /**
     * Get or set the table-DOM: the HTML structure of the table itself.
     *
     * @param {string} value: The table-DOM.
    **/
    gTable.dom = function(value) {
        var returnData;

        if (value !== null && value !== undefined) {
            gTable.settings.dom = value;
            returnData = gTable;
        } else {
            returnData = gTable.settings.dom;
        }

        return returnData;
    };

    /**
     * Get or set the row click function.
    **/
    gTable.clickFunction = function(value) {
        var returnData;

        returnData = gTable.settings.clickFunc;
        if (value !== null && value !== undefined) {
            gTable.settings.clickFunc = value;
            returnData = gTable;
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
    gTable.addRows = function(value) {
        gTable.tTable.rows.add(value).draw();
    };

    return gTable;
});
