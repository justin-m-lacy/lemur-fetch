/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * https://developer.mozilla.org/en-US/docs/Web/API/Response
 */

var baseFetch = {

	/**
	 * {Object} init Object to send with every fetch() call.
	 * This object is merged with the default base params required
	 * for the given method call. (e.g. method:'POST' for the post() method )
	 */
	init:{},

	/**
	 * {function(Response)} function to call on every successful request.
	 */
	success:null,

	/**
	 * {function(Object|string)} Optional function to call on any error.
	 * This function is also called if the fetch() call succeeds,
	 * but Response.ok === false.
	 */
	fail:null,

	/**
 	* {string} url to prefix before all fetch() urls.
 	*/
	BASE_URL:'',

	/**
 	* {string} Variable to include with all POST requests to guard
 	* against simple form exploits.
 	*/
	POST_VAR:'post_data',

	/**
	 * Sets the init{} setting indicating credentials should be sent
	 * with fetch() requestst.
	 * @param {bool} [sameOrigin=true] Only send credentials for same-origin requests.
	 */
	sendCredentials( sameOrigin=false) {
		this.init.credentials = sameOrigin ? 'same-origin' : 'include';
	},

	/**
	 * 
	 * @param {string} url - url to fetch. prepended with exported BASE_URL variable.
	 * @param {Object|null} [vars=null] - variables to send in the request.
	 * @returns {Promise}
	 */
	getJSON( url, vars=null ) {

		var req = {

			headers: {
				"Content-Type": "application/json",
				'Accept': 'application/json',
			},
			method:'GET'

		};

		for( let p in vars ) vars[p] = JSON.stringify( vars[p]);

		Object.assign( req, this.init );

		url = this.encodeGETUrl( this.BASE_URL + url, vars );
		console.log('sending url: ' + url );
		return fetch( url, req ).then( this._decode ).then( this._success ).catch(this._fail );

	},

	/**
	 * 
	 * @param {string} url 
	 * @param {Object|null} [vars=null] 
	 * @returns {Promise}
	 */
	get( url, vars=null ) {
	
		var req = {

			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method:'GET'

		};
		Object.assign( req, this.init );

		url = this.encodeGETUrl( this.BASE_URL + url, vars );
		console.log('sending url: ' + url );

		return fetch( url, req ).then( this._decode ).then( this._success ).catch(this._fail );
	
	},

	/**
	 * Each encoded variable arrives as a single json-string POST variable.
	 * @param {string} url 
	 * @param {Object|null} [vars=null] - object with properties that should be individually
	 * encoded as json.
	 * @returns {Promise}
	 */
	postJSON( url, vars=null ) {

		if ( vars ) {
			if ( this.POST_VAR ) vars[this.POST_VAR] = true;
			//for( let p in vars ) vars[p] = JSON.stringify(vars[p]);
		}
		var req = {

			headers: {
				"Content-Type": "application/json",
				'Accept': 'application/json',
			},
			method:'POST',
			body:JSON.stringify( vars || {} )

		};
		Object.assign( req, this.init );

		return fetch( this.BASE_URL + url, req ).then( this._decode ).then( this._success ).catch(this._fail );

	},

	/**
	 * 
	 * @param {string} url 
	 * @param {Object|null} [vars=null] 
	 */
	post( url, vars=null ) {

		if ( vars ){

			if ( this.POST_VAR ) vars[ this.POST_VAR ] = true;
			for( let p in vars ) vars[p] = JSON.stringify( vars[p]);

		}

		var req = {

			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				'Accept':'application/json'
			},
			method:'POST',
			body:this.urlVars(vars)

		};
		Object.assign( req, this.init );

		return fetch( this.BASE_URL + url, req ).then( this._decode ).then( this._success ).catch(this._fail );

	},

	/**
	 * 
	 * @param {string} url 
	 * @param {Object|null} [vars=null] 
	 */
	encodeGETUrl( url, vars=null ) {

		if ( !vars || !url ) return url;
		return url + '?' + this.urlVars( vars );

	},

	urlVars( vars ) {

		let full = '';

		let props = Object.getOwnPropertyNames( vars );
		let len = props.length;
		if ( len === 0 ) return full;

		let p = props[0];
		full += p + '=' + vars[p];

		for( let i = 1; i < len; i++ ) {
			p = props[i];
			full +=  '&' + p + '=' + vars[p];
		}

		return encodeURI( full );
	},

	_decode:null,

	_success:null,

	/**
	 * 
	 * @param {string|Object} err - error message or object.
	 */
	_fail:null

}

function makeFetcher() {

	let f = Object.assign( {}, baseFetch );
	f._decode = resultCb.bind(f);
	f._success = okCb.bind(f);
	f._fail = failCb.bind(f);

	return f;

}

function okCb(json) {

	if ( this.success ) this.success( json );
	return json;

}

function resultCb( res ){

	if ( res.ok === false ) throw new Error( res.statusText);
	return res.json();

}

function failCb(err){

	console.log( 'FAIL: ' + err );
	if ( this.fail ) this.fail(err);
	return err;

}

export default makeFetcher();