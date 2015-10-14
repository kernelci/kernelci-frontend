/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'compare/events',
    'compare/factory',
    'utils/html'
], function(cevents, factory, html) {
    'use strict';
    var containerElement,
        dataBucket,
        jobCompare;

    /**
     * Initialize a job comparison.
     *
     * @param {HTMLDivElement} container: The element that should contain the
     * job comparison.
     * @param {HTMLDivElement} bucke: The element where the data list
     * options should be added. If it is not passed, a new one will be created.
    **/
    jobCompare = function(container, bucket) {
        containerElement = container;

        if (bucket !== undefined && bucket !== null) {
            dataBucket = bucket;
        } else {
            dataBucket = factory.dataBucket();
            containerElement.appendChild(dataBucket);
        }

        return jobCompare;
    };

    /**
     * Return the associated bucket element.
    **/
    jobCompare.bucket = function() {
        return dataBucket;
    };

    /**
     * Create the job comparison selection.
     * Create the baseline choice and the multiple compare targets one.
    **/
    jobCompare.create = function() {
        html.removeChildren(containerElement);
        containerElement.appendChild(factory.baseline('job', dataBucket.id));
        containerElement.appendChild(
            factory.multiCompare('job', true, dataBucket.id));
        containerElement.appendChild(factory.submitButton('job'));
        cevents.getTrees(dataBucket);

        return jobCompare;
    };

    return jobCompare;
});
