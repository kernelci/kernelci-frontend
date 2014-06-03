// JSON stringify a SessionState object.
function toJSONString() {
    return JSON.stringify(this.objects);
}

function SessionState(id) {
    this.id = id;
    this.objects = null;
    this.toJSONString = toJSONString;
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

// Load form the session storage an object by id.
function loadFromSessionStorage(id) {
    var ret_val = false;

    if (Storage === 'undefined') {
        console.warn('Session/Local storage is not supported');
    } else {
        if (sessionStorage.getItem(id)) {
            var session_state = JSON.parse(sessionStorage.getItem(id)),
                key = '',
                data = null;

            for (key in session_state) {
                if (session_state.hasOwnProperty(key)) {
                    data = session_state[key];

                    if (data.value !== null) {
                        switch (data.type) {
                            case 'attr':
                                ret_val |= true;
                                setAttr(key, data.name, data.value);
                                break;
                            case 'class':
                                ret_val |= true;
                                addClass(key, data.value);
                                break;
                            default:
                                ret_val |= false;
                                console.warn(
                                    'Type not supported: ' + data.type
                                );
                                break;
                        }
                    }
                }
            }
        }
    }

    return ret_val;
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
