module.exports = {
  
  'src'  : '.',
  'dest' : 'README.md',
  
  'options' : {
    'startSymbol'   : "md:", // 開始文字列.
    'endSymbol'     : ":md", // 終了文字列.
    'writeFileName' : true,  // ファイル名を出力するか. 文字列を指定した場合 その文字列を手前に差し込みます.
    'verbose'       : false  // 細かなログを出力するかどうか.
  }
  
};