// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var WebStorage = (function() {
    'use strict';

    // JSON stringify a SessionState object.
    function toJSONString() {
        return JSON.stringify(this.objects);
    }

    // Run jQuery addClass() method on `element` setting `value`.
    function addClass(element, value) {
        $(element).each(function() {
            $(this).addClass(value);
        });
    }

    // Run jQuery attr() method on `element`, setting `attribute` to `value`.
    function setAttr(element, attribute, value) {
        $(element).each(function() {
            $(this).attr(attribute, value);
        });
    }

    function SessionState(id) {
        this.id = id;
        this.objects = null;
        this.toJSONString = toJSONString;
    }

    // Load form the session storage an object by id.
    function loadFromSessionStorage(id) {
        var retVal = false,
            sessionState = {},
            key = '',
            data = null;

        if (Storage === 'undefined') {
            console.warn('Session/Local storage is not supported');
        } else {
            if (sessionStorage.getItem(id)) {
                sessionState = JSON.parse(sessionStorage.getItem(id));

                for (key in sessionState) {
                    if (sessionState.hasOwnProperty(key)) {
                        data = sessionState[key];

                        if (data.value !== null) {
                            switch (data.type) {
                                case 'attr':
                                    retVal = retVal | true;
                                    setAttr(key, data.name, data.value);
                                    break;
                                case 'class':
                                    retVal = retVal | true;
                                    addClass(key, data.value);
                                    break;
                                default:
                                    retVal = retVal | false;
                                    break;
                            }
                        }
                    }
                }
            }
        }

        return retVal;
    }

    function saveToSessionStorage(session) {
        if (Storage === 'undefined') {
            console.warn('Saving to session/local storage is not supported');
        } else {
            try {
                sessionStorage.setItem(session.id, session.toJSONString());
            } catch (e) {
                if (e === QUOTA_EXCEEDED_ERR) {
                    console.error(
                        'Error saving to session storage: quota exceeded'
                    );
                } else {
                    console.error('Error saving to session storage');
                }
            }
        }
    }

    return {
        SessionState: SessionState,
        load: loadFromSessionStorage,
        save: saveToSessionStorage
    };
}());
