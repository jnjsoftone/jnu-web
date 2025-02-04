"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0}),Object.defineProperty(exports,"markdown",{enumerable:!0,get:function(){return u}});const t=(e=require("turndown"))&&e.__esModule?e:{default:e},r={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},n={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),n=t.querySelector("figcaption");if(!r)return e;let u=r.getAttribute("alt")||"",l=r.getAttribute("src")||"",i=n?n.textContent?.trim():"";return`![${u}](${l})

${i}

`}}},u=(e,u=r,l=n)=>{let i=new t.default(u);return Object.entries(l).forEach(([e,t])=>{i.addRule(e,t)}),i.turndown(e)};