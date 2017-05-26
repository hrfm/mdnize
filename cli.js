#!/usr/bin/env node

'use strict';

var mdpick = require('./src/mdpick.js');
const args = process.argv.slice(2);

// ---------------------------------------------

var target = args[0];
if( !target || target == ""){
	target = ".";
}

var dest = args[1];
if( !dest || dest == ""){
	dest = "README.md";
}

var options = {
	"verbose" : false,
	"writeFileName" : true
};

var i = 2;
while( i < args.length ){
	switch( args[i] ){
		case "-v" :
			options.verbose = true;
			continue;
	}
}

(new mdpick(options)).pick( target, dest );