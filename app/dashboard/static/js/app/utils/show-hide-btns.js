/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery',
    'sprintf',
    'utils/base',
    'utils/html'
], function($, p, b, html) {
    'use strict';
    var btns,
        gDom,
        gStrings,
        sHiddenLab,
        sHideBisectComparedTooltip,
        sHideBisectTooltip,
        sHideFaCls,
        sHideLabTooltip,
        sShowBisectComparedTooltip,
        sShowBisectTooltip,
        sShowFaCls,
        sShowLabTooltip,
        sBisectHiddenText,
        sBisectComparedHiddenText,
        bisectColSpan;

    btns = {};
    // The number of columns in the bisect table.
    bisectColSpan = 4;
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
            'Hide content of bisect compared to &#171;%s&#187;'
    };

    sBisectComparedHiddenText = 'Content of bisection compared to ' +
        '&#171;%s&#187; hidden. Use the ' +
        '<i class="fa fa-eye"></i> button to show it again.';
    sBisectHiddenText = 'Content of default bisection hidden. ' +
        'Use the <i class="fa fa-eye"></i> button to show it again.';
    sShowBisectTooltip = 'Show content of default bisect';
    sHideBisectTooltip = 'Hide content of default bisect';
    sShowBisectComparedTooltip = 'Show content of bisect ' +
        'compared to &#171;%s&#187;';
    sHideBisectComparedTooltip = 'Hide content of bisect ' +
        'compared to &#171;%s&#187;';
    sShowLabTooltip = 'Show contents of lab «%s»';
    sHideLabTooltip = 'Hide contents of lab «%s»';
    sHiddenLab = '<small>Content of lab &#171;%s&#187; hidden. ' +
        'Use the <i class="fa fa-eye"></i> button to show it again.</small>';
    sShowFaCls = 'fa fa-eye';
    sHideFaCls = 'fa fa-eye-slash';

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

    // Simulate a click on the bisect - button.
    btns.triggerMinusBisectBtns = function(compared) {
        if (compared) {
            $('#' + gDom.minus_c_id).trigger('click');
        } else {
            $('#' + gDom.minus_id).trigger('click');
        }
    };

    btns.createPlusMinBisectBtn = function(numEl, tableId, compared) {
        var dataType,
            min,
            minId,
            plus,
            plusId;

        plusId = gDom.plus_id;
        minId = gDom.minus_id;
        dataType = 'default';

        if (compared) {
            dataType = 'compare';
            plusId = gDom.plus_c_id;
            minId = gDom.minus_c_id;
        }

        plus = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show all bisect results">' +
            '<button id="' + plusId + '" type="button" ' +
            'class="bisect-pm-btn-more btn btn-default" ' +
            'data-action="more" ' +
            'data-table="' + tableId + '" data-rows="' + numEl +
            '" data-type="' + dataType + '">' +
            '<i class="fa fa-plus"></i>' +
            '</button>' +
            '</span>';
        min = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show less bisect results">' +
            '<button id="' + minId + '" type="button" ' +
            'class="bisect-pm-btn-less btn btn-default"' +
            'data-action="less" ' +
            'data-table="' + tableId + '" data-rows="' + numEl +
            '" data-type="' + dataType + '">' +
            '<i class="fa fa-minus"></i>' +
            '</button>' +
            '</span>';
        return plus + '&nbsp;' + min;
    };

    // Function called to hide bisect table rows.
    // The triggering element must contain the following data attributes:
    // data-table: the ID of the table element
    // data-rows: the total number of rows
    // data-type: the type of bisect (default or compare)
    btns.showLessBisectRowsBtn = function(event) {
        var that = this,
            data = that.dataset,
            type = data.type,
            rows = parseInt(data.rows, 10),
            table = data.table,
            rowText = '',
            newRow = '',
            row = null,
            rowIndex = 0,
            // Only show 4 rows and hide all the others.
            elementsToShow = [1, 2, rows - 1, rows],
            bisectHiddenClass = gDom.help_row_class,
            helpRowId = gDom.help_row_id,
            plusId = gDom.plus_id,
            minusId = gDom.minus_id,
            plusButton = '<i class="fa fa-plus"></i>',
            element;

        element = event.target || event.srcElement;

        if (type === 'compare') {
            helpRowId = gDom.help_c_row_id;
            bisectHiddenClass = gDom.help_c_row_class;
            plusId = gDom.plus_c_id;
            minusId = gDom.minus_c_id;
        }

        rowText = (rows - 4) + ' out of ' + rows + ' rows hidden. Use the ' +
            plusButton + ' button on the right to show them.';
        newRow = '<tr id="' + helpRowId + '">' +
            '<td class="pull-center" colspan="' + bisectColSpan + '">' +
            '<small>' + rowText + '</small></td></tr>';

        $('#' + table + ' > tbody > tr').each(function() {
            row = $(this);
            rowIndex = row.context.rowIndex;
            if (elementsToShow.indexOf(rowIndex) === -1) {
                row.addClass('hidden').addClass(bisectHiddenClass);
            }
        });
        document.getElementById(plusId).removeAttribute('disabled');
        document.getElementById(minusId).setAttribute('disabled', 'disable');
        // Add the row with the help text as the 3rd row.
        $('#' + table + ' tbody > tr:nth-child(2)').after(newRow);
    };

    // Function called to show again the hidden bisect row.
    // The triggering element must contain at least the following data
    // attributes:
    // 'data-type': the type of bisect (default or compare)
    /**
     * Show agaim the hidden bisection row.
     * The tiggering element must contain the 'data-type'.
     * data-type: the type of bisection ('default' or 'compare').
     *
     * @param {Event} event: The triggering event.
    **/
    btns.showMoreBisectRowsBtn = function(event) {
        var element,
            minusId,
            plusId,
            rowClass,
            rowId;

        element = element.target || event.srcElement;

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
            document.getElementsByClassName(rowClass),
            function(value) {
                html.removeClass(value, 'hidden');
            }
        );
        document.getElementById(minusId).removeAttribute('disabled');
        document.getElementById(plusId).setAttribute('disabled', 'disable');
    };

    // Create the "eye" button to show/hide the bisect table and summary.
    // `element`: The ID of the element that should contain the button.
    // `toSH`: The ID of the element that should be shown/hidden.
    // `action`: The action to take: can be 'show' or 'hide'.
    // `compareTo`: The name of the compare tree or null.
    btns.createShowHideBisectBtn = function(element, toSH, action, compareTo) {
        var faClass = sShowFaCls,
            tooltipTitle = sShowBisectTooltip;

        if (action === 'show' && compareTo !== null) {
            tooltipTitle = p.sprintf(sShowBisectComparedTooltip, compareTo);
        } else if (action === 'hide') {
            faClass = sHideFaCls;
            if (compareTo === null) {
                tooltipTitle = sHideBisectTooltip;
            } else {
                tooltipTitle = p.sprintf(
                    sHideBisectComparedTooltip, compareTo);
            }
        }
        return '<span rel="tooltip" data-toggle="tooltip"' +
            'title="' + tooltipTitle + '"><i data-action="' + action + '" ' +
            'data-id="' + element + '" data-sh="' + toSH + '" ' +
            'data-compared="' + compareTo + '" ' +
            'class="bisect-click-btn ' + faClass + '"></i></span>';
    };

    /**
     * Event function to show/hide a bisect section.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    btns.showHideBisect = function(event) {
        var compared,
            element,
            elementId,
            parent,
            tooltipTitle;

        element = event.target || event.srcElement;
        parent = element.parentNode;
        compared = element.getAttribute('data-compared');
        elementId = element.getAttribute('data-id');
        tooltipTitle = sShowBisectTooltip;

        if (element.getAttribute('data-action') === 'hide') {
            element.setAttribute('data-action', 'show');
            html.removeClass(element, 'fa-eye-slash');
            html.addClass(element, 'fa-eye');
            html.addClass(document.getElementById(
                element.getAttribute('data-sh')), 'hidden');

            if (compared === 'null') {
                // TODO
                b.replaceById(
                    'view-' + elementId,
                    '<small>' + sBisectHiddenText + '</small>');
            } else {
                tooltipTitle = p.sprintf(
                    sShowBisectComparedTooltip, compared);
                // TODO
                b.replaceById(
                    'view-' + elementId,
                    '<small>' +
                    p.sprintf(sBisectComparedHiddenText, compared) +
                    '</small>'
                );
            }
        } else {
            if (compared === 'null') {
                tooltipTitle = sHideBisectTooltip;
            } else {
                tooltipTitle = p.sprintf(
                    sHideBisectComparedTooltip, compared);
            }

            element.setAttribute('data-action', 'hide');
            html.removeClass(element, 'fa-eye');
            html.addClass(element, 'fa-eye-slash');
            html.removeClass(
                document.getElementById(element.getAttribute('data-sh')),
                'hidden');

            html.removeChildren(document.getElementById('view-' + elementId));
        }

        $(parent)
            .tooltip('hide')
            .attr('data-original-title', tooltipTitle)
            .tooltip('fixTitle');
    };

    btns.createShowHideLabBtn = function(element, action) {
        var faClass = sShowFaCls,
            tooltipTitle = p.sprintf(sShowLabTooltip, element);
        if (action === 'hide') {
            faClass = sHideFaCls;
            tooltipTitle = p.sprintf(sHideLabTooltip, element);
        }
        return '<span rel="tooltip" data-toggle="tooltip"' +
            'title="' + tooltipTitle + '"><i data-action="' +
            action + '" data-id="' + element + '" class="lab-click-btn ' +
            faClass + '"></i></span>';
    };

    /**
     * Function that show/hide a lab section.
     *
     * @param {Event} event: The event that triggers this function.
    **/
    btns.showHideLab = function(event) {
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

            b.replaceById(
                'view-' + elementId, p.sprintf(sHiddenLab, elementId));

            html.removeClass(element, 'fa-eye-slash');
            html.addClass(element, 'fa-eye');

            $(parent).tooltip('destroy')
                .attr(
                    'data-original-title',
                    p.sprintf(sShowLabTooltip, elementId))
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
                    p.sprintf(sHideLabTooltip, elementId))
                .tooltip('fixTitle');
        }
    };

    /**
     * Function to show/hide failed/successfull/unknown classed elements.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    btns.showHideElements = function(event) {
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
    btns.showHideWarnErr = function(event) {
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

    return btns;
});
