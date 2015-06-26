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
    'utils/base'
], function($, p, b) {
    'use strict';
    var btns = {},
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
        // The number of columns in the bisect table.
        bisectColSpan = 4,
        bisectPlustButtonId = 'plus-button',
        bisectMinusButtonId = 'minus-button',
        bisectComparePlusButtonId = 'plus-compare-button',
        bisectCompareMinusButtonId = 'minus-compare-button',
        bisectCompareHiddenHelpRowId = 'bisect-comapre-hidden-help',
        bisectHiddenHelpRowId = 'bisect-hidden-help',
        bisectHiddenRowClass = 'bisect-hidden-row',
        bisectCompareHiddenRowClass = 'bisect-compare-hidden-row';

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
    sShowLabTooltip = 'Show contents for lab «%s»';
    sHideLabTooltip = 'Hide contents for lab «%s»';
    sHiddenLab = '<small>Content for lab &#171;%s&#187; hidden. ' +
        'Use the <i class="fa fa-eye"></i> button to show it again.</small>';
    sShowFaCls = 'fa fa-eye';
    sHideFaCls = 'fa fa-eye-slash';

    // Simulate a click on the bisect - button.
    btns.triggerMinusBisectBtns = function(compared) {
        if (compared) {
            $('#' + bisectCompareMinusButtonId).trigger('click');
        } else {
            $('#' + bisectMinusButtonId).trigger('click');
        }
    };

    btns.createPlusMinBisectBtn = function(numEl, tableID, compared) {
        var plus,
            min,
            plusID = bisectPlustButtonId,
            minID = bisectMinusButtonId,
            dataType = 'default';

        if (compared) {
            dataType = 'compare';
            plusID = bisectComparePlusButtonId;
            minID = bisectCompareMinusButtonId;
        }

        plus = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show all bisect results">' +
            '<button id="' + plusID + '" type="button" ' +
            'class="bisect-pm-btn-more btn btn-default" ' +
            'data-action="more" ' +
            'data-table="' + tableID + '" data-rows="' + numEl +
            '" data-type="' + dataType + '">' +
            '<i class="fa fa-plus"></i>' +
            '</button>' +
            '</span>';
        min = '<span rel="tooltip" data-toggle="tooltip" ' +
            'title="Show less bisect results">' +
            '<button id="' + minID + '" type="button" ' +
            'class="bisect-pm-btn-less btn btn-default"' +
            'data-action="less" ' +
            'data-table="' + tableID + '" data-rows="' + numEl +
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
    btns.showLessBisectRowsBtn = function() {
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
            bisectHiddenClass = bisectHiddenRowClass,
            helpRowId = bisectHiddenHelpRowId,
            plusId = bisectPlustButtonId,
            minusId = bisectMinusButtonId,
            plusButton = '<i class="fa fa-plus"></i>';

        if (type === 'compare') {
            helpRowId = bisectCompareHiddenHelpRowId;
            bisectHiddenClass = bisectCompareHiddenRowClass;
            plusId = bisectComparePlusButtonId;
            minusId = bisectCompareMinusButtonId;
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
    btns.showMoreBisectRowsBtn = function() {
        var that = this,
            helpRowId = bisectHiddenHelpRowId,
            plusId = bisectPlustButtonId,
            minusId = bisectMinusButtonId,
            bisectHiddenClass = bisectHiddenRowClass;

        if (that.dataset.type === 'compare') {
            helpRowId = bisectCompareHiddenHelpRowId;
            bisectHiddenClass = bisectCompareHiddenRowClass;
            plusId = bisectComparePlusButtonId;
            minusId = bisectCompareMinusButtonId;
        }

        b.removeElement(helpRowId);
        $('.' + bisectHiddenClass).removeClass('hidden');
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

    btns.showHideBisect = function() {
        var that = this,
            parent = that.parentNode,
            data = that.dataset,
            id = data.id,
            compared = data.compared,
            tooltipTitle = sShowBisectTooltip;

        if (data.action === 'hide') {
            that.dataset.action = 'show';
            // TODO: if we get less IE 8 visits, use Element.classList.
            $(that).removeClass('fa-eye-slash').addClass('fa-eye');
            b.addClass(data.sh, 'hidden');
            if (compared === 'null') {
                b.replaceById(
                    'view-' + id, '<small>' + sBisectHiddenText + '</small>');
            } else {
                tooltipTitle = p.sprintf(
                    sShowBisectComparedTooltip, compared);
                b.replaceById(
                    'view-' + id,
                    '<small>' +
                    p.sprintf(sBisectComparedHiddenText, compared) +
                    '</small>'
                );
            }
            $(parent)
                .tooltip('hide')
                .attr('data-original-title', tooltipTitle)
                .tooltip('fixTitle');
        } else {
            if (compared === 'null') {
                tooltipTitle = sHideBisectTooltip;
            } else {
                tooltipTitle = p.sprintf(
                    sHideBisectComparedTooltip, compared);
            }
            that.dataset.action = 'hide';
            $(that).removeClass('fa-eye').addClass('fa-eye-slash');
            b.removeClass(data.sh, 'hidden');
            b.replaceById('view-' + id, '');
            $(parent)
                .tooltip('hide')
                .attr('data-original-title', tooltipTitle)
                .tooltip('fixTitle');
        }
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

    btns.showHideLab = function() {
        var that = this,
            data = that.dataset,
            accordionEl = document.getElementById('accordion-' + data.id),
            parent = that.parentNode;
        if (data.action === 'hide') {
            accordionEl.style.display = 'none';
            that.dataset.action = 'show';
            b.replaceById('view-' + data.id, p.sprintf(sHiddenLab, data.id));
            // TODO: if we get less IE 8 visits, use Element.classList.
            $(that).removeClass('fa-eye-slash').addClass('fa-eye');
            $(parent)
                .tooltip('destroy')
                .attr(
                    'data-original-title', p.sprintf(sShowLabTooltip, data.id))
                .tooltip('fixTitle');
        } else {
            accordionEl.style.display = 'block';
            that.dataset.action = 'hide';
            b.replaceById('view-' + data.id, '');
            $(that).removeClass('fa-eye').addClass('fa-eye-slash');
            $(parent)
                .tooltip('destroy')
                .attr(
                    'data-original-title', p.sprintf(sHideLabTooltip, data.id))
                .tooltip('fixTitle');
        }
    };

    btns.showHideElements = function() {
        var that = this,
            el;
        switch (that.id) {
            case 'success-cell':
                el = document.getElementById('success-btn');
                if (!el.hasAttribute('disabled')) {
                    $('.df-failed').hide();
                    $('.df-success').show();
                    $('.df-unknown').hide();
                    $(el).addClass('active').siblings().removeClass('active');
                }
                break;
            case 'success-btn':
                $('.df-failed').hide();
                $('.df-success').show();
                $('.df-unknown').hide();
                break;
            case 'fail-cell':
                el = document.getElementById('fail-btn');
                if (!el.hasAttribute('disabled')) {
                    $('.df-failed').show();
                    $('.df-success').hide();
                    $('.df-unknown').hide();
                    $(el).addClass('active').siblings().removeClass('active');
                }
                break;
            case 'fail-btn':
                $('.df-failed').show();
                $('.df-success').hide();
                $('.df-unknown').hide();
                break;
            case 'unknown-cell':
                el = document.getElementById('unknown-btn');
                if (!el.hasAttribute('disabled')) {
                    $('.df-failed').hide();
                    $('.df-success').hide();
                    $('.df-unknown').show();
                    $(el).addClass('active').siblings().removeClass('active');
                }
                break;
            case 'unknown-btn':
                $('.df-failed').hide();
                $('.df-success').hide();
                $('.df-unknown').show();
                break;
            default:
                $('.df-failed').show();
                $('.df-success').show();
                $('.df-unknown').show();
                $('#all-btn').addClass('active').siblings()
                    .removeClass('active');
                break;
        }
    };

    btns.showHideWarnErr = function() {
        var that = this,
            view = that.dataset.view;

        function checkButtonStatus() {
            if ($('#success-btn').hasClass('active')) {
                $('.df-success').show();
            } else if ($('#fail-btn').hasClass('active')) {
                $('.df-failed').show();
            } else if ($('#unknown-btn').hasClass('active')) {
                $('.df-unknown').show();
            } else {
                $('.df-failed').show();
                $('.df-success').show();
                $('.df-unknown').show();
            }
        }

        switch (view) {
            case 'warnings':
                checkButtonStatus();
                $('.df-w :visible').show();
                $('.df-e').hide();
                $('.df-w-e').hide();
                $('.df-no-w-no-e').hide();
                break;
            case 'errors':
                checkButtonStatus();
                $('.df-w').hide();
                $('.df-e :visible').show();
                $('.df-w-e').hide();
                $('.df-no-w-no-e').hide();
                break;
            case 'warnings-errors':
                checkButtonStatus();
                $('.df-w').hide();
                $('.df-e').hide();
                $('.df-w-e :visible').show();
                $('.df-no-w-no-e').hide();
                break;
            case 'no-warnings-no-errors':
                checkButtonStatus();
                $('.df-w').hide();
                $('.df-e').hide();
                $('.df-w-e').hide();
                $('.df-no-w-no-e :visible').show();
                break;
            default:
                checkButtonStatus();
                break;
        }
    };

    return btns;
});
