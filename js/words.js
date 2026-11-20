"use strict";
const CFG={url:"https://xqguwwhogubzvmrxsauj.supabase.co",key:"sb_publishable_VgRdHF86TBaxkqR8ejSYzw_VO7jbbhj"};

/* ---------- words ---------- */
const T={
  en:{sub:"Load Board",crew:"Crew",boss:"Lead",std:"The JME standard",streak:"Zero-forget streak",days:"days in a row",day:"day in a row",
    today:"Today",tomorrow:"Tomorrow",yesterday:"Yesterday",old:"Old trailer",neu:"New trailer",lead:"Lead",noLead:"No lead set",
    loaded:"loaded",of:"of",ready:"Ready to roll",left:"left to load",nothing:"No load yet",short:"Short",pickAt:s=>`Pick up at ${s}`,pickQ:"Pick up at a shop",other:"Other",otherPh:"Shop name",shortOpt:"Short – tell a lead",clearSt:"Clear – back to normal",readyPick:n=>`Ready to roll · ${n} to pick up`,dockGoPick:n=>`Ready to roll. ${n} to pick up`,pickList:"Pick up:",moreBtn:"Pick up / short",
    emptyCrewT:"Nothing on this trailer yet",emptyCrewP:"A lead will add the load here.",
    dockWait:n=>`${n} left. Don't roll yet`,dockGo:"Ready to roll. Let's go",dockShort:n=>`${n} short. Tell a lead`,
    pBig:"Ready to roll",pSmall:"Trailer is 100% loaded. Let's get it done right.",pClose:"Let's go",
    cats:{material:"Gutter & downspouts",guard:"Gutter guard",fittings:"Fittings",fasteners:"Fasteners & sealant",gear:"Tools & gear"},
    loadedBy:"loaded by",you:"you",
    setup:"Trailer setup",leadL:"Crew lead",jobsL:"Jobs / addresses",jobsPh:"e.g. 6” white – 1123 Oak St",
    add:"Add material",itemPh:"Material (e.g. 6” coil)",qtyPh:"Qty",colorPh:"Color (e.g. White)",addBtn:"Add to trailer",
    quick:"Quick add",spoutQ:"Downspout size for this job?",spout34:"3x4 (normal)",spout23:"2x3",daily:"+ Daily gear",forgot:"Did you forget?",onList:"On the list",
    setQty:"Set qty",tapEdit:"Tap a line to edit",editItem:"Edit material",section:"Section",save:"Save",del:"Remove",cancel:"Cancel",close:"Close",
    logForget:"Log a forget",forgetT:"Something got forgotten",forgetP:"Be honest. Logging it resets the streak, and it reminds us to add it to the template.",
    forgetWhat:"What was forgotten?",forgetPh:"e.g. Outlets",forgetTr:"Which trailer?",forgetSave:"Log it",
    editTpl:"Edit templates",tplHelp:"One material per line: name | qty | color. Leave qty blank if it changes per job.",
    dailyName:"Daily gear (every trailer, every day)",
    team:"Team",teamP:"Leads build the loads. Crew checks them off.",
    crewCode:"Crew code",leadCode:"Lead code",sendCrew:"Send crew link",changeCodes:"Change codes",
    codesHelp:"Crew code: 4 to 8 digits. Lead code: 6 to 8 digits. They can't match.",codesBad:"Those codes don't work. Check the rules.",codesSaved:"Codes changed",
    people:"People",crewInvite:c=>`JME Load Board. Crew code: ${c}`,
    addedN:n=>`Added ${n} items`,dup:"Already on the list",forgetSaved:"Logged. Streak reset. Now let's fix it.",
    shortList:"Crew says short on:",missing:"Still not loaded:",shareBtn:"Share list as text",copied:"Copied",
    confirmDel:"Tap again to remove",removed:"Removed",undo:"Undo",saved:"Saved",
    joinT:"Enter your code",joinP:"Ask your lead for the code.",cont:"Continue",whoT:"Who are you?",whoP:"Tap your name.",
    newName:"I'm not on the list",namePh:"Your first name",joinBtn:"Join",back:"Back",
    err_bad:"That code isn't right. Try again.",err_slow:"Too many tries. Wait 15 minutes and try again.",
    err_name:"Type your name (up to 24 letters).",err_taken:"That name belongs to a lead. Use a different name.",
    err_net:"No connection. Check your signal and try again.",
    offline:"No connection. Trying again…",loading:"Loading the load…",retry:"Try again",
    signed:"Signed in as",signOut:"Sign out",leadsOnly:"Only leads can do that.",saveFail:"Couldn't save. Try again.",
    installIOS:"Put this on your home screen: tap Share, then Add to Home Screen.",
    installAnd:"Put this on your home screen: open the browser menu, then Add to Home screen.",
    installBtn:"Install app",gotIt:"Got it"},
  es:{sub:"Tablero de carga",crew:"Cuadrilla",boss:"Líder",std:"El estándar JME",streak:"Racha sin olvidos",days:"días seguidos",day:"día seguido",
    today:"Hoy",tomorrow:"Mañana",yesterday:"Ayer",old:"Tráiler viejo",neu:"Tráiler nuevo",lead:"Líder",noLead:"Sin líder",
    loaded:"cargado",of:"de",ready:"Listos para salir",left:"falta cargar",nothing:"Sin carga",short:"Falta",pickAt:s=>`Recoger en ${s}`,pickQ:"Recoger en una tienda",other:"Otra",otherPh:"Nombre de la tienda",shortOpt:"Falta – avisar a un líder",clearSt:"Quitar – volver a normal",readyPick:n=>`Listos · ${n} por recoger`,dockGoPick:n=>`Listos para salir. ${n} por recoger`,pickList:"Recoger:",moreBtn:"Recoger / falta",
    emptyCrewT:"Este tráiler aún no tiene carga",emptyCrewP:"Un líder pondrá la carga aquí.",
    dockWait:n=>`Faltan ${n}. No salgan todavía`,dockGo:"Listos para salir. Vámonos",dockShort:n=>`Faltan ${n} en bodega. Avisen a un líder`,
    pBig:"Listos para salir",pSmall:"El tráiler está 100% cargado. A hacerlo bien.",pClose:"Vámonos",
    cats:{material:"Canaleta y bajantes",guard:"Protector de canaleta",fittings:"Piezas",fasteners:"Tornillería y sellador",gear:"Herramienta y equipo"},
    loadedBy:"cargó",you:"tú",
    setup:"Preparar tráiler",leadL:"Líder de cuadrilla",jobsL:"Trabajos / direcciones",jobsPh:"ej. 6” blanco – 1123 Oak St",
    add:"Agregar material",itemPh:"Material (ej. bobina 6”)",qtyPh:"Cant.",colorPh:"Color (ej. Blanco)",addBtn:"Agregar al tráiler",
    quick:"Agregar rápido",spoutQ:"¿Tamaño de bajante para este trabajo?",spout34:"3x4 (normal)",spout23:"2x3",daily:"+ Equipo diario",forgot:"¿Se te olvidó?",onList:"En la lista",
    setQty:"Poner cant.",tapEdit:"Toca una línea para editar",editItem:"Editar material",section:"Sección",save:"Guardar",del:"Quitar",cancel:"Cancelar",close:"Cerrar",
    logForget:"Registrar un olvido",forgetT:"Se olvidó algo",forgetP:"Sé honesto. Registrarlo reinicia la racha y nos recuerda agregarlo a la plantilla.",
    forgetWhat:"¿Qué se olvidó?",forgetPh:"ej. Salidas",forgetTr:"¿Cuál tráiler?",forgetSave:"Registrar",
    editTpl:"Editar plantillas",tplHelp:"Un material por línea: nombre | cant. | color. Deja la cantidad vacía si cambia por trabajo.",
    dailyName:"Equipo diario (todos los tráilers, todos los días)",
    team:"Equipo",teamP:"Los líderes arman las cargas. La cuadrilla las marca.",
    crewCode:"Código de cuadrilla",leadCode:"Código de líder",sendCrew:"Enviar enlace a la cuadrilla",changeCodes:"Cambiar códigos",
    codesHelp:"Código de cuadrilla: 4 a 8 dígitos. Código de líder: 6 a 8 dígitos. No pueden ser iguales.",codesBad:"Esos códigos no sirven. Revisa las reglas.",codesSaved:"Códigos cambiados",
    people:"Personas",crewInvite:c=>`Tablero de carga JME. Código de cuadrilla: ${c}`,
    addedN:n=>`Se agregaron ${n}`,dup:"Ya está en la lista",forgetSaved:"Registrado. Racha reiniciada. Ahora a corregirlo.",
    shortList:"La cuadrilla dice que falta:",missing:"Falta cargar:",shareBtn:"Compartir lista como texto",copied:"Copiado",
    confirmDel:"Toca otra vez para quitar",removed:"Quitado",undo:"Deshacer",saved:"Guardado",
    joinT:"Escribe tu código",joinP:"Pide el código a tu líder.",cont:"Continuar",whoT:"¿Quién eres?",whoP:"Toca tu nombre.",
    newName:"No estoy en la lista",namePh:"Tu nombre",joinBtn:"Entrar",back:"Atrás",
    err_bad:"Ese código no es correcto. Intenta otra vez.",err_slow:"Demasiados intentos. Espera 15 minutos e intenta otra vez.",
    err_name:"Escribe tu nombre (hasta 24 letras).",err_taken:"Ese nombre es de un líder. Usa otro nombre.",
    err_net:"Sin conexión. Revisa la señal e intenta otra vez.",
    offline:"Sin conexión. Reintentando…",loading:"Cargando…",retry:"Reintentar",
    signed:"Sesión de",signOut:"Salir",leadsOnly:"Solo los líderes pueden hacer eso.",saveFail:"No se pudo guardar. Intenta otra vez.",
    installIOS:"Ponla en tu pantalla de inicio: toca Compartir y luego Agregar a inicio.",
    installAnd:"Ponla en tu pantalla de inicio: abre el menú del navegador y luego Agregar a pantalla principal.",
    installBtn:"Instalar app",gotIt:"Entendido"}
};
const QUOTES=[
  ["Every screw matters. Done right or not done.","Cada tornillo cuenta. Bien hecho o no se hace."],
  ["Five-star jobs start in the trailer.","Los trabajos de cinco estrellas empiezan en el tráiler."],
  ["Load it right. Install it once.","Cárgalo bien. Instálalo una vez."],
  ["The best crews don't drive back for parts.","Las mejores cuadrillas no regresan por piezas."],
  ["Check twice. Roll once.","Revisa dos veces. Sal una vez."],
  ["Great companies are built one detail at a time.","Las grandes empresas se construyen detalle por detalle."],
  ["Pride in the prep is pride in the work.","Orgullo en la preparación es orgullo en el trabajo."],
  ["We don't guess. We check.","No adivinamos. Revisamos."],
  ["The homeowner never sees the trailer. They feel it.","El cliente nunca ve el tráiler. Pero lo siente."],
  ["Small details build big reputations.","Los pequeños detalles construyen grandes reputaciones."],
  ["Built right. Every time.","Bien hecho. Siempre."],
  ["A missing outlet costs an hour. A full trailer costs a minute.","Una salida olvidada cuesta una hora. Un tráiler completo cuesta un minuto."]
];
const CAT_ORDER=["material","guard","fittings","fasteners","gear"];
const TRAILERS=["old","new"];
/* extra materials offered in the type-ahead list (not tied to a template) */
const EXTRA_ITEMS=["Wedges","6” Shur Flo Guard","5” Shur Flo Guard","Leafblaster guard","Leaf Free guard","Gutter Rx guard"];
/* supply houses for "pick up at a shop" */
const SHOPS=["Senox","Spectra","QXO (Monroe)","QXO (Concord)"];
const COLORS=["White","White low gloss","Low gloss","Black","Musket brown","Royal brown","Clay","Almond","Bronze","Gray","Ivory","Mill finish"];

/* forget-prevention rules: when the list has X, it should usually also have Y */
const RULES=[
  {when:/gutter|coil|6”|6"|5”|5"|linear/i,need:[
    {n:"Hangers",m:/hanger/i,c:"fasteners"},{n:"End caps – left",c:"fittings"},{n:"End caps – right",c:"fittings"},
    {n:"Outlets",m:/outlet|salida/i,c:"fittings"},{n:"Miters",m:/miter|corner|esquina/i,c:"fittings"},
    {n:"Zips",m:/zip/i,c:"fasteners"},{n:"Silicone",m:/silicon|seal/i,c:"fasteners"}]},
  {when:/downspout|spout|2x3|3x4|bajante/i,need:[
    {n:"Elbows",m:/elbow|codo/i,c:"fittings"},{n:"Bandas",m:/banda|strap/i,c:"fasteners"},{n:"Outlets",m:/outlet|salida/i,c:"fittings"}]},
  {when:/guard|leaf ?blaster|leaf ?free|gutter ?rx|ez ?flow|shur ?flo|mesh|protector/i,need:[
    {n:"Long screws",m:/long screw|screw|tornillo/i,c:"fasteners"}]}
];
function autoCat(name){
  const s=(name||"").toLowerCase();
  if(/guard|leaf ?blaster|leaf ?free|gutter ?rx|ez ?flow|shur ?flo|mesh|protector/.test(s)) return "guard";
  if(/wedge|end ?cap|miter|corner|outlet|elbow|adapter|tapa|codo|esquina|salida/.test(s)) return "fittings";
  if(/hanger|zip|screw|banda|strap|silicon|seal|caulk|paint|rivet|nail|pintura|tornillo/.test(s)) return "fasteners";
  if(/generator|blower|ladder|stand|cooler|drill|cord|tool|bender|crimper|snips|hielera|escalera/.test(s)) return "gear";
  return "material";
}
const norm=s=>(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
