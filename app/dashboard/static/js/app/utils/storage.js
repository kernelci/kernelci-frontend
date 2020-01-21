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
    var gStorage,
        kciStorage;

    function hasStorage(type) {
        var item,
            storage;

        try {
            storage = window[type];
            item = '__storage_test__';

            storage.setItem(item, item);
            storage.removeItem(item);

            return true;
        } catch (ignore) {
            return false;
        }
    }

    kciStorage = {
        name: null,
        objects: null
    };

    kciStorage.save = function() {
        if (hasStorage('sessionStorage')) {
            try {
                sessionStorage.setItem(this.name, this.toJson());
            } catch (ignore) {
                // Do nothing.
            }
        }
        return this;
    };

    kciStorage.load = function() {
        var items;
        if (hasStorage('sessionStorage')) {
            items = sessionStorage.getItem(this.name);
            if (items) {
                this.fromJson(items);
            }
        }
        return this;
    };

    kciStorage.addObject = function(name, value) {
        if (!this.objects) {
            this.objects = {};
        }
        this.objects[name] = value;
        return this;
    };

    kciStorage.addObjects = function(objects) {
        this.objects = objects;
        return this;
    };

    kciStorage.toJson = function() {
        return JSON.stringify(this.objects);
    };

    kciStorage.fromJson = function(items) {
        this.objects = JSON.parse(items);
    };

    gStorage = function(name) {
        var newObject;

        newObject = Object.create(kciStorage);
        newObject.name = name;

        return newObject;
    };

    return gStorage;
});
