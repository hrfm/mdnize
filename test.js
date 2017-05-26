var mdpick = require('./index.js');

(new mdpick({
    "verbose"       : true,
    "writeFileName" : "#"
})).pick("test","README.md");