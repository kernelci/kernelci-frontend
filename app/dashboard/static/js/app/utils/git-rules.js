/*! Kernel CI Dashboard v2015.8 | Licensed under the GNU GPL v3 (or later) */
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
