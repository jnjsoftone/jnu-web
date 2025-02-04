"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0}),!function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(exports,{mdContent:function(){return a},mdFrontmatter:function(){return l},mdTitle:function(){return u}});const t=(e=require("turndown"))&&e.__esModule?e:{default:e},r=require("jnu-abc"),n=require("./utils-string.js"),o={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},i={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),n=t.querySelector("figcaption");if(!r)return e;let o=r.getAttribute("alt")||"",i=r.getAttribute("src")||"",u=n?n.textContent?.trim():"";return`![${o}](${i})

${u}

`}},codeBlock:{filter:["pre","code"],replacement:(e,t)=>{if("CODE"===t.nodeName&&"PRE"===t.parentNode.nodeName)return"";if("PRE"===t.nodeName){let e=t.querySelector("code"),r=e?.getAttribute("class")?.replace(/^language-/,"")||"",n=(e?.textContent||t.textContent||"").split("\n").map(e=>e.trimEnd()).join("\n").trim();return`\`\`\`${r}
${n}
\`\`\`

`}return`\`${e}\``}}},u=(e,t)=>(t||r.sanitizeName)(e),a=(e,r={})=>{let{config:n=o,rules:u=i}=r,a=new t.default(n);return Object.entries(u).forEach(([e,t])=>{a.addRule(e,t)}),a.turndown(e)},l=e=>{let t="---\n";for(let[r,o]of Object.entries(e))if(t+=`${r}:`,Array.isArray(o))t+="\n",o.forEach(e=>{t+=`  - "${(0,n.escapeDoubleQuotes)(String(e))}"
`});else switch(typeof o){case"number":let e=String(o).replace(/[^\d.-]/g,"");t+=e?` ${parseFloat(e)}
`:"\n";break;case"boolean":t+=` ${o}
`;break;case"string":""!==o.trim()?t+=` "${(0,n.escapeDoubleQuotes)(o)}"
`:t+="\n";break;default:t+=o?` "${(0,n.escapeDoubleQuotes)(String(o))}"
`:"\n"}return"---\n---"===(t+="---\n").trim()?"":t};