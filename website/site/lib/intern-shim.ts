/**
 * Het Salesbureau is geschreven voor claude.ai en praat met zijn omgeving via window.claude (mcp, sample, downloads, files).
 * Op de eigen site bestaat die omgeving niet; dit kleine script biedt dezelfde aanroepen aan en stuurt ze naar de eigen server.
 * Zo blijft er één bron voor het Salesbureau (werkomgeving/index.html) en werkt het op beide plekken.
 */
export const INTERN_SHIM = `<script>(function(){
var api=function(p,b,s){return fetch(p,{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(b),signal:s}).then(function(r){return r.json().catch(function(){return {error:"ongeldig_antwoord"};}).then(function(j){return {ok:r.ok,status:r.status,j:j};});});};
var inlog=function(){location.href="/intern/inloggen/";};
var mcp={callTool:function(server,tool,args){
  if(tool!=="execute_sql")return Promise.reject({code:"tool_error",message:"Onbekende actie "+tool});
  return api("/intern/api/sql/",{query:args.query}).then(function(x){
    if(x.status===401){inlog();return Promise.reject({code:"needs_reauth",message:"Opnieuw inloggen"});}
    if(!x.ok)return Promise.reject({code:"tool_error",message:x.j&&(x.j.message||x.j.error)||"Fout"});
    return {payload:x.j.rows};
  });
}};
var tekst=function(prompt,opts){return api("/intern/api/ai/",{prompt:prompt},opts&&opts.signal).then(function(x){
  if(x.status===401){inlog();return Promise.reject({code:"needs_reauth",message:"Opnieuw inloggen"});}
  if(!x.ok)return Promise.reject({code:x.j&&x.j.error==="rate_limited"?"rate_limited":"tool_error",message:x.j&&x.j.error==="ai_niet_ingesteld"?"AI is nog niet ingesteld op de server.":"AI gaf een fout"});
  return x.j.text||"";
});};
var sample=function(input,opts){return tekst(typeof input==="string"?input:JSON.stringify(input),opts).then(function(t){return {text:t,truncated:false};});};
sample.json=function(input,opts){return tekst((typeof input==="string"?input:JSON.stringify(input))+"\\n\\nAntwoord alleen met geldige JSON, zonder uitleg en zonder codeblok.",opts).then(function(t){
  var s=t.replace(/^\\s*\`\`\`(?:json)?/i,"").replace(/\`\`\`\\s*$/,"").trim();
  var a=s.search(/[\\[{]/);if(a>0)s=s.slice(a);
  try{return JSON.parse(s);}catch(e){return Promise.reject({code:"tool_error",message:"AI gaf geen leesbaar antwoord",text:t});}
});};
sample.limits=function(){return Promise.resolve({images:false});};
var downloads={save:function(o){return new Promise(function(res){
  var b=o.data instanceof Blob?o.data:new Blob([o.data]);var u=URL.createObjectURL(b);var a=document.createElement("a");
  a.href=u;a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(u);},1000);res({saved:true});
});}};
window.claude={use:function(n){return Promise.resolve(n==="mcp"?mcp:n==="sample"?sample:n==="downloads"?downloads:null);}};
})();</script>`;

/** Het Salesbureau gebruikt eigen scripts en stijl en haalt het lettertype bij Google; verder praat het alleen met deze site. */
export const INTERN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
