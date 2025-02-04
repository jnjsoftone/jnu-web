import e from"turndown";import{sanitizeName as t}from"jnu-abc";import{escapeDoubleQuotes as r}from"./utils-string.js";let n={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},i={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),n=t.querySelector("figcaption");if(!r)return e;let i=r.getAttribute("alt")||"",o=r.getAttribute("src")||"",a=n?n.textContent?.trim():"";return`![${i}](${o})

${a}

`}},codeBlock:{filter:["pre","code"],replacement:(e,t)=>{if("CODE"===t.nodeName&&"PRE"===t.parentNode.nodeName)return"";if("PRE"===t.nodeName){let e=t.querySelector("code"),r=e?.getAttribute("class")?.replace(/^language-/,"")||"",n=(e?.textContent||t.textContent||"").split("\n").map(e=>e.trimEnd()).join("\n").trim();return`\`\`\`${r}
${n}
\`\`\`

`}return`\`${e}\``}}},o=(e,r)=>(r||t)(e),a=(t,r={})=>{let{config:o=n,rules:a=i}=r,l=new e(o);return Object.entries(a).forEach(([e,t])=>{l.addRule(e,t)}),l.turndown(t)},l=e=>{let t="---\n";for(let[n,i]of Object.entries(e))if(t+=`${n}:`,Array.isArray(i))t+="\n",i.forEach(e=>{t+=`  - "${r(String(e))}"
`});else switch(typeof i){case"number":let e=String(i).replace(/[^\d.-]/g,"");t+=e?` ${parseFloat(e)}
`:"\n";break;case"boolean":t+=` ${i}
`;break;case"string":""!==i.trim()?t+=` "${r(i)}"
`:t+="\n";break;default:t+=i?` "${r(String(i))}"
`:"\n"}return"---\n---"===(t+="---\n").trim()?"":t};export{o as mdTitle,a as mdContent,l as mdFrontmatter};