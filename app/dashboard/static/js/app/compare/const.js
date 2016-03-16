/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
