var MDPick = require('./index.js');

var md = new MDPick({
    //"base"          : "README.md",
    "out"           : "./test/README.md",
    "verbose"       : true,
    "writeFileName" : true
});

md.pick("test");