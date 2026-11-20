"use strict";
/* ---------- small storage helpers (this phone only) ---------- */
const BASE=location.pathname.replace(/[^/]*$/,"")||"/";
const store={
  get(k){try{return localStorage.getItem(k);}catch(e){return null;}},
  set(k,v){try{localStorage.setItem(k,v);}catch(e){}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};
function readToken(){
  let tk=store.get("jme_token");
  if(!tk){try{const m=document.cookie.match(/(?:^|; )jme_token=([a-f0-9]{32,})/);if(m)tk=m[1];}catch(e){}}
  return tk||null;
}
function saveToken(tk){
  store.set("jme_token",tk);
  try{document.cookie="jme_token="+tk+";max-age=31536000;path="+BASE+";SameSite=Lax"+(location.protocol==="https:"?";Secure":"");}catch(e){}
}
function clearToken(){
  store.del("jme_token");
  try{document.cookie="jme_token=;max-age=0;path="+BASE;}catch(e){}
}

/* ---------- state ---------- */
const S={
  lang:"en",mode:"crew",trailer:"old",date:null,
  token:null,me:null,items:[],loads:{},templates:[],daily:[],forgets:[],streakStart:null,codes:null,members:[],
  loaded:false,loadedDay:null,offline:false,fatal:false,sig:"",busy:0,wseq:0,rseq:0,
  pending:new Set(),prevPct:{},_formTr:null,
  join:{step:"code",code:"",role:null,names:[],err:"",busy:false,typing:false,name:""},
  hintOff:store.get("jme_hint")==="off"
};
{const l=store.get("jme_lang");if(l==="es"||l==="en")S.lang=l;else if((navigator.language||"").toLowerCase().startsWith("es"))S.lang="es";
 const tr=store.get("jme_trailer");if(TRAILERS.includes(tr))S.trailer=tr;}
const t=()=>T[S.lang];
const isLead=()=>!!(S.me&&S.me.role==="lead");

/* dates (local) */
const pad=n=>String(n).padStart(2,"0");
const keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromKey=k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d);};
const addDays=(k,n)=>{const d=fromKey(k);d.setDate(d.getDate()+n);return keyOf(d);};
const daysBetween=(a,b)=>Math.round((fromKey(b)-fromKey(a))/864e5);
const todayKey=()=>keyOf(new Date());
S.date=new Date().getHours()>=15?addDays(todayKey(),1):todayKey();

/* ---------- dom helpers ---------- */
const $=id=>document.getElementById(id);
function h(tag,attrs,...kids){
  const el=document.createElement(tag);
  if(attrs) for(const k in attrs){
    const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="class") el.className=v;
    else if(k.startsWith("on")) el.addEventListener(k.slice(2),v);
    else if(k==="text") el.textContent=v;
    else el.setAttribute(k,v===true?"":v);
  }
  for(const c of kids.flat(3)){ if(c==null||c===false) continue; el.append(c.nodeType?c:document.createTextNode(String(c))); }
  return el;
}
const checkSvg=()=>{const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("width","20");s.setAttribute("height","20");s.setAttribute("viewBox","0 0 24 24");s.innerHTML='<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#062814" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';return s;};
let toastTimer;
function toast(msg,actLabel,act){
  const el=$("toast"); el.textContent=msg;
  if(act) el.append(h("button",{type:"button",onclick:()=>{el.classList.remove("show");act();}},actLabel));
  el.classList.add("show"); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove("show"),act?5500:2600);
}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){}}
const isStandalone=()=>{try{return window.navigator.standalone===true||matchMedia("(display-mode: standalone)").matches;}catch(e){return false;}};
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent||"");
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;render();});

/* ---------- server ---------- */
let sb=null,chan=null;
async function rpc(fn,args){
  const {data,error}=await sb.rpc(fn,args);
  if(error) throw error;
  return data;
}
const isAuthErr=e=>/JME_AUTH/.test((e&&e.message)||"");
function ping(){try{chan&&chan.send({type:"broadcast",event:"changed",payload:{}});}catch(e){}}

function apply(d){
  const sig=JSON.stringify(d);
  if(sig===S.sig&&S.loaded&&S.loadedDay===S.date) return false;
  S.sig=sig; S.loaded=true; S.loadedDay=d.day;
  S.me=d.me; S.items=d.items||[]; S.loads=d.loads||{}; S.templates=d.templates||[]; S.daily=d.daily||[];
  S.forgets=d.forgets||[]; S.streakStart=d.streak_start||null; S.codes=d.codes||null; S.members=d.members||[];
  if(!isLead()) S.mode="crew";
  else if(!S._modeSet){S._modeSet=true;S.mode=store.get("jme_mode")==="crew"?"crew":"boss";}
  render();
  return true;
}
async function refresh(){
  if(!S.token||!sb) return;
  const my=++S.rseq,w=S.wseq,date=S.date;
  try{
    const d=await rpc("jme_board",{p_token:S.token,p_day:date});
    if(my!==S.rseq||w!==S.wseq||S.busy>0||date!==S.date||!S.token) return;
    const was=S.offline; S.offline=false;
    if(!apply(d)&&was) render();
  }catch(e){
    if(isAuthErr(e)){signOutLocal();return;}
    if(my!==S.rseq) return;
    if(!S.offline){S.offline=true;render();}
  }
}
function writeFailed(e){
  const m=(e&&e.message)||"";
  if(/JME_AUTH/.test(m)){signOutLocal();return;}
  if(/JME_LEAD/.test(m)) toast(t().leadsOnly);
  else if(/JME_/.test(m)) toast(t().saveFail);
  else toast(t().err_net);
}
/* Writes show on screen right away, then go to the server. Taps on the same
   item (key) are sent in order, so a fast second tap is never lost. */
const chains=new Map();
async function write(fn,args,optimistic,key){
  S.busy++; S.wseq++;
  if(optimistic){optimistic();S.sig="";render();}
  const run=async()=>{const r=await rpc(fn,args);ping();return r;};
  let p;
  if(key){const prev=chains.get(key)||Promise.resolve();p=prev.then(run,run);chains.set(key,p);}
  else p=run();
  try{return await p;}
  catch(e){writeFailed(e);throw e;}
  finally{if(key&&chains.get(key)===p)chains.delete(key);S.busy--;if(S.busy===0){S.sig="";refresh();}}
}
function start(){
  try{if(chan)sb.removeChannel(chan);}catch(e){}
  try{
    chan=sb.channel("jme-board",{config:{broadcast:{self:false}}});
    chan.on("broadcast",{event:"changed"},()=>{if(S.busy===0)refresh();});
    chan.subscribe();
  }catch(e){chan=null;}
  S.loaded=false; S.sig=""; S._modeSet=false;
  render(); refresh();
}
function signOutLocal(){
  clearToken();
  try{if(chan)sb.removeChannel(chan);}catch(e){} chan=null;
  S.token=null; S.me=null; S.loaded=false; S.items=[]; S.loads={}; S.codes=null; S.members=[]; S.sig="";
  S.join={step:"code",code:"",role:null,names:[],err:"",busy:false,typing:false,name:""};
  closeSheet(); render();
}
async function signOut(){
  const tk=S.token; signOutLocal();
  try{await rpc("jme_signout",{p_token:tk});}catch(e){}
}

/* ---------- join ---------- */
async function checkCode(code){
  if(S.join.busy||!sb) return;
  S.join.busy=true; S.join.err=""; render();
  try{
    const r=await rpc("jme_names",{p_code:code});
    if(r&&r.error) S.join.err="err_"+r.error;
    else{S.join.code=code;S.join.role=r.role;S.join.names=r.names||[];S.join.step="name";S.join.typing=S.join.names.length===0;S.join.name="";}
  }catch(e){S.join.err="err_net";}
  S.join.busy=false; render();
  const f=$(S.join.step==="code"?"codeIn":"newNameIn"); if(f&&(S.join.step==="code"||S.join.typing)) f.focus();
}
async function doJoin(name){
  if(S.join.busy) return;
  name=(name||"").trim(); if(!name){S.join.err="err_name";render();return;}
  S.join.busy=true; S.join.err=""; render();
  try{
    const r=await rpc("jme_join",{p_code:S.join.code,p_name:name});
    if(r&&r.error){
      S.join.err="err_"+r.error;
      if(r.error==="bad"||r.error==="slow") S.join.step="code";
    }else{
      saveToken(r.token); S.token=r.token; S.me={id:r.id,name:r.name,role:r.role};
      S.join.busy=false; start(); return;
    }
  }catch(e){S.join.err="err_net";}
  S.join.busy=false; render();
}
function renderJoin(main){
  const L=t(), J=S.join;
  const err=J.err?h("div",{class:"alert",role:"alert",text:L[J.err]||L.err_net}):null;
  if(J.step==="code"){
    const inp=h("input",{class:"field code",id:"codeIn",inputmode:"numeric",pattern:"[0-9]*",maxlength:"8",autocomplete:"off","aria-label":L.joinT,placeholder:"••••"});
    inp.value=J.code;
    const go=()=>{const c=inp.value.replace(/\D/g,"");if(c.length<4){inp.focus();return;}checkCode(c);};
    inp.addEventListener("input",()=>{J.code=inp.value;});
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();go();}});
    main.append(h("div",{class:"card join"},h("h2",{text:L.joinT}),h("p",{class:"note",text:L.joinP}),inp,err,
      h("button",{type:"button",class:"btn",id:"codeGo",disabled:J.busy,onclick:go},L.cont)));
    return;
  }
  const kids=[h("h2",{text:L.whoT})];
  if(J.names.length&&!J.typing){
    kids.push(h("p",{class:"note",text:L.whoP}),
      h("div",{class:"names"},J.names.map(n=>h("button",{type:"button",disabled:J.busy,onclick:()=>doJoin(n)},n))),
      err,
      h("button",{type:"button",class:"linkbtn",id:"notListed",onclick:()=>{J.typing=true;J.err="";render();const f=$("newNameIn");if(f)f.focus();}},L.newName));
  }else{
    const nin=h("input",{class:"field",id:"newNameIn",maxlength:"24",autocomplete:"given-name",autocapitalize:"words",placeholder:L.namePh,"aria-label":L.namePh});
    nin.value=J.name;
    nin.addEventListener("input",()=>{J.name=nin.value;});
    nin.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doJoin(nin.value);}});
    kids.push(nin,err,h("button",{type:"button",class:"btn",id:"joinGo",disabled:J.busy,onclick:()=>doJoin(nin.value)},L.joinBtn));
    if(J.names.length) kids.push(h("button",{type:"button",class:"linkbtn",onclick:()=>{J.typing=false;J.err="";render();}},L.back));
  }
  kids.push(h("button",{type:"button",class:"linkbtn",onclick:()=>{J.step="code";J.err="";render();}},L.back+" · "+L.joinT));
  main.append(h("div",{class:"card join"},kids));
}
