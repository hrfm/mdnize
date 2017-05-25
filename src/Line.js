/**
 * 対象ファイルの各行を処理する際の処理内容の定義.
 */
(function() {

    "use strict;"

    var _regExp        = {};
    var _replaceRegExp = {};
    var _uncomment     = require("./uncomment.js");

    /*
    @md

    md@
    */
    var Line = function( line, startSymbol, endSymbol, extension ){

        var uncmt  = _uncomment(extension);

        if( typeof _regExp[extension] === "undefined" ){
            _regExp[extension] = new RegExp(
                "^(\\s*)" + uncmt + "(\\s*)" +                   // \s and uncomment string if exists.
                "("+startSymbol+"|"+endSymbol+")(?=\\[|\\s|$)" + // mdpick marker that is before '[' or \s or $.
                "(?:\\[(\\w*)\\])?" +                            // syntax if exists.
                "\\s*(.*)"                                       // inline text.
            );
        }

        var result = line.match(_regExp[extension]);

        if( result instanceof Array ){

            this.indent       = result[1] || "";
            this.uncommentStr = result[2] || "";
            this.whiteSpace   = result[3] || "";
            this.marker       = result[4];
            this.syntax       = result[5];
            this.inline       = result[6] || "";

            // 正規表現を生成する.
            // 一度でも生成されたものはキャッシュから取得する.

            var key = this.indent.length + "_" + this.whiteSpace.length + "_" + this.uncommentStr;
            if( this.useSyntax() || this.uncommentStr == "" ){
                // syntax 指定の場合はインデント文字列を
                // @mdpick が記述されている行のインデント文字列数のみ削除する
                key = this.syntax + "_" + key;
                if( !_replaceRegExp[key] ){
                    _replaceRegExp[key] = new RegExp("^\\s{0,"+this.indent.length+"}");
                }
            }else{
                // それ以外の場合.
                if( !_replaceRegExp[key] ){
                    _replaceRegExp[key] = new RegExp("^\\s*"+uncmt+"\\s{0,"+this.whiteSpace.length+"}");
                }
            }
            this.replaceReg = _replaceRegExp[key];

        }

    }

    /**
     * @md
     * ### isMatched
     * md@
     */
    Line.prototype.isMatched = function(){
        return ( typeof this.indent !== "undefined" );
    }

    /**
     * @md
     * ### isStart
     * md@
     */
    Line.prototype.isStart = function(){
        return this.marker && this.marker.indexOf("@") == 0;
    }

    /**
     * @md
     * ### isEnd
     * md@
     */
    Line.prototype.isEnd = function(){
        return this.marker && this.marker.lastIndexOf("@") == this.marker.length-1;
    }

    /**
     * @md
     * ### isEnd
     * md@
     */
    Line.prototype.isInline = function(){
        return this.inline && this.inline != "";
    }

    /**
     * @md
     * ### isEnd
     * md@
     */
    Line.prototype.useSyntax = function(){
        return this.syntax && this.syntax != "";
    }

    /**
     * @md
     * ### replace
     * md@
     */
    Line.prototype.replace = function( line, str ){
        if( !str ){
            str = "";
        }
        return line.replace(this.replaceReg,str);
    }

    return module.exports = Line;

}).call(this);
