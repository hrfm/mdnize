#!/usr/bin/env node

'use strict';

var fs     = require("fs"),
	path   = require("path"),
	extend = require("extend"),
	mdnize = require('./src/mdnize.js')
	;

// ---------------------------------------------

var configUri = "mdnize.config.js",
	src       = ".",
	dest      = "README.md",
	options   = {}
	;

var i   = 0;
var opt = null;

const args = process.argv.slice(2);
while( i < args.length ){

	var arg = args[i++];
	
	if( arg.indexOf("-") == 0 ){
		opt = arg;
		switch( opt ){
			case "-verbose" :
			case "-v" :
				options.verbose = true;
				break;
		}
	}else if(opt){
		switch( opt ){
			case "-src" :
			case "-s" :
				src = arg;
				break;
			case "-dest" :
			case "-d" :
				dest = arg;
				break;
			case "-config" :
			case "-c" :
				configUri = arg;
				break;
		}
	}

}

try{
	var uri  = path.resolve( configUri );
	var stat = fs.statSync(uri);
	if( stat.isFile() ){
		var config = require(uri);
		if( config.src     ) src     = config.src;
		if( config.dest    ) dest    = config.dest;
		if( config.options ) options = extend(options,config.options);
	}
}catch(e){}

if( options.verbose ){
	console.log( src, dest, options );
}

// ----------------------------------------------

(new mdnize(options)).pick( src, dest );