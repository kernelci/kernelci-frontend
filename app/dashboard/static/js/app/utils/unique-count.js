/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'jquery'
], function($) {
    'use strict';
    var unique = {};
    // Count unique values found in a boot data structure from the backend.
    // Rerturn a 2-size array with:
    // 0: the global unique count across all the data
    // 1: the unique count for each lab
    // Data structures are as follows:
    // 0:
    // {
    //     arch: [archname, ...],
    //     board: [boardname, ...],
    //     defconfig: [defconfiname, ...],
    //     soc: [soctype, ...],
    //     status: [status, ...],
    //     totals: {
    //         arch: count,
    //         board: count,
    //         defconfig: count,
    //         soc: count
    //     }
    // }
    //
    // 1:
    // {
    //     labname: {
    //         arch: {
    //             archtype: count
    //         },
    //         board: {
    //             boardname: count
    //         },
    //         defconfig: {
    //             defconfigname: count
    //         },
    //         soc: {
    //             soctype: count
    //         },
    //         status: {
    //             status: count
    //         },
    //         totals: {
    //             arch: count,
    //             board: count,
    //             defconfig: count,
    //             soc: count
    //         }
    //     }
    // }
    unique.countUniqueBoot = function(response) {
        var result = response.result,
            resLen = response.count,
            tStatus = {},
            tUniq = {},
            uniqueLab = {},
            idx = 0,
            tArchs = {},
            tBoards = {},
            tDefconfigs = {},
            tSoCs = {},
            lResult,
            lObj,
            lab,
            arch,
            board,
            defconfig,
            soc,
            status,
            key;

        if (resLen > 0) {
            for (idx; idx < resLen; idx = idx + 1) {
                lResult = result[idx];
                lab = lResult.lab_name;
                arch = lResult.arch;
                board = lResult.board;
                defconfig = lResult.defconfig_full;
                soc = lResult.mach;
                status = lResult.status;

                if (!uniqueLab.hasOwnProperty(lab)) {
                    uniqueLab[lab] = {
                        arch: {},
                        board: {},
                        defconfig: {},
                        soc: {},
                        status: {}
                    };
                }
                lObj = uniqueLab[lab];

                if (arch !== null) {
                    tArchs[arch] = (tArchs[arch] || 0) + 1;
                    lObj.arch[arch] = (lObj.arch[arch] || 0) + 1;
                }
                if (board !== null) {
                    tBoards[board] = (tBoards[board] || 0) + 1;
                    lObj.board[board] = (lObj.board[board] || 0) + 1;
                }
                if (defconfig !== null) {
                    tDefconfigs[defconfig] = (tDefconfigs[defconfig] || 0) + 1;
                    lObj.defconfig[defconfig] =
                        (lObj.defconfig[defconfig] || 0) + 1;
                }
                if (soc !== null) {
                    tSoCs[soc] = (tSoCs[soc] || 0) + 1;
                    lObj.soc[soc] = (lObj.soc[soc] || 0) + 1;
                }
                if (status !== null) {
                    switch (status) {
                        case 'FAIL':
                            lObj.status.fail = (lObj.status.fail || 0) + 1;
                            tStatus.fail = (tStatus.fail || 0) + 1;
                            break;
                        case 'PASS':
                            lObj.status.pass = (lObj.status.pass || 0) + 1;
                            tStatus.pass = (tStatus.pass || 0) + 1;
                            break;
                        default:
                            lObj.status.unknown =
                                (lObj.status.unknown || 0) + 1;
                            tStatus.unknown = (tStatus.unknown || 0) + 1;
                            break;
                    }
                }
            }
            // Polyfill for browsers that don't support Object.keys(). :-(
            // TODO: keep an eye for IE8 access.
            if (!Object.keys) {
                Object.keys = function(obj) {
                    var lst = [],
                        prp;
                    if (obj !== Object(obj)) {
                        throw new TypeError(
                            'Object.keys called on a non-object');
                    }
                    for (prp in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, prp)) {
                            lst.push(prp);
                        }
                    }
                    return lst;
                };
            }

            tUniq = {
                arch: Object.keys(tArchs),
                board: Object.keys(tBoards),
                defconfig: Object.keys(tDefconfigs),
                soc: Object.keys(tSoCs),
                status: tStatus
            };
            tUniq.totals = {
                arch: tUniq.arch.length,
                board: tUniq.board.length,
                defconfig: tUniq.defconfig.length,
                soc: tUniq.soc.length
            };
            for (key in uniqueLab) {
                if (uniqueLab.hasOwnProperty(key)) {
                    lObj = uniqueLab[key];
                    uniqueLab[key].totals = {
                        arch: Object.keys(lObj.arch).length,
                        board: Object.keys(lObj.board).length,
                        defconfig: Object.keys(lObj.defconfig).length,
                        soc: Object.keys(lObj.soc).length
                    };
                }
            }
        }

        return [tUniq, uniqueLab];
    };

    // Count unique values found in a boot data structure from the backend.
    // This is a Deferred wrapper around the real function.
    unique.countUniqueBootD = function(response) {
        var deferred;
        deferred = $.Deferred();
        deferred.resolve(unique.countUniqueBoot(response));
        return deferred.promise();
    };

    return unique;
});
