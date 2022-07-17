var MP4Metadata=function(){function e(e,i){return t(e,g)?(i.tag_format="mp4",n(e,i).then(function(e){if(!e)throw Error("No playable streams.");return r(e.atom,e.size,i)})):Promise.reject(new Error("Unknown MP4 file type"))}function t(e,t){var n=e.getASCIIText(8,4);if(n in t)return!0;for(var r=16,i=e.getUint32(0);i>r;){var a=e.getASCIIText(r,4);if(r+=4,a in t)return!0}return!1}function n(e){return new Promise(function(t,r){var i=e.sliceOffset+e.viewOffset,a=e.readUnsignedInt(),o=e.readASCIIText(4);0===a?a=e.blob.size-i:1===a&&(a=4294967296*e.readUnsignedInt()+e.readUnsignedInt()),"moov"===o?e.getMore(i,a,function(e){t({atom:e,size:a})}):i+a+16<=e.blob.size?e.getMore(i+a,16,function(e){try{n(e).then(function(e){t(e)})}catch(i){r(i)}}):t(null)})}function r(e,t,n){for(e.advance(8);e.index<t;){var r=e.readUnsignedInt(),a=e.readASCIIText(4),u=e.index+r-8;if("udta"===a)s(e,t,n);else if("trak"===a){if(e.advance(-8),!i(e,["mdia","minf"]))throw Error("Not enough metadata in MP4 container!");if(o(e,"vmhd"))throw Error("Found video track in MP4 container");if(o(e,"smhd")&&i(e,["stbl","stsd"])){e.advance(20);var c=e.readASCIIText(4);if(!(c in p))throw Error("Unsupported format in MP4 container: "+c)}}e.seek(u)}return n}function i(e,t){return t.every(function(t){return a(e,t)})}function a(e,t){var n=e.index,r=e.readUnsignedInt();for(e.advance(4);e.index<n+r;){var i=e.readUnsignedInt(),a=e.readASCIIText(4);if(a===t)return e.advance(-8),!0;e.advance(i-8)}return!1}function o(e,t){var n=e.index,r=a(e,t);return e.seek(n),r}function s(e,t,n){for(;e.index<t;){var r=e.readUnsignedInt(),i=e.readASCIIText(4);if("meta"===i)return u(e,e.index+r-8,n),e.seek(t),void 0;e.advance(r-8)}}function u(e,t,n){for(e.advance(4);e.index<t;){var r=e.readUnsignedInt(),i=e.readASCIIText(4);if("ilst"===i)return c(e,e.index+r-8,n),e.seek(t),void 0;e.advance(r-8)}}function c(e,t,n){for(;e.index<t;){var r=e.readUnsignedInt(),i=e.readASCIIText(4),a=e.index+r-8,o=f[i];if(o)try{var s=l(e,a,i);i in d?(n[o]=s.number,s.count&&(n[d[i]]=s.count)):n[o]=s}catch(u){console.warn("skipping",i,":",u)}e.seek(a)}}function l(e,t,n){for(;e.index<t;){var r=e.readUnsignedInt(),i=e.readASCIIText(4);if("data"===i){var a=16777215&e.readUnsignedInt();e.advance(4);var o=r-16;if(n in d){e.advance(2);var s=e.readUnsignedShort(),u=e.readUnsignedShort();return{number:s,count:u}}switch(a){case 1:return e.readUTF8Text(o);case 13:return{flavor:"embedded",start:e.sliceOffset+e.viewOffset+e.index,end:e.sliceOffset+e.viewOffset+e.index+o,type:"image/jpeg"};case 14:return{flavor:"embedded",start:e.sliceOffset+e.viewOffset+e.index,end:e.sliceOffset+e.viewOffset+e.index+o,type:"image/png"};default:throw Error("unexpected type in data atom")}}else e.advance(r-8)}throw Error("no data atom found")}var f={"©alb":"album","©art":"artist","©ART":"artist",aART:"artist","©nam":"title",trkn:"tracknum",disk:"discnum",covr:"picture"},d={trkn:"trackcount",disk:"disccount"},g={"M4A ":!0,"M4B ":!0,mp41:!0,mp42:!0,isom:!0,iso2:!0},p={mp4a:!0,samr:!0,sawb:!0,sawp:!0};return{parse:e}}();