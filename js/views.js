"use strict";
/* ---------- derived ---------- */
const itemsFor=tr=>S.items.filter(i=>i.trailer===tr).sort((a,b)=>(a.ord||0)-(b.ord||0));
function progress(tr){const its=itemsFor(tr);const done=its.filter(i=>i.done).length;return{total:its.length,done,pct:its.length?Math.round(done/its.length*100):0,short:its.filter(i=>i.short&&!i.done).length};}
function streak(){
  const today=todayKey();
  let start=S.streakStart||today;
  for(const f of S.forgets){if(f.day&&f.day>start&&f.day<=today)start=f.day;}
  if(S.forgets.some(f=>f.day===today)) return 0;
  return Math.max(0,daysBetween(start,today));
}
function relLabel(k){const d=daysBetween(todayKey(),k);if(d===0)return t().today;if(d===1)return t().tomorrow;if(d===-1)return t().yesterday;return "";}
function suggestions(tr){
  const its=itemsFor(tr); if(!its.length) return [];
  const all=its.map(i=>i.name).join(" | ");
  const out=[],seen=new Set();
  for(const r of RULES){ if(!r.when.test(all)) continue;
    for(const nd of r.need){
      if(seen.has(nd.n)) continue;
      let has;
      if(nd.n==="End caps – left") has=its.some(i=>/end ?cap|tapa/i.test(i.name)&&/left|izq|\bl\b|each/i.test(i.name));
      else if(nd.n==="End caps – right") has=its.some(i=>/end ?cap|tapa/i.test(i.name)&&/right|der|\br\b|each/i.test(i.name));
      else has=its.some(i=>nd.m.test(i.name));
      if(!has){seen.add(nd.n);out.push(nd);}
    }
  }
  return out;
}
function dailyMissing(tr){const names=new Set(itemsFor(tr).map(i=>norm(i.name)));return S.daily.filter(d=>!names.has(norm(d.name)));}
const dateText=()=>fromKey(S.date).toLocaleDateString(S.lang==="es"?"es-US":"en-US",{weekday:"long",month:"short",day:"numeric"});

/* ---------- render ---------- */
function render(){
  const L=t();
  document.documentElement.lang=S.lang;
  $("tSub").textContent=L.sub; $("tStd").textContent=L.std; $("tStreak").textContent=L.streak;
  $("lEn").setAttribute("aria-pressed",S.lang==="en"); $("lEs").setAttribute("aria-pressed",S.lang==="es");
  $("mCrew").textContent=L.crew; $("mBoss").textContent=L.boss;
  $("mCrew").setAttribute("aria-pressed",S.mode==="crew"); $("mBoss").setAttribute("aria-pressed",S.mode==="boss");
  $("pBig").textContent=L.pBig; $("pSmall").textContent=L.pSmall; $("pClose").textContent=L.pClose;
  $("teamBtn").textContent=L.team;

  const joined=!!S.token, ready=joined&&S.loaded&&S.loadedDay===S.date;
  $("modeSeg").classList.toggle("hidden",!(ready&&isLead()));
  $("teamBtn").classList.toggle("hidden",!(joined&&S.loaded&&isLead()));
  $("dateRow").classList.toggle("hidden",!joined);
  $("streakBox").classList.toggle("hidden",!(joined&&S.loaded));
  $("duo").style.gridTemplateColumns=(joined&&S.loaded)?"":"1fr";
  $("dLabel").textContent=dateText(); $("dRel").textContent=relLabel(S.date);
  const qi=Math.floor(fromKey(S.date)/864e5)%QUOTES.length;
  $("quote").textContent=QUOTES[(qi+QUOTES.length)%QUOTES.length][S.lang==="es"?1:0];
  const st=streak(); $("streakN").textContent=st; $("streakN").classList.toggle("zero",st===0);
  $("streakTxt").textContent=st===1?L.day:L.days;

  /* keep whatever someone is typing when live updates redraw the page */
  const keep={},act=document.activeElement,actId=act&&act.id;
  for(const id of ["nameIn","qtyIn","colorIn","leadIn","jobsIn"]){const el=$(id);if(el)keep[id]=el.value;}
  let selS=null,selE=null; try{if(act&&"selectionStart" in act){selS=act.selectionStart;selE=act.selectionEnd;}}catch(e){}
  const keepKey=S._formTr; S._formTr=S.trailer+"|"+S.date;

  const main=$("main"); main.replaceChildren();
  const trs=$("trailers"); trs.replaceChildren();
  const foot=$("foot"); foot.replaceChildren();
  trs.classList.toggle("hidden",!ready); foot.classList.toggle("hidden",!joined||!S.me);

  if(S.fatal){
    $("dock").classList.add("hidden");
    main.append(h("div",{class:"card join"},h("h2",{text:"JME"}),h("p",{class:"note",text:L.err_net}),h("button",{type:"button",class:"btn",onclick:()=>location.reload()},L.retry)));
    return;
  }
  if(!joined){$("dock").classList.add("hidden");renderJoin(main);return;}
  if(S.me) foot.append(h("span",{text:`${L.signed} ${S.me.name} ·`}),h("button",{type:"button",class:"linkbtn",id:"signOutBtn",onclick:signOut},L.signOut));
  if(S.offline) main.append(h("div",{class:"alert",role:"alert",text:L.offline}));
  if(!ready){$("dock").classList.add("hidden");if(!S.offline)main.append(h("div",{class:"empty",text:L.loading}));return;}

  if(!isStandalone()&&!S.hintOff){
    main.append(h("div",{class:"hint"},h("span",{text:installEvt?L.installBtn:(isIOS?L.installIOS:L.installAnd)}),
      installEvt?h("button",{type:"button",class:"chip tpl",onclick:async()=>{try{installEvt.prompt();await installEvt.userChoice;}catch(e){}installEvt=null;render();}},L.installBtn):null,
      h("button",{type:"button",class:"chip",onclick:()=>{S.hintOff=true;store.set("jme_hint","off");render();}},L.gotIt)));
  }

  for(const tr of TRAILERS){
    const p=progress(tr),ld=S.loads[tr]||{};
    trs.append(h("button",{type:"button",class:"tr","aria-pressed":String(S.trailer===tr),"data-tr":tr,onclick:()=>{S.trailer=tr;store.set("jme_trailer",tr);render();}},
      h("span",{class:"t",text:tr==="old"?L.old:L.neu}),
      h("span",{class:"l",text:ld.lead?`${L.lead}: ${ld.lead}`:L.noLead}),
      h("span",{class:"bar"},h("i",{class:p.total&&p.pct===100?"full":"",style:`width:${p.pct}%`})),
      h("span",{class:"c",text:p.total?`${p.done} ${L.of} ${p.total} ${L.loaded}`:L.nothing})));
  }

  checkCelebrate();
  if(S.mode==="boss"&&isLead()) renderBoss(main); else renderCrew(main);
  if(keepKey===S._formTr){
    for(const id of ["nameIn","qtyIn","colorIn"]) if(keep[id]!=null&&$(id)) $(id).value=keep[id];
    for(const id of ["leadIn","jobsIn"]) if(actId===id&&$(id)) $(id).value=keep[id];
    if(actId&&keep[actId]!=null&&$(actId)){const el=$(actId);el.focus({preventScroll:true});try{if(selS!=null)el.setSelectionRange(selS,selE);}catch(e){}}
  }
  renderDock();
}

function hero(tr){
  const L=t(),p=progress(tr),ld=S.loads[tr]||{};
  const C=2*Math.PI*50,off=C*(1-p.pct/100);
  const col=p.total&&p.pct===100?"var(--go)":"var(--sky)";
  const ring=h("div",{class:"ring"});
  ring.innerHTML=`<svg width="118" height="118" viewBox="0 0 118 118"><circle cx="59" cy="59" r="50" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="11"/><circle cx="59" cy="59" r="50" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .5s"/></svg>`;
  ring.append(h("div",{class:"val"},h("div",null,h("b",{text:p.pct+"%"}),h("span",{text:L.loaded}))));
  let status;
  if(!p.total) status=h("span",{class:"status none",text:L.nothing});
  else if(p.pct===100) status=h("span",{class:"status go",text:"✓ "+L.ready});
  else status=h("span",{class:"status wait",text:`${p.total-p.done} ${L.left}`});
  return h("div",{class:"hero"},ring,h("div",{class:"info"},
    h("h2",{text:tr==="old"?L.old:L.neu}),
    h("div",{class:"lead"},`${L.lead}: `,h("b",{text:ld.lead||"—"})),
    ld.jobs?h("div",{class:"jobs",text:ld.jobs}):null,
    status));
}
function tagsFor(it,lead){
  const L=t(),tags=h("div",{class:"tags"});
  if(it.qty) tags.append(h("span",{class:"tag qty",text:it.qty}));
  else if(lead) tags.append(h("span",{class:"tag need",text:L.setQty}));
  if(it.color) tags.append(h("span",{class:"tag",text:it.color}));
  if(it.short&&!it.done) tags.append(h("span",{class:"tag red",text:"⚠ "+L.short}));
  return tags;
}
function whoLine(it,withTime){
  if(!it.done||!it.done_name) return null;
  const L=t(),name=(S.me&&it.done_by===S.me.id)?L.you:it.done_name;
  let tm=""; if(withTime&&it.done_at){try{tm=" · "+new Date(it.done_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});}catch(e){}}
  return h("span",{class:"who",text:`✓ ${L.loadedBy} ${name}${tm}`});
}
function renderCrew(main){
  const L=t(),tr=S.trailer,its=itemsFor(tr);
  main.append(hero(tr));
  if(!its.length){main.append(h("div",{class:"empty"},h("b",{text:L.emptyCrewT}),L.emptyCrewP));return;}
  for(const cat of CAT_ORDER){
    const group=its.filter(i=>(i.cat||"material")===cat); if(!group.length) continue;
    group.sort((a,b)=>(a.done-b.done)||((a.ord||0)-(b.ord||0)));
    const g=h("section",{class:"group"},h("h3",null,h("span",{text:L.cats[cat]}),h("span",{text:`${group.filter(i=>i.done).length}/${group.length}`})));
    for(const it of group){
      g.append(h("div",{class:`row tap${it.done?" done":""}${it.short&&!it.done?" short":""}`,role:"checkbox","aria-checked":it.done?"true":"false",tabindex:"0",
        onclick:()=>toggleItem(it),onkeydown:e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();toggleItem(it);}}},
        h("span",{class:"box"},checkSvg()),
        h("div",{class:"mid"},h("span",{class:"nm",text:it.name}),tagsFor(it,false),whoLine(it,true)),
        it.done?null:h("button",{type:"button",class:`iconbtn${it.short?" on":""}`,"aria-label":L.short,title:L.short,onclick:e=>{e.stopPropagation();toggleShort(it);}},"!")));
    }
    main.append(g);
  }
}
function renderBoss(main){
  const L=t(),tr=S.trailer,its=itemsFor(tr),ld=S.loads[tr]||{};
  main.append(hero(tr));

  const shorts=its.filter(i=>i.short&&!i.done);
  if(shorts.length) main.append(h("div",{class:"alert"},h("b",{text:L.shortList+" "}),shorts.map(i=>i.name).join(", ")));

  /* setup */
  const leadIn=h("input",{class:"field",id:"leadIn",placeholder:"Jose / Erick / Daniel",autocomplete:"off",maxlength:"40"});
  leadIn.value=ld.lead||"";
  const jobsIn=h("textarea",{class:"field",id:"jobsIn",placeholder:L.jobsPh,maxlength:"600"});
  jobsIn.value=ld.jobs||"";
  const saveLoad=()=>writeLoad(tr,{lead:leadIn.value.trim(),jobs:jobsIn.value.trim()});
  leadIn.addEventListener("change",saveLoad); jobsIn.addEventListener("change",saveLoad);
  const leadNames=S.members.filter(m=>m.role==="lead").map(m=>m.name);
  main.append(h("div",{class:"card"},h("h4",{text:L.setup}),
    h("label",{class:"lb",for:"leadIn",text:L.leadL}),leadIn,
    h("div",{class:"chips"},(leadNames.length?leadNames:["Jose","Erick","Daniel"]).slice(0,8).map(n=>h("button",{type:"button",class:"chip",onclick:()=>{leadIn.value=n;saveLoad();}},n))),
    h("label",{class:"lb",for:"jobsIn",text:L.jobsL}),jobsIn));

  /* add */
  const nameIn=h("input",{class:"field full",id:"nameIn",placeholder:L.itemPh,list:"knownItems",autocomplete:"off",maxlength:"80","aria-label":L.itemPh});
  const qtyIn=h("input",{class:"field",id:"qtyIn",placeholder:L.qtyPh,autocomplete:"off",maxlength:"30","aria-label":L.qtyPh});
  const colorIn=h("input",{class:"field",id:"colorIn",placeholder:L.colorPh,list:"knownColors",autocomplete:"off",maxlength:"30","aria-label":L.colorPh});
  const known=h("datalist",{id:"knownItems"},[...new Set([...S.templates.flatMap(x=>x.items||[]),...S.daily].map(x=>x.name))].map(n=>h("option",{value:n})));
  const colors=h("datalist",{id:"knownColors"},COLORS.map(n=>h("option",{value:n})));
  const doAdd=async()=>{
    const n=nameIn.value.trim(); if(!n){nameIn.focus();return;}
    const item={name:n,qty:qtyIn.value.trim(),color:colorIn.value.trim()};
    if(itemsFor(tr).some(i=>norm(i.name)===norm(n))){toast(L.dup);return;}
    nameIn.value=""; qtyIn.value="";
    addItems(tr,[item]);
    const f=$("nameIn"); if(f) f.focus();
  };
  nameIn.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doAdd();}});
  qtyIn.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();doAdd();}});
  const addCard=h("div",{class:"card"},h("h4",{text:L.add}),
    h("div",{class:"addgrid"},nameIn,colorIn,qtyIn),known,colors,
    h("button",{type:"button",class:"btn",id:"addBtn",onclick:doAdd},L.addBtn),
    h("label",{class:"lb",text:L.quick}),
    h("div",{class:"chips",id:"quickChips"},
      S.templates.map(tp=>h("button",{type:"button",class:"chip tpl",onclick:()=>quickTpl(tr,tp)},"+ "+(S.lang==="es"&&tp.nameEs?tp.nameEs:tp.name))),
      S.daily.length?h("button",{type:"button",class:"chip tpl",onclick:()=>addItems(tr,S.daily,true)},L.daily):null));
  const sug=suggestions(tr),dm=dailyMissing(tr);
  if(its.length&&(sug.length||dm.length)){
    addCard.append(h("label",{class:"lb",text:L.forgot}),
      h("div",{class:"chips",id:"forgotChips"},
        sug.map(s=>h("button",{type:"button",class:"chip sug",onclick:()=>addItems(tr,[{name:s.n,qty:"",color:"",cat:s.c}])},"+ "+s.n)),
        dm.length?h("button",{type:"button",class:"chip sug",onclick:()=>addItems(tr,dm,true)},`${L.daily} (${dm.length})`):null));
  }
  main.append(addCard);

  /* list */
  if(its.length){
    const list=h("section",{class:"group",id:"leadList"},h("h3",null,h("span",{text:`${L.onList} · ${its.length}`}),h("span",{text:L.tapEdit})));
    for(const cat of CAT_ORDER){
      const group=its.filter(i=>(i.cat||"material")===cat); if(!group.length) continue;
      list.append(h("h3",null,h("span",{text:L.cats[cat]})));
      for(const it of group){
        const tmp=!!it._tmp;
        list.append(h("div",{class:`row${tmp?" tmp":" tap"}${it.done?" done":""}${it.short&&!it.done?" short":""}`,tabindex:tmp?null:"0",
          onclick:tmp?null:()=>openEdit(it),onkeydown:tmp?null:e=>{if(e.key==="Enter")openEdit(it);}},
          h("span",{class:"box"},checkSvg()),
          h("div",{class:"mid"},h("span",{class:"nm",text:it.name}),tagsFor(it,true),whoLine(it,false)),
          tmp?null:h("button",{type:"button",class:"iconbtn del","aria-label":`${L.del} ${it.name}`,title:L.del,onclick:e=>{e.stopPropagation();quickDelete(it);}},"✕")));
      }
    }
    main.append(list);
  }

  main.append(h("div",{class:"card"},
    h("button",{type:"button",class:"btn ghost",onclick:shareList},L.shareBtn),
    h("button",{type:"button",class:"btn ghost",onclick:openTemplates},L.editTpl),
    h("button",{type:"button",class:"btn danger",onclick:openForget},L.logForget)));
}
function renderDock(){
  const L=t(),p=progress(S.trailer),dock=$("dock"),inn=$("dockIn");
  if(!p.total){dock.classList.add("hidden");return;}
  dock.classList.remove("hidden"); inn.replaceChildren();
  const its=itemsFor(S.trailer);
  if(p.short){inn.className="in short";inn.append(h("div",{class:"txt"},h("div",{class:"big",text:L.dockShort(p.short)}),h("div",{class:"sm",text:its.filter(i=>i.short&&!i.done).map(i=>i.name).join(", ")})));}
  else if(p.pct===100){inn.className="in go";inn.append(h("div",{class:"txt"},h("div",{class:"big",text:"✓ "+L.dockGo})));}
  else{inn.className="in wait";inn.append(h("div",{class:"txt"},h("div",{class:"big",text:L.dockWait(p.total-p.done)}),h("div",{class:"sm",text:L.missing+" "+its.filter(i=>!i.done).map(i=>i.name).join(", ")})));}
}
