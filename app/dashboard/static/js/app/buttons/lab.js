/*!
 * kernelci dashboard.
 *
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
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
    var gLabButtons,
        gStrings;

    gLabButtons = {};

    gStrings = {
        show_class: 'fa fa-eye',
        hide_class: 'fa fa-eye-slash',
        lab_show_tooltip: 'Show content of lab &#171;%s&#187;',
        lab_hide_tooltip: 'Hide content of lab &#171;%s&#187;',
        lab_hidden: 'Content of lab &#171;%s&#187; hidden. ' +
            'Use the <i class="fa fa-eye"></i> button to show it again.'
    };

    gLabButtons.createShowHideLabBtn = function(element, action) {
        var elementClass,
            iNode,
            title,
            tooltipNode;

        elementClass = gStrings.show_class;
        title = gStrings.lab_show_tooltip;

        if (action === 'hide') {
            elementClass = gStrings.hide_class;
            title = gStrings.lab_hide_tooltip;
        }

        tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', sprintf(title, element));

        iNode = document.createElement('i');
        iNode.setAttribute('data-id', element);
        iNode.setAttribute('data-action', action);
        iNode.className = 'lab-click-btn ' + elementClass;

        tooltipNode.appendChild(iNode);

        return tooltipNode;
    };

    /**
     * Function that show/hide a lab section.
     *
     * @param {Event} event: The event that triggers this function.
    **/
    gLabButtons.showHideLab = function(event) {
        var accordion,
            element,
            elementId,
            parent,
            smallNode;

        element = event.target || event.srcElement;
        parent = element.parentNode;
        elementId = element.getAttribute('data-id');
        accordion = document.getElementById('accordion-' + elementId);

        if (element.getAttribute('data-action') === 'hide') {
            accordion.style.setProperty('display', 'none');
            element.setAttribute('data-action', 'show');

            smallNode = document.createElement('small');
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

    return gLabButtons;
});
