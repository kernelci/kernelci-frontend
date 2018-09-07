/*!
 * kernelci dashboard.
 * 
 * Copyright (C) 2014, 2015, 2016, 2017  Linaro Ltd.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
define([
    'jquery'
], function( $ ) {
    'use strict';

    /**
     * Router Object
     * @constructor
     */
    let router = function ( ) {

        this.routes = [ ];

        /**
         * @param urlPattern
         * @param params
         * @returns {router}
         */
        this.addRoute = ( alias , urlPattern , params ) => {
            this.routes.push( [ alias , urlPattern , params ] );
            return this;
        };

        /**
         * @param alias
         * @returns {*}
         */
        this.getRoute = ( alias ) => {
            for( let i in this.routes ) {
                if ( this.routes[ i ][ 0 ] == alias )
                    return this.routes[ i ]
            }
        }

        /**
         * @param route
         * @returns {RegExp}
         */
        let buildPattern = ( route ) => {
            return new RegExp( '[\\/]*'+ buildRoute( route[ 0 ] ) +'[\\/]*' )
        };

        /**
         * @param alias
         * @returns {string}
         */
        let buildRoute = ( alias ) => {
            var    route = this.getRoute( alias );
            return route[ 1 ].replace( '\$p' , buildParams( route[ 2 ] ) )
        };

        /**
         * @param route
         * @returns {string}
         */
        let buildParams = ( data ) => {
            let params = [ ];
            Object.keys( data )
                .forEach( ( key ) => {
                    params.push( key +'/('+ data[ key ] +')' );
                } );

            return  params.join( '/' )
        };

        /**
         *
         * @param urlPath
         * @param route
         */
        let extractParams = ( urlPath , route ) => {
            let p = { };
            Object.keys( route[ 2 ] )
                .forEach( ( key , i ) => {
                    p[ key ] = urlPath[ ++i ]
                } );

            return p;
        };

        this.parse = ( ) => {
            for( let i in this.routes ) {
                let  m , r = this.routes[ i ];
                if ( m = location.pathname.match( buildPattern( r ) ) )
                    return extractParams( m , r )
            }
        }
    };

    return router
});
