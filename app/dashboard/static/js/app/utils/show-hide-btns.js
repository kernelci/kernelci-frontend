/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'utils/html',
    'sprintf'
], function($, html) {
    'use strict';
    var gButtons,
        gDom,
        gStrings,
        gTableColSpan;

    gButtons = {};
    // The number of columns in the bisect table.
    gTableColSpan = 4;
    gDom = {
        help_c_row_id: 'bisect-comapre-hidden-help',
        help_row_id: 'bisect-hidden-help',
        help_c_row_class: 'bisect-compare-hidden-row',
        help_row_class: 'bisect-hidden-row',
        minus_c_id: 'minus-compare-button',
        minus_id: 'minus-button',
        plus_c_id: 'plus-compare-button',
        plus_id: 'plus-button'
    };

    gStrings = {
        bisect_show_tooltip: 'Show content of default bisect',
        bisect_hide_tooltip: 'Hide content of default bisect',
        bisect_c_show_tooltip:
            'Show content of bisect compared to &#171;%s&#187;',
        bisect_c_hide_tooltip:
            'Hide content of bisect compared to &#171;%s&#187;',
        bisect_rows_hidden_text:
            '%d out of %d rows hidden. Use the <strong>&#43;</strong> ' +
            'button on the right to show them.',
        bisect_hidden_text: 'Content of default bisection hidden. ' +
            'Use the <i class="fa fa-eye"></i> button to show it again.',
        bisect_c_hidden_text: 'Content of bisection compared to ' +
            '&#171;%s&#187; hidden. Use the <i class="fa fa-eye"></i> ' +
            'button to show it again.',
        show_class: 'fa fa-eye',
        hide_class: 'fa fa-eye-slash',
        lab_show_tooltip: 'Show content of lab &#171;%s&#187;',
        lab_hide_tooltip: 'Hide content of lab &#171;%s&#187;',
        lab_hidden: 'Content of lab &#171;%s&#187; hidden. ' +
            'Use the <i class="fa fa-eye"></i> button to show it again.'
    };

    /**
     * Show only elements that have don't have a display style of none.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function _showElement(element) {
        if (element.style.display !== 'none') {
            element.style.setProperty('display', 'block');
        }
    }

    /**
     * Hide an element which display style is 'block'.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function _hideElement(element) {
        if (element.style.display === 'block') {
            element.style.setProperty('display', 'none');
        }
    }

    /**
     * Apply a display style of 'block' to the element.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function _showAllElement(element) {
        element.style.setProperty('display', 'block');
    }

    /**
     * Apply a display style of 'none' to the element.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function _hideAllElement(element) {
        element.style.setProperty('display', 'none');
    }

    /**
     * Show only the elements that don't have a display=block attribute.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function _showVisibleByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), _showElement);
    }

    /**
     * Hide only elements that have a display=block attribute.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function _hideVisibleByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), _hideElement);
    }

    /**
     * Show all elements by their class name.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function _showAllByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), _showAllElement);
    }

    /**
     * Hide all elements identified by a class name.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function _hideAllByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), _hideAllElement);
    }

    /**
     * Verify which button is pressed and show the correct elements.
     *
     * This is only used internally with the drop-down list of options to
     * show and hide builds/boots with errors/warnings.
     *
     * @private
    **/
    function _checkButtonStatus() {
        var failBtn,
            successBtn,
            unknownBtn;

        successBtn = document.getElementById('success-btn');
        failBtn = document.getElementById('fail-btn');
        unknownBtn = document.getElementById('unknown-btn');

        if (html.classed(successBtn, 'active')) {
            _showAllByClass('df-success');
        } else if (html.classed(failBtn, 'active')) {
            _showAllByClass('df-failed');
        } else if (html.classed(unknownBtn, 'active')) {
            _showAllByClass('df-unknown');
        } else {
            _showAllByClass('df-failed');
            _showAllByClass('df-success');
            _showAllByClass('df-unknown');
        }
    }

    /**
     * Remove the hidden class from an element.
     * Internally used.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function _removeHidden(element) {
        html.removeClass(element, 'hidden');
    }

    /**
     * Simulate a click on the bisect button to show less lines.
     *
     * @param {boolean} compared: If this is a comparison bisection.
    **/
    gButtons.triggerMinusBisectBtns = function(compared) {
        if (compared) {
            document.getElementById(gDom.minus_c_id).click();
        } else {
            document.getElementById(gDom.minus_id).click();
        }
    };

    /**
     * Create the +/- button to show/hide bisection lines.
     *
     * @param {number} rows: The total number of rows.
     * @param {string} tableId: The ID of the table.
     * @param {Boolean} compared: If this is for a comparison bisection.
     * @return {string} The HTML of the buttons.
    **/
    gButtons.createPlusMinBisectBtn = function(rows, tableId, compared) {
        var buttonNode,
            dataType,
            divNode,
            minusId,
            plusId;

        plusId = gDom.plus_id;
        minusId = gDom.minus_id;
        dataType = 'default';

        if (compared) {
            dataType = 'compare';
            plusId = gDom.plus_c_id;
            minusId = gDom.minus_c_id;
        }

        divNode = document.createElement('div');
        divNode.className = 'btn-group btn-group-sm';
        divNode.setAttribute('role', 'group');

        buttonNode = document.createElement('button');
        buttonNode.id = plusId;
        buttonNode.type = 'button';
        buttonNode.title = 'Show more bisect results';
        buttonNode.className = 'bisect-pm-btn-more btn btn-default';
        buttonNode.setAttribute('data-action', 'more');
        buttonNode.setAttribute('data-table', tableId);
        buttonNode.setAttribute('data-rows', rows);
        buttonNode.setAttribute('data-type', dataType);
        // The + sign.
        buttonNode.insertAdjacentHTML('beforeend', '&#43;');

        divNode.appendChild(buttonNode);

        buttonNode = document.createElement('button');
        buttonNode.id = minusId;
        buttonNode.type = 'button';
        buttonNode.title = 'Show less bisect results';
        buttonNode.className = 'bisect-pm-btn-less btn btn-default';
        buttonNode.setAttribute('data-action', 'less');
        buttonNode.setAttribute('data-table', tableId);
        buttonNode.setAttribute('data-rows', rows);
        buttonNode.setAttribute('data-type', dataType);
        // The - sign.
        buttonNode.insertAdjacentHTML('beforeend', '&#8722;');

        divNode.appendChild(buttonNode);
        // TODO: need to fix bisect and pass the node instead of the HTML.
        return divNode.outerHTML;
    };

    /**
     * Function called to hide bisect table rows.
     * The triggering element must contain the following data attributes:
     *
     * data-table: The ID of the table element.
     * data-rows: The total number of rows.
     * data-type: The type of bisection ('default' or 'compare').
     *
     * @param {Event} event: The triggering event.
    **/
    gButtons.showLessBisectRowsBtn = function(event) {
        var bisectType,
            element,
            hiddenClass,
            minusId,
            newCell,
            newRow,
            plusId,
            rowId,
            rows,
            smallNode,
            tableRef,
            toShow;

        element = event.target || event.srcElement;

        bisectType = element.getAttribute('data-type');
        rows = parseInt(element.getAttribute('data-rows'), 10);
        tableRef = document.getElementById(element.getAttribute('data-table'));

        // Only show 4 rows and hide all the others.
        toShow = [1, 2, rows - 1, rows];
        hiddenClass = gDom.help_row_class;
        rowId = gDom.help_row_id;
        plusId = gDom.plus_id;
        minusId = gDom.minus_id;

        if (bisectType === 'compare') {
            rowId = gDom.help_c_row_id;
            hiddenClass = gDom.help_c_row_class;
            plusId = gDom.plus_c_id;
            minusId = gDom.minus_c_id;
        }

        [].forEach.call(
            tableRef.querySelectorAll('tbody > tr'),
            function(row) {
                if (toShow.indexOf(row.rowIndex) === -1) {
                    html.addClass(row, 'hidden');
                    html.addClass(row, hiddenClass);
                }
            }
        );

        document.getElementById(plusId).removeAttribute('disabled');
        document.getElementById(minusId).setAttribute('disabled', 'disable');

        newRow = tableRef.insertRow(3);
        newRow.id = rowId;
        newCell = newRow.insertCell();
        newCell.colSpan = gTableColSpan;
        newCell.className = 'pull-center';

        smallNode = document.createElement('small');
        smallNode.insertAdjacentHTML(
            'beforeend',
            sprintf(gStrings.bisect_rows_hidden_text, (rows - 4), rows));

        newCell.appendChild(smallNode);
    };

    /**
     * Show again the hidden bisection row.
     * The tiggering element must contain the 'data-type'.
     * data-type: the type of bisection ('default' or 'compare').
     *
     * @param {Event} event: The triggering event.
    **/
    gButtons.showMoreBisectRowsBtn = function(event) {
        var element,
            minusId,
            plusId,
            rowClass,
            rowId;

        element = event.target || event.srcElement;

        rowClass = gDom.help_row_class;
        rowId = gDom.help_row_id;
        minusId = gDom.minus_id;
        plusId = gDom.plus_id;

        if (element.getAttribute('data-type') === 'compare') {
            rowId = gDom.help_c_row_id;
            rowClass = gDom.help_c_row_class;
            plusId = gDom.plus_c_id;
            minusId = gDom.minus_c_id;
        }

        html.removeElement(document.getElementById(rowId));
        [].forEach.call(
            document.getElementsByClassName(rowClass), _removeHidden);
        document.getElementById(minusId).removeAttribute('disabled');
        document.getElementById(plusId).setAttribute('disabled', 'disable');
    };

    /**
     * Create the "eye" button to show/hide the bisect section.
     *
     * @param {string} elementId: The Id of the element that should contain the
     * button.
     * @param {string} targetId: The ID of the element that should be shown or
      * hidden.
     * @param {string} action: The action to take: 'show' or 'hide'.
     * @param {string} compareTo: The name of the compared tree or null.
    **/
    gButtons.createShowHideBisectBtn = function(
            elementId, targetId, action, compareTo) {
        var className,
            title,
            tooltipNode,
            iNode;

        className = gStrings.show_class;
        title = gStrings.bisect_show_tooltip;

        if (action === 'show' && compareTo) {
            title = sprintf(gStrings.bisect_c_show_tooltip, compareTo);
        } else if (action === 'hide') {
            className = gStrings.hide_class;

            if (compareTo) {
                title = sprintf(
                    gStrings.bisect_c_hide_tooltip, compareTo);
            } else {
                title = gStrings.bisect_hide_tooltip;
            }
        }

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', title);

        iNode = document.createElement('i');
        iNode.setAttribute('data-action', action);
        iNode.setAttribute('data-id', elementId);
        iNode.setAttribute('data-sh', targetId);
        iNode.setAttribute('data-compared', compareTo);
        iNode.className = 'bisect-click-btn ' + className;

        tooltipNode.appendChild(iNode);
        // TODO: fix where this is called and return the DOM node.
        return tooltipNode.outerHTML;
    };

    /**
     * Event function to show/hide a bisect section.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gButtons.showHideBisect = function(event) {
        var compared,
            element,
            elementId,
            parent,
            smallNode,
            title;

        element = event.target || event.srcElement;
        parent = element.parentNode;
        compared = element.getAttribute('data-compared');
        elementId = element.getAttribute('data-id');
        title = gStrings.bisect_show_tooltip;

        if (element.getAttribute('data-action') === 'hide') {
            element.setAttribute('data-action', 'show');
            html.removeClass(element, gStrings.hide_class);
            html.addClass(element, gStrings.show_class);
            html.addClass(document.getElementById(
                element.getAttribute('data-sh')), 'hidden');

            smallNode = document.createElement('small');
            if (compared === 'null') {
                smallNode.insertAdjacentHTML(
                    'beforeend', gStrings.bisect_hidden_text);
            } else {
                title = sprintf(
                    gStrings.bisect_c_show_tooltip, compared);

                smallNode.insertAdjacentHTML(
                    'beforeend',
                    sprintf(gStrings.bisect_c_hidden_text, compared));
            }

            html.replaceContent(
                document.getElementById('view-' + elementId),
                smallNode);
        } else {
            if (compared === 'null') {
                title = gStrings.bisect_hide_tooltip;
            } else {
                title = sprintf(gStrings.bisect_c_hide_tooltip, compared);
            }

            element.setAttribute('data-action', 'hide');
            html.removeClass(element, gStrings.show_class);
            html.addClass(element, gStrings.hide_class);
            html.removeClass(
                document.getElementById(element.getAttribute('data-sh')),
                'hidden');

            html.removeChildren(document.getElementById('view-' + elementId));
        }

        $(parent)
            .tooltip('hide')
            .attr('data-original-title', title)
            .tooltip('fixTitle');
    };

    gButtons.createShowHideLabBtn = function(element, action) {
        var elementClass,
            title;

        elementClass = gStrings.show_class;
        title = gStrings.lab_show_tooltip;

        if (action === 'hide') {
            elementClass = gStrings.hide_class;
            title = gStrings.lab_hide_tooltip;
        }

        var tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', sprintf(title, element));

        var iNode = document.createElement('i');
        iNode.setAttribute('data-id', element);
        iNode.setAttribute('data-action', action);
        iNode.className = 'lab-click-btn ' + elementClass;

        tooltipNode.appendChild(iNode);

        // TODO: fix where this is called and return the node.
        return tooltipNode.outerHTML;
    };

    /**
     * Function that show/hide a lab section.
     *
     * @param {Event} event: The event that triggers this function.
    **/
    gButtons.showHideLab = function(event) {
        var accordion,
            element,
            elementId,
            parent;

        element = event.target || event.srcElement;
        parent = element.parentNode;
        elementId = element.getAttribute('data-id');
        accordion = document.getElementById('accordion-' + elementId);

        if (element.getAttribute('data-action') === 'hide') {
            accordion.style.setProperty('display', 'none');
            element.setAttribute('data-action', 'show');

            var smallNode = document.createElement('small');
            smallNode.insertAdjacentHTML(
                'beforeend', sprintf(gStrings.lab_hidden, elementId));

            html.replaceContent(
                document.getElementById('view-' + elementId), smallNode);

            html.removeClass(element, gStrings.hide_class);
            html.addClass(element, gStrings.show_class);

            $(parent).tooltip('destroy')
                .attr(
                    'data-original-title',
                    sprintf(gStrings.lab_show_tooltip, elementId))
                .tooltip('fixTitle');
        } else {
            accordion.style.setProperty('display', 'block');
            element.setAttribute('data-action', 'hide');

            html.removeChildren(document.getElementById('view-' + elementId));

            html.removeClass(element, 'fa-eye');
            html.addClass(element, 'fa-eye-slash');

            $(parent).tooltip('destroy')
                .attr(
                    'data-original-title',
                    sprintf(gStrings.lab_hide_tooltip, elementId))
                .tooltip('fixTitle');
        }
    };

    /**
     * Function to show/hide failed/successfull/unknown classed elements.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gButtons.showHideElements = function(event) {
        var element,
            target;

        function _makeActiveInactive(child) {
            if (child === target) {
                html.addClass(target, 'active');
            } else {
                html.removeClass(child, 'active');
            }
        }

        element = event.target || event.srcElement;

        // If we click on the graph lagend, we might click not directly into
        // the cell itself, but on the number, that does not have an id set.
        // Look for its parent node that is the cell.
        if (!element.id) {
            element = element.parentElement;
        }

        switch (element.id) {
            case 'success-cell':
                target = document.getElementById('success-btn');
                if (!target.hasAttribute('disabled')) {
                    _hideAllByClass('df-failed');
                    _showAllByClass('df-success');
                    _showAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'success-btn':
                _hideAllByClass('df-failed');
                _showAllByClass('df-success');
                _hideAllByClass('df-unknown');
                break;
            case 'fail-cell':
                target = document.getElementById('fail-btn');
                if (!target.hasAttribute('disabled')) {
                    _showAllByClass('df-failed');
                    _hideAllByClass('df-success');
                    _hideAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'fail-btn':
                _showAllByClass('df-failed');
                _hideAllByClass('df-success');
                _hideAllByClass('df-unknown');
                break;
            case 'unknown-cell':
                target = document.getElementById('unknown-btn');
                if (!target.hasAttribute('disabled')) {
                    _hideAllByClass('df-failed');
                    _hideAllByClass('df-success');
                    _showAllByClass('df-unknown');

                    [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                }
                break;
            case 'unknown-btn':
                _hideAllByClass('df-failed');
                _hideAllByClass('df-success');
                _showAllByClass('df-unknown');
                break;
            default:
                _showAllByClass('df-failed');
                _showAllByClass('df-success');
                _showAllByClass('df-unknown');

                target = document.getElementById('all-btn');
                [].forEach.call(
                        target.parentElement.children, _makeActiveInactive);
                break;
        }
    };

    /**
     * Function to show/hide elements based on the warnings/errors they have.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gButtons.showHideWarnErr = function(event) {
        var element,
            view;

        element = event.target || event.srcElement;
        view = element.getAttribute('data-view');

        // First make sure that what we have to see or hide has a default
        // style attribute, then hide or show it.
        switch (view) {
            case 'warnings':
                _checkButtonStatus();
                _showVisibleByClass('df-w');
                _hideVisibleByClass('df-e');
                _hideVisibleByClass('df-w-e');
                _hideVisibleByClass('df-no-w-no-e');
                break;
            case 'errors':
                _checkButtonStatus();
                _hideVisibleByClass('df-w');
                _showVisibleByClass('df-e');
                _hideVisibleByClass('df-w-e');
                _hideVisibleByClass('df-no-w-no-e');
                break;
            case 'warnings-errors':
                _checkButtonStatus();
                _hideVisibleByClass('df-w');
                _hideVisibleByClass('df-e');
                _showVisibleByClass('df-w-e');
                _hideVisibleByClass('df-no-w-no-e');
                break;
            case 'no-warnings-no-errors':
                _checkButtonStatus();
                _hideVisibleByClass('df-w');
                _hideVisibleByClass('df-e');
                _hideVisibleByClass('df-w-e');
                _showVisibleByClass('df-no-w-no-e');
                break;
            default:
                _checkButtonStatus();
                break;
        }
    };

    return gButtons;
});
