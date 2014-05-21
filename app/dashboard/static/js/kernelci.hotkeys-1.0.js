$(document).ready(function() {
    var selectSearch = function() {
        $('.input-sm').focus();
    };

    var selectTableLength = function() {
        $('.length-menu .input-sm').focus();
    };

    var goToHome = function() {
        window.location = $('#home-l')[0].href;
    };

    var goToJob = function() {
        window.location = $('#job-l')[0].href;
    };

    var goToBuild = function() {
        window.location = $('#build-l')[0].href;
    };

    var goToBoot = function() {
        window.location = $('#boot-l')[0].href;
    };

    var goToInfo = function() {
        window.location = $('#info-l')[0].href;
    };

    var showHelp = function() {
        $('#modal-hotkeys').modal('show')
    };

    $(document).mapHotKeys(
        [
            {key: '/', action: selectSearch},
            {key: 'l', action: selectTableLength},
            $.mapHotKeys.createSequence('s', 'h', $(document), showHelp),
            $.mapHotKeys.createSequence('g', 'h', $(document), goToHome),
            $.mapHotKeys.createSequence('g', 'j', $(document), goToJob),
            $.mapHotKeys.createSequence('g', 'b', $(document), goToBuild),
            $.mapHotKeys.createSequence('g', 't', $(document), goToBoot),
            $.mapHotKeys.createSequence('g', 'i', $(document), goToInfo)
        ]
    );
});
