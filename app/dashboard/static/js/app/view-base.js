// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

define([
    'jquery',
    'utils/init',
    'utils/base',
    'utils/request',
    'utils/error'
], function($, i, b, r, e) {
    'use strict';
    var deferred;

    function getVersionFail() {
        b.replaceById('api-version', '<i class="fa fa-question"><i>');
    }

    function getVersionDone(response) {
        var localData = response.result,
            dataLen = localData.length,
            version,
            content;

        if (dataLen > 0) {
            version = localData[0].version;
            content = '<a href="' +
                'https://git.linaro.org/lava-team/kernel-ci-backend.git/' +
                'log/refs/tags/' + version + '">' + version + '</a>';
        } else {
            content = '&infin;';
        }
        b.replaceById('api-version', content);
    }

    i();

    deferred = r.get('/_ajax/version');
    $.when(deferred)
        .fail(e.error, getVersionFail)
        .done(getVersionDone);
});
