define([],function(){function t(t,e,n){function i(e,n){var i=t[n];if(i){var o=i.indexOf(e);o>=0&&i.splice(o,1)}}"function"==typeof e?Object.keys(t).forEach(i.bind(null,e)):n?i(n,e):e in t&&(t[e]=[])}function e(e){var n=e||[],i={insert:[],remove:[],replace:[],reset:[]},o=function(t,e){var n=i[t];n.forEach(function(n){n({type:t,data:e})})};return{get length(){return n.length},get array(){return n},forEach:function(t){n.forEach(t)},observe:function(t,e){var n=i[t];n&&n.push(e)},unobserve:t.bind(null,i),push:function(t){n.push(t),o("insert",{index:n.length-1,count:1,items:[t]})},pop:function(){if(n.length){var t=n.pop();return o("remove",{index:n.length,count:1}),t}},splice:function(t,e){if(!(arguments.length<2)){var i=Array.prototype.slice.call(arguments,2);n.splice.apply(n,arguments),e&&o("remove",{index:t,count:e}),i.length&&o("insert",{index:t,count:i.length,items:i})}},set:function(t,e){if(!(0>t||t>=n.length)){var i=n[t];n[t]=e,o("replace",{index:t,oldValue:i,newValue:e})}},get:function(t){return n[t]},reset:function(t){n=t,o("reset",{items:n})}}}return e});