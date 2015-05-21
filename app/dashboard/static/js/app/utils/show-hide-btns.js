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
        sShowLabTooltip,
        sHideLabTooltip,
        sShowFaCls,
        sHideFaCls;

    sShowLabTooltip = 'Show contents for lab «%s»';
    sHideLabTooltip = 'Hide contents for lab «%s»';
    sHiddenLab = '<small>Content for lab &#171;%s&#187; hidden. ' +
        'Use the <i class="fa fa-eye"></i> button to show it again.</small>';
    sShowFaCls = 'fa fa-eye';
    sHideFaCls = 'fa fa-eye-slash';

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
                if (!el.getAttribute('disabled')) {
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
                if (!el.getAttribute('disabled')) {
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
                if (!el.getAttribute('disabled')) {
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
    return btns;
});
