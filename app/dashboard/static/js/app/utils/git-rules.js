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
define(function() {
    'use strict';
    var rules;
    /**
     * The following structure is used to give translation rules to known
     * git:// URLs.
     * Parameters are as follows:
     * 0. scheme
     * 1. base path for web interface view
     * 2. path to web interface commit view
     * 3. list of 2-elements lists for replace rules
     * 4. New hostname
     * Example:
     * IN: git://git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git
     * OUT: https://git.kernel.org/linux/kernel/git/khilman/linux.git
     * OUT: git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git/?id=
     * @type {Object}
     */
    rules = {
        'git.kernel.org': [
            'https',
            '/cgit/{0}',
            '/cgit/{0}/commit/?id=',
            [['/pub/scm/', '']],
            ''
        ],
        'git.linaro.org': [
            'https',
            '{0}',
            '{0}/commit/?id=',
            [],
            ''
        ],
        'android.googlesource.com': [
            'https',
            '{0}',
            '{0}/+/',
            [],
            ''
        ],
        'anongit.freedesktop.org': [
            'https',
            '{0}',
            '{0}/commit/?id=',
            [['/git/', ''], ['.git', '']],
            'cgit.freedesktop.org'
        ]
    };
    return rules;
});
