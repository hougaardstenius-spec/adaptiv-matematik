
async function loadData(){
  const res = await fetch('/data/data.json');
  const data = await res.json();
  return data;
}

function el(tag, attrs={}, children=[]) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') e.className=v; else e.setAttribute(k,v)
  });
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(typeof c==='string') e.appendChild(document.createTextNode(c));
    else if(c) e.appendChild(c);
  });
  return e;
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

function renderLevels(key, subject){
  document.getElementById('levels').classList.remove('hidden');
  document.getElementById('details').classList.add('hidden');
  const levels = document.getElementById('levels');
  levels.innerHTML = '';
  levels.appendChild(el('h2',{},`${subject.title} – niveauer`));
  const grid = el('div',{class:'grid'});
  subject.levels.forEach(l=>{
    const card = el('div',{class:'level'},[
      el('h4',{},`Niveau ${l.level}: ${l.title}`),
      el('p',{class:'small'},l.desc),
      el('a',{href:'#',class:'button',onclick:(ev)=>{ev.preventDefault();renderDetails(subject.title,l);}},'Se detaljer')
    ]);
    grid.appendChild(card);
  });
  levels.appendChild(grid);
}

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
}

loadData().then(renderSubjects);
