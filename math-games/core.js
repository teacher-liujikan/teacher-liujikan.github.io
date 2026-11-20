/* 數學遊戲樂園 — 共用核心 */
const app = document.getElementById('app');
const G = {}, ORDER = [];
const CATS = {
  num:   {name:'數與量', emoji:'🔢', color:'#b5482f'},
  geo:   {name:'幾何',   emoji:'📐', color:'#2f6690'},
  logic: {name:'推理',   emoji:'🧠', color:'#3f7d5a'},
};
const BANDS = {1:{name:'低中年級', short:'低中', emoji:'🌱'}, 2:{name:'高年級', short:'高', emoji:'🌿'}, 3:{name:'國中', short:'國中', emoji:'🌳'}};
let runId = 0, curId = null, catFilter = 'all', band = 0, exTab = 2;
try { band = +localStorage.getItem('mathgames-band') || 0; } catch(e){}
function setBand(b){ band = b; try { localStorage.setItem('mathgames-band', b); } catch(e){} }
function reg(g){ G[g.id] = g; ORDER.push(g.id); }
function later(fn, ms){ const id = runId; setTimeout(()=>{ if(id===runId) fn(); }, ms); }
const rand = n => Math.floor(Math.random()*n);
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const big = t => `<b style="font-size:26px">${t}</b>`;

/* ---------- 視窗 ---------- */
const modal = document.getElementById('modal'), explainBox = document.getElementById('explain');
let againFn = null;
function showWin(emoji, title, text, again, againLabel){
  document.getElementById('mEmoji').textContent = emoji;
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mText').innerHTML = text;
  document.getElementById('mAgain').textContent = againLabel || '再玩一次';
  againFn = again; modal.hidden = false;
}
function showExplain(){
  const g = G[curId]; if(!g) return;
  const bs = g.bands;
  exTab = !band ? bs[0] : bs.includes(band) ? band : bs.reduce((a,b)=>Math.abs(b-band)<Math.abs(a-band)?b:a);
  drawExplain(); explainBox.hidden = false;
}
function drawExplain(){
  const g = G[curId];
  document.getElementById('eTitle').textContent = `🎓 ${g.title}的數學`;
  document.getElementById('eTabs').innerHTML = g.bands.map(b=>`<button data-b="${b}" class="${b===exTab?'on':''}">${BANDS[b].emoji} ${BANDS[b].name}</button>`).join('');
  const body = document.getElementById('eBody'); body.innerHTML = g.explain[exTab]; body.scrollTop = 0;
}
document.getElementById('eTabs').onclick = e=>{ const b = e.target.closest('button'); if(b){ exTab = +b.dataset.b; drawExplain(); } };
document.getElementById('mAgain').onclick = ()=>{ modal.hidden = true; againFn && againFn(); };
document.getElementById('mHome').onclick = ()=>{ modal.hidden = true; location.hash = ''; };
document.getElementById('mExplain').onclick = showExplain;
document.getElementById('eClose').onclick = ()=>{ explainBox.hidden = true; };

/* ---------- 共用版面 ---------- */
function shell(el, rules, defs, opts, onChange){
  el.innerHTML = `<div class="game">
    <aside class="panel">
      <div class="card rules"><h3>📖 怎麼玩<span class="fold-ic"></span></h3><div class="rules-body">${rules}</div>
        <button class="btn green explain-btn">🎓 數學講解</button></div>
      <div class="card settings"></div>
      <div class="status"></div>
    </aside>
    <section class="board"></section></div>`;
  el.querySelector('.explain-btn').onclick = showExplain;
  const rc = el.querySelector('.rules'); if(firstVisit) rc.classList.add('open');
  rc.querySelector('h3').onclick = ()=>rc.classList.toggle('open');
  const setEl = el.querySelector('.settings');
  function drawSet(){
    setEl.innerHTML = defs.map(d=>`<div class="set-row"><span class="set-label">${d.label}</span><div class="seg">${
      d.options.map(([v,t])=>`<button data-k="${d.key}" data-v="${v}" class="${String(opts[d.key])===String(v)?'on':''}">${t}</button>`).join('')
    }</div></div>`).join('') + `<button class="btn ghost restart">🔄 重新開始</button>`;
  }
  drawSet();
  setEl.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    if(b.classList.contains('restart')){ onChange(); return; }
    const d = defs.find(x=>x.key===b.dataset.k), o = d.options.find(([v])=>String(v)===b.dataset.v);
    opts[d.key] = o[0]; drawSet(); onChange();
  });
  const status = el.querySelector('.status');
  return { board: el.querySelector('.board'), setStatus: html => status.innerHTML = html, redrawSettings: drawSet };
}
function playerNames(mode){ return mode==='pvp' ? ['紅隊','藍隊'] : ['你','電腦']; }
function turnHTML(names, t){ return `輪到 <span class="badge p${t}">${names[t]}</span>`; }
function padHTML(){
  return `<div class="keypad">${[1,2,3,4,5,6,7,8,9].map(d=>`<button data-d="${d}">${d}</button>`).join('')}<button data-d="del">⌫</button><button data-d="0">0</button><button data-d="ok" class="ok">OK</button></div>`;
}

/* ---------- 大廳與路由 ---------- */
const homeBtn = document.getElementById('homeBtn'), leftSpacer = document.getElementById('leftSpacer');
const pageTitle = document.getElementById('pageTitle');
homeBtn.onclick = ()=>{ location.hash = ''; };
const GRAD = {
  num:   [['#ff7a59','#f0436b'],['#ff9f43','#f2622e'],['#f5a623','#ee6c1b']],
  geo:   [['#3fa9f5','#2d6cdf'],['#22b8c3','#2374c9'],['#7b6cf6','#4a7ff0']],
  logic: [['#35c98a','#1b9566'],['#6cc24a','#2a965a'],['#2fbf9f','#15868a']],
};
let played = new Set(), firstVisit = false;
try { played = new Set(JSON.parse(localStorage.getItem('mathgames-played') || '[]')); } catch(e){}
function markPlayed(id){ firstVisit = !played.has(id); played.add(id); try { localStorage.setItem('mathgames-played', JSON.stringify([...played])); } catch(e){} }
function renderHome(){
  const inBand = ORDER.filter(id=>!band || G[id].bands.includes(band));
  const ids = inBand.filter(id=>catFilter==='all' || G[id].cat===catFilter);
  const count = c => inBand.filter(id=>G[id].cat===c).length;
  const done = ORDER.filter(id=>played.has(id)).length;
  const tile = id => { const g=G[id], c=CATS[g.cat]; return `
      <button class="gcard" style="--c:${c.color}" data-id="${id}">
        <span class="no">${String(ORDER.indexOf(id)+1).padStart(2,'0')}</span>${played.has(id)?'<span class="star">✓ 玩過</span>':''}
        <span class="emo">${g.emoji}</span>
        <h2>${g.title}</h2><p>${g.desc}</p><small class="lv">${g.bands.map(b=>BANDS[b].short).join('・')}</small></button>`; };
  const shelves = (catFilter==='all' ? Object.keys(CATS) : [catFilter]).map(k=>{ const list=ids.filter(id=>G[id].cat===k); return list.length ? `
      <h3 class="shelf" style="--c:${CATS[k].color}"><span>${CATS[k].name}</span><i>${list.length} 款</i></h3>
      <div class="lobby">${list.map(tile).join('')}</div>` : ''; }).join('');
  app.innerHTML = `<section class="hero2">
      <p class="eyebrow">CLASSIC MATH GAMES</p>
      <h2>${ORDER.length} 款經典數學遊戲</h2>
      <p class="sub">流傳百年的益智遊戲，每一款都藏著數學。</p>
      <div class="explore"><span>已遊玩 <b>${done}</b> / ${ORDER.length}</span><div class="bar"><div style="width:${done/ORDER.length*100}%"></div></div></div>
      <button class="dice"><span>🎲</span> 隨機選一款</button>
    </section>
    <div class="bandbar">
      <button data-b="0" class="${!band?'on':''}">全部</button>
      ${Object.entries(BANDS).map(([k,b])=>`<button data-b="${k}" class="${band===+k?'on':''}">${b.name}</button>`).join('')}
    </div>
    <div class="chips cats">
      <button data-c="all" class="${catFilter==='all'?'on':''}">全部 ${inBand.length}</button>
      ${Object.entries(CATS).map(([k,c])=>`<button data-c="${k}" class="${catFilter===k?'on':''}">${c.name} ${count(k)}</button>`).join('')}
    </div>${shelves}`;
  app.querySelectorAll('.gcard').forEach(b=>b.onclick=()=>{ location.hash = b.dataset.id; });
  app.querySelectorAll('.chips button[data-c]').forEach(b=>b.onclick=()=>{ catFilter = b.dataset.c; renderHome(); });
  app.querySelectorAll('.bandbar button').forEach(b=>b.onclick=()=>{ setBand(+b.dataset.b); renderHome(); });
  app.querySelector('.dice').onclick = ()=>{
    const fresh = ids.filter(id=>!played.has(id)), pool = fresh.length ? fresh : ids; if(!pool.length) return;
    const pick = pool[rand(pool.length)], card = app.querySelector(`.gcard[data-id="${pick}"]`);
    app.querySelectorAll('.gcard').forEach(x=>x.classList.remove('picked'));
    card.classList.add('picked'); card.scrollIntoView({block:'center', behavior:'smooth'});
    later(()=>{ location.hash = pick; }, 900);
  };
}
function route(){
  runId++; modal.hidden = true; explainBox.hidden = true;
  const id = location.hash.slice(1), g = G[id];
  if(g){
    curId = id; markPlayed(id);
    pageTitle.textContent = `${g.emoji} ${g.title}`;
    homeBtn.hidden = false; leftSpacer.hidden = true;
    g.mount(app);
  } else {
    curId = null;
    pageTitle.textContent = '數學遊戲樂園';
    homeBtn.hidden = true; leftSpacer.hidden = false;
    renderHome();
  }
  window.scrollTo(0,0);
}
function boot(){ window.addEventListener('hashchange', route); route(); }
