define(["require"],function(){var e=function(){this._elements={}};return e.prototype={init:function(e){this._elements=e,this._loadGaiaCommit()},_dateToUTC:function(e){var t=[];return[e.getUTCFullYear(),e.getUTCMonth()+1,e.getUTCDate(),e.getUTCHours(),e.getUTCMinutes(),e.getUTCSeconds()].forEach(function(e){t.push(e>=10?e:"0"+e)}),t.splice(0,3).join("-")+" "+t.join(":")},_loadGaiaCommit:function(){const e="resources/gaia_commit.txt";if(!this._elements.dispHash.textContent){var t=new XMLHttpRequest;t.onreadystatechange=function(){if(4===t.readyState)if(0===t.status||200===t.status){var e=t.responseText.split("\n"),n=new Date(parseInt(e[1]+"000",10));this._elements.dispDate.textContent=this._dateToUTC(n),this._elements.dispHash.textContent=e[0].substr(0,8)}else console.error("Failed to fetch gaia commit: ",t.statusText)}.bind(this),t.open("GET",e,!0),t.responseType="text",t.send()}}},function(){return new e}});