/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
