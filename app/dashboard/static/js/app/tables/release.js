/*! Kernel CI Dashboard | Licensed under the GNU GPL v3 (or later) */
define([
    'utils/html',
    'tables/common'
], function(html, tcommon) {
    'use strict';
    var gTestTable;
    var gStatusDefaults;
     gTestTable = {};
     gStatusDefaults = {
        pass: 'Test executed successfully',
        fail: 'Test execution failed',
        offline: 'Test offline',
        default: 'Test execution status unknown'
    };
     // function to render the date.
    gTestTable.dateNode = function(date) {
        return tcommon.dateNode(date);
    };
     // Create the test status element.
    gTestTable.statusNode = function(status) {
        return tcommon.statusNode(status, gStatusDefaults);
    };
     // Function to render the case detail.
    gTestTable.detailsNode = function(link) {
        var aNode;
        var str;
        var tooltipNode;
         tooltipNode = html.tooltip();
        tooltipNode.setAttribute('title', 'More info');
         aNode = document.createElement('a');
        str = link;
        aNode.setAttribute('href', str);
         aNode.appendChild(html.search());
        tooltipNode.appendChild(aNode);
         return tooltipNode;
    };
     // Function to render the rate detail. 
    gTestTable.renderRate = function(date, type , data) {
        var hash = function(s) {
            var a = 1, c = 0, h, o;
            if (s) {
                a = 0;
                for (h = s.length - 1; h >= 0; h--) {
                    o = s.charCodeAt(h);
                    a = (a<<6&268435455) + o + (o<<14);
                    c = a & 266338304;
                    a = c!==0?a^c>>21:a;
                }
            }
            return String(a);
        };
        return $('<div id="rate-'+ hash(data.git_branch + data.kernel) +'"></div>').html('<i class="fa fa-circle-o-notch fa-spin fa-fw count-content"></i>')[0].outerHTML
    };
     // Function to render the rate detail(for specific view).
    gTestTable.renderRate2 = function(date, type , data) {
		var hash = function(s) {
			var a = 1, c = 0, h, o;
			if (s) {
				a = 0;
				for (h = s.length - 1; h >= 0; h--) {
					o = s.charCodeAt(h);
					a = (a<<6&268435455) + o + (o<<14);
					c = a & 266338304;
					a = c!==0?a^c>>21:a;
				}
			}
			return String(a);
		};
		return $('<div id="rate-'+ hash(data.board) +'"></div>').html('<i class="fa fa-circle-o-notch fa-spin fa-fw count-content"></i>')[0].outerHTML
	};
    // Function to render the rate name (for specific view).
    gTestTable.renderRateSetName = function(data, type , date) {
		return $('<div id="rate-'+ data +'"></div>').html('<i class="fa fa-circle-o-notch fa-spin fa-fw count-content"></i>')[0].outerHTML
	};
 	// Function to render the board name.
	gTestTable.renderBoardName = function(a, type , data) {
		return $('<div id="board-'+ data.board +'"></div>').html(data.board)[0].outerHTML
	};
     // Function to render the measurement detail.
    gTestTable.renderMeasurement = function(value, type , data) {
        if ( data.measurements.length )
            return data.measurements[ 0 ][ 'value' ];
    };
     // Function to render the unit detail.
    gTestTable.renderUnit = function(value, type , data) {
         if(!value){
            console.data( data )
        }
         if ( data.measurements.length )
            return data.measurements[ 0 ][ 'unit' ];
    };
    
	// renderDate
    gTestTable.renderDate = function(date, type) {
        return tcommon.renderDate(date, type);
    };
    
	// renderDetails
    gTestTable.renderDetails = function(href, type, data) {
        return tcommon.renderDetails(href, type, data);
    };
    
	// renderGitUrl
	gTestTable.renderGitUrl = function(href, type, data) {
        return tcommon.renderGitUrl(href, type, data);
    };
     // renderKernel
    gTestTable.renderKernelRelease = function(data, type, href) {
        return tcommon.renderKernelRelease(data, type, href);
    };
     gTestTable.countBadge = function(settings) {
        return tcommon.countBadge(
            settings.data,
            settings.type, settings.extraClasses, settings.idStart).outerHTML;
    };
	
    gTestTable.renderCasesCount = function(data, type, id_str, href) {
        return tcommon.countAll({
            data: data,
            type: type,
            href: href,
            extraClasses: ['extra-margin'],
            idStart: id_str
        });
    };
     gTestTable.renderTree = function(tree, type, href) {
        return tcommon.renderTree(tree, type, href);
    };
     gTestTable.getCountFail = function(idStart) {
        document.getElementById('cases-total-count-'+ idStart)
            .innerHTML ='&infin;';
        document.getElementById('cases-success-count-'+ idStart)
            .innerHTML ='&infin;';
        document.getElementById('cases-fail-count-'+ idStart)
            .innerHTML ='&infin;';
        document.getElementById('cases-unknown-count-'+ idStart)
            .innerHTML ='&infin;';
    };
     return gTestTable;
});
