"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),Object.defineProperty(exports,"Cheerio",{enumerable:!0,get:function(){return f}});const e=/*#__PURE__*/function(e,t){if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var n=r(t);if(n&&n.has(e))return n.get(e);var o={__proto__:null},l=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in e)if("default"!==u&&Object.prototype.hasOwnProperty.call(e,u)){var i=l?Object.getOwnPropertyDescriptor(e,u):null;i&&(i.get||i.set)?Object.defineProperty(o,u,i):o[u]=e[u]}return o.default=e,n&&n.set(e,o),o}(require("cheerio"));function t(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function r(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,n=new WeakMap;return(r=function(e){return e?n:t})(e)}const n=(e,t)=>e instanceof Function?e(t):e.find(t),o=(e,t)=>e instanceof Function?e(t).eq(0):e.find(t).eq(0),l=(e,t)=>{let r;switch(t??(t="text"),t.toLowerCase()){case"text":r=e.text().trim();break;case"texts":let n=e.contents(),o=[];for(let e=0;e<n.length;e++){let t=n.eq(e).text().trim();t.length>0&&o.push(t)}r=o;break;case"innerhtml":r=e.html().trim();break;default:r=e.attr(t)}return r},u=(e,t,r)=>{r??(r="text");let n=o(e,t);return n?l(n,r):""},i=(e,t,r)=>{r??(r="text");let o=n(e,t);if(!o)return[];let u=[];for(let e=0;e<o.length;e++){let t=l(o.eq(e),r);t&&u.push(t)}return u},c=(e,t)=>e.html(o(e,t)),s=(e,t=[])=>{let r={};for(let n of t){if(!n.selector)continue;let t=u(e,n.selector,n.target);r[n.key]=n.callback?n.callback(t):t}return r},a=(e,t=[],r=[])=>{let n=[];for(let o=0;o<e.length;o++){let l=s(e[o],t);if(!l)continue;let u=!1;for(let e of r)if(!l[e]){u=!0;break}u||n.push(l)}return n};class f{root(){return this.$}value(e,t){return u(this.$,e,t)}values(e,t){return i(this.$,e,t)}html(e){return c(this.$,e)}json(e=[]){return s(this.$,e)}jsons(e,t=[],r=[]){return a(e,t,r)}constructor(r){t(this,"source",void 0),t(this,"$",void 0),this.source=r,this.$=e.load(r)}}