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
    
    var mdpick = module.exports = function( options ){
        this.options = extend({
            "startSymbol"   : "@md",       // 開始文字列.
            "endSymbol"     : "md@",       // 終了文字列.
            "out"           : "README.md", // 出力ファイル名.
            "base"          : undefined,   // 元となるファイルを指定するかどうか.
            "writeFileName" : true,        // ファイル名を出力するか. 文字列を指定した場合 その文字列を手前に差し込みます.
            "verbose"       : false        // 細かなログを出力するかどうか.
        },options);
        
    };
    
    mdpick.prototype.pick = function( file ){
        this._output = ["<!-- @mdpick -->"];
        this._check(file,"./");
        this._writeFile();
    };
    
    // -------- PRIVATE ---------------------------------------------------------------------
    
    mdpick.prototype._check = function( file, dir ){
        var uri  = path.resolve(dir+file);
        var stat = fs.statSync(uri);
        if( stat.isDirectory() ){
            var list = fs.readdirSync(uri);
            for (var i = 0; i < list.length; i++) {
                this._check( list[i], dir+"/"+file + "/" );
            }
        }else if( stat.isFile() ){
            this._readFile(uri);
        }
    }
    
    mdpick.prototype._readFile = function( uri, callback ){
        
        var filename  = uri.substr( uri.lastIndexOf("/")+1, uri.length );
        var extension = filename.substr( filename.lastIndexOf(".")+1, filename.length );

        var basepath  = ( typeof this.options.base !== 'undefined' ) ? path.resolve('.',this.options.base) : path.resolve(__dirname);
        basepath = basepath.substr(0,basepath.lastIndexOf('/'));
        
        // markdown は無視.
        if( extension.toLowerCase() == "md" ){
            if( callback ) callback();
            return;
        }

        // ------------------------------------------------------------------------
        // --- Start
        
        var picked = [];
        var lines  = fs.readFileSync(uri,'utf8').toString().split(/\r?\n/);

        if( this.options.verbose == true ){
            logger.log( "Processing " + uri );
        }

        // ファイル名の出力設定があった場合出力する.
        
        if( this.options.writeFileName === true ){
            picked.push( [ "## " + path.relative(basepath,uri) ] );
        }else if( typeof options.writeFileName === "string" ){
            picked.push( [ options.writeFileName + path.relative(basepath,uri) ] );
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
            this._output.push( picked.join("\r\n\r\n") );
        }
        
    }
    
    mdpick.prototype._writeFile = function(){
        
        if( this._output.length <= 1 ){
            return;
        }
        
        // 出力内容があった場合に出力を行う.
        
        this._output.push("<!-- mdpick@ -->");
        
        var buffer;
        
        if( typeof this.options.base !== "undefined" ){
            
            if( this.options.verbose == true ){
                logger.log( "Create " + this.options.out + " based on " + this.options.base );
            }
            
            try{

                var base = fs.readFileSync( path.resolve( ".", this.options.base ) );

                var reg  = /<!\-+\s*@mdpick\s*\-+>(.|\n|\r)+<!\-+\s*mdpick@\s*\-+>/m;
                var src  = base.toString();

                if( src.match(reg) ){
                    buffer = new Buffer( src.replace(reg,this._output.join("\n\n")) );
                }else{
                    buffer = new Buffer( src + "\n\n" + this._output.join("\n\n") );
                }

            }catch(e){

                logger.error(e);
                
                buffer = new Buffer(this._output.join("\n\n"));

            }

        }else{
            
            if( this.options.verbose == true ){
                logger.log( "Create " + this.options.out );
            }
            
            buffer = new Buffer(this._output.join("\r\n\r\n"));
            
        }
        
        // 出力ファイルを生成（新規ファイル生成にはgulp-utilのFileを利用する）
        // TODO ファイルを生成するが independently の場合はsrc をそのまま返す.
        
        fs.writeFile( path.resolve( ".", this.options.out ), buffer.toString() );
        
    }
    
    return mdpick;
    
}).call(this);