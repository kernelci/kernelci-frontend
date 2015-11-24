/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'buttons/common',
    'utils/html'
], function(common, html) {
    'use strict';
    var gBuildButtons;

    gBuildButtons = {};

    /**
     * Show only elements that have don't have a display style of none.
     *
     * @private
     * @param {Element} element: The DOM element.
    **/
    function showElement(element) {
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
    function hideElement(element) {
        if (element.style.display === 'block') {
            element.style.setProperty('display', 'none');
        }
    }

    function showVisibleByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), showElement);
    }

    /**
     * Hide only elements that have a display=block attribute.
     *
     * @private
     * @param {string} className: The name of the CSS class.
    **/
    function hideVisibleByClass(className) {
        [].forEach.call(
            document.getElementsByClassName(className), hideElement);
    }

    /**
     * Verify which button is pressed and show the correct elements.
     *
     * This is only used internally with the drop-down list of options to
     * show and hide builds/boots with errors/warnings.
     *
     * @private
    **/
    function checkButtonStatus() {
        var failBtn,
            successBtn,
            unknownBtn;

        successBtn = document.getElementById('success-btn');
        failBtn = document.getElementById('fail-btn');
        unknownBtn = document.getElementById('unknown-btn');

        if (html.classed(successBtn, 'active')) {
            common.showAllByClass('df-success');
        } else if (html.classed(failBtn, 'active')) {
            common.showAllByClass('df-failed');
        } else if (html.classed(unknownBtn, 'active')) {
            common.showAllByClass('df-unknown');
        } else {
            common.showAllByClass('df-failed');
            common.showAllByClass('df-success');
            common.showAllByClass('df-unknown');
        }
    }

    /**
     * Function to show/hide elements based on the warnings/errors they have.
     *
     * @param {Event} event: The event that triggers the function.
    **/
    gBuildButtons.showHideWarnErr = function(event) {
        var element,
            view;

        element = event.target || event.srcElement;
        view = element.getAttribute('data-view');

        // First make sure that what we have to see or hide has a default
        // style attribute, then hide or show it.
        switch (view) {
            case 'warnings':
                checkButtonStatus();
                showVisibleByClass('df-w');
                hideVisibleByClass('df-e');
                hideVisibleByClass('df-w-e');
                hideVisibleByClass('df-no-w-no-e');
                break;
            case 'errors':
                checkButtonStatus();
                hideVisibleByClass('df-w');
                showVisibleByClass('df-e');
                hideVisibleByClass('df-w-e');
                hideVisibleByClass('df-no-w-no-e');
                break;
            case 'warnings-errors':
                checkButtonStatus();
                hideVisibleByClass('df-w');
                hideVisibleByClass('df-e');
                showVisibleByClass('df-w-e');
                hideVisibleByClass('df-no-w-no-e');
                break;
            case 'no-warnings-no-errors':
                checkButtonStatus();
                hideVisibleByClass('df-w');
                hideVisibleByClass('df-e');
                hideVisibleByClass('df-w-e');
                showVisibleByClass('df-no-w-no-e');
                break;
            default:
                checkButtonStatus();
                break;
        }
    };

    return gBuildButtons;
});
