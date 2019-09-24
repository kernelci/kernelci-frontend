/*!
 * Copyright (C) Linaro Limited 2015,2016,2017,2019
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
    'utils/html',
    'sprintf'
], function($, html) {
    'use strict';
    var gBisectButtons;
    var gDom;
    var gStrings;
    var gTableColSpan;

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
        show_class: ['fa', 'fa-eye'],
        hide_class: ['fa', 'fa-eye-slash']
    };

    gBisectButtons = {};

    /**
     * Remove the hidden class from an element.
     * Internally used.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function removeHidden(element) {
        html.removeClass(element, 'hidden');
    }

    /**
     * Simulate a click on the bisect button to show less lines.
     *
     * @param {boolean} compared: If this is a comparison bisection.
    **/
    gBisectButtons.minusClick = function(compared) {
        var element;
        if (compared) {
            element = document.getElementById(gDom.minus_c_id);
            if (element) {
                element.click();
            }
        } else {
            element = document.getElementById(gDom.minus_id);
            if (element) {
                element.click();
            }
        }
    };

    /**
     * Event function to show/hide a bisect section.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gBisectButtons.showHideEvent = function(event) {
        var compared;
        var element;
        var elementId;
        var frag;
        var parent;
        var smallNode;
        var title;

        element = event.target || event.srcElement;
        parent = element.parentNode;
        compared = element.getAttribute('data-compared');
        elementId = element.getAttribute('data-id');
        title = gStrings.bisect_show_tooltip;

        if (element.getAttribute('data-action') === 'hide') {
            element.setAttribute('data-action', 'show');
            html.removeClasses(element, gStrings.hide_class);
            html.addClasses(element, gStrings.show_class);
            html.addClass(document.getElementById(
                element.getAttribute('data-sh')), 'hidden');

            frag = document.createDocumentFragment();
            smallNode = frag.appendChild(document.createElement('small'));
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
                document.getElementById('view-' + elementId), frag);
        } else {
            if (compared === 'null') {
                title = gStrings.bisect_hide_tooltip;
            } else {
                title = sprintf(gStrings.bisect_c_hide_tooltip, compared);
            }

            element.setAttribute('data-action', 'hide');
            html.removeClasses(element, gStrings.show_class);
            html.addClasses(element, gStrings.hide_class);
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

    /**
     * Create the +/- button to show/hide bisection lines.
     *
     * @param {number} rows: The total number of rows.
     * @param {string} tableId: The ID of the table.
     * @param {Boolean} compared: If this is for a comparison bisection.
     * @return {string} The HTML of the buttons.
    **/
    gBisectButtons.plusMinButton = function(rows, tableId, compared) {
        var buttonNode;
        var dataType;
        var divNode;
        var frag;
        var minusId;
        var plusId;

        frag = document.createDocumentFragment();

        plusId = gDom.plus_id;
        minusId = gDom.minus_id;
        dataType = 'default';

        if (compared) {
            dataType = 'compare';
            plusId = gDom.plus_c_id;
            minusId = gDom.minus_c_id;
        }

        divNode = frag.appendChild(document.createElement('div'));
        divNode.className = 'btn-group btn-group-sm';
        divNode.setAttribute('role', 'group');

        buttonNode = divNode.appendChild(document.createElement('button'));
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

        buttonNode = divNode.appendChild(document.createElement('button'));
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

        return frag;
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
    gBisectButtons.lessRowsEvent = function(event) {
        var bisectType;
        var element;
        var frag;
        var hiddenClass;
        var minusId;
        var newCell;
        var newRow;
        var plusId;
        var rowId;
        var rows;
        var smallNode;
        var tableRef;
        var toShow;

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

        Array.prototype.forEach.call(
            tableRef.querySelectorAll('tbody > tr'),
            function(row) {
                if (toShow.indexOf(row.rowIndex) === -1) {
                    html.addClasses(row, ['hidden', hiddenClass]);
                }
            }
        );

        document.getElementById(plusId).removeAttribute('disabled');
        document.getElementById(minusId).setAttribute('disabled', 'disable');

        frag = document.createDocumentFragment();
        newCell = frag.appendChild(document.createElement('td'));
        newCell.colSpan = gTableColSpan;
        newCell.className = 'pull-center';

        smallNode = newCell.appendChild(document.createElement('small'));
        smallNode.insertAdjacentHTML(
            'beforeend',
            sprintf(gStrings.bisect_rows_hidden_text, (rows - 4), rows));

        newRow = tableRef.insertRow(3);
        newRow.id = rowId;
        newRow.appendChild(frag);
    };

    /**
     * Show again the hidden bisection row.
     * The tiggering element must contain the 'data-type'.
     * data-type: the type of bisection ('default' or 'compare').
     *
     * @param {Event} event: The triggering event.
    **/
    gBisectButtons.moreRowsEvent = function(event) {
        var element;
        var minusId;
        var plusId;
        var rowClass;
        var rowId;

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
        Array.prototype.forEach.call(
            document.getElementsByClassName(rowClass), removeHidden);
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
    gBisectButtons.showHideButton = function(
            elementId, targetId, action, compareTo) {
        var classes;
        var frag;
        var iNode;
        var title;
        var tooltipNode;

        classes = gStrings.show_class;
        title = gStrings.bisect_show_tooltip;
        frag = document.createDocumentFragment();

        if (action === 'show' && compareTo) {
            title = sprintf(gStrings.bisect_c_show_tooltip, compareTo);
        } else if (action === 'hide') {
            classes = gStrings.hide_class;

            if (compareTo) {
                title = sprintf(
                    gStrings.bisect_c_hide_tooltip, compareTo);
            } else {
                title = gStrings.bisect_hide_tooltip;
            }
        }

        tooltipNode = frag.appendChild(html.tooltip());
        tooltipNode.setAttribute('title', title);

        iNode = tooltipNode.appendChild(document.createElement('i'));
        iNode.setAttribute('data-action', action);
        iNode.setAttribute('data-id', elementId);
        iNode.setAttribute('data-sh', targetId);
        iNode.setAttribute('data-compared', compareTo);
        iNode.className = 'bisect-click-btn';
        html.addClasses(iNode, classes);

        return frag;
    };

    return gBisectButtons;
});
