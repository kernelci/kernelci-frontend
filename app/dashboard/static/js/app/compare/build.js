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
    'compare/events',
    'compare/factory',
    'utils/html'
], function(cevents, factory, html) {
    'use strict';
    var containerElement;
    var dataBucket;
    var buildCompare;

    /**
     * Initialize a build comparison.
     *
     * @param {HTMLDivElement} container: The element that should contain the
     * comparison.
     * @param {HTMLDivElement} bucket: The element where the data list
     * options should be added. If it is not passed, a new one will be created.
    **/
    buildCompare = function(container, bucket) {
        containerElement = container;

        if (bucket !== undefined && bucket !== null) {
            dataBucket = bucket;
        } else {
            dataBucket = factory.dataBucket();
            containerElement.appendChild(dataBucket);
        }

        return buildCompare;
    };

    /**
     * Return the associated bucket element.
    **/
    buildCompare.bucket = function() {
        return dataBucket;
    };

    /**
     * Create the build comparison selection.
     * Create the baseline choice and the multiple compare targets one.
    **/
    buildCompare.create = function() {
        html.removeChildren(containerElement);
        containerElement.appendChild(factory.baseline('build', dataBucket.id));
        containerElement.appendChild(
            factory.multiCompare('build', true, dataBucket.id));
        containerElement.appendChild(factory.submitButton('build'));
        cevents.getTrees(dataBucket);

        return buildCompare;
    };

    return buildCompare;
});
