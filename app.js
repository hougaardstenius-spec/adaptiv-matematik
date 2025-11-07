python3 scripts/generate_taskbanks.py
python3 scripts/add_real_life_tasks.py
python3 scripts/add_unit_conversion_tasks.py

const PASS_REQUIRED = 6; // krævede korrekte svar ud af 8

// === Configurable settings ===
const CONFIG = {
  strictUnits: true,              // kræv korrekt enhed ved numeric-opgaver med unit
  mode: 'all',                    // 'all' | 'units' (kun enhedsrelaterede opgaver)
  mixWeights: {                   // [easy, medium, hard]
    low:  [4,3,1],   // niveau 1–3
    mid:  [3,3,2],   // niveau 4–6
    high: [2,3,3],   // niveau 7–8
    top:  [1,3,4]    // niveau 9–10
  }
};

// Unit normalization: accepter små variationer (fx m2 ~ m^2, liter L/l)
function normalizeUnit(u){
  if(!u) return null;
  let s = String(u).toLowerCase().trim();
  s = s.replace(/\s+/g,'');
  s = s.replace(/kr\.?$/,'kr');
  s = s.replace(/øre|ore/,'øre');
  // m2 -> m^2, cm2 -> cm^2, m3 -> m^3, ...
  s = s.replace(/\b(m|cm|mm|km)(2)\b/g, '$1^2');
  s = s.replace(/\b(m|cm|mm|km)(3)\b/g, '$1^3');
  if(s==='l' || s==='liter') s='l';
  if(s==='m/s' || s==='m·s^-1' || s==='ms^-1' || s==='m s^-1') s='m/s';
  return s;
}

function unitsMatch(expected, given){
  if(!expected) return true; // nothing to enforce
  const e = normalizeUnit(expected);
  const g = normalizeUnit(given);
  if(!g) return false;
  if(e===g) return true;
  const aliases = {
    'l': ['liter','l'],
    'kr': ['kr','kr.'],
    'm^2': ['m2','m^2'],
    'cm^2': ['cm2','cm^2'],
    'm^3': ['m3','m^3'],
    'cm^3': ['cm3','cm^3'],
    'm/s': ['m/s','ms^-1','m s^-1']
  };
  for(const [key, list] of Object.entries(aliases)){
    if(e===key && list.includes(g)) return true;
  }
  return false;
}
const STORAGE_KEY = 'am_progress_v1';
let FEEDBACK = {};

// === Configurable settings ===
const CONFIG = {
  strictUnits: true,              // kræv korrekt enhed ved numeric-opgaver med unit
  mode: 'all',                    // 'all' | 'units' (kun enhedsrelaterede opgaver)
  mixWeights: {                   // [easy, medium, hard]
    low:  [4,3,1],   // niveau 1–3
    mid:  [3,3,2],   // niveau 4–6
    high: [2,3,3],   // niveau 7–8
    top:  [1,3,4]    // niveau 9–10
  }
};

// === XP / Gamification ===
const XP_KEY = 'am_xp_v1';
const XP_POINTS = { easy: 10, medium: 20, hard: 35 };
const XP_STREAK_STEP = 5;
const XP_STREAK_MAX  = 25;
const XP_PASS_BONUS  = 50;

function xpThresholds(limit=50){ const arr=[200]; while(arr.length<limit){ arr.push(Math.round(arr[arr.length-1]*1.25)); } return arr; }
const XP_THRESH = xpThresholds(50);
function loadXP(){ try{ return JSON.parse(localStorage.getItem(XP_KEY)) || {xp:0, level:1}; }catch(e){ return {xp:0, level:1}; } }
function saveXP(state){ localStorage.setItem(XP_KEY, JSON.stringify(state)); }
function recomputeLevel(xp){ let lvl=1, need=XP_THRESH[0], idx=0, spent=0; while(xp - (spent+need) >= 0 && idx < XP_THRESH.length){ xp -= need; spent += need; lvl++; idx++; need = XP_THRESH[idx] || Math.round(need*1.25);} return { level:lvl, xpInto: xp, need: need }; }
function addXP(amount){ const s=loadXP(); s.xp += Math.max(0, Math.round(amount)); const res=recomputeLevel(s.xp); const leveledUp = res.level > s.level; s.level = res.level; saveXP(s); try{ renderXPBar(); }catch(e){} return { leveledUp, level:res.level, xpInto:res.xpInto, need:res.need }; }

async function loadFeedback(){ try{ const r=await fetch('/data/feedback.json'); if(r.ok){ FEEDBACK = await r.json(); } }catch(e){} }

function loadProgress(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {subjects:{}, last:null}; }catch(e){return {subjects:{}, last:null}} }
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

async function loadData(){ const res = await fetch('/data/data.json'); return res.json(); }

function el(tag, attrs={}, children=[]){ const e=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k==='onclick') e.onclick=v; else e.setAttribute(k,v); }); (Array.isArray(children)?children:[children]).forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); }); return e; }

function normalizeUnit(u){ if(!u) return null; let s=String(u).toLowerCase().trim(); s=s.replace(/\s+/g,''); s=s.replace(/kr\.?$/,'kr'); s=s.replace(/øre|ore/,'øre'); s=s.replace(/\b(m|cm|mm|km)(2)\b/g,'$1^2'); s=s.replace(/\b(m|cm|mm|km)(3)\b/g,'$1^3'); if(s==='l'||s==='liter') s='l'; if(s==='m/s'||s==='m·s^-1'||s==='ms^-1'||s==='m s^-1') s='m/s'; return s; }
function unitsMatch(expected, given){ if(!expected) return true; const e=normalizeUnit(expected); const g=normalizeUnit(given); if(!g) return false; if(e===g) return true; const aliases={'l':['liter','l'],'kr':['kr','kr.'],'m^2':['m2','m^2'],'cm^2':['cm2','cm^2'],'m^3':['m3','m^3'],'cm^3':['cm3','cm^3'],'m/s':['m/s','ms^-1','m s^-1']}; for(const [key,list] of Object.entries(aliases)){ if(e===key && list.includes(g)) return true; } return false; }

function headerUI(){ const h=document.querySelector('header'); const prog=loadProgress(); const btn = prog.last ? el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); const subj=prog.last.subject; const lvl=prog.last.level; renderLevels(subj, window.__data[subj]); const levelObj=window.__data[subj].levels.find(x=>x.level===lvl); renderDetails(window.__data[subj].title, levelObj);}},'Fortsæt hvor du slap') : null; const wrap=el('div',{}, [btn?btn:el('span',{},'')]); h.appendChild(wrap); }

function headerControls(){
  const h = document.querySelector('header');
  const wrap = el('div', {class:'small'}, []);

  // Mode select
  const modeSel = el('select', {}, [
    el('option',{value:'all'},'Alle opgaver'),
    el('option',{value:'units'},'Kun enheder')
  ]);
  modeSel.value = CONFIG.mode;
  modeSel.onchange = () => { CONFIG.mode = modeSel.value; };

  // Strict units checkbox
  const chk = el('input',{type:'checkbox'});
  chk.checked = CONFIG.strictUnits;
  chk.onchange = () => { CONFIG.strictUnits = chk.checked; };

  // Sværhedsvægte inputs
  function mkWeightInputs(label, arr){
    const w = el('span',{style:'margin-left:8px;'});
    w.appendChild(el('span',{style:'margin:0 6px;'},label+':'));
    const e = el('input',{type:'number',value:arr[0],min:'0',max:'8',style:'width:48px'});
    const m = el('input',{type:'number',value:arr[1],min:'0',max:'8',style:'width:48px;margin-left:4px'});
    const h = el('input',{type:'number',value:arr[2],min:'0',max:'8',style:'width:48px;margin-left:4px'});
    e.onchange = () => arr[0]=Number(e.value);
    m.onchange = () => arr[1]=Number(m.value);
    h.onchange = () => arr[2]=Number(h.value);
    w.appendChild(e); w.appendChild(m); w.appendChild(h);
    return w;
  }

  const row1 = el('div',{},[
    el('label',{},['Træning: ', modeSel]),
    el('span',{style:'margin-left:10px'}),
    el('label',{},[chk, ' Kræv korrekt enhed'])
  ]);
  const row2 = el('div',{style:'margin-top:6px'},[
    el('span',{},'Sværhedsvægte (let, mellem, svær):'),
    mkWeightInputs('1–3', CONFIG.mixWeights.low),
    mkWeightInputs('4–6', CONFIG.mixWeights.mid),
    mkWeightInputs('7–8', CONFIG.mixWeights.high),
    mkWeightInputs('9–10', CONFIG.mixWeights.top)
  ]);

  wrap.appendChild(row1);
  wrap.appendChild(row2);
  h.appendChild(wrap);
}

function renderSubjects(data){ const c=document.getElementById('subjects'); c.innerHTML=''; c.appendChild(el('h2',{},'Emner')); const grid=el('div',{class:'grid'}); Object.entries(data).forEach(([key,subject])=>{ const card=el('div',{class:'card'},[ el('h3',{},subject.title), el('p',{class:'small'},`Niveauer: 1–${subject.levels.length}`), el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault();renderLevels(key, subject);}},'Se niveauer') ]); grid.appendChild(card); }); c.appendChild(grid); }

function subjectProgress(subjectKey){ const p=loadProgress(); const s=p.subjects[subjectKey] || {passed:[], unlocked:1}; return s; }
function progressBar(subjectKey){ const s=subjectProgress(subjectKey); const total=10; const done=s.passed.length; const pct=Math.round((done/total)*100); const outer=el('div',{style:'margin:8px 0;'}); outer.appendChild(el('div',{class:'small'},`Fremskridt: ${done}/${total} (${pct}%)`)); const bar=el('div',{style:'height:10px;background:#1f2937;border-radius:999px;overflow:hidden;'}); const fill=el('div',{style:`height:100%;width:${pct}%;background:var(--accent)`}); bar.appendChild(fill); outer.appendChild(bar); return outer; }

function renderLevels(key, subject){ document.getElementById('levels').classList.remove('hidden'); document.getElementById('details').classList.add('hidden'); const levels=document.getElementById('levels'); levels.innerHTML=''; levels.appendChild(el('h2',{},`${subject.title} – niveauer`)); levels.appendChild(progressBar(key)); const grid=el('div',{class:'grid'}); const s=subjectProgress(key); subject.levels.forEach(l=>{ const locked = l.level > (s.unlocked || 1); const passed = (s.passed||[]).includes(l.level); const badge = passed ? '✅ Bestået' : (locked ? '🔒 Låst' : '▶️ Klar'); const card=el('div',{class:'level'},[ el('h4',{},`Niveau ${l.level}: ${l.title}`), el('p',{class:'small'},l.desc), el('p',{class:'small'},badge), el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); if(!locked){ renderDetails(subject.title,l); } }}, passed? 'Se igen' : 'Start niveau') ]); grid.appendChild(card); }); levels.appendChild(grid); }

async function loadTasks(subjectKey, level){ const res=await fetch(`/data/${subjectKey}-n${level}.json`); if(!res.ok) return null; return res.json(); }

function pickAdaptive(tasks, level){
  // filter by mode (units-only selects tasks with a unit defined)
  if(CONFIG.mode==='units'){ tasks = tasks.filter(t=>t && (t.unit || (t.tags&&t.tags.includes('unit')))); }
  const easy=tasks.filter(t=>t.difficulty==='easy'); const med=tasks.filter(t=>t.difficulty==='medium'); const hard=tasks.filter(t=>t.difficulty==='hard');
  let needEasy, needMed, needHard;
  if(level <=3){ [needEasy,needMed,needHard] = CONFIG.mixWeights.low; }
  else if(level<=6){ [needEasy,needMed,needHard] = CONFIG.mixWeights.mid; }
  else if(level<=8){ [needEasy,needMed,needHard] = CONFIG.mixWeights.high; }
  else { [needEasy,needMed,needHard] = CONFIG.mixWeights.top; }
  function take(arr,n){ const a=[...arr]; const out=[]; while(out.length<n && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }
  const picked=[...take(easy,needEasy), ...take(med,needMed), ...take(hard,needHard)];
  while(picked.length<8 && tasks.length){ const t=tasks[Math.floor(Math.random()*tasks.length)]; if(!picked.includes(t)) picked.push(t); }
  return picked.slice(0,8);
}

function parseNumericInput(raw){ if(raw==null) return {num:NaN, unit:null}; const s=String(raw).replace(',', '.').trim(); const match=s.match(/([-+]?\d+(?:\.\d+)?)/); const num=match? parseFloat(match[1]) : NaN; const unit=s.replace(match?match[0]:'','').trim().replace(/\s+/g,' '); return {num, unit: unit||null}; }
function near(a,b,tol=0.01){ return Math.abs(Number(a)-Number(b)) <= tol; }

function renderDetails(subjectTitle, level){ const details=document.getElementById('details'); details.classList.remove('hidden'); details.innerHTML=''; details.appendChild(el('h2',{},`${subjectTitle} – Niveau ${level.level}`)); details.appendChild(el('div',{class:'card'},[ el('p',{},`Titel: ${level.title}`), el('p',{},`Beskrivelse: ${level.desc}`), el('p',{},`Eksempel: ${level.example}`) ])); const tasksWrap=el('div',{class:'card'}); details.appendChild(tasksWrap);
  const key=Object.keys(window.__data||{}).find(k => (window.__data[k] && window.__data[k].title===subjectTitle)); const subjectKey=key || subjectTitle.toLowerCase(); const prog=loadProgress(); prog.last={subject:subjectKey, level:level.level}; saveProgress(prog);
  loadTasks(subjectKey, level.level).then(data=>{ if(!data){ tasksWrap.appendChild(el('p',{},'Ingen opgaver fundet.')); return; } const quiz=new Quiz(subjectKey, level.level, data.tasks); tasksWrap.appendChild(quiz.el); }); }

function renderXPBar(){ const wrapId='xpbar-wrap'; let node=document.getElementById(wrapId); if(!node){ node=el('div',{id:wrapId, class:'xpbar'}); document.querySelector('header').appendChild(node); } const {xp,level}=loadXP(); const prog=recomputeLevel(xp); const pct=Math.min(100, Math.round((prog.xpInto/prog.need)*100)); node.innerHTML=''; node.appendChild( el('div',{},[ el('span',{class:'small'},`Level ${level}`), el('div',{class:'xpbar-outer'},[ el('div',{class:'xpbar-fill', style:`width:${pct}%`},[]) ]), el('div',{class:'small'},`${prog.xpInto} / ${prog.need} XP`) ]) ); }

const BADGES_KEY='am_badges_v1';
const BADGE_CATALOG={
  perfect_round:{title:'Perfekt runde',desc:'8/8 korrekte i én runde.',icon:'🏆'},
  streak_10:{title:'Streak‑10',desc:'10 korrekte svar i træk.',icon:'🔥'},
  speed_runner:{title:'Speedrunner',desc:'Bestå en runde på ≤ 120 sek.',icon:'⚡'},
  unit_ace:{title:'Enheds‑Ace',desc:'Mindst 5 korrekte numeric‑svar med korrekt enhed i én runde.',icon:'📏'},
  broeker_master:{title:'Brøk‑mester',desc:'Bestå alle 10 niveauer i Brøker.',icon:'➗'},
  procent_pro:{title:'Procent‑Pro',desc:'På Procent‑niveau 9+: mindst 7/8 korrekte.',icon:'📈'},
  geometri_guru:{title:'Geometri‑Guru',desc:'På Geometri‑niveau 9+: mindst 7/8 korrekte.',icon:'📐'}
};
function loadBadges(){ try{ return JSON.parse(localStorage.getItem(BADGES_KEY)) || {earned:{}}; }catch(e){ return {earned:{}}; } }
function saveBadges(s){ localStorage.setItem(BADGES_KEY, JSON.stringify(s)); }
function hasBadge(id){ const b=loadBadges(); return !!b.earned[id]; }
function awardBadge(id){ if(!BADGE_CATALOG[id]) return false; const b=loadBadges(); if(b.earned[id]) return false; b.earned[id]={date:new Date().toISOString()}; saveBadges(b); renderBadgesStrip(); badgeToast(id); return true; }
function badgeToast(id){ const info=BADGE_CATALOG[id]; if(!info) return; const node=el('div',{class:'badge-toast'},[ el('span',{class:'badge-icon'},info.icon), el('span',{},` Badge: ${info.title}`) ]); document.body.appendChild(node); setTimeout(()=>{ node.classList.add('show'); },10); setTimeout(()=>{ node.classList.remove('show'); node.remove(); },2500); }
function renderBadgesStrip(){ const wrapId='badges-strip'; let node=document.getElementById(wrapId); if(!node){ node=el('div',{id:wrapId,class:'badges-strip'},[]); document.querySelector('header').appendChild(node); } const state=loadBadges(); const earnedIds=Object.keys(state.earned||{}); const earnedCount=earnedIds.length; const icons=earnedIds.slice(0,6).map(id=> el('span',{class:'badge-icon',title: (BADGE_CATALOG[id]?.title||id)}, BADGE_CATALOG[id]?.icon||'⭐')); const more = earnedCount>6 ? el('span',{class:'small',style:'margin-left:8px'},`+${earnedCount-6} flere`) : null; node.innerHTML=''; node.appendChild(el('div',{},[ el('span',{class:'small'},'Badges: '), ...icons, more || el('span',{},'') ])); const btn=el('a',{href:'#',class:'button',style:'margin-left:8px',onclick:(ev)=>{ev.preventDefault(); toggleBadgesPanel();}},'Se alle'); node.appendChild(btn); }
function toggleBadgesPanel(){ const id='badges-panel'; let p=document.getElementById(id); if(p){ p.remove(); return; } p=el('div',{id:id,class:'badges-panel card'},[]); const title=el('h3',{},'Dine badges'); const grid=el('div',{class:'badges-grid'},[]); const state=loadBadges(); const earned=state.earned||{}; Object.entries(BADGE_CATALOG).forEach(([id,meta])=>{ const got=!!earned[id]; const item=el('div',{class:'badge-card '+(got?'earned':'locked')},[ el('div',{class:'badge-icon big'}, meta.icon), el('div',{class:'badge-title'}, meta.title), el('div',{class:'small'}, meta.desc), got? el('div',{class:'small'}, new Date(earned[id].date).toLocaleDateString()) : el('div',{class:'small'}, 'Lås op ved at klare kravet') ]); grid.appendChild(item); }); const close=el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); p.remove();}},'Luk'); p.appendChild(title); p.appendChild(grid); p.appendChild(close); document.querySelector('main').insertBefore(p, document.querySelector('main').firstChild); }

function renderXPInit(){ try{ renderXPBar(); renderBadgesStrip(); }catch(e){} }

async function loadTasksWrapper(subjectKey, level){ return loadTasks(subjectKey, level); }

class Quiz{
  constructor(subjectKey, level, tasks){ this.subjectKey=subjectKey; this.level=level; this.allTasks=tasks; this.tasks=pickAdaptive(tasks, level); this.idx=0; this.correct=0; this.answers=[]; this.el=el('div',{},[]); this.streak=0; this.sessionXp=0; this.roundStart=Date.now(); this.unitCorrect=0; this.render(); }
  render(){ this.el.innerHTML=''; if(this.idx>=this.tasks.length){ this.renderSummary(); return; } const t=this.tasks[this.idx]; const head=el('div',{},[ el('h3',{},`Opgave ${this.idx+1} af ${this.tasks.length}`), el('p',{class:'small'},`Sværhedsgrad: ${t.difficulty}`) ]); const body=el('div',{},[ el('div',{},t.prompt) ]);
    let inputArea; if(t.type==='mcq'){ inputArea = el('div',{}, t.choices.map((c,i)=> el('button',{class:'button',onclick:()=> this.submit(i)}, `${String.fromCharCode(65+i)}. ${c}`)) ); } else if(t.type==='numeric'){ const inp=el('input',{type:'text',placeholder:t.unit?`fx 78.5 ${t.unit}`:'',style:'margin-right:8px'}); inputArea = el('div',{}, [inp, el('button',{class:'button',onclick:()=> this.submit(inp.value)},'Svar')]); } else { const inp=el('input',{type:'text',style:'margin-right:8px'}); inputArea = el('div',{}, [inp, el('button',{class:'button',onclick:()=> this.submit(inp.value.trim())},'Svar')]); }
    const hint = el('details',{}, [el('summary',{},'Hint'), el('div',{class:'small'}, t.hint || '')]);
    this.el.appendChild(head); this.el.appendChild(body); this.el.appendChild(inputArea); this.el.appendChild(hint); }
  isCorrect(t, ans){ if(t.type==='mcq') return ans===t.answer; if(t.type==='numeric'){ const a=Number(ans); const b=Number(t.answer); return Math.abs(a-b) < 0.01; } return String(ans).toLowerCase()===String(t.answer).toLowerCase(); }
  submit(ans){ const t=this.tasks[this.idx]; let given=ans; let givenUnit=null; if(t.type==='numeric'){ const p=parseNumericInput(ans); given=p.num; givenUnit=p.unit; }
    let ok=this.isCorrect(t, given);
    if(ok && CONFIG.strictUnits && t.type==='numeric' && t.unit){ if(!unitsMatch(t.unit, givenUnit)){ ok=false; } }
    if(ok) this.correct++; this.answers.push({id:t.id, ok, given});
    // XP logic
    let gained=0; if(ok){ const base = XP_POINTS[t.difficulty] || 10; this.streak=(this.streak||0)+1; const bonus=Math.min((this.streak-1)*XP_STREAK_STEP, XP_STREAK_MAX); gained=base+bonus; } else { this.streak=0; }
    if(gained>0){ this.sessionXp += gained; const res=addXP(gained); const xpNote=el('p',{class:'small'},`+${gained} XP` + (res.leveledUp?`  🎉 Level ${res.level}!`:'')); this.el.appendChild(xpNote); }
    // unit-correct counter
    if(ok && t.type==='numeric' && t.unit){ try{ if(unitsMatch(t.unit, givenUnit)) this.unitCorrect++; }catch(e){} }
    // targeted feedback
    let feedbackText=null; if(!ok){ if(t.type==='numeric'){ const ds=(t.distractors||[]).map(Number); let matched=null; for(const d of ds){ if(near(given,d)) { matched=d; break; } } if(matched!=null && t.feedback_map && t.feedback_map[String(matched)]){ const key=t.feedback_map[String(matched)]; feedbackText = FEEDBACK[key] || null; } }
      if(!feedbackText && CONFIG.strictUnits && t.type==='numeric' && t.unit){ feedbackText = FEEDBACK['unit_missing_or_wrong'] || 'Enhed mangler eller er forkert.'; }
      if(!feedbackText && t.feedback_key){ feedbackText = FEEDBACK[t.feedback_key] || null; }
      if(!feedbackText && t.hint){ feedbackText = t.hint; }
    }
    const facitText = t.type==='mcq'? t.choices[t.answer] : t.answer; const fb = el('div',{}, [ el('p',{}, ok? '✔️ Korrekt!' : `❌ Forkert. Facit: ${facitText}`), feedbackText? el('p',{class:'small'}, feedbackText) : null ]); this.el.appendChild(fb);
    // streak-10 badge live
    if(this.streak===10){ awardBadge('streak_10'); }
    setTimeout(()=>{ this.idx++; this.render(); }, 700);
  }
  renderSummary(){ this.el.innerHTML=''; const passed = this.correct >= PASS_REQUIRED; this.el.appendChild(el('h3',{},'Opsummering')); this.el.appendChild(el('p',{},`Korrekte svar: ${this.correct}/${this.tasks.length}`)); this.el.appendChild(el('p',{}, passed? '🎉 Bestået!' : 'Prøv igen for at bestå.'));
    // Save progress & unlock
    const p=loadProgress(); const s=p.subjects[this.subjectKey] || {passed:[], unlocked:1}; if(passed && !s.passed.includes(this.level)) s.passed.push(this.level); if(passed && (s.unlocked||1) < this.level+1) s.unlocked=this.level+1; p.subjects[this.subjectKey]=s; p.last={subject:this.subjectKey, level:this.level}; saveProgress(p);
    // Pass bonus
    let passBonus=0; if(passed){ passBonus = XP_PASS_BONUS; this.sessionXp += passBonus; addXP(passBonus); }
    this.el.appendChild(el('p',{}, `Optjent XP i runden: ${this.sessionXp}${passBonus?` (+${passBonus} bonus for bestået)`:''}`));
    // Badges on finish
    if(this.correct===this.tasks.length){ awardBadge('perfect_round'); }
    if(passed && (Date.now()-this.roundStart)/1000 <= 120){ awardBadge('speed_runner'); }
    if(this.unitCorrect >= 5){ awardBadge('unit_ace'); }
    try{ if(this.level>=9 && this.correct>=7){ if(this.subjectKey==='procent') awardBadge('procent_pro'); if(this.subjectKey==='geometri') awardBadge('geometri_guru'); } const all=loadProgress(); const brok=all.subjects['broeker']; if(brok && Array.isArray(brok.passed) && brok.passed.length>=10){ awardBadge('broeker_master'); } }catch(e){}

    const againBtn=el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); this.idx=0; this.correct=0; this.tasks=pickAdaptive(this.allTasks, this.level); this.streak=0; this.sessionXp=0; this.unitCorrect=0; this.roundStart=Date.now(); this.render();}},'Øv igen');
    const nextBtn=el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); const subj=this.subjectKey; const subjObj=window.__data[subj]; renderLevels(subj, subjObj); const next=Math.min(this.level+1, 10); const lvlObj=subjObj.levels.find(x=>x.level===next); renderDetails(subjObj.title, lvlObj); }},'Næste niveau'); if(!passed){ nextBtn.style.opacity='0.5'; nextBtn.style.pointerEvents='none'; }
    const backBtn=el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); renderLevels(this.subjectKey, window.__data[this.subjectKey]);}},'Tilbage til niveauer');
    const actions=el('div',{},[againBtn, el('span',{style:'margin:0 8px'}), nextBtn, el('span',{style:'margin:0 8px'}), backBtn]); this.el.appendChild(actions);
    try{ renderXPBar(); }catch(e){}
  }
}
Promise.all([loadData(), loadFeedback()]).then(([d])=>{
  window.__data = d;
  renderSubjects(d);
  headerUI();
  headerControls();
});
