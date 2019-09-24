/* globals onmessage: true, postMessage: true */
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
onmessage = function(message) {
    'use strict';
    var gNewRegressions;
    var gRecurringRegressions;

    gNewRegressions = {};
    gRecurringRegressions = {};

    function compareFunction(a, b) {
        var compA;
        var compB;
        var compRet;

        compRet = -1;

        compA = new Date(a.created_on.$date);
        compB = new Date(b.created_on.$date);

        if (compA === compB) {
            compRet = 0;
        } else if (compA > compB) {
            compRet = 1;
        }

        return compRet;
    }

    function parse(data) {
        var archD;
        var bInstD;
        var boardD;
        var defconfigD;
        var labD;

        function checkData(regression) {
            var regr;
            var passRegr;
            var failRegr;
            var firstFailRegr;
            var regLen;
            var labName;

            regLen = regression.length;
            // Make sure the data is sorted by date.
            regression = regression.sort(compareFunction);

            passRegr = regression[0];
            failRegr = regression[regLen - 1];
            firstFailRegr = regression[1];

            labName = passRegr.lab_name;

            regr = {
                job: passRegr.job,
                board: passRegr.board,
                board_instance: passRegr.board_instance,
                arch: passRegr.arch,
                defconfig: passRegr.defconfig,
                defconfig_full: passRegr.defconfig_full,
                lab_name: labName,
                pass: passRegr,
                fail: failRegr
            };

            // New regression.
            if (regLen === 2) {
                if (!gNewRegressions.hasOwnProperty(labName)) {
                    gNewRegressions[labName] = [];
                }

                gNewRegressions[labName].push(regr);
            } else {
                if (!gRecurringRegressions.hasOwnProperty(labName)) {
                    gRecurringRegressions[labName] = [];
                }

                regr.first_fail = firstFailRegr;
                gRecurringRegressions[labName].push(regr);
            }
        }

        Object.keys(data).forEach(function(lab) {
            labD = data[lab];

            Object.keys(labD).forEach(function(arch) {
                archD = labD[arch];

                Object.keys(archD).forEach(function(board) {
                    boardD = archD[board];

                    Object.keys(boardD).forEach(function(bInst) {
                        bInstD = boardD[bInst];

                        Object.keys(bInstD).forEach(function(defconfig) {
                            defconfigD = bInstD[defconfig];

                            Object.keys(defconfigD).forEach(function(comp) {
                                checkData(defconfigD[comp]);
                            });
                        });
                    });
                });
            });
        });
    }

    if (message.data) {
        parse(message.data);
    }

    postMessage([gNewRegressions, gRecurringRegressions]);
};
