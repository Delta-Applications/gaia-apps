function MockDownload(e){e=e||{},this.id=e.id||"0",this.totalBytes=e.totalBytes||DEFAULT_DOWNLOAD.totalBytes,this.currentBytes=e.currentBytes||DEFAULT_DOWNLOAD.currentBytes,this.url=e.url||DEFAULT_DOWNLOAD.url,this.path=e.path||DEFAULT_DOWNLOAD.path,this.state=e.state||DEFAULT_DOWNLOAD.state,this.contentType=e.contentType||DEFAULT_DOWNLOAD.contentType,this.started=e.started||DEFAULT_DOWNLOAD.started}function _getState(e){return 0===e?"stopped":"downloading"}var DEFAULT_DOWNLOAD={id:"0",totalBytes:1800,currentBytes:100,url:"http://firefoxos.com/archivo.mp3",path:"//SDCARD/Downloads/archivo.mp3",state:"downloading",contentType:"audio/mpeg",started:new Date},MOCK_LENGTH=10;MockDownload.prototype={pause:function(){},resume:function(){}},navigator.mozDownloadManager={getDownloads:function(){return{then:function(e){for(var t=[],n=0;MOCK_LENGTH>n;n++){var i=new MockDownload({id:"message-"+n,url:"http://firefoxos.com/archivo"+n+".mp3",path:"//SDCARD/Downloads/archivo"+n+".mp3",state:_getState(n)});t.push(i)}setTimeout(function(){e(t)})}}},remove:function(){return{then:function(e){setTimeout(e)}}},set ondownloadstart(e){setTimeout(function(){var t=MOCK_LENGTH+10,n=new MockDownload({id:"message-"+t,url:"http://firefoxos.com/loremipsumblablablablablablablablabla.mp3",path:"//SDCARD/Downloads/newFile.mp3",state:"downloading"});e({download:n})},5e3)}};