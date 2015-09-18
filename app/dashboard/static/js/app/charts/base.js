/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define(function() {
    'use strict';
    function toBuildLinkClick(element) {
        var loc = '#',
            job = element.getAttribute('data-job'),
            kernel = element.getAttribute('data-kernel');
        if (job !== null && kernel !== null) {
            loc = '/build/' + job + '/kernel/' + kernel + '/';
        }
        window.location = loc;
    }

    function toBootLinkClick(element) {
        var loc = '#',
            job = element.getAttribute('data-job'),
            kernel = element.getAttribute('data-kernel');
        if (job !== null && kernel !== null) {
            loc = '/boot/all/job/' + job + '/kernel/' + kernel + '/';
        }
        window.location = loc;
    }

    function rateNumber(num, den) {
        if (isNaN(num)) {
            num = 0;
        }
        return (num / den) * 100;
    }

    return {
        charts: {},
        rateNumber: rateNumber,
        toBootLinkClick: toBootLinkClick,
        toBuildLinkClick: toBuildLinkClick
    };
});
