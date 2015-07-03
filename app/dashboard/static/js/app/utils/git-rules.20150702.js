/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
define(function() {
    'use strict';
    var rules;
    // The following structure is used to give translation rules to known
    // git:// URLs.
    // Parameters are as follows:
    // 0. scheme
    // 1. base path for web interface view
    // 2. path to web interface commit view
    // 3. list of 2-elements lists for replace rules
    // Example:
    // IN: git://git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git
    // OUT: https://git.kernel.org/linux/kernel/git/khilman/linux.git
    // OUT: git.kernel.org/pub/scm/linux/kernel/git/khilman/linux.git/?id=
    rules = {
        'git.kernel.org': [
            'https',
            '/cgit/%s',
            '/cgit/%s/commit/?id=',
            [['/pub/scm/', '']]
        ],
        'git.linaro.org': [
            'https',
            '%s',
            '%s/commitdiff/',
            []
        ]
    };
    return rules;
});
