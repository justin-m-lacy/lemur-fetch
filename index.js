/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * https://developer.mozilla.org/en-US/docs/Web/API/Response
 */

 /**
  * @callback successCb
  * @param {Response}
  */
 /**
  * @callback failCb
  * @param {?Object|string}
  */

var baseFetch = {

	/**
	 * {Object} init Object to send with every fetch() call.
	 * This object is merged with the default base params required
	 * for the given method call. (e.g. method:'POST' for the post() method )
	 */
	init:{},

	/**
	 * {successCb} function to call on every successful request.
	 */
	success:null,

	/**
	 * {failCb} Optional function to call on any error.
	 * The function is also called if the fetch() call succeeds,
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
	 * Setting which indicates credentials should be sent with fetch() requests.
	 * This modifies the init member object..
	 * @param {boolean} [sameOrigin=true] Only send credentials for same-origin requests.
	 */
	sendCredentials( sameOrigin=false) {
		this.init.credentials = sameOrigin ? 'same-origin' : 'include';
	},

	/**
	 * 
	 * @param {string} url - url to fetch. prepended with exported BASE_URL variable.
	 * @param {?Object} [vars=null] - variables to send in the request.
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
		return fetch( url, req ).then( this._decode ).then( this._success ).catch(this._fail );

	},

	/**
	 * 
	 * @param {string} url 
	 * @param {?Object} [vars=null] 
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

		return fetch( url, req ).then( this._decode ).then( this._success ).catch(this._fail );
	
	},

	/**
	 * The body of the POST is encoded as a JSON string.
	 * @param {string} url 
	 * @param {?Object} [vars=null] - object with properties that should be individually
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
	 * Each POST variable is encoded as a separate JSON string.
	 * @param {string} url 
	 * @param {?Object} [vars=null] 
	 * @returns {Promise}
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
	 * @param {?Object} [vars=null]
	 * @returns {string}
	 */
	encodeGETUrl( url, vars=null ) {

		if ( !vars || !url ) return url;
		return url + '?' + this.urlVars( vars );

	},

	/**
	 * 
	 * @param {?Object} vars
	 * @returns {?string}
	 */
	urlVars( vars ) {

		if ( !vars ) return null;

		let full = '';

		let props = Object.getOwnPropertyNames( vars );
		let len = props.length;
		if ( len === 0 ) return full;

		let p = props[0];
		full += encodeURIComponent(p) + '=' + encodeURIComponent(vars[p]);

		for( let i = 1; i < len; i++ ) {
			p = props[i];
			full +=  '&' + encodeURIComponent(p) + '=' + encodeURIComponent(vars[p]);
		}

		return ( full );
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

/**
 * 
 * @param {*} json - decoded json object.
 * @returns {*} the decoded json object.
 */
function okCb(json) {

	if ( this.success ) this.success( json );
	return json;

}

/**
 * 
 * @param {Response} res
 * @returns {Promise}
 */
function resultCb( res ){

	if ( res.ok === false ) throw new Error( res.statusText);

	// need a chance to get the error as text, not json.
	return res.text().then(

		txt=>{

			try {
				return JSON.parse( txt );
			} catch (e ){
				throw new Error(txt);
			}
		}

	);

}

/**
 * 
 * @param {?object|string} err 
 */
function failCb(err){

	if ( this.fail ) this.fail(err);
	throw err;

}

export default makeFetcher();