#!/usr/bin/env node

'use strict';

var mdpick = require('./src/mdpick.js');
const args = process.argv.slice(2);

// ---------------------------------------------

var targetDir = args[0];
if( !targetDir || targetDir == ""){
	targetDir = ".";
}

(new mdpick({
	"base"          : "README.md",
	"verbose"       : false,
	"writeFileName" : true
})).pick( targetDir );