define([],function(){function t(t,e,n){function i(e,n){var i=t[n];if(i){var o=i.indexOf(e);o>=0&&i.splice(o,1)}}"function"==typeof e?Object.keys(t).forEach(i.bind(null,e)):n?i(n,e):e in t&&(t[e]=[])}function e(e){var n={},i={observe:function(t,e){var i=n[t];i&&i.push(e)},unobserve:t.bind(null,n)},o=function(t){return function(){return i["_"+t]}},r=function(t){return function(e){var o=i["_"+t];if(o!==e){i["_"+t]=e;var r=n[t];r.forEach(function(t){t(e,o)})}}};for(var a in e)"function"!=typeof e[a]?(n[a]=[],Object.defineProperty(i,"_"+a,{value:e[a],writable:!0}),Object.defineProperty(i,a,{enumerable:!0,get:o(a),set:r(a)})):i[a]=e[a];return i}return e});