let e=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),a=e=>e.replace(/([[\]])/g,"\\$1"),t=e=>e.replace(/"/g,'\\"').replace(/\n/g,"\\n"),l=e=>e.replace(/\\"/g,'"').replace(/\\n/g,"\n"),r=e=>e.replace(/"/g,'\\"'),s=e=>Object.entries(e).map(([e,a])=>{let t=e.replace(/^{{|}}$/g,"");return`
        <div class="variable-item is-collapsed">
          <span class="variable-key" data-variable="${p(e)}">${p(t)}</span>
          <span class="variable-value">${p(a)}</span>
          <span class="chevron-icon" aria-label="Expand">
            <i data-lucide="chevron-right"></i>
          </span>
        </div>
      `}).join(""),p=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),c=(e,a,t)=>{let l=e.getAttribute(a);if(l)try{let r=new URL(t.href);r.pathname.endsWith("/")||(r.pathname=r.pathname.substring(0,r.pathname.lastIndexOf("/")+1));let s=new URL(l,r);if(["http:","https:"].includes(s.protocol)){let t=s.href;e.setAttribute(a,t)}else{let s=l.split("/"),p=s[2];if(p&&p.includes(".")){let r=`${t.protocol}//`+l.split("://")[1];e.setAttribute(a,r)}else{let t=s.slice(3).join("/"),l=new URL(t,r.origin+r.pathname).href;e.setAttribute(a,l)}}}catch(t){console.warn(`Failed to process URL: ${l}`,t),e.setAttribute(a,l)}},i=e=>e<1e3?`${Math.round(e)}ms`:`${(e/1e3).toFixed(2)}s`;export{e as escapeRegExp,a as escapeMarkdown,t as escapeValue,l as unescapeValue,r as escapeDoubleQuotes,s as formatVariables,p as escapeHtml,c as makeUrlAbsolute,i as formatDuration};