/* 數學遊戲樂園 — 共用核心 */
const app = document.getElementById('app');
const G = {}, ORDER = [];
const CATS = {
  num:   {name:'數與量', emoji:'🔢', color:'#ec6a52'},
  geo:   {name:'幾何',   emoji:'📐', color:'#5aa9e6'},
  logic: {name:'推理',   emoji:'🧠', color:'#6fb04a'},
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
/* 封面圖：做好的圖片放在 img/<id>.webp，再把遊戲 id 加進這個清單 */
const COVERS = new Set(['grab','magic','tf','guess','mind','sieve','taxman','jug','kap','tangram']);
let view = 'cf', lastId = null;
try { view = localStorage.getItem('mathgames-view') || 'cf'; } catch(e){}
const coverHTML = id => COVERS.has(id) ? `<img src="img/${id}.webp" alt="" draggable="false">` : `<span class="cv-emo">${G[id].emoji}</span>`;
function renderHome(){
  const inBand = ORDER.filter(id=>!band || G[id].bands.includes(band));
  const ids = inBand.filter(id=>catFilter==='all' || G[id].cat===catFilter);
  const count = c => inBand.filter(id=>G[id].cat===c).length;
  const done = ORDER.filter(id=>played.has(id)).length;
  const tile = id => { const g=G[id], c=CATS[g.cat]; return `
      <button class="gcard" style="--c:${c.color}" data-id="${id}">
        <span class="no">${String(ORDER.indexOf(id)+1).padStart(2,'0')}</span>${played.has(id)?'<span class="star">✓ 玩過</span>':''}
        <span class="emo ${COVERS.has(id)?'pic':''}">${COVERS.has(id)?`<img src="img/${id}.webp" alt="">`:g.emoji}</span>
        <h2>${g.title}</h2><p>${g.desc}</p><small class="lv">${g.bands.map(b=>BANDS[b].short).join('・')}</small></button>`; };
  const shelves = (catFilter==='all' ? Object.keys(CATS) : [catFilter]).map(k=>{ const list=ids.filter(id=>G[id].cat===k); return list.length ? `
      <h3 class="shelf" style="--c:${CATS[k].color}"><span>${CATS[k].name}</span><i>${list.length} 款</i></h3>
      <div class="lobby">${list.map(tile).join('')}</div>` : ''; }).join('');
  const flow = ids.length ? `<div class="cf-wrap">
      <div class="cf-stage" aria-hidden="true">${ids.map(id=>{ const g=G[id], c=CATS[g.cat]; return `
        <div class="cf-item" style="--c:${c.color}"><div class="cf-card">
          <div class="cf-art">${coverHTML(id)}</div><div class="cf-name">${g.title}</div>${played.has(id)?'<span class="star">✓ 玩過</span>':''}</div></div>`; }).join('')}</div>
      <div class="cf" tabindex="0" aria-label="遊戲轉盤，左右滑動選遊戲">${ids.map(id=>`<button class="cf-slot" aria-label="${G[id].title}"></button>`).join('')}</div>
      <button class="cf-nav prev" aria-label="上一個">‹</button>
      <button class="cf-nav next" aria-label="下一個">›</button></div>
      <div class="cf-info"></div>` : '<p class="cf-empty">這個年段和分類沒有遊戲，換一個試試看。</p>';
  app.innerHTML = `<section class="hero2 ${view==='cf'?'compact':''}">
      <p class="eyebrow">CLASSIC MATH GAMES</p>
      <h2>${ORDER.length} 款經典數學遊戲</h2>
      <p class="sub">流傳百年的益智遊戲，每一款都藏著數學。</p>
      <div class="hero-row"><div class="explore"><span>已遊玩 <b>${done}</b> / ${ORDER.length}</span><div class="bar"><div style="width:${done/ORDER.length*100}%"></div></div></div>
      <button class="dice"><span>🎲</span> 隨機選一款</button>
      <div class="view-sw" role="group" aria-label="切換顯示方式"><button data-v="cf" class="${view==='cf'?'on':''}">🎠 3D 轉盤</button><button data-v="grid" class="${view==='grid'?'on':''}">▦ 表格</button></div></div>
    </section>
    <div class="filters"><div class="bandbar">
      <button data-b="0" class="${!band?'on':''}">全部</button>
      ${Object.entries(BANDS).map(([k,b])=>`<button data-b="${k}" class="${band===+k?'on':''}">${b.name}</button>`).join('')}
    </div>
    <div class="chips cats">
      <button data-c="all" class="${catFilter==='all'?'on':''}">全部 ${inBand.length}</button>
      ${Object.entries(CATS).map(([k,c])=>`<button data-c="${k}" class="${catFilter===k?'on':''}">${c.name} ${count(k)}</button>`).join('')}
    </div></div>${view==='cf' ? flow : shelves}`;
  app.querySelectorAll('.gcard').forEach(b=>b.onclick=()=>{ location.hash = b.dataset.id; });
  app.querySelectorAll('.chips button[data-c]').forEach(b=>b.onclick=()=>{ catFilter = b.dataset.c; renderHome(); });
  app.querySelectorAll('.bandbar button').forEach(b=>b.onclick=()=>{ setBand(+b.dataset.b); renderHome(); });
  app.querySelectorAll('.view-sw button').forEach(b=>b.onclick=()=>{ view=b.dataset.v; try{ localStorage.setItem('mathgames-view', view); }catch(e){} renderHome(); });
  let go = null;
  if(view==='cf' && ids.length) go = setupFlow(ids);
  app.querySelector('.dice').onclick = ()=>{
    const fresh = ids.filter(id=>!played.has(id)), pool = fresh.length ? fresh : ids; if(!pool.length) return;
    const pick = pool[rand(pool.length)];
    if(go){ go(ids.indexOf(pick)); later(()=>{ location.hash = pick; }, 1100); return; }
    const card = app.querySelector(`.gcard[data-id="${pick}"]`);
    app.querySelectorAll('.gcard').forEach(x=>x.classList.remove('picked'));
    card.classList.add('picked'); card.scrollIntoView({block:'center', behavior:'smooth'});
    later(()=>{ location.hash = pick; }, 900);
  };
}
function setupFlow(ids){
  // 視覺卡片放在不會捲動的舞台上，只用透明的捲動層接收手指滑動（避免 Safari 在捲動容器裡算錯 3D 位置）
  const sc = app.querySelector('.cf'), slots = [...sc.children], cards = [...app.querySelectorAll('.cf-stage .cf-item')], info = app.querySelector('.cf-info');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1, raf = 0, drag = null, moved = false;
  const W = ()=>slots[0].offsetWidth;
  const centerOf = i => slots[i].offsetLeft + W()/2 - sc.clientWidth/2;
  function showInfo(){
    const id = ids[cur], g = G[id], c = CATS[g.cat];
    info.innerHTML = `<div class="cf-txt"><span class="cf-cat" style="--c:${c.color}">${c.name}</span>
      <h2>${g.title}</h2><p>${g.desc}</p>
      <small>${g.bands.map(b=>BANDS[b].name).join('・')}　|　${cur+1} / ${ids.length}</small></div>
      <button class="btn big cf-play">▶ 開始玩</button>`;
    info.querySelector('.cf-play').onclick = ()=>{ location.hash = id; };
  }
  function layout(){
    raf = 0; if(!sc.isConnected) return;
    const w = W(), pos = (sc.scrollLeft + sc.clientWidth/2 - slots[0].offsetLeft - w/2) / w;
    cards.forEach((it,i)=>{
      const o = i - pos, a = Math.abs(o);
      if(a > 3.6){ it.style.visibility = 'hidden'; return; }
      const oc = Math.max(-3, Math.min(3, o)), x = (oc*0.68 + (o-oc)) * w;
      it.style.visibility = '';
      it.style.transform = `translate3d(${x}px,0,${-Math.min(a,3)*110}px) rotateY(${-oc*42}deg)`;
      it.style.zIndex = String(100 - Math.round(a*10));
      it.style.opacity = String(Math.max(0, 1 - Math.max(0, a-2)*0.9));
    });
    const best = Math.max(0, Math.min(cards.length-1, Math.round(pos)));
    if(best !== cur){ cur = best; cards.forEach((it,i)=>it.classList.toggle('on', i===cur)); showInfo(); lastId = ids[cur]; }
  }
  const go = i => { i = Math.max(0, Math.min(slots.length-1, i)); sc.scrollTo({left: centerOf(i), behavior: reduce ? 'auto' : 'smooth'}); };
  sc.addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(layout); }, {passive:true});
  addEventListener('resize', ()=>{ if(sc.isConnected){ sc.scrollLeft = centerOf(Math.max(0,cur)); layout(); } });
  slots.forEach((it,i)=>it.addEventListener('click', ()=>{ if(moved) return; if(i===cur) location.hash = ids[i]; else go(i); }));
  app.querySelector('.cf-nav.prev').onclick = ()=>go(cur-1);
  app.querySelector('.cf-nav.next').onclick = ()=>go(cur+1);
  sc.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft'){ e.preventDefault(); go(cur-1); }
    else if(e.key==='ArrowRight'){ e.preventDefault(); go(cur+1); }
    else if(e.key==='Enter'){ e.preventDefault(); location.hash = ids[cur]; } });
  sc.addEventListener('pointerdown', e=>{ if(e.pointerType!=='mouse') return; drag = {x:e.clientX, l:sc.scrollLeft}; moved = false; });
  addEventListener('pointermove', e=>{ if(!drag) return; const dx = e.clientX - drag.x; if(Math.abs(dx) > 6){ moved = true; sc.classList.add('dragging'); } if(moved) sc.scrollLeft = drag.l - dx; });
  addEventListener('pointerup', ()=>{ if(!drag) return; drag = null; if(moved){ sc.classList.remove('dragging'); layout(); go(cur); setTimeout(()=>{ moved = false; }, 0); } });
  const start = Math.max(0, ids.indexOf(lastId));
  sc.scrollLeft = centerOf(start); layout();
  return go;
}
function route(){
  runId++; modal.hidden = true; explainBox.hidden = true;
  const id = location.hash.slice(1), g = G[id];
  if(g){
    curId = id; lastId = id; markPlayed(id);
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
