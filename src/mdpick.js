var fs       = require('fs'),
    path     = require('path'),
    extend   = require('extend'),
    Line     = require('./Line.js'),
    Logger   = require('./Logger.js');

module.exports = (function(){
    
    // --------------------------------------------------------------------------------------
    // --- Log utils.
    
    var logger = new Logger("mdpick");
    
    // --------------------------------------------------------------------------------------
    // --- Module.

	/**
	 * @class
     * @type {module.exports}
     */
    var mdpick = module.exports = function( options ){
        this.options = extend({
            "startSymbol"   : "md:",       // 開始文字列.
            "endSymbol"     : ":md",       // 終了文字列.
            "writeFileName" : false,       // ファイル名を出力するか. 文字列を指定した場合 その文字列を手前に差し込みます.
            "verbose"       : false        // 細かなログを出力するかどうか.
        },options);
    };
    
	/**
     * 取得対象を調べ Markdown 文字列を抜き出し,ファイルを出力します.
     * @param target    取得対象
     * @param dest      出力ファイル
     */
    mdpick.prototype.pick = function( target, dest ){
        var result = {};
        this._pick( target, ".", result );
        this._writeFile(dest,result);
    };
    
    // --- PRIVATE
    
	/**
	 * 取得対象を調べ Markdown 文字列を抜き出す処理の実際処理です.
     * 対象がディレクトリの場合は、子ディレクトリに対しても再帰的に行います.
     * 
     * @param target    Markdown 文字列の取得対象のパス.
     * @param dir       チェック中のディレクトリのパス.
     * @param obj       取得した内容を保存するための Object.
     * @private
     */
    mdpick.prototype._pick = function( target, dir, obj ){
        
        var uri  = path.resolve( dir + "/" + target );
        
        // --- stat を調べ ディレクトリとファイルで処理を切り分ける.
        
        var stat = fs.statSync(uri);
        if( stat.isDirectory() ){
            obj[target] = {};
            var list = fs.readdirSync(uri);
            for (var i = 0; i < list.length; i++) {
                this._pick( list[i], dir+"/"+target, obj[target] );
            }
        }else if( stat.isFile() ){
            var output = this._readFile(uri);
            if( output ){
                obj[target] = output;
            }
        }
        
    };

	/**
	 * ファイルを走査して Markdown を発見したらピックアップします.
     * 
     * @param uri
     * @returns {*}
     * @private
     */
    mdpick.prototype._readFile = function( uri ){
        
        var filename  = uri.substr( uri.lastIndexOf("/")+1, uri.length );

        // --- markdown ファイルは無視する.
        var extension = filename.substr( filename.lastIndexOf(".")+1, filename.length );
        if( extension.toLowerCase() == "md" ){
            return;
        }
        
        var basepath  = ( typeof this.options.base !== 'undefined' ) ? path.resolve('.',this.options.base) : path.resolve(__dirname);
        basepath = basepath.substr(0,basepath.lastIndexOf('/'));
        
        // ------------------------------------------------------------------------
        // --- Check Process Start.
        
        var picked = [];
        var lines  = fs.readFileSync(uri,'utf8').toString().split(/\r?\n/);
        
        if( this.options.verbose == true ){
            logger.log( "[Processing] " + uri );
        }
        
        // ファイルの読み込み.
        
        for( var i=0,len=lines.length; i<len; i++ ){

            var r = new Line( lines[i], this.options.startSymbol, this.options.endSymbol, extension );

            // マーカーの条件とマッチした場合.
            if( r.isMatched() ){

                var src = [], isEnd = false;

                // 開始タグであった場合 pick を開始する.
                if( r.isStart() ){

                    // コードハイライト用の syntax 指定がある場合は開始文字列を追記.
                    if( r.useSyntax() ) src.push("```"+ r.syntax);

                    if( r.isInline() ){

                        // inline 記述の場合は閉じタグを調べずその後に書かれたものを出力する.
                        src.push(r.inline);

                    }else{

                        // それ以外の場合. isEnd == true になるまで行を処理しつづける.
                        do{

                            if( ++i == len ){

                                // 最終行であった場合は終了.
                                isEnd = true;

                            }else{

                                // 次の行を調べる.
                                var r2 = new Line( lines[i], this.options.startSymbol, this.options.endSymbol, extension);

                                if( r2.isStart() ){
                                    // 開始タグ内に開始タグがある場合はエラー
                                    logger.error("Can't use startSymbol during picking.");
                                }else if( r2.isEnd() ){
                                    // 閉じタグがある場合は終了
                                    isEnd = true;
                                }else{
                                    // それ以外の場合はインデント等を消して出力に追加.
                                    src.push(r.replace(lines[i]));
                                }

                            }

                        }while( !isEnd );

                    }

                    // コードハイライト用の syntax 指定がある場合は終了文字列を追記.
                    if( r.useSyntax() ) src.push("```");

                }

                picked.push( src.join("  \r\n") );

            }

        }
        
        // pick された行が1行以上ある場合に output に追加.
        if( 1 < picked.length ){
            if( this.options.verbose == true ){
                logger.log( "Pick from " + uri );
            }
            return picked.join("\r\n\r\n");
        }
        
        return null;
        
    }

	/**
	 * 結果をパースして文字列化する処理です.
     * @mdpick[xxx] の記述法を拡張するならここに記載する
     * 
     * @param result
     * @param output
     * @returns {*}
     * @private
     */
    mdpick.prototype._parseResult = function( result, map, nest ){
        
        for( var key in result ){
            
            var uri = nest.concat([key]).join("/");
            
            output = map[''];
            for( var pattern in map ){
                if( pattern != '' ){
                    regPattern = "^(\\.\\/)?" + pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    if( new RegExp(regPattern).test(uri) ){
                        output = map[pattern];
                        break;
                    }
                }
            }
            
            var type = typeof result[key];
            switch( type ) {
                case "object" :
                    this._parseResult( result[key], map, nest.concat([key]) );
                    break;
                case "string" :
                    if( this.options.writeFileName === true ) {
                        output.push("## " + uri);
                    }else if( typeof this.options.writeFileName === "string" ){
                            output.push( this.options.writeFileName + " " + uri );
                    }else{
                        output.push( "<!-- " + uri + " -->" );
                    }
                    output.push( result[key] );
                    break;
            }
            
        }
        
        return map;
        
    }

	/**
     * 第一引数で指定した文字列の中に記載されている <!-- mdpick --> を元に
     * 第二引数で指定したオブジェクトのキーと照らし合わせ, マッチしたものを置換します.
     * 
     * @param str
     * @param map
     * @private
     */
    mdpick.prototype._createBuffer = function( str, map ){
        
        for( var key in map ){
            
            var open, regexp;
            
            if( key == "" ){
                open   = "<!-- mdpick: -->";
                regexp = /<!\-\-\smdpick:\s\-\->((.|\r|\n)+?)<!\-\-\s:mdpick\s\-\->/mg;
            }else{
                open   = "<!-- mdpick["+key+"]: -->";
                regexp = new RegExp("<!\\-\\-\\smdpick\\["+key+"\\]:\\s\\-\\->((.|\\r|\\n)+?)<!\\-\\-\\s:mdpick\\s\\-\\->","mg");
            }
            open += "\r\n\r\n";
            
            str = str.replace( regexp, open + map[key].join("\r\n\r\n") + "\r\n\r\n<!-- :mdpick -->");
            
        }
        
        return new Buffer(str);
        
    }
    
	/**
	 * ピックアップされた Markdown のデータの構造を元に、出力先ファイルの記述に応じて Markdown 文字列を出力します.
     * 
     * @param dest      出力先ファイル
     * @param result    ピックアップ結果
     * @private
     */
    mdpick.prototype._writeFile = function( dest, result ){
        
        if( typeof this.options.base === "undefined" ){
            this.options.base = "README.md";
        }
        
        var destString = "";
        var destStringMap = { "":[] };
        
        try{
            
            destString = fs.readFileSync( path.resolve( ".", dest ) ).toString();
            
            // --- 出力対象のファイル内に <!-- @mdpick --> があるかを調べる.
            
            var reg = /<!\-\-\smdpick\[?([\d\w\-._ /]*)\]?:\s\-\->((.|\r|\n)+?)<!\-\-\s:mdpick\s\-\->/mg;
            var matches = destString.match(reg);
            
            if( matches ){
                
                // --- <!-- @mdpick --> に [] でファイル指定があるかを調べる. あればそこはそのファイル or ディレクトリ以下を出力するように準備する. なければ 全てを <!-- @mdpick --> 内に書く
                
                var reg2 = /<!\-\-\smdpick\[?([\d\w\-._ /]*)\]?:\s\-\->/;
                for( var i=0; i<matches.length; i++ ){
                    var target = matches[i].match(reg2)[1];
                    if( !destStringMap[target] ){
                        destStringMap[target] = [];
                    }
                }
                
            }else{
                
                destString += "<!-- mdpick: -->\n\n<!-- :mdpick -->";
                
            }
            
        }catch(e){}
        
        if( destString == "" ) {
            destString = "<!-- mdpick: -->\n\n<!-- :mdpick -->";
        }
        
        var buffer = this._createBuffer( destString, this._parseResult( result, destStringMap,[] ) );
        if( buffer ){
            fs.writeFile( path.resolve( ".", dest ), buffer.toString() );
        }
        
    }
    
    return mdpick;
    
}).call(this);