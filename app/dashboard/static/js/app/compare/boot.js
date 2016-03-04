/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'compare/events',
    'compare/factory',
    'utils/html'
], function(cevents, factory, html) {
    'use strict';
    var bootCompare;
    var containerElement;
    var dataBucket;

    /**
     * Initialize a boot comparison.
     *
     * @param {HTMLDivElement} container: The element that should contain the
     * comparison.
     * @param {HTMLDivElement} bucket: The element where the data list
     * options should be added. If it is not passed, a new one will be created.
    **/
    bootCompare = function(container, bucket) {
        containerElement = container;

        if (bucket !== undefined && bucket !== null) {
            dataBucket = bucket;
        } else {
            dataBucket = factory.dataBucket();
            containerElement.appendChild(dataBucket);
        }

        return bootCompare;
    };

    /**
     * Return the associated bucket element.
    **/
    bootCompare.bucket = function() {
        return dataBucket;
    };

    /**
     * Create the boot comparison selection.
     * Create the baseline choice and the multiple compare targets one.
    **/
    bootCompare.create = function() {
        html.removeChildren(containerElement);
        containerElement.appendChild(factory.baseline('boot', dataBucket.id));
        containerElement.appendChild(
            factory.multiCompare('boot', true, dataBucket.id));
        containerElement.appendChild(factory.submitButton('boot'));
        cevents.getTrees(dataBucket);

        return bootCompare;
    };

    return bootCompare;
});
