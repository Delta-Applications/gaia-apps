var VorbisPictureComment=function(){function e(e){var t=e.readUnsignedInt();if(3!=t)return null;var n=e.readUnsignedInt(),r=e.readASCIIText(n);if("-->"==r)return console.error("URL for cover art is not supported from Vorbis comment."),null;n=e.readUnsignedInt(),e.readNullTerminatedUTF8Text(n),e.advance(16);var i=e.readUnsignedInt(),o=e.index;return{flavor:"embedded",start:o,end:o+i,type:r}}function t(e,t){function n(e){return e>64&&91>e?e-65:e>96&&123>e?e-71:e>47&&58>e?e+4:43===e?62:47===e?63:0}for(var r,i,o=e.replace(/[^A-Za-z0-9\+\/]/g,""),a=o.length,s=t?Math.ceil((3*a+1>>2)/t)*t:3*a+1>>2,u=new Uint8Array(s),c=0,l=0,f=0;a>f;f++)if(i=3&f,c|=n(o.charCodeAt(f))<<18-6*i,3===i||1===a-f){for(r=0;3>r&&s>l;r++,l++)u[l]=255&c>>>(24&16>>>r);c=0}return u}function n(n){return new Promise(function(r){if(!n.picture)return r(n),void 0;var i=n.picture;try{var o=t(i),a=new Blob([o]);BlobView.get(a,0,a.size,function(t){var i=e(t);i&&(n.picture={flavor:"unsynced",blob:a.slice(i.start,i.end,i.type)}),r(n)},BlobView.bigEndian)}catch(s){console.warn("Error parsing picture comment",s.message),r(n)}})}return{readPicFrame:e,parsePictureComment:n}}();