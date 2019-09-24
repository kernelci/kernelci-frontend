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
define(function() {
    'use strict';
    var compareConstants;

    compareConstants = {
        BOOT_CACHE_PREFIX: 'boot-',
        COMPARE_CONTAINER_ID: 'compare-container',
        COMPARE_TO_CONTAINER_ID: 'compare-to-choice',
        DATA_BUCKET_ID: 'bucket-container',
        FORM_ID: 'compare-form',
        KERNEL_CI_COMPARE_ID_HEADER: 'X-Kernelci-Compare-Id',
        MAX_COMPARE_TARGETS: 20,
        TREES_DATA_LIST: 'trees'
    };

    return compareConstants;
});
