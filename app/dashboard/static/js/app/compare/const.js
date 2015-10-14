/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    var compareConstants;

    var COMPARE_TO_CONTAINER_ID = 'compare-to-choice';
    var DATA_BUCKET_ID = 'bucket-container';
    var FORM_ID = 'compare-form';
    var MAX_COMPARE_TARGETS = 20;
    var TREES_DATA_LIST = 'trees';
    var KERNEL_CI_COMPARE_ID_HEADER = 'X-Kernelci-Compare-Id';

    compareConstants = {};

    compareConstants.COMPARE_TO_CONTAINER_ID = COMPARE_TO_CONTAINER_ID;
    compareConstants.DATA_BUCKET_ID = DATA_BUCKET_ID;
    compareConstants.FORM_ID = FORM_ID;
    compareConstants.MAX_COMPARE_TARGETS = MAX_COMPARE_TARGETS;
    compareConstants.TREES_DATA_LIST = TREES_DATA_LIST;
    compareConstants.KERNEL_CI_COMPARE_ID_HEADER = KERNEL_CI_COMPARE_ID_HEADER;

    return compareConstants;
});
