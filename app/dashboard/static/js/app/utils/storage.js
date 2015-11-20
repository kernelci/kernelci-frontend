/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
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
