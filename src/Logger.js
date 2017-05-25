/**
 * Logger.
 */
(function() {
	
	"use strict;"

	var black   = '\u001b[30m',
		red     = '\u001b[31m',
		green   = '\u001b[32m',
		yellow  = '\u001b[33m',
		blue    = '\u001b[34m',
		magenta = '\u001b[35m',
		cyan    = '\u001b[36m',
		white   = '\u001b[37m',
		reset   = '\u001b[0m';
	
	var Logger = function( pluginName ){
		this._pluginName = pluginName;
	}
	
	Logger.prototype.log = function( message ){
		if( this._pluginName ){
			console.log( magenta + "[" + this._pluginName + "]" + reset, message);
		}else{
			console.log( message );
		}
	}
	
	Logger.prototype.warn = function( message ){
		this.log( yellow + '[WARNING]' + reset + ' ' + message );
	}
	
	Logger.prototype.error = function( message ){
		this.log( red + '[ERROR]' + reset + ' ' + message );
	}
	
	return module.exports = Logger;
	
}).call(this);
