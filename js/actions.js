"use strict";
/* ---------- writes ---------- */
function toggleItem(it){
  if(it._tmp) return;
  const now=!it.done; buzz(now?18:8);
  write("jme_toggle",{p_token:S.token,p_item:it.id,p_done:now},()=>{
    it.done=now; it.done_by=now?S.me.id:null; it.done_name=now?S.me.name:null; it.done_at=now?new Date().toISOString():null; if(now) it.short=false;
  },it.id).catch(()=>{});
}
function setShort(it,v){
  if(it._tmp) return; buzz(30);
  write("jme_short",{p_token:S.token,p_item:it.id,p_short:v},()=>{it.short=v;if(v)it.pickup="";},it.id).catch(()=>{});
}
function setPickup(it,shop){
  if(it._tmp) return; shop=(shop||"").trim().slice(0,40); buzz(30);
  write("jme_pickup",{p_token:S.token,p_item:it.id,p_shop:shop},()=>{it.pickup=shop;if(shop)it.short=false;},it.id).catch(()=>{});
}
async function addItems(tr,list,quiet){
  const have=new Set(itemsFor(tr).map(i=>norm(i.name)));
  const fresh=[];
  for(const x of list||[]){
    if(!x||!x.name||have.has(norm(x.name))) continue;
    have.add(norm(x.name));
    fresh.push({name:String(x.name).slice(0,80),qty:String(x.qty||"").slice(0,30),color:String(x.color||"").slice(0,30),cat:CAT_ORDER.includes(x.cat)?x.cat:autoCat(x.name)});
  }
  if(!fresh.length){toast(t().dup);return;}
  const date=S.date; let ord=Math.max(0,...itemsFor(tr).map(i=>i.ord||0));
  try{
    const n=await write("jme_add_items",{p_token:S.token,p_day:date,p_trailer:tr,p_items:fresh},()=>{
      for(const f of fresh) S.items.push({id:"tmp"+Math.random().toString(36).slice(2),trailer:tr,name:f.name,qty:f.qty,color:f.color,cat:f.cat,ord:++ord,done:false,short:false,_tmp:true});
    });
    if(fresh.length>1) toast(t().addedN(n==null?fresh.length:n)); else buzz(12);
  }catch(e){}
}
async function quickDelete(it){
  if(it._tmp||S.pending.has(it.id)) return;
  S.pending.add(it.id); buzz(15);
  try{
    const row=await write("jme_delete_item",{p_token:S.token,p_item:it.id},()=>{S.items=S.items.filter(x=>x.id!==it.id);},it.id);
    if(row) toast(`${t().removed}: ${it.name}`,t().undo,()=>{write("jme_restore_item",{p_token:S.token,p_row:row}).catch(()=>{});});
  }catch(e){}
  finally{S.pending.delete(it.id);}
}
function writeLoad(tr,data){
  const cur=S.loads[tr]||{lead:"",jobs:""};
  if((cur.lead||"")===data.lead&&(cur.jobs||"")===data.jobs) return;
  write("jme_set_load",{p_token:S.token,p_day:S.date,p_trailer:tr,p_lead:data.lead,p_jobs:data.jobs},()=>{S.loads[tr]={lead:data.lead,jobs:data.jobs};},"load:"+S.date+tr).catch(()=>{});
}

/* ---------- sheets ---------- */
function openSheet(...kids){$("sheet").replaceChildren(...kids.flat(3).filter(k=>k!=null&&k!==false));$("sheetBg").classList.add("open");$("sheet").scrollTop=0;}
function closeSheet(){$("sheetBg").classList.remove("open");}
$("sheetBg").addEventListener("click",e=>{if(e.target.id==="sheetBg")closeSheet();});

/* not on the trailer: pick up at a shop, or short */
function openStatus(it){
  if(it._tmp) return;
  const L=t(),cur=it.pickup||"",custom=cur&&!SHOPS.includes(cur);
  const otherIn=h("input",{class:"field",id:"pickOther",placeholder:L.otherPh,maxlength:"40",autocomplete:"off"}); otherIn.value=custom?cur:"";
  const saveOther=()=>{const v=otherIn.value.trim(); if(!v){otherIn.focus();return;} closeSheet(); setPickup(it,v);};
  otherIn.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveOther();}});
  const otherRow=h("div",{class:"otherrow"+(custom?"":" hidden")},otherIn,h("button",{type:"button",class:"btn",onclick:saveOther},L.save));
  openSheet(h("h3",{text:it.name}),
    h("label",{class:"lb",text:L.pickQ}),
    h("div",{class:"chips shops"},
      SHOPS.map(s=>h("button",{type:"button",class:"chip","aria-pressed":String(cur===s),onclick:()=>{closeSheet();setPickup(it,s);}},s)),
      h("button",{type:"button",class:"chip","aria-pressed":String(!!custom),onclick:()=>{otherRow.classList.remove("hidden");otherIn.focus();}},L.other+"…")),
    otherRow,
    h("button",{type:"button",class:"btn danger","aria-pressed":String(!!it.short),onclick:()=>{closeSheet();setShort(it,!it.short);}},(it.short?"✓ ":"⚠ ")+L.shortOpt),
    (cur||it.short)?h("button",{type:"button",class:"btn ghost",onclick:()=>{closeSheet();if(cur)setPickup(it,"");if(it.short)setShort(it,false);}},L.clearSt):null,
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.cancel));
}

function openEdit(it){
  const L=t();
  const n=h("input",{class:"field",id:"eName",maxlength:"80"}); n.value=it.name;
  const q=h("input",{class:"field",id:"eQty",placeholder:L.qtyPh,maxlength:"30"}); q.value=it.qty||"";
  const c=h("input",{class:"field",id:"eColor",placeholder:L.colorPh,autocomplete:"off",maxlength:"30"}); c.value=it.color||"";
  const cWrap=acBox(c,COLORS);
  const cat=h("select",{class:"field",id:"eCat"},CAT_ORDER.map(k=>{const o=h("option",{value:k,text:L.cats[k]});if((it.cat||"material")===k)o.selected=true;return o;}));
  const save=()=>{
    const name=n.value.trim(); if(!name){n.focus();return;}
    const v={name:name.slice(0,80),qty:q.value.trim().slice(0,30),color:c.value.trim().slice(0,30),cat:cat.value};
    closeSheet();
    write("jme_update_item",{p_token:S.token,p_item:it.id,p_name:v.name,p_qty:v.qty,p_color:v.color,p_cat:v.cat},()=>{Object.assign(it,v);},it.id).catch(()=>{});
  };
  for(const el of [n,q,c]) el.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();save();}});
  openSheet(h("h3",{text:L.editItem}),
    h("label",{class:"lb",for:"eName",text:L.itemPh}),n,
    h("div",{class:"addgrid"},h("div",null,h("label",{class:"lb",for:"eColor",text:L.colorPh}),cWrap),h("div",null,h("label",{class:"lb",for:"eQty",text:L.qtyPh}),q)),
    h("label",{class:"lb",for:"eCat",text:L.section}),cat,
    it.done?null:h("button",{type:"button",class:"btn ghost",onclick:()=>{closeSheet();openStatus(it);}},"🏪 "+L.moreBtn),
    h("button",{type:"button",class:"btn",id:"eSave",onclick:save},L.save),
    h("button",{type:"button",class:"btn danger",onclick:()=>{closeSheet();quickDelete(it);}},L.del),
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.cancel));
  if(!it.qty) q.focus();
}
function openForget(){
  const L=t();
  const what=h("input",{class:"field",id:"fWhat",placeholder:L.forgetPh,maxlength:"80"});
  const which=h("select",{class:"field",id:"fTr"},TRAILERS.map(tr=>{const o=h("option",{value:tr,text:tr==="old"?L.old:L.neu});if(tr===S.trailer)o.selected=true;return o;}));
  openSheet(h("h3",{text:L.forgetT}),h("p",{class:"note",text:L.forgetP}),
    h("label",{class:"lb",for:"fWhat",text:L.forgetWhat}),what,
    h("label",{class:"lb",for:"fTr",text:L.forgetTr}),which,
    h("button",{type:"button",class:"btn danger",onclick:async()=>{
      const w=what.value.trim(); if(!w){what.focus();return;}
      closeSheet();
      try{await write("jme_log_forget",{p_token:S.token,p_day:todayKey(),p_item:w.slice(0,80),p_trailer:which.value});toast(L.forgetSaved);}catch(e){}
    }},L.forgetSave),
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.cancel));
}
const toLines=list=>(list||[]).map(x=>[x.name,x.qty||"",x.color||""].join(" | ").replace(/( \| )+$/,"")).join("\n");
const fromLines=txt=>txt.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const [name,qty,color]=l.split("|").map(s=>(s||"").trim());return{name:(name||"").slice(0,80),qty:(qty||"").slice(0,30),color:(color||"").slice(0,30),cat:autoCat(name)};}).filter(x=>x.name);
/* downspout size pick for templates that load downspouts (3x4 is the default) */
const SPOUT_RE=/downspout|elbow|outlet|bajante|codo|salida|2x3|3x4/i;
function to2x3(items){return (items||[]).map(x=>{const n=String(x.name||"");if(!SPOUT_RE.test(n))return x;
  return {...x,name:/3x4/i.test(n)?n.replace(/3x4/gi,"2x3"):(/2x3/i.test(n)?n:("2x3 "+n.charAt(0).toLowerCase()+n.slice(1)).slice(0,80))};});}
function quickTpl(tr,tp){
  const items=tp.items||[];
  if(!items.some(x=>SPOUT_RE.test(String(x.name||"")))){addItems(tr,items,true);return;}
  const L=t(),name=S.lang==="es"&&tp.nameEs?tp.nameEs:tp.name;
  openSheet(h("h3",{text:name}),h("p",{class:"note",text:L.spoutQ}),
    h("button",{type:"button",class:"btn",onclick:()=>{closeSheet();addItems(tr,items,true);}},L.spout34),
    h("button",{type:"button",class:"btn ghost",onclick:()=>{closeSheet();addItems(tr,to2x3(items),true);}},L.spout23),
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.cancel));
}
function openTemplates(){
  const L=t();
  const areas=S.templates.map((tp,i)=>{const a=h("textarea",{class:"field",id:"tpl"+i,rows:"10"});a.value=toLines(tp.items);return a;});
  const dailyA=h("textarea",{class:"field",id:"tplDaily",rows:"9"}); dailyA.value=toLines(S.daily);
  openSheet(h("h3",{text:L.editTpl}),h("p",{class:"note",text:L.tplHelp}),
    S.templates.map((tp,i)=>[h("label",{class:"lb",for:"tpl"+i,text:tp.name}),areas[i]]),
    h("label",{class:"lb",for:"tplDaily",text:L.dailyName}),dailyA,
    h("button",{type:"button",class:"btn",onclick:async()=>{
      const list=S.templates.map((tp,i)=>({...tp,items:fromLines(areas[i].value)}));
      const daily=fromLines(dailyA.value);
      closeSheet();
      try{await write("jme_save_templates",{p_token:S.token,p_templates:list,p_daily:daily},()=>{S.templates=list;S.daily=daily;});toast(L.saved);}catch(e){}
    }},L.save),
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.cancel));
}
async function teamOp(fn,args){
  try{await rpc(fn,args);ping();}catch(e){writeFailed(e);}
  S.sig=""; await refresh();
  if(S.token&&isLead()) openTeam(); else closeSheet();
}
function openTeam(){
  if(!isLead()) return;
  const L=t(),c=S.codes||{crew:"",lead:""};
  const rows=S.members.map(p=>{
    const mine=p.id===S.me.id; let armed=false;
    const rm=h("button",{type:"button",class:"iconbtn del","aria-label":`${L.del} ${p.name}`,title:L.del,onclick:()=>{
      if(!armed){armed=true;rm.classList.add("armed");toast(L.confirmDel);return;}
      teamOp("jme_remove_member",{p_token:S.token,p_member:p.id});
    }},"✕");
    return h("div",{class:"person"},h("span",{class:"pn",text:p.name+(mine?` (${L.you})`:"")}),
      mine?h("span",{class:"toggle on",text:L.boss}):
        h("button",{type:"button",class:`toggle${p.role==="lead"?" on":""}`,"aria-label":`${p.name}: ${p.role==="lead"?L.boss:L.crew}`,
          onclick:()=>teamOp("jme_set_role",{p_token:S.token,p_member:p.id,p_role:p.role==="lead"?"crew":"lead"})},p.role==="lead"?L.boss:L.crew),
      mine?null:rm);
  });
  const crewIn=h("input",{class:"field",id:"ccIn",inputmode:"numeric",pattern:"[0-9]*",maxlength:"8",autocomplete:"off"}); crewIn.value=c.crew;
  const leadCIn=h("input",{class:"field",id:"lcIn",inputmode:"numeric",pattern:"[0-9]*",maxlength:"8",autocomplete:"off"}); leadCIn.value=c.lead;
  const editBox=h("div",{class:"card hidden",id:"codeEdit",style:"background:var(--navy-900)"},
    h("p",{class:"note",text:L.codesHelp}),
    h("label",{class:"lb",for:"ccIn",text:L.crewCode}),crewIn,
    h("label",{class:"lb",for:"lcIn",text:L.leadCode}),leadCIn,
    h("button",{type:"button",class:"btn",onclick:async()=>{
      let r=null; try{r=await rpc("jme_set_codes",{p_token:S.token,p_crew:crewIn.value.trim(),p_lead:leadCIn.value.trim()});}catch(e){writeFailed(e);return;}
      if(r&&r.error){toast(L.codesBad);return;}
      toast(L.codesSaved); S.sig=""; await refresh(); if(S.token&&isLead()) openTeam();
    }},L.save));
  openSheet(h("h3",{text:L.team}),h("p",{class:"note",text:L.teamP}),
    h("div",{class:"codes"},
      h("div",{class:"codebox"},h("small",{text:L.crewCode}),h("b",{id:"crewCodeTxt",text:c.crew})),
      h("div",{class:"codebox"},h("small",{text:L.leadCode}),h("b",{id:"leadCodeTxt",text:c.lead}))),
    h("button",{type:"button",class:"btn",onclick:sendCrew},L.sendCrew),
    h("button",{type:"button",class:"btn ghost",onclick:()=>editBox.classList.toggle("hidden")},L.changeCodes),
    editBox,
    h("label",{class:"lb",text:`${L.people} · ${S.members.length}`}),rows,
    h("button",{type:"button",class:"btn ghost",onclick:closeSheet},L.close));
}
async function shareText(text,url){
  try{if(navigator.share){await navigator.share(url?{title:"JME Load Board",text,url}:{text});return;}}
  catch(e){if(e&&e.name==="AbortError")return;}
  try{await navigator.clipboard.writeText(url?text+"\n"+url:text);toast(t().copied);}
  catch(e){toast(url||t().saveFail);}
}
function sendCrew(){
  if(!S.codes) return;
  shareText(t().crewInvite(S.codes.crew),location.origin+location.pathname+"#c="+S.codes.crew);
}
function shareList(){
  const L=t(); let out=`JME – ${dateText()}\n`;
  for(const tr of TRAILERS){
    const its=itemsFor(tr); if(!its.length) continue; const ld=S.loads[tr]||{};
    out+=`\n${(tr==="old"?L.old:L.neu).toUpperCase()}${ld.lead?` (${ld.lead})`:""}\n`;
    for(const i of its) out+=`${i.done?"✅":i.pickup?"🏪":"⬜"} ${i.name}${i.qty?` – ${i.qty}`:""}${i.color?` – ${i.color}`:""}${i.pickup&&!i.done?` (${L.pickAt(i.pickup)})`:""}\n`;
  }
  shareText(out);
}

/* ---------- celebration ---------- */
function celebrate(){
  $("party").classList.add("open"); buzz([40,60,40,60,120]);
  try{if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;}catch(e){}
  const cv=$("confetti"),ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1;
  const W=cv.width=innerWidth*dpr,H=cv.height=innerHeight*dpr;
  const cols=["#FFFFFF","#5AA9FF","#2FD27A","#1B437A","#BFD9FF"];
  const ps=Array.from({length:160},()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.45,vx:(Math.random()-.5)*16*dpr,vy:(-Math.random()*18-6)*dpr,s:(5+Math.random()*7)*dpr,r:Math.random()*6,c:cols[(Math.random()*cols.length)|0]}));
  let f=0;(function tick(){ctx.clearRect(0,0,W,H);for(const p of ps){p.vy+=.45*dpr;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=.15;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore();}
    if(++f<200&&$("party").classList.contains("open"))requestAnimationFrame(tick);else ctx.clearRect(0,0,W,H);})();
}
$("pClose").addEventListener("click",()=>$("party").classList.remove("open"));
function checkCelebrate(){
  for(const tr of TRAILERS){
    const p=progress(tr),key=S.date+tr,was=S.prevPct[key];
    if(was!==undefined&&was<100&&p.total&&p.pct===100&&tr===S.trailer&&S.mode==="crew") celebrate();
    S.prevPct[key]=p.total?p.pct:0;
  }
}

/* ---------- controls ---------- */
$("lEn").onclick=()=>{S.lang="en";store.set("jme_lang","en");render();};
$("lEs").onclick=()=>{S.lang="es";store.set("jme_lang","es");render();};
$("mCrew").onclick=()=>{S.mode="crew";store.set("jme_mode","crew");render();};
$("mBoss").onclick=()=>{S.mode="boss";store.set("jme_mode","boss");render();};
function goDay(n){S.date=addDays(S.date,n);S.items=[];S.loads={};S.sig="";S.loadedDay=null;render();refresh();}
$("dPrev").onclick=()=>goDay(-1);
$("dNext").onclick=()=>goDay(1);
$("teamBtn").onclick=()=>openTeam();

/* ---------- boot ---------- */
function boot(){
  if(!window.supabase||!window.supabase.createClient){S.fatal=true;render();return;}
  sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  S.token=readToken();
  render();
  if(S.token) start();
  else{
    const m=(location.hash||"").match(/[#&]c=(\d{4,8})\b/);
    if(m){S.join.code=m[1];checkCode(m[1]);}
    else{const f=$("codeIn");if(f&&!isIOS)f.focus();}
  }
  setInterval(()=>{if(document.visibilityState==="visible"&&S.token&&S.busy===0)refresh();},20000);
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.token&&S.busy===0)refresh();});
  window.addEventListener("online",()=>{if(S.token&&S.busy===0)refresh();});
}
boot();
