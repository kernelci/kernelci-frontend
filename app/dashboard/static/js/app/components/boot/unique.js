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
define([
    'jquery'
], function($) {
    'use strict';
    var gBootUnique;

    gBootUnique = {};
    /**
     * Count unique values found in a boot data structure from the backend.
     * Rerturn a 2-size array with:
     *  0: the global unique count across all the data
     *  1: the unique count for each lab
     * Data structures are as follows:
     *  0:
     *  {
     *      arch: [archname, ...],
     *      board: [boardname, ...],
     *      defconfig: [defconfiname, ...],
     *      soc: [soctype, ...],
     *      status: [status, ...],
     *      totals: {
     *          arch: count,
     *          board: count,
     *          defconfig: count,
     *          soc: count
     *      }
     *  }
     *
     *  1:
     *  {
     *       labname: {
     *          arch: {
     *              archtype: count
     *          },
     *          board: {
     *              boardname: count
     *          },
     *          defconfig: {
     *              defconfigname: count
     *          },
     *          soc: {
     *              soctype: count
     *          },
     *          status: {
     *              status: count
     *          },
     *          totals: {
     *              arch: count,
     *              board: count,
     *              defconfig: count,
     *              soc: count
     *          }
     *      }
     *  }
    **/
    function uniqueBoot(response) {
        var arch,
            board,
            defconfig,
            key,
            localLab,
            lab,
            results,
            soc,
            status,
            totalArch = {},
            totalBoard = {},
            totalDefconfig = {},
            totalSoc = {},
            totalStatus = {},
            totalUnique = {},
            uniqueLab = {};

        totalArch = {};
        totalBoard = {};
        totalDefconfig = {};
        totalSoc = {};
        totalStatus = {};
        totalUnique = {};
        uniqueLab = {};
        results = response.result;

        function _parseResult(result) {
            lab = result.lab_name;
            arch = result.arch;
            board = result.board;
            defconfig = result.defconfig_full;
            soc = result.mach;
            status = result.status;

            if (!uniqueLab.hasOwnProperty(lab)) {
                uniqueLab[lab] = {
                    arch: {},
                    board: {},
                    defconfig: {},
                    soc: {},
                    status: {}
                };
            }
            localLab = uniqueLab[lab];

            if (arch) {
                totalArch[arch] = (totalArch[arch] || 0) + 1;
                localLab.arch[arch] = (localLab.arch[arch] || 0) + 1;
            }

            if (board) {
                totalBoard[board] = (totalBoard[board] || 0) + 1;
                localLab.board[board] = (localLab.board[board] || 0) + 1;
            }

            if (defconfig) {
                totalDefconfig[defconfig] =
                    (totalDefconfig[defconfig] || 0) + 1;
                localLab.defconfig[defconfig] =
                    (localLab.defconfig[defconfig] || 0) + 1;
            }

            if (soc) {
                totalSoc[soc] = (totalSoc[soc] || 0) + 1;
                localLab.soc[soc] = (localLab.soc[soc] || 0) + 1;
            }

            if (status) {
                switch (status) {
                    case 'FAIL':
                        localLab.status.fail = (localLab.status.fail || 0) + 1;
                        totalStatus.fail = (totalStatus.fail || 0) + 1;
                        break;
                    case 'PASS':
                        localLab.status.pass = (localLab.status.pass || 0) + 1;
                        totalStatus.pass = (totalStatus.pass || 0) + 1;
                        break;
                    default:
                        localLab.status.unknown =
                            (localLab.status.unknown || 0) + 1;
                        totalStatus.unknown = (totalStatus.unknown || 0) + 1;
                        break;
                }
            }
        }

        if (results.length > 0) {
            results.forEach(_parseResult);

            totalUnique = {
                arch: Object.keys(totalArch),
                board: Object.keys(totalBoard),
                defconfig: Object.keys(totalDefconfig),
                soc: Object.keys(totalSoc),
                status: totalStatus
            };
            totalUnique.totals = {
                arch: totalUnique.arch.length,
                board: totalUnique.board.length,
                defconfig: totalUnique.defconfig.length,
                soc: totalUnique.soc.length
            };

            for (key in uniqueLab) {
                if (uniqueLab.hasOwnProperty(key)) {
                    localLab = uniqueLab[key];
                    uniqueLab[key].totals = {
                        arch: Object.keys(localLab.arch).length,
                        board: Object.keys(localLab.board).length,
                        defconfig: Object.keys(localLab.defconfig).length,
                        soc: Object.keys(localLab.soc).length
                    };
                }
            }
        }

        return [totalUnique, uniqueLab];
    }

    /**
     * Count unique values found in a boot data strcture.
     *
     * @param {Object} response: The data from the backend.
     * @return {Array} A 2-size array.
    **/
    gBootUnique.count = function(response) {
        return uniqueBoot(response);
    };

    /**
     * Count unique values found in a boot data strcture.
     * This is a Deferred wrapper around the real function.
     *
     * @param {Object} response: The data from the backend.
     * @return {Array} A 2-size array.
    **/
    gBootUnique.countD = function(response) {
        var deferred;
        deferred = $.Deferred();
        deferred.resolve(uniqueBoot(response));
        return deferred.promise();
    };

    return gBootUnique;
});
