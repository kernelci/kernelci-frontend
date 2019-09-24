/*!
 * Copyright (C) Linaro Limited 2015,2017,2019
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
