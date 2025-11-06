
const PASS_REQUIRED = 6; // krævede korrekte svar ud af 8
const STORAGE_KEY = 'am_progress_v1';
let FEEDBACK = {};

async function loadFeedback(){
  try{ const r=await fetch('/data/feedback.json'); if(r.ok){ FEEDBACK = await r.json(); } }catch(e){}
}

function loadProgress(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {subjects:{}, last:null}; }catch(e){return {subjects:{}, last:null}}
}
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

async function loadData(){
  const res = await fetch('/data/data.json');
  const data = await res.json();
  return data;
}

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k==='onclick') e.onclick=v; else e.setAttribute(k,v) });
  (Array.isArray(children)?children:[children]).forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); });
  return e;
}

function headerUI(){
  const h = document.querySelector('header');
  const prog = loadProgress();
  const btn = prog.last ? el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault();
      const subj = prog.last.subject; const lvl = prog.last.level; 
      renderLevels(subj, window.__data[subj]);
      const levelObj = window.__data[subj].levels.find(x=>x.level===lvl);
      renderDetails(window.__data[subj].title, levelObj);
  }},'Fortsæt hvor du slap') : null;
  const wrap = el('div',{}, [btn?btn:el('span',{},'')]);
  h.appendChild(wrap);
}

function renderSubjects(data){
  const container = document.getElementById('subjects');
  container.innerHTML = '';
  container.appendChild(el('h2',{},'Emner'));
  const grid = el('div',{class:'grid'});
  Object.entries(data).forEach(([key, subject])=>{
    const card = el('div',{class:'card'},[
      el('h3',{},subject.title),
      el('p',{class:'small'},`Niveauer: 1–${subject.levels.length}`),
      el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault();renderLevels(key, subject);}},'Se niveauer')
    ]);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function subjectProgress(subjectKey){
  const p = loadProgress();
  const s = p.subjects[subjectKey] || {passed:[], unlocked:1};
  return s;
}

function progressBar(subjectKey){
  const s = subjectProgress(subjectKey);
  const total = 10; const done = s.passed.length;
  const pct = Math.round((done/total)*100);
  const outer = el('div',{style:'margin:8px 0;'});
  outer.appendChild(el('div',{class:'small'},`Fremskridt: ${done}/${total} (${pct}%)`));
  const bar = el('div',{style:'height:10px;background:#1f2937;border-radius:999px;overflow:hidden;'});
  const fill = el('div',{style:`height:100%;width:${pct}%;background:var(--accent);`});
  bar.appendChild(fill);
  outer.appendChild(bar);
  return outer;
}

function renderLevels(key, subject){
  document.getElementById('levels').classList.remove('hidden');
  document.getElementById('details').classList.add('hidden');
  const levels = document.getElementById('levels');
  levels.innerHTML = '';
  levels.appendChild(el('h2',{},`${subject.title} – niveauer`));
  levels.appendChild(progressBar(key));
  const grid = el('div',{class:'grid'});
  const s = subjectProgress(key);
  subject.levels.forEach(l=>{
    const locked = l.level > (s.unlocked || 1);
    const passed = (s.passed||[]).includes(l.level);
    const badge = passed ? '✅ Bestået' : (locked ? '🔒 Låst' : '▶️ Klar');
    const card = el('div',{class:'level'},[
      el('h4',{},`Niveau ${l.level}: ${l.title}`),
      el('p',{class:'small'},l.desc),
      el('p',{class:'small'},badge),
      el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); if(!locked){ renderDetails(subject.title,l); } }}, passed? 'Se igen' : 'Start niveau')
    ]);
    grid.appendChild(card);
  });
  levels.appendChild(grid);
}

async function loadTasks(subjectKey, level){
  const res = await fetch(`/data/${subjectKey}-n${level}.json`);
  if(!res.ok) return null;
  return res.json();
}

function pickAdaptive(tasks, level){
  const easy = tasks.filter(t=>t.difficulty==='easy');
  const med = tasks.filter(t=>t.difficulty==='medium');
  const hard = tasks.filter(t=>t.difficulty==='hard');
  let needEasy, needMed, needHard;
  if(level <=3){ [needEasy,needMed,needHard] = [4,3,1]; }
  else if(level<=6){ [needEasy,needMed,needHard] = [3,3,2]; }
  else if(level<=8){ [needEasy,needMed,needHard] = [2,3,3]; }
  else { [needEasy,needMed,needHard] = [1,3,4]; }
  function take(arr, n){ const a=[...arr]; const out=[]; while(out.length<n && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }
  const picked = [...take(easy,needEasy), ...take(med,needMed), ...take(hard,needHard)];
  while(picked.length<8 && tasks.length){
    const t = tasks[Math.floor(Math.random()*tasks.length)];
    if(!picked.includes(t)) picked.push(t);
  }
  return picked.slice(0,8);
}

function parseNumericInput(raw){
  if(raw==null) return {num:NaN, unit:null};
  const s = String(raw).replace(',', '.').trim();
  const match = s.match(/([-+]?\d+(?:\.\d+)?)/);
  const num = match? parseFloat(match[1]) : NaN;
  const unit = s.replace(match?match[0]:'', '').trim().replace(/\s+/g,' ');
  return {num, unit: unit||null};
}
function near(a,b,tol=0.01){ return Math.abs(Number(a)-Number(b)) <= tol; }

function renderDetails(subjectTitle, level){
  const details = document.getElementById('details');
  details.classList.remove('hidden');
  details.innerHTML = '';
  details.appendChild(el('h2',{},`${subjectTitle} – Niveau ${level.level}`));
  details.appendChild(el('div',{class:'card'},[
    el('p',{},`Titel: ${level.title}`),
    el('p',{},`Beskrivelse: ${level.desc}`),
    el('p',{},`Eksempel: ${level.example}`),
  ]));

  const tasksWrap = el('div',{class:'card'});
  details.appendChild(tasksWrap);

  const key = Object.keys(window.__data || {}).find(k => (window.__data[k] && window.__data[k].title===subjectTitle));
  const subjectKey = key || subjectTitle.toLowerCase();
  const prog = loadProgress();
  prog.last = {subject: subjectKey, level: level.level};
  saveProgress(prog);

  loadTasks(subjectKey, level.level).then(data=>{
    if(!data){ tasksWrap.appendChild(el('p',{},'Ingen opgaver fundet.')); return; }
    const quiz = new Quiz(subjectKey, level.level, data.tasks);
    tasksWrap.appendChild(quiz.el);
  });
}

class Quiz{
  constructor(subjectKey, level, tasks){
    this.subjectKey = subjectKey; this.level = level;
    this.allTasks = tasks;
    this.tasks = pickAdaptive(tasks, level);
    this.idx = 0; this.correct = 0;
    this.answers = [];
    this.el = el('div',{},[]);
    this.render();
  }
  render(){
    this.el.innerHTML='';
    if(this.idx >= this.tasks.length){ this.renderSummary(); return; }
    const t = this.tasks[this.idx];
    const head = el('div',{},[
      el('h3',{},`Opgave ${this.idx+1} af ${this.tasks.length}`),
      el('p',{class:'small'},`Sværhedsgrad: ${t.difficulty}`)
    ]);
    const body = el('div',{},[ el('div',{},t.prompt) ]);

    let inputArea;
    if(t.type==='mcq'){
      inputArea = el('div',{}, t.choices.map((c,i)=> el('button',{class:'button',onclick:()=> this.submit(i)}, `${String.fromCharCode(65+i)}. ${c}`)) );
    } else if(t.type==='numeric'){
      const inp = el('input',{type:'text',placeholder:t.unit?`fx 78.5 ${t.unit}`:'',style:'margin-right:8px'});
      inputArea = el('div',{}, [inp, el('button',{class:'button',onclick:()=> this.submit(inp.value)},'Svar')]);
    } else { // short (tekst)
      const inp = el('input',{type:'text',style:'margin-right:8px'});
      inputArea = el('div',{}, [inp, el('button',{class:'button',onclick:()=> this.submit(inp.value.trim())},'Svar')]);
    }

    const hint = el('details',{}, [el('summary',{},'Hint'), el('div',{class:'small'}, t.hint || '')]);

    this.el.appendChild(head);
    this.el.appendChild(body);
    this.el.appendChild(inputArea);
    this.el.appendChild(hint);
  }
  isCorrect(t, ans){
    if(t.type==='mcq') return ans===t.answer;
    if(t.type==='numeric'){
      const a = Number(ans);
      const b = Number(t.answer);
      return Math.abs(a-b) < 0.01;
    }
    return String(ans).toLowerCase()===String(t.answer).toLowerCase();
  }
  submit(ans){
    const t = this.tasks[this.idx];
    let given = ans;
    if(t.type==='numeric'){ const p = parseNumericInput(ans); given = p.num; }
    const ok = this.isCorrect(t, given);
    if(ok) this.correct++;
    this.answers.push({id:t.id, ok, given});

    let feedbackText = null;
    if(!ok){
      if(t.type==='numeric'){
        const ds = (t.distractors||[]).map(Number);
        let matched=null;
        for(const d of ds){ if(near(given,d)) { matched = d; break; } }
        if(matched!=null && t.feedback_map && t.feedback_map[String(matched)]){
          const key = t.feedback_map[String(matched)];
          feedbackText = FEEDBACK[key] || null;
        }
      }
      if(!feedbackText && t.feedback_key){ feedbackText = FEEDBACK[t.feedback_key] || null; }
      if(!feedbackText && t.hint){ feedbackText = t.hint; }
    }
    const facitText = t.type==='mcq'? t.choices[t.answer] : t.answer;
    const fb = el('div',{}, [
      el('p',{}, ok? '✔️ Korrekt!' : `❌ Forkert. Facit: ${facitText}`),
      feedbackText? el('p',{class:'small'}, feedbackText) : null
    ]);
    this.el.appendChild(fb);
    setTimeout(()=>{ this.idx++; this.render(); }, 800);
  }
  renderSummary(){
    this.el.innerHTML='';
    const passed = this.correct >= PASS_REQUIRED;
    this.el.appendChild(el('h3',{},'Opsummering'));
    this.el.appendChild(el('p',{},`Korrekte svar: ${this.correct}/${this.tasks.length}`));
    this.el.appendChild(el('p',{}, passed? '🎉 Bestået!' : 'Prøv igen for at bestå.'));

    const p = loadProgress();
    const s = p.subjects[this.subjectKey] || {passed:[], unlocked:1};
    if(passed && !s.passed.includes(this.level)) s.passed.push(this.level);
    if(passed && (s.unlocked||1) < this.level+1) s.unlocked = this.level+1;
    p.subjects[this.subjectKey] = s;
    p.last = {subject: this.subjectKey, level: this.level};
    saveProgress(p);

    const againBtn = el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); this.idx=0; this.correct=0; this.tasks = pickAdaptive(this.allTasks, this.level); this.render();}},'Øv igen');
    const nextBtn = el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); const subj = this.subjectKey; const subjObj = window.__data[subj]; renderLevels(subj, subjObj); const next = Math.min(this.level+1, 10); const lvlObj = subjObj.levels.find(x=>x.level===next); renderDetails(subjObj.title, lvlObj); }},'Næste niveau');
    if(!passed){ nextBtn.style.opacity='0.5'; nextBtn.style.pointerEvents='none'; }

    const backBtn = el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault(); renderLevels(this.subjectKey, window.__data[this.subjectKey]);}},'Tilbage til niveauer');

    const actions = el('div',{},[againBtn, el('span',{style:'margin:0 8px'}), nextBtn, el('span',{style:'margin:0 8px'}), backBtn]);
    this.el.appendChild(actions);
  }
}

Promise.all([loadData(), loadFeedback()]).then(([d])=>{ window.__data = d; renderSubjects(d); headerUI(); });
