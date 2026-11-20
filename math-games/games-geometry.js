/* ===================== 幾何 ===================== */

/* ---------- 七巧板 ---------- */
reg({id:'tangram', cat:'geo', title:'七巧板', emoji:'🧩',
  desc:'用七塊板子拼出指定的形狀，拖一拖、轉一轉！',
  explain:`<p>七巧板是中國古代發明的拼圖，把一個<b>正方形</b>切成 7 塊：</p>
  <ul><li>大三角形 2 塊、中三角形 1 塊、小三角形 2 塊</li><li>正方形 1 塊、平行四邊形 1 塊</li></ul>
  <p><b>它們的大小有祕密！</b>如果把最小的三角形當作 1 份：</p>
  <div class="ex">小三角形 ＝ 1 份<br>正方形 ＝ 中三角形 ＝ 平行四邊形 ＝ 2 份（都可以用 2 個小三角形拼出來）<br>大三角形 ＝ 4 份<br>全部合起來：1＋1＋2＋2＋2＋4＋4 ＝ <b>16 份</b></div>
  <p>所以正方形、中三角形、平行四邊形雖然<b>形狀不同，面積卻一樣大</b>；大三角形是整個七巧板的 <b>4 分之 1</b>。</p>
  <p>不管拼成房子、火箭還是三角形，用的都是同樣 7 塊，所以<b>面積都相同</b>——形狀變了，面積不變。</p>
  <p>💭 七塊板子的角只有三種：45 度、90 度、135 度，所以它們才能拼得這麼剛好。</p>`,
  mount(el){
    const opts = {lv:0};
    const ui = shell(el, `
      <p>用 7 塊板子把灰色的形狀<b>剛好填滿</b>，不能重疊、不能超出去。</p>
      <ul><li><b>拖</b>：按住板子移動。</li><li><b>點一下</b>：轉 45 度。</li>
      <li><b>翻面</b>：先點板子，再按「翻面」（平行四邊形常常需要）。</li>
      <li>板子靠近正確位置時會自動吸過去。</li></ul>`,
      [{key:'lv', label:'形狀', options:TANGRAM_LEVELS.map((l,i)=>[i,l.n])}], opts, newGame);
    const BASE=[[[0,0],[4,0],[2,2]],[[0,0],[4,0],[2,2]],[[0,0],[2,0],[0,2]],[[1,0],[2,1],[1,2],[0,1]],[[0,0],[2,0],[3,1],[1,1]],[[0,0],[2,0],[1,1]],[[0,0],[2,0],[1,1]]];
    const COL=['#e4572e','#2d7dd2','#3bb273','#ffc93c','#7d5ba6','#f39237','#e05297'];
    const HOME=[[2.7,10],[7.7,10],[11.6,10.3],[14.3,10.2],[3.2,13.6],[8,13.6],[12,13.6]];
    const VW=16, VH=15.5, S=14;
    let target, SV, pieces, hintLv, active, won, svg, drag, tMask;
    function area(p){ let s=0; for(let i=0;i<p.length;i++){ const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length]; s+=x1*y2-x2*y1; } return Math.abs(s)/2; }
    function verts(p){
      const b=BASE[p.i], cx=b.reduce((s,v)=>s+v[0],0)/b.length, cy=b.reduce((s,v)=>s+v[1],0)/b.length;
      const a=p.rot*Math.PI/4, c=Math.cos(a), s=Math.sin(a);
      return b.map(([x,y])=>{ let dx=x-cx, dy=y-cy; if(p.flip) dx=-dx; return [p.x+dx*c-dy*s, p.y+dx*s+dy*c]; });
    }
    function mask(polys){
      const c=document.createElement('canvas'); c.width=VW*S; c.height=VH*S; const x=c.getContext('2d');
      for(const p of polys){ x.beginPath(); p.forEach(([a,b],i)=>i?x.lineTo(a*S,b*S):x.moveTo(a*S,b*S)); x.closePath(); x.fill(); }
      return x.getImageData(0,0,c.width,c.height).data;
    }
    const pstr = p => p.map(v=>v[0].toFixed(3)+','+v[1].toFixed(3)).join(' ');
    function newGame(){
      runId++;
      const L=TANGRAM_LEVELS[opts.lv], k=L.a?1:Math.SQRT2;
      let polys=L.p.map(p=>p.map(([x,y])=>[x*k,-y*k]));
      const xs=polys.flat().map(v=>v[0]), ys=polys.flat().map(v=>v[1]);
      const ox=8-(Math.min(...xs)+Math.max(...xs))/2, oy=4.3-(Math.min(...ys)+Math.max(...ys))/2;
      target=polys.map(p=>p.map(([x,y])=>[x+ox,y+oy])); SV=target.flat(); tMask=mask(target);
      pieces=BASE.map((_,i)=>({i,rot:0,flip:false,x:HOME[i][0],y:HOME[i][1]}));
      hintLv=0; active=null; won=false; build();
    }
    function build(){
      ui.board.innerHTML = `<svg class="tan" viewBox="0 0 ${VW} ${VH}">
        <rect x=".3" y="8.4" width="15.4" height="6.8" rx=".6" fill="#f7efe1"/>
        ${target.map(p=>`<polygon points="${pstr(p)}" fill="#cfc4b4" stroke="#cfc4b4" stroke-width=".06"/>`).join('')}
        <g class="hint"></g>
        ${pieces.map((p,i)=>`<polygon class="tp" data-i="${i}" fill="${COL[i]}"/>`).join('')}</svg>
        <div class="actions"><button class="btn ghost flip">⇋ 翻面</button><button class="btn ghost hintb">💡 提示</button><button class="btn ghost back">全部放回去</button></div>`;
      svg = ui.board.querySelector('svg');
      pieces.forEach((_,i)=>setPts(i)); drawHint();
      svg.addEventListener('pointerdown', down); svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
      ui.setStatus('拖動板子，把灰色形狀填滿');
    }
    function setPts(i){ const e=svg.querySelector(`.tp[data-i="${i}"]`); e.setAttribute('points', pstr(verts(pieces[i]))); e.classList.toggle('act', active===i); }
    function drawHint(){
      const idx=target.map((p,i)=>i).sort((a,b)=>area(target[b])-area(target[a]));
      const show = hintLv===0 ? [] : hintLv===1 ? idx.slice(0,2) : idx;
      svg.querySelector('.hint').innerHTML = show.map(i=>`<polygon points="${pstr(target[i])}" fill="none" stroke="#fff" stroke-width=".1" stroke-dasharray=".3 .2"/>`).join('');
    }
    function pt(e){ const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
    function down(e){
      const t=e.target.closest('.tp'); if(!t || won) return; e.preventDefault();
      const i=+t.dataset.i, p=pt(e), old=active;
      drag={i, sx:p.x, sy:p.y, ox:pieces[i].x, oy:pieces[i].y, moved:false};
      active=i; svg.appendChild(t); try{ svg.setPointerCapture(e.pointerId); }catch(_){}
      if(old!==null) setPts(old); setPts(i);
    }
    function move(e){
      if(!drag) return; const p=pt(e), dx=p.x-drag.sx, dy=p.y-drag.sy;
      if(Math.hypot(dx,dy)>0.25) drag.moved=true;
      if(!drag.moved) return;
      const q=pieces[drag.i]; q.x=Math.max(0.5,Math.min(VW-0.5,drag.ox+dx)); q.y=Math.max(0.5,Math.min(VH-0.5,drag.oy+dy)); setPts(drag.i);
    }
    function snap(q){
      let best=0.5, sh=null;
      for(const v of verts(q)) for(const s of SV){ const d=Math.hypot(v[0]-s[0],v[1]-s[1]); if(d<best){ best=d; sh=[s[0]-v[0],s[1]-v[1]]; } }
      if(sh){ q.x+=sh[0]; q.y+=sh[1]; }
    }
    function up(){
      if(!drag) return; const q=pieces[drag.i];
      if(!drag.moved) q.rot=(q.rot+1)%8;
      snap(q); setPts(drag.i); drag=null; check();
    }
    function check(){
      const pm=mask(pieces.map(verts)); let t=0, cov=0, out=0;
      for(let k=3;k<tMask.length;k+=4){ const a=tMask[k]>127, b=pm[k]>127; if(a){ t++; if(b) cov++; } else if(b) out++; }
      ui.setStatus(`已經填滿 ${big(Math.round(cov/t*100))} %`);
      if(cov/t>0.97 && out/t<0.03){ won=true; showWin('🧩','拼好了！',`你拼出了「${TANGRAM_LEVELS[opts.lv].n}」！`, ()=>{ opts.lv=(opts.lv+1)%TANGRAM_LEVELS.length; ui.redrawSettings(); newGame(); }, '下一個形狀'); }
    }
    ui.board.addEventListener('click', e=>{
      if(e.target.closest('.flip')){ if(active===null) return; const q=pieces[active]; q.flip=!q.flip; snap(q); setPts(active); check(); }
      else if(e.target.closest('.hintb')){ hintLv=(hintLv+1)%3; drawHint(); }
      else if(e.target.closest('.back')){ pieces.forEach((p,i)=>{ p.x=HOME[i][0]; p.y=HOME[i][1]; p.rot=0; p.flip=false; setPts(i); }); check(); }
    });
    newGame();
  }});

/* ---------- 五連方 ---------- */
reg({id:'pento', cat:'geo', title:'五連方拼圖', emoji:'🟪',
  desc:'用 5 個正方形連成的積木，把長方形剛好拼滿。',
  explain:`<p>把 <b>5 個一樣大的正方形</b>邊對邊連在一起，可以連出幾種不同的形狀？答案是 <b>12 種</b>（轉一轉、翻過來一樣的算同一種）。它們長得像英文字母，所以叫 F、I、L、N、P、T、U、V、W、X、Y、Z。</p>
  <p><b>面積的祕密：</b>每一塊都是 5 個小方格。</p>
  <div class="ex">3 塊 → 15 格 ＝ 3 × 5 的長方形<br>4 塊 → 20 格 ＝ 4 × 5<br>6 塊 → 30 格 ＝ 5 × 6<br>12 塊全部 → 60 格 ＝ 6 × 10</div>
  <p>所以看到長方形有幾格，就知道要用幾塊：<b>格子數 ÷ 5</b>。</p>
  <p><b>周長不一樣！</b>雖然每塊面積都是 5 格，但周長不全相同：大部分是 12，只有 P 形是 10。<b>面積一樣，周長不一定一樣</b>。</p>
  <p>💭 小一點的家族：2 個正方形只有 1 種連法（骨牌），3 個有 2 種，4 個有 5 種（就是俄羅斯方塊！）。</p>`,
  mount(el){
    const opts = {lv:'3x5'};
    const ui = shell(el, `
      <p>把所有積木放進長方形，<b>剛好拼滿</b>。</p>
      <ul><li>先點一塊積木，再點棋盤上的格子放下去。</li><li>放之前可以按「旋轉」和「翻面」。</li>
      <li>點棋盤上的積木可以把它拿起來。</li></ul>`,
      [{key:'lv', label:'大小', options:[['3x5','3×5（3 塊）'],['4x5','4×5（4 塊）'],['5x5','5×5（5 塊）'],['5x6','5×6（6 塊）']]}], opts, newGame);
    const PEN={F:[[0,1],[0,2],[1,0],[1,1],[2,1]],I:[[0,0],[1,0],[2,0],[3,0],[4,0]],L:[[0,0],[1,0],[2,0],[3,0],[3,1]],N:[[0,1],[1,1],[2,0],[2,1],[3,0]],P:[[0,0],[0,1],[1,0],[1,1],[2,0]],T:[[0,0],[0,1],[0,2],[1,1],[2,1]],U:[[0,0],[0,2],[1,0],[1,1],[1,2]],V:[[0,0],[1,0],[2,0],[2,1],[2,2]],W:[[0,0],[1,0],[1,1],[2,1],[2,2]],X:[[0,1],[1,0],[1,1],[1,2],[2,1]],Y:[[0,1],[1,0],[1,1],[2,1],[3,1]],Z:[[0,0],[0,1],[1,1],[2,1],[2,2]]};
    const PC={F:'#e4572e',I:'#2d7dd2',L:'#3bb273',N:'#ffc93c',P:'#7d5ba6',T:'#f39237',U:'#e05297',V:'#17a2a2',W:'#8a5a32',X:'#c0392b',Y:'#5d6dbe',Z:'#7cb342'};
    const norm=c=>{ const mr=Math.min(...c.map(p=>p[0])), mc=Math.min(...c.map(p=>p[1])); return c.map(([r,q])=>[r-mr,q-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); };
    let R, C, set, board, ori, sel, msg;
    function newGame(){
      runId++; [R,C]=opts.lv.split('x').map(Number);
      const sets=PENTO_LEVELS[opts.lv]; set=sets[rand(sets.length)].split('');
      board=Array.from({length:R},()=>Array(C).fill(null)); ori={}; set.forEach(n=>ori[n]=norm(PEN[n])); sel=set[0]; msg=''; draw();
    }
    const placed=n=>board.some(row=>row.includes(n));
    function mini(n){ const c=ori[n], h=Math.max(...c.map(p=>p[0]))+1, w=Math.max(...c.map(p=>p[1]))+1;
      return `<svg viewBox="0 0 ${w*10} ${h*10}" style="width:${w*18}px;height:${h*18}px">${c.map(([r,q])=>`<rect x="${q*10+.5}" y="${r*10+.5}" width="9" height="9" rx="1.5" fill="${PC[n]}"/>`).join('')}</svg>`; }
    function draw(){
      const left=set.filter(n=>!placed(n));
      ui.board.innerHTML = `<div class="pento" style="grid-template-columns:repeat(${C},1fr);--n:${Math.max(R,C)}">${board.map((row,r)=>row.map((v,c)=>
          `<button data-r="${r}" data-c="${c}" style="${v?`background:${PC[v]};box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)`:''}"></button>`).join('')).join('')}</div>
        <div class="pento-tray">${left.map(n=>`<button class="${sel===n?'on':''}" data-n="${n}">${mini(n)}</button>`).join('')||'<span class="empty">積木都放上去了</span>'}</div>
        <div class="actions"><button class="btn ghost rot">⟳ 旋轉</button><button class="btn ghost flp">⇋ 翻面</button><button class="btn ghost clr">全部拿起來</button></div>
        <div class="msg">${msg}</div>`;
      ui.setStatus(`還有 ${big(left.length)} 塊積木`);
    }
    ui.board.addEventListener('click', e=>{
      const cb=e.target.closest('.pento button'), tb=e.target.closest('.pento-tray button'); msg='';
      if(tb) sel=tb.dataset.n;
      else if(e.target.closest('.rot')){ if(sel&&!placed(sel)) ori[sel]=norm(ori[sel].map(([r,q])=>[q,-r])); }
      else if(e.target.closest('.flp')){ if(sel&&!placed(sel)) ori[sel]=norm(ori[sel].map(([r,q])=>[r,-q])); }
      else if(e.target.closest('.clr')){ board.forEach(row=>row.fill(null)); sel=set[0]; }
      else if(cb){
        const r=+cb.dataset.r, c=+cb.dataset.c, v=board[r][c];
        if(v){ board.forEach(row=>row.forEach((x,i)=>{ if(x===v) row[i]=null; })); sel=v; }
        else if(!sel || placed(sel)) msg='先點一塊下面的積木！';
        else {
          let ok=false;
          for(const [ar,ac] of ori[sel]){
            const cs=ori[sel].map(([a,b])=>[r+a-ar,c+b-ac]);
            if(cs.every(([a,b])=>a>=0&&a<R&&b>=0&&b<C&&!board[a][b])){ cs.forEach(([a,b])=>board[a][b]=sel); ok=true; break; }
          }
          if(!ok){ const cs=ori[sel].map(([a,b])=>[r+a,c+b]);
            if(cs.every(([a,b])=>a>=0&&a<R&&b>=0&&b<C&&!board[a][b])){ cs.forEach(([a,b])=>board[a][b]=sel); ok=true; } }
          if(!ok) msg='這裡放不下，轉一轉或換個位置試試！';
          else sel=set.find(n=>!placed(n))||null;
        }
      } else return;
      draw();
      if(board.every(row=>row.every(Boolean))) showWin('🎉','拼滿了！',`${R} × ${C} ＝ ${R*C} 格，剛好是 ${set.length} 塊 × 5 格。`, newGame, '換一題');
    });
    newGame();
  }});

/* ---------- 一筆畫 ---------- */
reg({id:'euler', cat:'geo', title:'一筆畫', emoji:'✏️',
  desc:'筆不離開紙、每條線只畫一次，能把圖形畫完嗎？',
  explain:`<p>要判斷能不能一筆畫，只要<b>數一數每個點連出幾條線</b>：</p>
  <ul><li>連出雙數條線的點叫<b>偶點</b>，單數條線的叫<b>奇點</b>。</li></ul>
  <div class="ex">奇點有 <b>0 個</b>：可以一筆畫，從哪個點開始都行，最後會回到起點。<br>奇點有 <b>2 個</b>：可以一筆畫，但一定要從一個奇點出發，在另一個奇點結束。<br>奇點有 <b>4 個以上</b>：畫不出來！</div>
  <p><b>為什麼？</b>畫的時候經過一個點，一定是「走進來、再走出去」，會用掉 2 條線。所以中間經過的點，線的數量一定是雙數。只有<b>起點</b>（多一條走出去）和<b>終點</b>（多一條走進來）可以是單數。</p>
  <p>這是數學家<b>歐拉</b>在 1736 年解決「七橋問題」時發現的：柯尼斯堡城有 7 座橋，人們想知道能不能每座橋剛好走一次。歐拉把陸地變成點、橋變成線，發現 4 個點全是奇點——所以不可能！</p>
  <p>💭 按遊戲裡的「顯示線數」，就能看到每個點連出幾條線。</p>`,
  mount(el){
    const pent=Array.from({length:5},(_,i)=>[50+42*Math.sin(i*2*Math.PI/5), 52-42*Math.cos(i*2*Math.PI/5)]);
    const sq=[[20,20],[80,20],[80,80],[20,80]], grid=[]; for(let r=0;r<3;r++) for(let c=0;c<3;c++) grid.push([15+35*c,15+35*r]);
    const LV=[
      {pts:sq, e:[[0,1],[1,2],[2,3],[3,0],[0,2]]},
      {pts:[[15,20],[15,80],[50,50],[85,20],[85,80]], e:[[0,1],[1,2],[2,0],[2,3],[3,4],[4,2]]},
      {pts:[[25,10],[75,10],[25,50],[75,50],[25,90],[75,90]], e:[[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,5]]},
      {pts:[[20,90],[80,90],[80,45],[20,45],[50,12]], e:[[0,1],[1,2],[2,3],[3,0],[0,2],[1,3],[3,4],[2,4]]},
      {pts:sq, e:[[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]]},
      {pts:pent, e:[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[2,4],[4,1],[1,3],[3,0]]},
      {pts:grid, e:[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8]]},
    ];
    const opts = {lv:0};
    const ui = shell(el, `
      <p>用<b>一筆</b>把圖形的每一條線都畫到。</p>
      <ul><li>點一個點當起點，再點旁邊連著的點，就會畫出一條線。</li>
      <li>每條線<b>只能畫一次</b>，點可以重複經過。</li>
      <li>有些圖形其實畫不出來！覺得不可能就按「畫不出來」。</li></ul>`,
      [{key:'lv', label:'關卡', options:LV.map((_,i)=>[i,`第 ${i+1} 關`])}], opts, newGame);
    let L, path, used, msg, showDeg;
    function newGame(){ runId++; L=LV[opts.lv]; path=[]; used=[]; msg=''; showDeg=false; draw(); }
    const deg=i=>L.e.filter(e=>e.includes(i)).length;
    const possible=()=>{ const o=L.pts.filter((_,i)=>deg(i)%2).length; return o===0||o===2; };
    function draw(){
      const cur=path[path.length-1];
      ui.board.innerHTML = `<svg class="eul" viewBox="0 0 100 100">
        ${L.e.map(([a,b],i)=>`<line x1="${L.pts[a][0]}" y1="${L.pts[a][1]}" x2="${L.pts[b][0]}" y2="${L.pts[b][1]}" stroke="${used.includes(i)?'#f39237':'#d8cbb5'}" stroke-width="${used.includes(i)?3.2:2.2}" stroke-linecap="round"/>`).join('')}
        ${L.pts.map(([x,y],i)=>`<g data-i="${i}"><circle cx="${x}" cy="${y}" r="10" fill="transparent"/><circle cx="${x}" cy="${y}" r="5" fill="${i===cur?'#ffc93c':'#3b2f2a'}" stroke="#fff" stroke-width="1.2"/>
          ${showDeg?`<text x="${x}" y="${y+1.8}" text-anchor="middle" font-size="5.5" font-weight="900" fill="${i===cur?'#3b2f2a':'#fff'}">${deg(i)}</text>`:''}</g>`).join('')}</svg>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${path.length?'':'disabled'}>↩ 上一步</button><button class="btn ghost degb">💡 ${showDeg?'隱藏':'顯示'}線數</button>
          <button class="btn nope" style="background:var(--red);box-shadow:0 4px 0 #a83a1a">🙅 畫不出來</button></div>`;
      ui.setStatus(path.length ? `畫了 ${big(used.length)} / ${L.e.length} 條線` : '點一個點當起點');
    }
    ui.board.addEventListener('click', e=>{
      const g=e.target.closest('g[data-i]'); msg='';
      if(g){
        const v=+g.dataset.i;
        if(!path.length) path=[v];
        else { const cur=path[path.length-1];
          const idx=L.e.findIndex(([a,b],i)=>!used.includes(i)&&((a===cur&&b===v)||(a===v&&b===cur)));
          if(idx>=0){ used.push(idx); path.push(v); }
          else if(v!==cur) msg = L.e.some(([a,b])=>(a===cur&&b===v)||(a===v&&b===cur)) ? '這條線已經畫過了！' : '這兩個點之間沒有線喔！'; }
      }
      else if(e.target.closest('.undo')){ path.pop(); if(path.length) used.pop(); else used=[]; }
      else if(e.target.closest('.degb')) showDeg=!showDeg;
      else if(e.target.closest('.nope')){
        if(!possible()){ showWin('🙅','答對了！','這個圖形真的<b>畫不出來</b>。<br>為什麼呢？看看數學講解！', next, '下一關'); return; }
        msg='其實畫得出來喔！換個起點試試看？';
      } else return;
      draw();
      if(used.length===L.e.length) showWin('✏️','一筆畫完成！','每條線都剛好畫了一次！', next, '下一關');
    });
    function next(){ opts.lv=(opts.lv+1)%LV.length; ui.redrawSettings(); newGame(); }
    newGame();
  }});

/* ---------- 釘板 ---------- */
reg({id:'geo', cat:'geo', title:'釘板圍面積', emoji:'📍',
  desc:'在釘板上用橡皮筋圍出指定面積的圖形。',
  explain:`<p>釘板上相鄰兩根釘子的距離是 1 公分，所以每一小格是 <b>1 平方公分</b>。</p>
  <p><b>方法一：數格子。</b>完整的格子算 1，斜線切一半的算半格，兩個半格合成 1 格。</p>
  <p><b>方法二：三角形是長方形的一半。</b></p>
  <div class="ex">底 4、高 3 的三角形：<br>先想一個 4 × 3 ＝ 12 的長方形，三角形剛好是一半，所以是 <b>6</b> 平方公分。</div>
  <p><b>方法三：大的減掉小的。</b>先用一個大長方形把圖形框住，再把多出來的角落減掉。</p>
  <p><b>高年級的祕密武器——皮克公式：</b></p>
  <div class="ex">面積 ＝ 裡面的釘子數 ＋ 邊上的釘子數 ÷ 2 － 1</div>
  <p>例如 2 × 2 的正方形：裡面 1 根、邊上 8 根，1 ＋ 8 ÷ 2 － 1 ＝ <b>4</b> ✔　只要數釘子就能算面積，很神奇吧！</p>
  <p>💭 面積一樣的圖形可以長得很不一樣——試試看「面積 4」你能圍出幾種？</p>`,
  mount(el){
    const CH=[{t:'四邊形',v:4,a:4},{t:'三角形',v:3,a:2},{t:'三角形',v:3,a:6},{t:'四邊形',v:4,a:3},{t:'三角形',v:3,a:4.5},{t:'五邊形',v:5,a:5},{t:'六邊形',v:6,a:8},{t:'三角形',v:3,a:0.5}];
    const opts = {mode:'ch'};
    const ui = shell(el, `
      <p>在釘板上圍出圖形，每一小格是 <b>1 平方公分</b>。</p>
      <ul><li>一根一根點釘子，橡皮筋會跟著拉過去。</li><li><b>點回第一根釘子</b>就圍起來了。</li>
      <li>挑戰模式：圍出題目要的形狀和面積。</li></ul>`,
      [{key:'mode', label:'模式', options:[['ch','挑戰'],['free','自由圍']]}], opts, newGame);
    let pts, closed, lvl, msg;
    function newGame(){ runId++; lvl=0; clear(); }
    function clear(){ pts=[]; closed=false; msg=''; draw(); }
    const areaOf=p=>{ let s=0; for(let i=0;i<p.length;i++){ const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length]; s+=x1*y2-x2*y1; } return Math.abs(s)/2; };
    function corners(p){ return p.filter((b,i)=>{ const a=p[(i+p.length-1)%p.length], c=p[(i+1)%p.length]; return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])!==0; }); }
    function crossed(p){
      const o=(a,b,c)=>Math.sign((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])), n=p.length;
      for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
        if(j===i+1 || (i===0&&j===n-1)) continue;
        const a=p[i],b=p[(i+1)%n],c=p[j],d=p[(j+1)%n];
        if(o(a,b,c)!==o(a,b,d) && o(c,d,a)!==o(c,d,b)) return true;
      }
      return false;
    }
    function draw(){
      const P=([c,r])=>[5+10*c,5+10*r], s=pts.map(P).map(p=>p.join(',')).join(' ');
      const q=CH[lvl];
      ui.board.innerHTML = `${opts.mode==='ch'?`<div class="g-range">第 ${lvl+1} 題：圍出面積 <b>${q.a}</b> 平方公分的<b>${q.t}</b></div>`:''}
        <svg class="geo" viewBox="0 0 60 60">
        ${Array.from({length:6},(_,i)=>`<line x1="5" y1="${5+10*i}" x2="55" y2="${5+10*i}" stroke="#eadfcb" stroke-width=".3"/><line y1="5" x1="${5+10*i}" y2="55" x2="${5+10*i}" stroke="#eadfcb" stroke-width=".3"/>`).join('')}
        ${closed?`<polygon points="${s}" fill="rgba(243,146,55,.35)" stroke="#f39237" stroke-width="1.2" stroke-linejoin="round"/>`:`<polyline points="${s}" fill="none" stroke="#f39237" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>`}
        ${Array.from({length:36},(_,i)=>{ const c=i%6, r=Math.floor(i/6), [x,y]=P([c,r]), on=pts.some(p=>p[0]===c&&p[1]===r), first=pts.length&&pts[0][0]===c&&pts[0][1]===r;
          return `<g data-c="${c}" data-r="${r}"><circle cx="${x}" cy="${y}" r="4.8" fill="transparent"/><circle cx="${x}" cy="${y}" r="${on?1.8:1.2}" fill="${first&&!closed?'#e4572e':on?'#f39237':'#8a7a6c'}"/></g>`; }).join('')}</svg>
        <div class="msg" style="color:var(--ink)">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${pts.length&&!closed?'':'disabled'}>↩ 上一根</button><button class="btn ghost clr">清除</button></div>`;
      ui.setStatus(closed ? `面積 ${big(areaOf(pts))} 平方公分` : pts.length>=3 ? '點回紅色的第一根釘子就圍起來' : '點釘子開始圍');
    }
    ui.board.addEventListener('click', e=>{
      const g=e.target.closest('g[data-c]');
      if(g){
        const c=+g.dataset.c, r=+g.dataset.r;
        if(closed){ pts=[[c,r]]; closed=false; msg=''; }
        else if(pts.length>=3 && pts[0][0]===c && pts[0][1]===r){
          closed=true; const a=areaOf(pts), k=corners(pts).length;
          if(crossed(pts) || a===0){ msg='橡皮筋打結了，清除再圍一次吧！'; }
          else if(opts.mode==='free') msg=`這個圖形有 ${k} 個角，面積是 ${a} 平方公分。`;
          else { const q=CH[lvl];
            if(k!==q.v) msg=`這是有 ${k} 個角的圖形，題目要的是${q.t}喔！`;
            else if(a!==q.a) msg=`面積是 ${a}，題目要 ${q.a}。再調整看看！`;
            else { draw(); if(lvl===CH.length-1) showWin('🏆','全部過關！','8 個挑戰都完成了！', newGame);
              else showWin('🎉','答對了！',`面積剛好是 ${q.a} 平方公分。`, ()=>{ lvl++; clear(); }, '下一題'); return; } }
        }
        else if(pts.some(p=>p[0]===c&&p[1]===r)) msg='這根釘子用過了。要圍起來請點紅色的第一根。';
        else { pts.push([c,r]); msg=''; }
      }
      else if(e.target.closest('.undo')) pts.pop();
      else if(e.target.closest('.clr')){ clear(); return; }
      else return;
      draw();
    });
    newGame();
  }});

/* ---------- 對稱鏡子 ---------- */
reg({id:'mirror', cat:'geo', title:'對稱鏡子', emoji:'🪞',
  desc:'照著鏡子線，把另一半的圖案塗出來。',
  explain:`<p>沿著一條線對摺，兩邊能<b>完全重疊</b>的圖形叫做<b>線對稱圖形</b>，那條線就是<b>對稱軸</b>（像一面鏡子）。</p>
  <p><b>找對稱點的方法：數格子！</b></p>
  <div class="ex">一個格子離鏡子線 <b>2 格</b>，<br>它的對稱格子就在鏡子另一邊，也離鏡子線 <b>2 格</b>，而且在同一排上。</div>
  <p>所以越靠近鏡子的格子，對稱後也越靠近鏡子；最外面的，對稱後還是在最外面。左右鏡子會讓圖案<b>左右相反</b>，但上下不變。</p>
  <p>生活裡到處都有對稱：蝴蝶、樹葉、臉、國字「田、中、木、日」，還有很多國旗和標誌。</p>
  <p>💭 找找看：哪些國字是左右對稱？哪些是上下對稱？哪些兩種都是？（提示：「田」和「十」）</p>`,
  mount(el){
    const opts = {axis:'v', n:6};
    const ui = shell(el, `
      <p>中間的虛線是一面<b>鏡子</b>。</p>
      <ul><li>一邊已經有圖案了，請在另一邊塗出<b>鏡子裡看到的樣子</b>。</li>
      <li>點格子塗色，再點一次擦掉。</li><li>兩邊完全對稱就過關！</li></ul>`,
      [{key:'axis', label:'鏡子', options:[['v','左右'],['h','上下']]},{key:'n', label:'大小', options:[[6,'6 × 6'],[8,'8 × 8']]}], opts, newGame);
    let N, g, msg;
    const src=(r,c)=>opts.axis==='v' ? c<N/2 : r<N/2;
    const mir=(r,c)=>opts.axis==='v' ? [r,N-1-c] : [N-1-r,c];
    function newGame(){
      runId++; N=opts.n; msg='';
      do { g=Array.from({length:N},(_,r)=>Array.from({length:N},(_,c)=>src(r,c)&&Math.random()<0.42)); } while(g.flat().filter(Boolean).length<N);
      draw();
    }
    function draw(){
      ui.board.innerHTML = `<div class="mirror ${opts.axis}" style="grid-template-columns:repeat(${N},1fr)">${g.map((row,r)=>row.map((v,c)=>
        `<button data-r="${r}" data-c="${c}" class="${src(r,c)?'src':''} ${v?'on':''}"></button>`).join('')).join('')}<i></i></div><div class="msg">${msg}</div>`;
      let need=0, ok=0; for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(src(r,c)&&g[r][c]){ need++; const [a,b]=mir(r,c); if(g[a][b]) ok++; }
      ui.setStatus(`對稱的格子 ${big(ok)} / ${need}`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.mirror button'); if(!b) return; const r=+b.dataset.r, c=+b.dataset.c;
      if(src(r,c)){ msg='這一邊是題目，請塗另外一邊喔！'; draw(); return; }
      g[r][c]=!g[r][c]; msg=''; draw();
      let win=true; for(let a=0;a<N;a++) for(let d=0;d<N;d++) if(src(a,d)){ const [x,y]=mir(a,d); if(g[x][y]!==g[a][d]) win=false; }
      if(win) showWin('🪞','完全對稱！','兩邊對摺會剛好重疊在一起。', newGame, '下一題');
    });
    newGame();
  }});

/* ---------- 正方體展開圖 ---------- */
function foldNet(cells){
  const key=p=>p[0]+','+p[1], has=new Set(cells.map(key)), face={};
  const q=[[cells[0],{b:0,t:1,n:2,s:3,e:4,w:5}]]; face[key(cells[0])]=0;
  const mv=[[0,1,o=>({b:o.e,e:o.t,t:o.w,w:o.b,n:o.n,s:o.s})],[0,-1,o=>({b:o.w,w:o.t,t:o.e,e:o.b,n:o.n,s:o.s})],
            [1,0,o=>({b:o.s,s:o.t,t:o.n,n:o.b,e:o.e,w:o.w})],[-1,0,o=>({b:o.n,n:o.t,t:o.s,s:o.b,e:o.e,w:o.w})]];
  while(q.length){ const [[r,c],o]=q.shift();
    for(const [dr,dc,f] of mv){ const k=(r+dr)+','+(c+dc); if(has.has(k) && !(k in face)){ const no=f(o); face[k]=no.b; q.push([[r+dr,c+dc],no]); } } }
  return face;
}
reg({id:'net', cat:'geo', title:'正方體展開圖', emoji:'📦',
  desc:'這 6 個正方形摺起來，能不能變成一個正方體？',
  explain:`<p>正方體有 6 個面，把它剪開攤平就是<b>展開圖</b>。6 個正方形連在一起的形狀有 35 種，但只有 <b>11 種</b>可以摺成正方體！</p>
  <p><b>11 種展開圖可以分成四家人：</b></p>
  <div class="ex"><b>一四一型（6 種）</b>：中間一排 4 個，上面 1 個、下面 1 個（上下各放哪裡都可以）。<br><b>二三一型（3 種）</b>：三排分別是 2 個、3 個、1 個。<br><b>二二二型（1 種）</b>：像樓梯。<br><b>三三型（1 種）</b>：兩排 3 個錯開。</div>
  <p><b>一看就知道不行的：</b></p>
  <ul><li>有 <b>「田」字</b>（4 個擠成 2×2）：摺起來一定有面重疊。</li>
  <li>有 <b>「凹」字</b>：一樣會重疊。</li><li>一排有 5 個或 6 個：太長了，繞一圈會疊在一起。</li></ul>
  <p><b>找對面的方法：</b>在同一直線上「隔一格」的兩個面，摺起來會是<b>相對的面</b>（遊戲裡同顏色的就是對面）。對面永遠不會相鄰！</p>
  <p>💭 骰子相對兩面的點數加起來都是 7，你能在展開圖上填出骰子的點數嗎？</p>`,
  mount(el){
    const ui = shell(el, `
      <p>想像把這張紙沿著線摺起來。</p>
      <ul><li>如果可以摺成一個<b>完整的正方體</b>（6 個面都有、沒有重疊），按「可以」。</li>
      <li>如果會有面重疊，按「不行」。</li><li>答完會用顏色告訴你哪些面是<b>相對的面</b>。</li></ul>`, [], {}, newGame);
    const QN=10; let cells, face, isNet, ans, qi, score;
    function gen(){
      const want=Math.random()<0.5;
      for(;;){
        const c=[[0,0]];
        while(c.length<6){ const [r,q]=c[rand(c.length)], [dr,dc]=[[0,1],[0,-1],[1,0],[-1,0]][rand(4)]; if(!c.some(p=>p[0]===r+dr&&p[1]===q+dc)) c.push([r+dr,q+dc]); }
        const mr=Math.min(...c.map(p=>p[0])), mc=Math.min(...c.map(p=>p[1])); const n=c.map(([r,q])=>[r-mr,q-mc]);
        const f=foldNet(n), ok=new Set(Object.values(f)).size===6;
        if(ok===want){ cells=n; face=f; isNet=ok; return; }
      }
    }
    function newGame(){ runId++; qi=0; score=0; nextQ(); }
    function nextQ(){ gen(); ans=null; draw(); }
    function draw(){
      const R=Math.max(...cells.map(p=>p[0]))+1, C=Math.max(...cells.map(p=>p[1]))+1, pc=['#ffc93c','#2d7dd2','#3bb273'];
      const cnt={}; Object.values(face).forEach(f=>cnt[f]=(cnt[f]||0)+1);
      ui.board.innerHTML = `<div class="net" style="grid-template-columns:repeat(${C},var(--s));grid-template-rows:repeat(${R},var(--s))">${cells.map(([r,c])=>{
          const f=face[r+','+c]; let st='', tx='';
          if(ans!==null){ if(isNet) st=`background:${pc[Math.floor(f/2)]}`; else if(cnt[f]>1){ st='background:#e4572e;color:#fff'; tx='✖'; } }
          return `<div style="grid-row:${r+1};grid-column:${c+1};${st}">${tx}</div>`; }).join('')}</div>
        <div class="msg" style="color:${ans===isNet?'var(--green)':'var(--red)'}">${ans===null?'':(ans===isNet?'⭕ 答對了！':'❌ 答錯了！')+(isNet?'可以摺成正方體，同顏色的是相對的面。':'不行，打 ✖ 的面摺起來會重疊。')}</div>
        <div class="actions">${ans===null?`<button class="btn big green yes">⭕ 可以</button><button class="btn big no" style="background:var(--red);box-shadow:0 4px 0 #a83a1a">❌ 不行</button>`:`<button class="btn big nx">${qi+1<QN?'下一題':'看成績'}</button>`}</div>`;
      ui.setStatus(`第 ${big(qi+1)} / ${QN} 題　｜　答對 ${score}`);
    }
    ui.board.addEventListener('click', e=>{
      if(ans===null && (e.target.closest('.yes')||e.target.closest('.no'))){ ans=!!e.target.closest('.yes'); if(ans===isNet) score++; draw(); }
      else if(e.target.closest('.nx')){ qi++; if(qi>=QN) showWin(score>=8?'🏆':'📦','完成 10 題！',`你答對了 <b>${score}</b> 題。`, newGame); else nextQ(); }
    });
    newGame();
  }});

/* ---------- 數積木 ---------- */
reg({id:'cubes', cat:'geo', title:'數積木', emoji:'🧊',
  desc:'這堆積木一共有幾個？小心，有些躲在後面看不到！',
  explain:`<p>積木堆在一起，有些會被擋住<b>看不見</b>，但它們還是在那裡——因為上面的積木不能浮在空中，下面一定有東西撐著。</p>
  <p><b>方法一：一疊一疊數。</b>從上面往下看，每個位置有一疊積木，數出每一疊有幾個，再全部加起來。</p>
  <div class="ex">例如從上面看是：<br>3　2　1<br>2　1　1<br>1　1　0<br>3＋2＋1＋2＋1＋1＋1＋1 ＝ <b>12</b> 個</div>
  <p><b>方法二：一層一層數。</b>先數最下面那層有幾個，再數第二層、第三層…最後加起來。上面例子：第一層 8 個、第二層 3 個、第三層 1 個，8＋3＋1 ＝ 12。</p>
  <p>兩種方法答案一樣，可以互相<b>驗算</b>！</p>
  <p>💭 數的時候最容易漏掉的，就是<b>高的積木後面和下面</b>那些看不到的。答完題目後，看看「從上面看」的數字圖來對答案吧。</p>`,
  mount(el){
    const opts = {n:3};
    const ui = shell(el, `
      <p>數數看，這堆積木<b>一共有幾個</b>？</p>
      <ul><li>積木都是整齊疊好的，<b>不會浮在空中</b>。</li><li>被擋住看不到的積木也要算！</li>
      <li>答完會顯示「從上面看」每一疊有幾個。</li></ul>`,
      [{key:'n', label:'大小', options:[[2,'小'],[3,'中'],[4,'大']]}], opts, newGame);
    let h, total, choices, ans, score, qn;
    function newGame(){ runId++; score=0; qn=0; nextQ(); }
    function nextQ(){
      const n=opts.n;
      do { h=Array.from({length:n},()=>Array(n).fill(0));
        for(let r=0;r<n;r++) for(let c=0;c<n;c++){ const lim=Math.min(r?h[r-1][c]:n, c?h[r][c-1]:n); h[r][c]=Math.max(0, lim-(Math.random()<0.55?0:1+rand(2))); }
        total=h.flat().reduce((a,b)=>a+b,0);
      } while(total<n+2 || total===n*n*n);
      const set=new Set([total]); while(set.size<4){ const v=total+rand(7)-3; if(v>0) set.add(v); }
      choices=shuffle([...set]); ans=null; qn++; draw();
    }
    function iso(){
      const n=opts.n, a=30, b=15, H=34, W=2*a*n+20, HT=2*b*n+H*n+20, ox=W/2, oy=H*n+10; let s='';
      for(let r=0;r<n;r++) for(let c=0;c<n;c++) for(let z=0;z<h[r][c];z++){
        const x=ox+(c-r)*a, y=oy+(c+r)*b-(z+1)*H;
        s+=`<polygon points="${x},${y} ${x+a},${y+b} ${x},${y+2*b} ${x-a},${y+b}" fill="#ffe08a"/>
            <polygon points="${x-a},${y+b} ${x},${y+2*b} ${x},${y+2*b+H} ${x-a},${y+b+H}" fill="#f5b83d"/>
            <polygon points="${x+a},${y+b} ${x},${y+2*b} ${x},${y+2*b+H} ${x+a},${y+b+H}" fill="#d9952a"/>`;
      }
      return `<svg class="iso" viewBox="0 0 ${W} ${HT}" stroke="#7a5417" stroke-width="1.5" stroke-linejoin="round">${s}</svg>`;
    }
    function draw(){
      ui.board.innerHTML = `<div class="cube-row">${iso()}${ans===null?'':`<div class="topview"><b>從上面看</b><div style="grid-template-columns:repeat(${opts.n},1fr)">${h.flat().map(v=>`<span class="${v?'':'z'}">${v}</span>`).join('')}</div></div>`}</div>
        <div class="msg" style="color:${ans===total?'var(--green)':'var(--red)'}">${ans===null?'':ans===total?`⭕ 答對了！一共 ${total} 個。`:`❌ 是 ${total} 個喔！把每一疊加起來看看。`}</div>
        <div class="actions">${ans===null?choices.map(v=>`<button class="btn big ch" data-v="${v}">${v} 個</button>`).join(''):`<button class="btn big nx">下一題</button>`}</div>`;
      ui.setStatus(`第 ${big(qn)} 題　｜　答對 ${score}`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.ch');
      if(b && ans===null){ ans=+b.dataset.v; if(ans===total) score++; draw(); }
      else if(e.target.closest('.nx')) nextQ();
    });
    newGame();
  }});

/* ---------- 地圖著色 ---------- */
reg({id:'mapcolor', cat:'geo', title:'地圖著色', emoji:'🗺️',
  desc:'幫地圖塗顏色，相鄰的區域不能同色，最少要幾種顏色？',
  explain:`<p>畫地圖的時候，<b>相鄰的兩個區域要用不同顏色</b>才分得清楚。那最少需要準備幾種顏色呢？</p>
  <p>1852 年，一位英國學生古德里在塗英國地圖時發現：好像<b>不管地圖多複雜，4 種顏色一定夠</b>！</p>
  <p>這個「<b>四色猜想</b>」聽起來很簡單，卻讓數學家傷腦筋了一百多年。直到 1976 年，兩位數學家才用<b>電腦</b>檢查了將近兩千種情況，把它證明出來——這是史上第一個靠電腦幫忙證明的大定理，從此叫做<b>四色定理</b>。</p>
  <div class="ex">注意：只有一個「點」碰在一起的區域不算相鄰，可以同色。<br>要有一段「邊」貼在一起才算相鄰。</div>
  <p><b>塗色小祕訣：</b></p>
  <ul><li>先塗<b>鄰居最多</b>的區域，它最難安排。</li><li>顏色盡量<b>重複使用</b>：不相鄰的區域就用同一色。</li>
  <li>如果有 3 個區域兩兩相鄰，至少要 3 色；如果有一塊被「奇數個」鄰居圍一圈，就一定要 4 色。</li></ul>`,
  mount(el){
    const opts = {k:7};
    const ui = shell(el, `
      <p>幫地圖的每一個區域塗上顏色。</p>
      <ul><li><b>相鄰的區域（有一段邊貼在一起）不能同色。</b></li><li>先選顏色，再點區域。</li>
      <li>挑戰用<b>最少的顏色</b>塗完！</li></ul>`,
      [{key:'k', label:'區域', options:[[5,'5 塊'],[7,'7 塊'],[10,'10 塊'],[13,'13 塊']]}], opts, newGame);
    const W=9, H=6, PAL=['#e4572e','#2d7dd2','#3bb273','#ffc93c'];
    let reg_, adj, col, sel, minC, K, warned;
    function gen(){
      for(;;){
        K=opts.k; const seeds=shuffle(Array.from({length:W*H},(_,i)=>i)).slice(0,K).map(i=>[Math.floor(i/W),i%W]);
        reg_=Array.from({length:H},(_,r)=>Array.from({length:W},(_,c)=>{ let b=0,bd=1e9; seeds.forEach(([sr,sc],i)=>{ const d=(sr-r)**2+(sc-c)**2+i*0.01; if(d<bd){bd=d;b=i;} }); return b; }));
        let ok=true;
        for(let i=0;i<K&&ok;i++){ const cells=[]; reg_.forEach((row,r)=>row.forEach((v,c)=>{ if(v===i) cells.push([r,c]); }));
          const seen=new Set([cells[0].join()]), st=[cells[0]];
          while(st.length){ const [r,c]=st.pop(); for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){ const a=r+dr,b=c+dc; if(a>=0&&a<H&&b>=0&&b<W&&reg_[a][b]===i&&!seen.has(a+','+b)){ seen.add(a+','+b); st.push([a,b]); } } }
          if(seen.size!==cells.length) ok=false; }
        if(!ok) continue;
        adj=Array.from({length:K},()=>new Set());
        for(let r=0;r<H;r++) for(let c=0;c<W;c++){ if(c+1<W&&reg_[r][c]!==reg_[r][c+1]){ adj[reg_[r][c]].add(reg_[r][c+1]); adj[reg_[r][c+1]].add(reg_[r][c]); }
          if(r+1<H&&reg_[r][c]!==reg_[r+1][c]){ adj[reg_[r][c]].add(reg_[r+1][c]); adj[reg_[r+1][c]].add(reg_[r][c]); } }
        minC=0;
        for(let k=1;k<=4&&!minC;k++){ const a=Array(K).fill(-1);
          const bt=i=>{ if(i===K) return true; for(let x=0;x<k;x++){ if([...adj[i]].every(j=>a[j]!==x)){ a[i]=x; if(bt(i+1)) return true; a[i]=-1; } } return false; };
          if(bt(0)) minC=k; }
        if(minC>=3) return;
      }
    }
    function newGame(){ runId++; gen(); col=Array(K).fill(null); sel=0; warned=false; draw(); }
    function draw(){
      let s='', lines='';
      for(let r=0;r<H;r++) for(let c=0;c<W;c++){ const i=reg_[r][c], f=col[i]===null?'#f3e9d8':PAL[col[i]];
        s+=`<rect data-i="${i}" x="${c*10}" y="${r*10}" width="10.1" height="10.1" fill="${f}"/>`;
        for(const [dr,dc,x1,y1,x2,y2] of [[0,1,c*10+10,r*10,c*10+10,r*10+10],[1,0,c*10,r*10+10,c*10+10,r*10+10]]){
          const a=r+dr,b=c+dc; if(a<H&&b<W&&reg_[a][b]!==i){ const j=reg_[a][b], bad=col[i]!==null&&col[i]===col[j];
            lines+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bad?'#000':'#3b2f2a'}" stroke-width="${bad?2.2:0.8}" ${bad?'stroke-dasharray="1.5 1"':''} stroke-linecap="round"/>`; } } }
      const usedC=new Set(col.filter(v=>v!==null)).size;
      ui.board.innerHTML = `<svg class="map" viewBox="-1 -1 ${W*10+2} ${H*10+2}">${s}${lines}<rect x="0" y="0" width="${W*10}" height="${H*10}" fill="none" stroke="#3b2f2a" stroke-width="1.2" pointer-events="none"/></svg>
        <div class="palette">${PAL.map((p,i)=>`<button data-p="${i}" class="${sel===i?'on':''}" style="background:${p}"></button>`).join('')}<button data-p="-1" class="era ${sel===-1?'on':''}">🧽</button></div>
        <div class="msg">${conflicts()?'⚠ 粗虛線兩邊的區域同色了！':''}</div>`;
      ui.setStatus(`已用 ${big(usedC)} 種顏色　｜　目標 ${minC} 種`);
    }
    const conflicts=()=>adj.some((s,i)=>col[i]!==null&&[...s].some(j=>col[j]===col[i]));
    ui.board.addEventListener('click', e=>{
      const p=e.target.closest('[data-p]'), r=e.target.closest('rect[data-i]');
      if(p) sel=+p.dataset.p; else if(r) col[+r.dataset.i]= sel<0?null:sel; else return;
      draw();
      if(col.every(v=>v!==null) && !conflicts()){
        const u=new Set(col).size;
        if(u<=minC) showWin('🏆','完美著色！',`只用了 <b>${u}</b> 種顏色，這是最少的了！`, newGame, '換一張地圖');
        else if(!warned){ warned=true; showWin('🎨','塗好了！',`你用了 <b>${u}</b> 種顏色，其實 <b>${minC}</b> 種就夠了！<br>要不要改改看？`, ()=>{}, '繼續挑戰'); }
      }
    });
    newGame();
  }});

/* ---------- 撞球檯 ---------- */
reg({id:'billiard', cat:'geo', title:'神奇撞球檯', emoji:'🎱',
  desc:'球從角落斜斜打出去，一直反彈…最後會掉進哪個洞？',
  explain:`<p>球每走 1 格，就同時<b>往右（或左）1 格、往上（或下）1 格</b>。它碰到左右邊會左右反彈，碰到上下邊會上下反彈。</p>
  <p><b>球一共走幾格？</b>要掉進角落，左右方向要剛好走完「長」的整數趟，上下方向也要剛好走完「寬」的整數趟。所以走的格數是<b>長和寬的最小公倍數</b>！</p>
  <div class="ex">長 6、寬 4 的球檯：6 和 4 的最小公倍數是 12，球走 12 格進洞。<br>左右走了 12 ÷ 6 ＝ <b>2 趟</b>（去、回 → 回到左邊）<br>上下走了 12 ÷ 4 ＝ <b>3 趟</b>（上、下、上 → 停在上面）<br>所以掉進<b>左上角</b>！</div>
  <p><b>快速判斷：</b>先把長和寬一起約分到不能再約（例如 6 和 4 → 3 和 2）：</p>
  <ul><li>長單數、寬單數 → <b>右上</b>（對角）</li><li>長雙數、寬單數 → <b>右下</b></li><li>長單數、寬雙數 → <b>左上</b></li></ul>
  <p>球<b>永遠不會回到出發的洞</b>，也一定會進洞，不會永遠彈下去！</p>
  <p>💭 中年級可以先當成找規律的遊戲：長寬一樣（正方形）會怎樣？長是寬的 2 倍呢？</p>`,
  mount(el){
    const opts = {m:4, n:3};
    const ui = shell(el, `
      <p>球從<b>左下角</b>出發，沿著格子的對角線斜斜前進，碰到邊就反彈。</p>
      <ul><li>先猜猜看：球最後會掉進<b>哪一個角落的洞</b>？點那個洞！</li>
      <li>然後看球跑一次，驗證你的猜測。</li><li>換不同的長和寬，找找看有什麼規律。</li></ul>`,
      [{key:'m', label:'長', options:[2,3,4,5,6,7,8].map(v=>[v,v])},{key:'n', label:'寬', options:[1,2,3,4,5,6].map(v=>[v,v])}], opts, newGame);
    let P, t, guess, end, bounces, score=0, played=0, running;
    function newGame(){
      runId++; const {m,n}=opts; P=[[0,0]]; let x=0,y=0,dx=1,dy=1; bounces=0;
      for(;;){ x+=dx; y+=dy; P.push([x,y]); const wx=x===0||x===m, wy=y===0||y===n; if(wx&&wy) break; if(wx){dx=-dx;bounces++;} if(wy){dy=-dy;bounces++;} }
      end = x===m ? (y===0?'B':'C') : 'D'; t=0; guess=null; running=false; draw();
    }
    function draw(){
      const {m,n}=opts, X=x=>1+x, Y=y=>1+n-y, name={B:'右下',C:'右上',D:'左上'}, pos={A:[0,0],B:[m,0],C:[m,n],D:[0,n]};
      let grid=''; for(let i=0;i<=m;i++) grid+=`<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(n)}"/>`; for(let j=0;j<=n;j++) grid+=`<line x1="${X(0)}" y1="${Y(j)}" x2="${X(m)}" y2="${Y(j)}"/>`;
      const fin=t===P.length-1 && guess;
      ui.board.innerHTML = `<svg class="pool" viewBox="0 0 ${m+2} ${n+2}" style="max-width:${Math.min(720,(m+2)*90)}px">
        <rect x=".55" y=".55" width="${m+.9}" height="${n+.9}" rx=".35" fill="#8a5a32"/><rect x="1" y="1" width="${m}" height="${n}" fill="#2e8b57"/>
        <g stroke="rgba(255,255,255,.25)" stroke-width=".03">${grid}</g>
        <polyline points="${P.slice(0,t+1).map(([x,y])=>X(x)+','+Y(y)).join(' ')}" fill="none" stroke="#fff" stroke-width=".07" stroke-linejoin="round"/>
        ${Object.entries(pos).map(([k,[x,y]])=>`<g ${k!=='A'?`data-k="${k}"`:''}><circle cx="${X(x)}" cy="${Y(y)}" r=".42" fill="${guess===k?'#ffc93c':k==='A'?'#555':'#1c1c1c'}" stroke="${fin&&end===k?'#3bb273':'#c9a36a'}" stroke-width="${fin&&end===k?.14:.06}"/>
          <text x="${X(x)}" y="${Y(y)+.13}" text-anchor="middle" font-size=".36" font-weight="900" fill="${guess===k?'#3b2f2a':'#fff'}">${k==='A'?'起':name[k][0]+name[k][1]}</text></g>`).join('')}
        <circle cx="${X(P[t][0])}" cy="${Y(P[t][1])}" r=".2" fill="#fff" stroke="#999" stroke-width=".03"/></svg>
        <div class="msg" style="color:${guess===end?'var(--green)':'var(--red)'}">${fin?(guess===end?'⭕ 猜對了！':'❌ 沒猜中！')+`球掉進${name[end]}的洞，反彈 ${bounces} 次，走了 ${P.length-1} 格。`:guess?'':'<span style="color:var(--ink)">👆 點一個洞來猜</span>'}</div>
        <div class="actions"><button class="btn ghost rnd">🎲 換一張球檯</button></div>`;
      ui.setStatus(`長 ${big(m)} × 寬 ${big(n)}　｜　猜對 ${score} / ${played}`);
    }
    function run(){ if(t>=P.length-1){ running=false; played++; if(guess===end) score++; draw(); return; } t++; draw(); later(run, P.length>30?70:130); }
    ui.board.addEventListener('click', e=>{
      const g=e.target.closest('g[data-k]');
      if(g && !guess){ guess=g.dataset.k; running=true; draw(); later(run, 400); }
      else if(e.target.closest('.rnd') && !running){ opts.m=2+rand(7); opts.n=1+rand(6); ui.redrawSettings(); newGame(); }
    });
    newGame();
  }});

/* ---------- 摺紙打洞 ---------- */
reg({id:'fold', cat:'geo', title:'摺紙打洞', emoji:'📄',
  desc:'把紙對摺再打洞，打開以後洞會在哪裡？',
  explain:`<p>紙摺起來的時候是<b>兩層（或四層）疊在一起</b>，所以打一個洞，其實每一層都被打穿了。</p>
  <p>打開以後，洞會出現在<b>摺線兩邊對稱的位置</b>——摺線就是<b>對稱軸</b>！</p>
  <div class="ex">對摺 1 次 → 2 層 → 打 1 個洞，打開有 <b>2</b> 個洞<br>對摺 2 次 → 4 層 → 打 1 個洞，打開有 <b>4</b> 個洞<br>對摺 3 次 → 8 層 → <b>8</b> 個洞</div>
  <p>每多摺一次，層數就變成 <b>2 倍</b>：2、4、8、16…</p>
  <p><b>怎麼找洞的位置？</b>倒著想，一次打開一摺：</p>
  <ul><li>洞離摺線幾格，打開後的新洞就在另一邊、離摺線一樣遠的地方。</li>
  <li>摺兩次的，先打開最後摺的那一次，再打開第一次。</li></ul>
  <p>💭 剪窗花、剪雪花就是用這個道理：摺很多次只要剪一刀，打開就有很多個對稱的圖案。回家拿張紙試試看！</p>`,
  mount(el){
    const opts = {mode:'1'};
    const ui = shell(el, `
      <p>一張正方形的紙被<b>對摺</b>之後打了洞。</p>
      <ul><li>左邊是摺紙和打洞的步驟。</li><li>在右邊的紙上，點出<b>打開之後所有的洞</b>。</li>
      <li>按「打開看看」對答案！</li></ul>`,
      [{key:'mode', label:'摺法', options:[['1','對摺 1 次'],['2','對摺 2 次'],['d','斜斜對摺']]}], opts, newGame);
    let steps, holes, answer, pick, msg, solved, score, qn;
    function newGame(){ runId++; score=0; qn=0; nextQ(); }
    function nextQ(){
      qn++; pick=new Set(); msg=''; solved=false; steps=[]; let vis, maps;
      if(opts.mode==='d'){
        vis=[]; for(let r=0;r<4;r++) for(let c=r+1;c<4;c++) vis.push([r,c]);
        steps=[{poly:[[0,0],[80,0],[80,80],[0,80]], line:[0,0,80,80], txt:'沿斜線對摺'},{poly:[[0,0],[80,0],[80,80]], txt:'打洞'}];
        maps=([r,c])=>[[r,c],[c,r]];
      } else {
        const vert=Math.random()<0.5;
        if(opts.mode==='1'){
          vis=[]; for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(vert?c<2:r<2) vis.push([r,c]);
          steps=[{poly:[[0,0],[80,0],[80,80],[0,80]], line:vert?[40,0,40,80]:[0,40,80,40], txt:vert?'右邊摺到左邊':'下面摺到上面'},
                 {poly:vert?[[0,0],[40,0],[40,80],[0,80]]:[[0,0],[80,0],[80,40],[0,40]], txt:'打洞'}];
          maps=([r,c])=>vert?[[r,c],[r,3-c]]:[[r,c],[3-r,c]];
        } else {
          vis=[[0,0],[0,1],[1,0],[1,1]];
          steps=[{poly:[[0,0],[80,0],[80,80],[0,80]], line:[40,0,40,80], txt:'右邊摺到左邊'},
                 {poly:[[0,0],[40,0],[40,80],[0,80]], line:[0,40,40,40], txt:'下面摺到上面'},
                 {poly:[[0,0],[40,0],[40,40],[0,40]], txt:'打洞'}];
          maps=([r,c])=>[[r,c],[r,3-c],[3-r,c],[3-r,3-c]];
        }
      }
      holes=shuffle(vis).slice(0, opts.mode==='2' ? 1+rand(2) : 1+rand(3));
      answer=new Set(holes.flatMap(maps).map(p=>p.join()));
      draw();
    }
    function paper(s, last){
      return `<div class="fold-step"><svg viewBox="-2 -2 84 84">
        <rect x="0" y="0" width="80" height="80" fill="none" stroke="#cbbfa9" stroke-width=".8" stroke-dasharray="3 2"/>
        <polygon points="${s.poly.map(p=>p.join()).join(' ')}" fill="#fff6dc" stroke="#3b2f2a" stroke-width="1.4"/>
        ${s.line?`<line x1="${s.line[0]}" y1="${s.line[1]}" x2="${s.line[2]}" y2="${s.line[3]}" stroke="#e4572e" stroke-width="1.6" stroke-dasharray="4 3"/>`:''}
        ${last?holes.map(([r,c])=>`<circle cx="${c*20+10}" cy="${r*20+10}" r="5.5" fill="#3b2f2a"/>`).join(''):''}</svg><span>${s.txt}</span></div>`;
    }
    function draw(){
      ui.board.innerHTML = `<div class="fold-row"><div class="fold-steps">${steps.map((s,i)=>paper(s,i===steps.length-1)).join('<b>➜</b>')}</div>
        <div class="fold-ans"><div class="fold-grid">${Array.from({length:16},(_,i)=>{ const k=Math.floor(i/4)+','+(i%4);
          return `<button data-k="${k}" class="${pick.has(k)?'on':''} ${solved&&answer.has(k)?'ans':''}"></button>`; }).join('')}</div><span>打開後的紙（點出所有的洞）</span></div></div>
        <div class="msg" style="color:${solved&&msg.startsWith('⭕')?'var(--green)':'var(--red)'}">${msg}</div>
        <div class="actions">${solved?`<button class="btn big nx">下一題</button>`:`<button class="btn big open">📖 打開看看</button><button class="btn ghost show">看答案</button>`}</div>`;
      ui.setStatus(`第 ${big(qn)} 題　｜　答對 ${score}`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.fold-grid button');
      if(b && !solved){ const k=b.dataset.k; pick.has(k)?pick.delete(k):pick.add(k); msg=''; }
      else if(e.target.closest('.open')){
        if(pick.size===answer.size && [...pick].every(k=>answer.has(k))){ solved=true; score++; msg=`⭕ 答對了！打開後有 ${answer.size} 個洞。`; }
        else msg = pick.size<answer.size ? '洞好像還不夠喔！紙摺起來有好幾層呢。' : '位置不太對喔！想想摺線在哪裡，洞會出現在摺線兩邊對稱的地方。';
      }
      else if(e.target.closest('.show')){ solved=true; pick=new Set(); msg=`答案是這 ${answer.size} 個洞。`; }
      else if(e.target.closest('.nx')){ nextQ(); return; }
      else return;
      draw();
    });
    newGame();
  }});
