var mdnize = require('./index.js');

(new mdnize({
    "verbose"       : true,
    "writeFileName" : "#"
})).pick(".","README.md");