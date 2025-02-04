import e from"turndown";let t={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},r={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),i=t.querySelector("figcaption");if(!r)return e;let l=r.getAttribute("alt")||"",n=r.getAttribute("src")||"",o=i?i.textContent?.trim():"";return`![${l}](${n})

${o}

`}}},i=(i,l=t,n=r)=>{let o=new e(l);return Object.entries(n).forEach(([e,t])=>{o.addRule(e,t)}),o.turndown(i)};export{i as markdown};