/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var compareConstants;

    compareConstants = {
        COMPARE_TO_CONTAINER_ID: 'compare-to-choice',
        DATA_BUCKET_ID: 'bucket-container',
        FORM_ID: 'compare-form',
        MAX_COMPARE_TARGETS: 20,
        TREES_DATA_LIST: 'trees',
        KERNEL_CI_COMPARE_ID_HEADER: 'X-Kernelci-Compare-Id'
    };

    return compareConstants;
});
