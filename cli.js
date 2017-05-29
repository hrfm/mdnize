#!/usr/bin/env node

'use strict';

var mdpick = require('./src/mdpick.js');
const args = process.argv.slice(2);

// ---------------------------------------------

var target  = ".";
var dest    = "README.md";
var options = {
	"verbose" : false,
	"writeFileName" : true
};

var i =0;
var opt = null;

while( i < args.length ){
	
	var arg = args[i++];
	
	if( arg.indexOf("-") == 0 ){
		opt = arg;
		switch( opt ){
			case "-v" :
				options.verbose = true;
				break;
		}
	}else if(opt){
		switch( opt ){
			case "-t" :
				target = arg;
				break;
			case "-d" :
				dest = arg;
				break;
		}
	}
	
}

(new mdpick(options)).pick( target, dest );