var mdpick = require('./index.js');

(new mdpick({
    "verbose"       : true,
    "writeFileName" : "#"
})).pick(".","README.md");