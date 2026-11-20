/* ===================== 棋牌（二） ===================== */

/* ---------- 象棋 ---------- */
const XQ = (()=>{
  const INIT = ['rnbakabnr','.........','.c.....c.','p.p.p.p.p','.........','.........','P.P.P.P.P','.C.....C.','.........','RNBAKABNR'].join('').split('');
  const VAL = {K:100000,R:900,C:450,N:400,B:200,A:200,P:100};
  const red = ch => ch>='A' && ch<='Z';
  const sideOf = ch => ch==='.' ? -1 : red(ch) ? 0 : 1;
  const ORTH = [[0,1],[0,-1],[1,0],[-1,0]];
  const NM = [[-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],[-1,-2,0,-1],[1,-2,0,-1],[-1,2,0,1],[1,2,0,1]];
  function gen(b, side){
    const out = [];
    const add = (f,r,c)=>{ if(r<0||r>9||c<0||c>8) return; const t=r*9+c; if(sideOf(b[t])!==side) out.push([f,t]); };
    for(let i=0;i<90;i++){
      if(sideOf(b[i])!==side) continue;
      const t=b[i].toUpperCase(), r=Math.floor(i/9), c=i%9;
      if(t==='R' || t==='C'){
        for(const [dr,dc] of ORTH){ let rr=r+dr, cc=c+dc, jumped=false;
          while(rr>=0&&rr<=9&&cc>=0&&cc<=8){ const j=rr*9+cc;
            if(!jumped){ if(b[j]==='.') out.push([i,j]); else { if(t==='R'){ if(sideOf(b[j])!==side) out.push([i,j]); break; } jumped=true; } }
            else if(b[j]!=='.'){ if(sideOf(b[j])!==side) out.push([i,j]); break; }
            rr+=dr; cc+=dc; } }
      } else if(t==='N'){ for(const [dr,dc,lr,lc] of NM) if(b[(r+lr)*9+c+lc]==='.' ) add(i,r+dr,c+dc);
      } else if(t==='B'){ for(const [dr,dc] of [[2,2],[2,-2],[-2,2],[-2,-2]]){ const rr=r+dr, cc=c+dc; if(rr<0||rr>9||cc<0||cc>8) continue;
          if((side===0 ? rr>=5 : rr<=4) && b[(r+dr/2)*9+c+dc/2]==='.') add(i,rr,cc); }
      } else if(t==='A'){ for(const [dr,dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ const rr=r+dr, cc=c+dc; if(cc>=3&&cc<=5&&(side===0 ? rr>=7&&rr<=9 : rr>=0&&rr<=2)) add(i,rr,cc); }
      } else if(t==='K'){ for(const [dr,dc] of ORTH){ const rr=r+dr, cc=c+dc; if(cc>=3&&cc<=5&&(side===0 ? rr>=7&&rr<=9 : rr>=0&&rr<=2)) add(i,rr,cc); }
        const d = side===0 ? -1 : 1; let rr=r+d; while(rr>=0&&rr<=9&&b[rr*9+c]==='.') rr+=d;      // 王見王
        if(rr>=0&&rr<=9&&b[rr*9+c].toUpperCase()==='K') out.push([i,rr*9+c]);
      } else { const d = side===0 ? -1 : 1; add(i,r+d,c); if(side===0 ? r<=4 : r>=5){ add(i,r,c-1); add(i,r,c+1); } }
    }
    return out;
  }
  const make = (b,m)=>{ const n=b.slice(); n[m[1]]=n[m[0]]; n[m[0]]='.'; return n; };
  const kingPos = (b,side)=>b.indexOf(side===0?'K':'k');
  const inCheck = (b,side)=>{ const k=kingPos(b,side); return gen(b,1-side).some(m=>m[1]===k); };
  const legal = (b,side)=>gen(b,side).filter(m=>!inCheck(make(b,m),side));
  function evalB(b, side){ let s=0;
    for(let i=0;i<90;i++){ const ch=b[i]; if(ch==='.') continue; const t=ch.toUpperCase(), sd=sideOf(ch), r=Math.floor(i/9), c=i%9; let v=VAL[t];
      if(t==='P'){ const adv = sd===0 ? 6-r : r-3; if(adv>1) v+=60+adv*12; }
      else if(t==='N'||t==='C'||t==='R') v+=(4-Math.abs(c-4))*6;
      s += sd===side ? v : -v; }
    return s; }
  function search(b, side, d, a, bt){
    if(kingPos(b,side)<0) return -900000-d;
    if(d===0) return evalB(b,side);
    const ms=gen(b,side).sort((x,y)=>(b[y[1]]==='.'?0:VAL[b[y[1]].toUpperCase()])-(b[x[1]]==='.'?0:VAL[b[x[1]].toUpperCase()]));
    let best=-1e9;
    for(const m of ms){ const s=-search(make(b,m),1-side,d-1,-bt,-a); if(s>best) best=s; if(best>a) a=best; if(a>=bt) break; }
    return best; }
  return {INIT, gen, make, inCheck, legal, search, sideOf, red};
})();
reg({id:'xiangqi', cat:'board', title:'象棋', emoji:'🐘',
  desc:'楚河漢界，將死對方的將帥就獲勝。',
  explain:{
  1:`<p><b>七種棋子怎麼走：</b></p>
  <div class="ex"><b>車</b>：直直走，走幾格都可以。<br><b>馬</b>：走「日」字（先直一格再斜一格），前面被擋住就不能走（拐馬腳）。<br><b>象／相</b>：走「田」字的對角，不能過河，田中間被擋住也不能走。<br><b>士／仕</b>：在九宮格裡斜走一格。<br><b>將／帥</b>：在九宮格裡直走或橫走一格。<br><b>炮</b>：走法和車一樣，但<b>吃棋要隔一顆</b>。<br><b>兵／卒</b>：只能往前一格；過河之後才可以左右走，但不能後退。</div>
  <p><b>棋子有多厲害？</b>可以幫它們打分數：</p>
  <div class="ex">車 9 分　馬 4 分　炮 4.5 分　象、士 2 分　兵 1 分（過河 2 分）</div>
  <p>💭 用 1 顆馬去換對手的車，划算嗎？9 － 4 ＝ 賺 5 分！</p>`,
  2:`<p><b>換子算術：</b>高手下棋時一直在心裡做加減法。</p>
  <div class="ex">車 9　炮 4.5　馬 4　象 2　士 2　兵 1（過河後 2）<br>「一車換雙」：用 1 車（9）換對手 1 馬 1 炮（8.5）→ 幾乎打平<br>用 1 炮（4.5）換 1 象 1 士（4）→ 差不多，但對手的將少了保鑣</div>
  <p><b>棋盤的數學：</b>象棋下在<b>交叉點</b>上，橫 9 條線、直 10 條線，共 9 × 10 ＝ <b>90</b> 個點。</p>
  <ul><li><b>車</b>在空棋盤上永遠能走到 8 ＋ 9 ＝ <b>17</b> 個點，不管它在哪裡。</li>
  <li><b>馬</b>在中間最多能跳到 <b>8</b> 個點，在角落只剩 2 個——所以「馬要往中間跳」。</li>
  <li><b>象</b>一輩子只能到 <b>7</b> 個點，士只能到 <b>5</b> 個點。</li></ul>
  <p>💭 開局的口訣「當頭炮、馬來跳」：第一步把炮移到正中間，對手用馬保護中間的卒。</p>`,
  3:`<p><b>象棋有多複雜？</b></p>
  <div class="ex">可能出現的盤面：大約 10⁴⁰ 種<br>可能的對局過程：大約 10¹⁵⁰ 種<br>（宇宙中的原子大約只有 10⁸⁰ 個）</div>
  <p>所以電腦不可能像井字棋那樣全部算完，只能「往後看幾步，再估計誰比較好」：</p>
  <ul><li><b>評估函數：</b>把雙方棋子的分數加總，再考慮位置（過河的兵、中間的馬加分）。</li>
  <li><b>minimax ＋ α-β 剪枝：</b>每多看一步，要算的盤面大約變成 40 倍；剪枝做得好，可以把 40 降到大約 √40 ≈ 6 倍，同樣的時間就能多看一倍深。</li></ul>
  <p><b>用座標描述走法：</b>把棋子位置記成 (x, y)。</p>
  <div class="ex">馬的 8 種跳法：(±1, ±2) 和 (±2, ±1)，每一步移動距離都是 √(1² ＋ 2²) ＝ √5<br>象的 4 種走法：(±2, ±2)，距離 2√2</div>
  <p>💭 馬每跳一步，x ＋ y 的奇偶一定改變（1＋2 ＝ 3 是奇數）。所以馬要回到原來的點，一定要跳<b>偶數</b>步。</p>`},
  mount(el){
    const opts = {mode:'easy', first:'me'};
    const ui = shell(el, `<p>紅棋在下方，黑棋在上方，輪流走一步。</p>
      <ul><li><b>點自己的棋子</b>，可以走的位置會出現圓點，再點要去的地方。</li><li>走到對方棋子的位置就把它吃掉。</li>
      <li>讓對方的將（帥）<b>無路可逃</b>就獲勝。將和帥不能在同一直線上面對面。</li></ul>`,
      [{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const CH = {K:'帥',A:'仕',B:'相',R:'俥',N:'傌',C:'炮',P:'兵',k:'將',a:'士',b:'象',r:'車',n:'馬',c:'包',p:'卒'};
    let b, turn, sel, moves, over, busy, last, msg;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    function newGame(){ runId++; b=XQ.INIT.slice(); turn=opts.first==='me'?0:1; sel=-1; moves=[]; over=false; busy=false; last=null; msg=''; begin(); draw(); maybe(); }
    function draw(){
      const X=c=>c+1, Y=r=>r+1; let ln='';
      for(let r=0;r<10;r++) ln+=`<line x1="1" y1="${Y(r)}" x2="9" y2="${Y(r)}"/>`;
      for(let c=0;c<9;c++){ if(c===0||c===8) ln+=`<line x1="${X(c)}" y1="1" x2="${X(c)}" y2="10"/>`; else ln+=`<line x1="${X(c)}" y1="1" x2="${X(c)}" y2="5"/><line x1="${X(c)}" y1="6" x2="${X(c)}" y2="10"/>`; }
      ln+=`<line x1="4" y1="1" x2="6" y2="3"/><line x1="6" y1="1" x2="4" y2="3"/><line x1="4" y1="8" x2="6" y2="10"/><line x1="6" y1="8" x2="4" y2="10"/>`;
      const tg = sel>=0 ? moves.filter(m=>m[0]===sel).map(m=>m[1]) : [];
      let pcs='', hit='';
      for(let i=0;i<90;i++){ const r=Math.floor(i/9), c=i%9, ch=b[i];
        if(last && (i===last[0]||i===last[1])) pcs+=`<rect x="${X(c)-.48}" y="${Y(r)-.48}" width=".96" height=".96" fill="none" stroke="#3f7d5a" stroke-width=".06" stroke-dasharray=".2 .12"/>`;
        if(ch!=='.'){ const rd=XQ.red(ch);
          pcs+=`<circle cx="${X(c)}" cy="${Y(r)}" r=".44" fill="${i===sel?'#f3dc9a':'#f6ead0'}" stroke="${rd?'#b5482f':'#26211c'}" stroke-width=".07"/>
            <text x="${X(c)}" y="${Y(r)+.2}" text-anchor="middle" font-size=".56" font-weight="900" fill="${rd?'#b5482f':'#26211c'}">${CH[ch]}</text>`; }
        if(tg.includes(i)) pcs+= ch==='.' ? `<circle cx="${X(c)}" cy="${Y(r)}" r=".15" fill="#3f7d5a"/>` : `<circle cx="${X(c)}" cy="${Y(r)}" r=".49" fill="none" stroke="#3f7d5a" stroke-width=".09"/>`;
        hit+=`<rect data-i="${i}" x="${X(c)-.5}" y="${Y(r)-.5}" width="1" height="1" fill="transparent"/>`; }
      ui.board.innerHTML = `<svg class="xq" viewBox="0 0 10 11"><rect x=".3" y=".3" width="9.4" height="10.4" rx=".2" fill="#e7c98f"/><g stroke="#6b4a1f" stroke-width=".04">${ln}</g>
        <text x="3" y="5.68" text-anchor="middle" font-size=".5" fill="#6b4a1f" font-weight="700">楚 河</text><text x="7" y="5.68" text-anchor="middle" font-size=".5" fill="#6b4a1f" font-weight="700">漢 界</text>${pcs}${hit}</svg>
        <div class="msg">${msg}</div>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : `輪到 <b style="color:${turn===0?'var(--red)':'var(--ink)'}">${turn===0?'紅棋':'黑棋'}</b>${opts.mode==='pvp'?'':'（你）'}`);
    }
    function begin(){ moves=XQ.legal(b,turn); sel=-1;
      if(!moves.length){ over=true; draw(); endTwoPlayer(ui, opts.mode, 1-turn, newGame); return false; }
      msg = XQ.inCheck(b,turn) ? '將軍！' : ''; return true; }
    function play(m){ b=XQ.make(b,m); last=m; turn=1-turn; if(begin()){ draw(); maybe(); } }
    function maybe(){ if(!cpu()||over) return; busy=true; draw();
      later(()=>{ const d=opts.mode==='hard'?4:2; let bs=-1e9, pick=null;
        for(const m of moves){ let s=-XQ.search(XQ.make(b,m),0,d-1,-1e9,1e9); if(opts.mode==='easy') s+=Math.random()*90; else s+=Math.random()*8; if(s>bs){ bs=s; pick=m; } }
        busy=false; play(pick); }, 250); }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('rect[data-i]'); if(!x||over||busy||cpu()) return; const i=+x.dataset.i;
      const m = sel>=0 && moves.find(v=>v[0]===sel&&v[1]===i);
      if(m){ play(m); return; }
      if(XQ.sideOf(b[i])===turn){ sel = sel===i ? -1 : i; if(sel>=0 && !moves.some(v=>v[0]===i)) msg='這顆棋現在不能動（動了會被將軍，或被擋住了）。'; else msg = XQ.inCheck(b,turn)?'將軍！':''; }
      else sel=-1;
      draw();
    });
    newGame();
  }});

/* ---------- 跳棋 ---------- */
reg({id:'checkers', cat:'board', title:'跳棋', emoji:'🔯',
  desc:'六角星棋盤，跳過別的棋子連續前進，先把十顆棋子搬到對面的人贏。',
  explain:{
  1:`<p><b>兩種走法：</b></p>
  <div class="ex"><b>走</b>：移到旁邊的空洞（一格）。<br><b>跳</b>：旁邊有棋子（自己的或對手的都可以），而它後面剛好是空洞，就能跳過去。跳完如果還能跳，可以<b>一直連跳</b>！</div>
  <p><b>數一數棋子：</b>每個人的三角形有 1 ＋ 2 ＋ 3 ＋ 4 ＝ <b>10</b> 顆。</p>
  <p><b>小祕訣：</b></p>
  <ul><li><b>搭橋</b>：把棋子排成「隔一格一顆」，後面的棋子就能一口氣跳很遠。</li><li>不要讓棋子<b>落單</b>在後面，最後要一格一格慢慢走很吃虧。</li><li>對手的棋子也可以拿來當跳板！</li></ul>`,
  2:`<p><b>棋盤上一共有幾個洞？</b>六角星可以看成「中間一個大六邊形 ＋ 六個小三角形」：</p>
  <div class="ex">每個小三角形：1＋2＋3＋4 ＝ 10 個洞，六個共 60 個<br>中間六邊形：5＋6＋7＋8＋9＋8＋7＋6＋5 ＝ 61 個<br>合計 <b>121</b> 個洞</div>
  <p>1、3、6、10、15…這種「排成三角形」的數叫做<b>三角形數</b>。</p>
  <p><b>對稱：</b>六角星有 <b>6 條對稱軸</b>，轉 60 度也會和原來重合。</p>
  <p><b>跳躍的規律：</b>被跳過的棋子，一定剛好在「起點」和「落點」的<b>正中間</b>。所以跳一次會前進 2 格；連跳 5 次就前進 10 格，比一格一格走快 10 倍！</p>
  <p>💭 從自己的頂點到對面的頂點有 16 格遠。只用走的要 16 步，如果橋搭得好，有可能一步就跳過大半個棋盤。</p>`,
  3:`<p><b>三角形數與六邊形數：</b></p>
  <div class="ex">第 n 個三角形數：T(n) ＝ n(n＋1) ÷ 2　→　T(4) ＝ 10<br>邊長 n 的六邊形點陣：H(n) ＝ 3n(n－1) ＋ 1　→　H(5) ＝ 61<br>棋盤總洞數 ＝ H(5) ＋ 6 × T(4) ＝ 61 ＋ 60 ＝ <b>121</b></div>
  <p>也可以看成兩個大三角形重疊：2 × T(13) － H(5) ＝ 182 － 61 ＝ 121 ✔</p>
  <p><b>三個方向的座標：</b>方格棋盤用 (x, y) 兩個方向；跳棋的洞排成正三角形格子，有<b>三個</b>互夾 60° 的方向，每個洞有 <b>6</b> 個鄰居。</p>
  <p><b>中點與對稱：</b>跳躍時，被跳的棋子是起點和落點的<b>中點</b>——也就是落點和起點對那顆棋子成<b>點對稱</b>。用座標寫：起點 A、被跳的棋子 M，落點 B ＝ 2M － A。</p>
  <p><b>不變量：</b>把座標寫成 (列, 行)，每跳一次兩個座標都改變偶數，所以<b>只靠跳躍</b>的棋子，永遠只能到達「座標奇偶性和起點相同」的洞——大約只有全部的四分之一。想到別的洞，就得走一步來調整。</p>`},
  mount(el){
    const opts = {mode:'easy', first:'me'};
    const ui = shell(el, `<p>你的棋子在<b>下面</b>的三角形，目標是全部搬到<b>上面</b>的三角形。</p>
      <ul><li><b>點自己的棋子</b>，可以去的洞會亮起來，再點要去的洞。</li><li>可以走到旁邊的空洞，或<b>跳過</b>一顆棋子到它後面的空洞，還能連續跳。</li>
      <li>先把 10 顆棋子都搬進對面三角形的人贏。</li></ul>`,
      [{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const RC=[1,2,3,4,13,12,11,10,9,10,11,12,13,4,3,2,1], H=[], ID={};
    RC.forEach((n,y)=>{ for(let k=0;k<n;k++){ const X=2*k-(n-1); ID[X+','+y]=H.length; H.push({X,y}); } });
    const DIR=[[2,0],[-2,0],[1,1],[-1,1],[1,-1],[-1,-1]];
    const home=[H.map((h,i)=>h.y>=13?i:-1).filter(i=>i>=0), H.map((h,i)=>h.y<=3?i:-1).filter(i=>i>=0)];
    let b, turn, sel, tg, over, busy, last;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    const at=(X,y)=>ID[X+','+y];
    function reach(bb, i){ const out=new Set(), h=H[i];
      for(const [dx,dy] of DIR){ const j=at(h.X+dx,h.y+dy); if(j!==undefined && bb[j]<0) out.add(j); }
      const seen=new Set([i]), st=[i];
      while(st.length){ const p=H[st.pop()];
        for(const [dx,dy] of DIR){ const m=at(p.X+dx,p.y+dy), l=at(p.X+2*dx,p.y+2*dy);
          if(m!==undefined && l!==undefined && bb[m]>=0 && bb[l]<0 && !seen.has(l)){ seen.add(l); out.add(l); st.push(l); } } }
      return [...out]; }
    function newGame(){ runId++; b=Array(H.length).fill(-1); home[0].forEach(i=>b[i]=0); home[1].forEach(i=>b[i]=1);
      turn=opts.first==='me'?0:1; sel=-1; tg=[]; over=false; busy=false; last=null; draw(); maybe(); }
    function won(p){ const goal=home[1-p]; return goal.every(i=>b[i]>=0) && goal.some(i=>b[i]===p); }
    function draw(){
      const px=h=>[h.X*0.5+6.5, h.y*0.866+0.7];
      ui.board.innerHTML = `<svg class="ckr" viewBox="0 0 13 15.3">${H.map((h,i)=>{ const [x,y]=px(h), v=b[i];
        const zone = h.y<=3 ? '#d9c9b0' : h.y>=13 ? '#e8c4b6' : '#e9dfc8';
        return `<g data-i="${i}"><circle cx="${x}" cy="${y}" r=".5" fill="transparent"/><circle cx="${x}" cy="${y}" r=".3" fill="${zone}" stroke="${tg.includes(i)?'#3f7d5a':last&&last.includes(i)?'#b8923a':'#b9ad94'}" stroke-width="${tg.includes(i)?.1:.04}"/>
          ${v>=0?`<circle cx="${x}" cy="${y}" r=".36" fill="${v===0?'#b5482f':'#2f6690'}" stroke="${i===sel?'#f3dc9a':'rgba(0,0,0,.35)'}" stroke-width="${i===sel?.12:.05}"/><circle cx="${x-.1}" cy="${y-.12}" r=".1" fill="rgba(255,255,255,.45)"/>`:''}
          ${tg.includes(i)?`<circle cx="${x}" cy="${y}" r=".12" fill="#3f7d5a"/>`:''}</g>`; }).join('')}</svg>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : turnHTML(playerNames(opts.mode), turn));
    }
    function play(f,t){ b[t]=b[f]; b[f]=-1; last=[f,t]; sel=-1; tg=[];
      if(won(turn)){ over=true; draw(); endTwoPlayer(ui, opts.mode, turn, newGame); return; }
      turn=1-turn; draw(); maybe(); }
    function gains(bb, p){ const res=[]; const sgn=p===1?1:-1;
      bb.forEach((v,i)=>{ if(v!==p) return; for(const t of reach(bb,i)){
        const g=(H[t].y-H[i].y)*sgn - 0.06*(Math.abs(H[t].X)-Math.abs(H[i].X)) + 0.03*(p===1?16-H[i].y:H[i].y); res.push({f:i,t,g}); } });
      return res; }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ let ms=gains(b,1);
        if(opts.mode==='hard') ms.forEach(m=>{ const nb=b.slice(); nb[m.t]=1; nb[m.f]=-1; const nx=gains(nb,1); m.g += 0.5*Math.max(0,...nx.map(x=>x.g)); });
        else ms.forEach(m=>{ m.g += Math.random()*1.5; });
        ms.sort((x,y)=>y.g-x.g); const top=ms.filter(m=>m.g>=ms[0].g-0.01), pick=top[rand(top.length)];
        busy=false; play(pick.f,pick.t); }, 600); }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('g[data-i]'); if(!x||over||busy||cpu()) return; const i=+x.dataset.i;
      if(sel>=0 && tg.includes(i)){ play(sel,i); return; }
      if(b[i]===turn){ sel = sel===i?-1:i; tg = sel>=0 ? reach(b,i) : []; } else { sel=-1; tg=[]; }
      draw();
    });
    newGame();
  }});

/* ---------- 暗棋 ---------- */
reg({id:'banqi', cat:'board', title:'暗棋', emoji:'🀄',
  desc:'棋子全部蓋著，翻開才知道是誰的！大吃小，把對方吃光就贏。',
  explain:{
  1:`<p><b>誰比較大？</b>大的可以吃小的（一樣大也可以吃）：</p>
  <div class="ex">帥（將）＞ 仕（士）＞ 相（象）＞ 俥（車）＞ 傌（馬）＞ 炮（包）＞ 兵（卒）</div>
  <p><b>兩個特別的規則：</b></p>
  <ul><li><b>兵（卒）可以吃帥（將）！</b>最小的反而能吃最大的，但帥不能吃兵。</li><li><b>炮</b>不管大小都能吃，可是一定要<b>隔一顆棋子</b>跳過去吃（中間剛好一顆）。</li></ul>
  <p><b>每一邊有幾顆？</b></p>
  <div class="ex">帥 1　仕 2　相 2　俥 2　傌 2　炮 2　兵 5　→　共 <b>16</b> 顆</div>
  <p>💭 自己的大棋子旁邊如果有還沒翻開的棋，要小心：翻出來可能是對手的！</p>`,
  2:`<p>暗棋一半靠推理，一半靠<b>機率</b>。</p>
  <div class="ex">一開始 32 顆都蓋著：<br>翻到「帥或將」的機率 ＝ 2 ÷ 32 ＝ 1/16<br>翻到「兵或卒」的機率 ＝ 10 ÷ 32 ＝ 5/16</div>
  <p><b>記棋很重要！</b>隨著棋子一顆顆翻開，機率會一直變。</p>
  <div class="ex">例：還剩 6 顆沒翻，你算出其中有對手的 2 顆炮、你的 4 顆兵。<br>這時翻任何一顆，是自己棋子的機率 ＝ 4 ÷ 6 ＝ 2/3。</div>
  <p><b>要不要翻旁邊那顆？</b>你的帥旁邊有一顆蓋著的棋：</p>
  <ul><li>如果對手的 5 顆卒都已經翻出來或被吃掉了，那顆絕對吃不了你的帥（除了隔子的包）。</li><li>如果對手還有 3 顆卒沒出現，就要小心了。</li></ul>
  <p>💭 高手會在心裡一直更新「還有哪些棋沒出現」。</p>`,
  3:`<p><b>不是「大就一定贏」：</b>帥吃仕、仕吃相…一路吃到兵，兵卻回頭吃帥。這種繞一圈的關係叫<b>非遞移關係</b>，和剪刀、石頭、布一樣——沒有「最強」的棋子。</p>
  <p><b>用期望值做決定：</b>你的俥旁邊有一顆蓋著的棋，要不要翻開它？假設還有 8 顆沒翻：</p>
  <div class="ex">其中 2 顆是「能吃掉我的俥」的敵棋 → 危險的機率 2/8<br>其中 3 顆是「我的俥能吃」的敵棋 → 賺到的機率 3/8<br>其餘 3 顆是自己的棋 → 沒事</div>
  <p>幫棋子訂分數（例如俥 4 分），期望值 ＝ 3/8 ×（賺的分數）－ 2/8 ×（賠 4 分）。大於 0 才值得翻。而且翻開後是<b>對手先動</b>，所以危險要算得更重。</p>
  <p><b>條件機率：</b>每翻開一顆，剩下的機率都要重算——「已知這些棋已經出現」的條件下，剩下的可能性變少了。</p>
  <p><b>先翻的人有利嗎？</b>第一顆翻到什麼顏色，那個顏色就是你的。翻到兵的機率最高（10/32），但不管翻到什麼，雙方的棋子組成完全一樣，所以開局是公平的；勝負來自之後的推理與運氣。</p>`},
  mount(el){
    const opts = {mode:'easy'};
    const ui = shell(el, `<p>32 顆棋子一開始都<b>蓋著</b>。第一個人翻到什麼顏色，那個顏色就是他的。</p>
      <ul><li>輪到你時可以：<b>翻開</b>一顆蓋著的棋，或<b>移動</b>自己的棋（上下左右一格）。</li>
      <li>大吃小：帥＞仕＞相＞俥＞傌＞炮＞兵；<b>兵能吃帥</b>，帥不能吃兵。</li><li><b>炮</b>要隔一顆棋子才能吃，什麼都能吃。</li><li>把對方的棋子吃光就贏。</li></ul>`,
      [{key:'mode', label:'對手', options:OPP}], opts, newGame);
    const CH=[{K:'帥',A:'仕',B:'相',R:'俥',N:'傌',C:'炮',P:'兵'},{K:'將',A:'士',B:'象',R:'車',N:'馬',C:'包',P:'卒'}];
    const RANK={K:7,A:6,B:5,R:4,N:3,C:2,P:1}, VALUE={K:60,A:35,B:25,R:15,N:9,C:18,P:5}, SET='KAABBRRNNCCPPPPP';
    const D=[[0,1],[0,-1],[1,0],[-1,0]];
    let b, own, turn, sel, over, busy, quiet, msg, last;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    const cap=(a,z)=> a.t==='K'&&z.t==='P' ? false : a.t==='P'&&z.t==='K' ? true : RANK[a.t]>=RANK[z.t];
    const inb=(r,c)=>r>=0&&r<4&&c>=0&&c<8;
    function targets(i){ const p=b[i], r=Math.floor(i/8), c=i%8, out=[];
      for(const [dr,dc] of D){ const rr=r+dr, cc=c+dc; if(!inb(rr,cc)) continue; const j=rr*8+cc, q=b[j];
        if(!q) out.push(j); else if(p.t!=='C' && q.up && q.s!==p.s && cap(p,q)) out.push(j);
        if(p.t==='C'){ let k=1, mid=0, r2=r+dr, c2=c+dc;
          while(inb(r2,c2)){ const q2=b[r2*8+c2]; if(q2){ if(mid===1){ if(q2.up && q2.s!==p.s) out.push(r2*8+c2); break; } mid++; } r2+=dr; c2+=dc; } } }
      return out; }
    function allMoves(p){ const ms=[]; b.forEach((q,i)=>{ if(!q) return; if(!q.up) ms.push({flip:i}); else if(own[p]===q.s) targets(i).forEach(t=>ms.push({f:i,t})); }); return ms; }
    function newGame(){ runId++; const ps=[]; for(const s of [0,1]) for(const t of SET) ps.push({t,s,up:false}); b=shuffle(ps);
      own=[null,null]; turn=0; sel=-1; over=false; busy=false; quiet=0; msg=''; last=-1; draw(); }
    function draw(){
      const tg = sel>=0 ? targets(sel) : [];
      ui.board.innerHTML = `<div class="banqi">${b.map((q,i)=>`<button data-i="${i}" class="${i===sel?'sel':''} ${tg.includes(i)?'tg':''} ${i===last?'last':''}">${!q?'':q.up?`<span class="pc ${q.s===0?'r':'k'}">${CH[q.s][q.t]}</span>`:'<span class="pc dn"></span>'}</button>`).join('')}</div>
        <div class="msg">${msg}</div>`;
      if(!over){ const n=playerNames(opts.mode), col=own[turn]===null?'':`（${own[turn]===0?'紅':'黑'}棋）`;
        ui.setStatus(cpu() ? '🤔 電腦想一想…' : `${turnHTML(n,turn)}${col}`); }
    }
    function endCheck(){
      if(own[0]===null) return false;
      for(const p of [0,1]) if(!b.some(q=>q&&q.s===own[p])){ over=true; draw(); endTwoPlayer(ui, opts.mode, 1-p, newGame); return true; }
      if(quiet>=40){ over=true; draw(); endTwoPlayer(ui, opts.mode, -1, newGame, '40 步都沒有吃棋或翻棋，算平手。'); return true; }
      if(!allMoves(turn).length){ over=true; draw(); endTwoPlayer(ui, opts.mode, 1-turn, newGame); return true; }
      return false; }
    function doFlip(i){ b[i].up=true; last=i; quiet=0; if(own[0]===null){ own[turn]=b[i].s; own[1-turn]=1-b[i].s; }
      msg=''; sel=-1; turn=1-turn; if(!endCheck()){ draw(); maybe(); } }
    function doMove(f,t){ quiet = b[t] ? 0 : quiet+1; b[t]=b[f]; b[f]=null; last=t; msg=''; sel=-1; turn=1-turn; if(!endCheck()){ draw(); maybe(); } }
    function danger(i, p){ const r=Math.floor(i/8), c=i%8; return D.some(([dr,dc])=>{ const rr=r+dr, cc=c+dc; if(!inb(rr,cc)) return false; const q=b[rr*8+cc]; return q&&q.up&&q.s!==p.s&&q.t!=='C'&&cap(q,p); }); }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ const ms=allMoves(1); let best=-1e9, pick=ms[0];
        for(const m of ms){ let s;
          if(m.flip!==undefined) s=3+Math.random()*2;
          else { const p=b[m.f], q=b[m.t], save=b[m.f]; b[m.f]=null; const dz=danger(m.t,p); b[m.f]=save;
            s = (q ? VALUE[q.t]*10 : 0.5) + (danger(m.f,p) ? VALUE[p.t]*6 : 0) - (dz ? VALUE[p.t]*8 : 0); }
          if(opts.mode==='easy') s += Math.random()*40;
          if(s>best){ best=s; pick=m; } }
        busy=false; if(pick.flip!==undefined) doFlip(pick.flip); else doMove(pick.f,pick.t); }, 700); }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('.banqi button'); if(!x||over||busy||cpu()) return; const i=+x.dataset.i, q=b[i];
      if(sel>=0 && targets(sel).includes(i)){ doMove(sel,i); return; }
      if(q && !q.up){ doFlip(i); return; }
      if(q && q.up && own[turn]===q.s){ sel = sel===i?-1:i; msg=''; }
      else { if(sel>=0 && q && q.up) msg = b[sel].t==='C' ? '炮要隔一顆棋子才能吃。' : '吃不了：對方比較大，或者不在旁邊。'; else if(q && q.up) msg='這是對方的棋子。'; sel=-1; }
      draw();
    });
    newGame();
  }});

/* ---------- 撿紅點 ---------- */
reg({id:'redten', cat:'board', title:'撿紅點', emoji:'♦️',
  desc:'用手牌和桌上的牌湊成 10 就能撿走，紅色的牌才有分數！',
  explain:{
  1:`<p><b>怎麼撿牌？</b>手上的牌和桌上的牌，數字<b>加起來是 10</b> 就可以一起撿走：</p>
  <div class="ex">A（1）＋ 9　　2 ＋ 8　　3 ＋ 7　　4 ＋ 6　　5 ＋ 5</div>
  <p>10、J、Q、K 要找<b>一模一樣</b>的：10 配 10、J 配 J、Q 配 Q、K 配 K。</p>
  <p><b>只有紅色的牌（♥ 和 ♦）有分數：</b></p>
  <div class="ex">紅 A：<b>20 分</b><br>紅 9、10、J、Q、K：各 <b>10 分</b><br>紅 2～8：數字是多少就幾分<br>黑色的牌：0 分</div>
  <p>💭 最棒的一手：用 9 撿到紅 A（或用 A 撿到紅 9），如果兩張都是紅的，一次就拿 30 分！</p>`,
  2:`<p><b>整副牌一共有幾分？</b>先算一種紅色花色：</p>
  <div class="ex">A：20 分<br>2 ＋ 3 ＋ 4 ＋ 5 ＋ 6 ＋ 7 ＋ 8 ＝ 35 分<br>9、10、J、Q、K：5 × 10 ＝ 50 分<br>小計 <b>105</b> 分；♥ 和 ♦ 兩種共 <b>210</b> 分</div>
  <p>兩個人玩，拿到超過一半（<b>105 分</b>）就贏了。</p>
  <p><b>策略：</b></p>
  <ul><li><b>先撿分數高的</b>：有好幾種撿法時，算一算哪一組的紅牌分數最多。</li>
  <li><b>不能撿的時候要丟牌</b>：盡量丟黑色的牌；而且想一想，對手會不會剛好拿它去撿走桌上的紅牌？</li>
  <li><b>記牌</b>：每個數字有 4 張。如果 3 張 9 都出現過了，桌上那張紅 A 就只剩最後一張 9 能撿。</li></ul>`,
  3:`<p><b>配對的結構：</b>52 張牌其實被分成 9 組「互相配」的家族：</p>
  <div class="ex">{A, 9}　{2, 8}　{3, 7}　{4, 6}：每組 8 張，剛好配成 4 對<br>{5}　{10}　{J}　{Q}　{K}：每組 4 張，自己配成 2 對</div>
  <p>每一組都是偶數張，所以理論上整副牌可以<b>剛好全部配完</b>。</p>
  <p><b>零和遊戲：</b>總分固定 210，你多拿 x 分，對手就少 x 分。所以「阻止對手拿 20 分」和「自己拿 20 分」價值一樣。</p>
  <p><b>期望值：</b>一張牌的平均分數是 210 ÷ 52 ≈ <b>4 分</b>。紅 A 值 20 分，是平均的 5 倍；而黑牌雖然 0 分，卻是「撿走紅牌的工具」。</p>
  <p><b>機率小題：</b>桌上有一張紅 A，你手上沒有 9。牌堆還有 20 張、其中有 3 張 9，你翻牌時翻到 9 的機率是 3 ÷ 20 ＝ 15%。如果你這回合不處理它，對手手上有 9 的機率卻高得多——所以危險的紅牌留在桌上，通常是幫對手的忙。</p>`},
  mount(el){
    const ui = shell(el, `<p>你和電腦各 12 張手牌，桌上 4 張，其餘是牌堆。</p>
      <ul><li>輪到你時<b>點一張手牌</b>：能和桌上的牌<b>湊成 10</b>（或 10、J、Q、K 配成對）就一起撿走；不能撿就把它放到桌上。</li>
      <li>接著會從牌堆<b>翻一張</b>，能和桌上的牌配對也歸你。</li><li>紅色的牌才有分：紅 A 20 分，紅 9～K 各 10 分，紅 2～8 照數字。</li></ul>`, [], {}, newGame);
    let hand, table, stock, got, turn, pend, over, busy, log;
    const pts=c=> isRed(c.s) ? (c.r===1?20 : c.r>=9?10 : c.r) : 0;
    const match=(a,z)=> a.r<10&&z.r<10 ? a.r+z.r===10 : a.r>=10&&a.r===z.r;
    const name=c=>`<b class="${isRed(c.s)?'redt':''}">${SUITS[c.s]}${RANKS[c.r]}</b>`;
    const score=p=>got[p].reduce((a,c)=>a+pts(c),0);
    function newGame(){ runId++; const d=newDeck(); hand=[d.splice(0,12),d.splice(0,12)]; hand[0].sort((a,z)=>a.r-z.r||a.s-z.s); table=d.splice(0,4); stock=d; got=[[],[]];
      turn=0; pend=-1; over=false; busy=false; log='你先開始，點一張手牌。'; draw(); }
    const kc=(c,attr,cls='')=>`<button class="kc ${isRed(c.s)?'red':''} ${cls}" ${attr}><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i><span>${SUITS[c.s]}</span></button>`;
    function draw(){
      const my = turn===0 && !busy && !over;
      ui.board.innerHTML = `<div class="rt-score"><span class="badge p0">你 ${score(0)} 分</span><span>牌堆 ${stock.length} 張</span><span class="badge p1">電腦 ${score(1)} 分・手牌 ${hand[1].length}</span></div>
        <div class="rt-table">${table.map((c,i)=>kc(c,`data-t="${i}"`, pend>=0&&match(hand[0][pend],c)?'ok':'')).join('')||'<span class="empty">桌上沒有牌</span>'}</div>
        <div class="msg" style="color:var(--ink)">${log}</div>
        <div class="sv-hand">${hand[0].map((c,i)=>kc(c,`data-h="${i}"`, (i===pend?'ok ':'')+(my&&pend<0&&table.some(t=>match(c,t))?'ok':my&&pend<0?'cov':''))).join('')}</div>`;
      if(!over) ui.setStatus(turn===0 ? (pend>=0 ? '有好幾張可以撿，點桌上你要的那一張' : '輪到<span class="badge p0">你</span>：亮起來的手牌可以撿牌') : '🤔 電腦出牌中…');
    }
    function take(p, c, ti, how){ if(ti>=0){ const t=table.splice(ti,1)[0]; got[p].push(c,t); return `${how} ${name(c)}，撿走 ${name(t)}（＋${pts(c)+pts(t)} 分）`; } table.push(c); return `${how} ${name(c)}，放到桌上`; }
    const bestMatch=c=>{ let bi=-1; table.forEach((t,i)=>{ if(match(c,t) && (bi<0 || pts(t)>pts(table[bi]))) bi=i; }); return bi; };
    function finishTurn(p, text){ busy=true; log=text; draw();
      later(()=>{ if(stock.length){ const c=stock.pop(); log = text + '<br>' + take(p, c, bestMatch(c), '翻到'); }
        turn=1-turn; busy=false;
        if(!hand[0].length && !hand[1].length){ over=true; draw(); const a=score(0), z=score(1);
          ui.setStatus(a>z?'🏆 你贏了！':a===z?'🤝 平手':'電腦贏了');
          showWin(a>z?'🏆':a===z?'🤝':'🤖', a>z?'你贏了！':a===z?'平手！':'電腦贏了！', `你 <b>${a}</b> 分，電腦 <b>${z}</b> 分。<br>（總分 210，超過 105 就贏）`, newGame, '再來一局'); return; }
        draw(); if(turn===1) cpuPlay(); }, 900); }
    function cpuPlay(){ busy=true; draw();
      later(()=>{ const h=hand[1]; let bi=-1, bt=-1, bs=-1;
        h.forEach((c,i)=>{ const t=bestMatch(c); if(t>=0){ const s=pts(c)+pts(table[t]); if(s>bs){ bs=s; bi=i; bt=t; } } });
        if(bi<0){ bi=h.reduce((a,c,i)=>pts(c)<pts(h[a])?i:a,0); bt=-1; }
        const c=h.splice(bi,1)[0]; finishTurn(1, '電腦' + take(1,c,bt,'出')); }, 900); }
    ui.board.addEventListener('click', e=>{
      if(turn!==0||busy||over) return;
      const hb=e.target.closest('[data-h]'), tb=e.target.closest('[data-t]');
      if(hb){ const i=+hb.dataset.h, c=hand[0][i], ms=table.map((t,k)=>match(c,t)?k:-1).filter(k=>k>=0);
        if(ms.length>1 && new Set(ms.map(k=>pts(table[k]))).size>1){ pend = pend===i?-1:i; draw(); return; }
        hand[0].splice(i,1); pend=-1; finishTurn(0, '你' + take(0,c,ms.length?bestMatch(c):-1,'出')); }
      else if(tb && pend>=0){ const k=+tb.dataset.t, c=hand[0][pend]; if(!match(c,table[k])) return; hand[0].splice(pend,1); pend=-1; finishTurn(0, '你' + take(0,c,k,'出')); }
    });
    newGame();
  }});

/* ---------- 心臟病 ---------- */
reg({id:'slap', cat:'board', title:'心臟病', emoji:'💓',
  desc:'邊翻牌邊數 1 到 13，翻出來的牌和喊的數字一樣就要趕快拍！',
  explain:{
  1:`<p>大家輪流翻牌，一邊照順序喊：</p>
  <div class="ex">1、2、3、4、5、6、7、8、9、10、11、12、13，然後再從 1 開始</div>
  <p>撲克牌的 <b>A 是 1</b>、<b>J 是 11</b>、<b>Q 是 12</b>、<b>K 是 13</b>。</p>
  <p>翻出來的牌<b>剛好和喊的數字一樣</b>，就要趕快拍！最慢的人要把整疊牌收回去；拍錯的人也要收牌。先把手上的牌出完的人贏。</p>
  <p><b>小祕訣：</b></p>
  <ul><li>眼睛看牌，耳朵（心裡）記數字，兩件事要同時做。</li><li>喊到 11、12、13 時特別容易忘記是 J、Q、K，先在心裡複習一次！</li><li>不確定就不要拍，拍錯比慢拍還虧。</li></ul>`,
  2:`<p><b>多久會出現一次要拍的牌？</b></p>
  <p>每個數字有 4 張，一副牌 52 張。翻開一張牌，它剛好等於現在喊的數字的機率是：</p>
  <div class="ex">4 ÷ 52 ＝ <b>1/13</b></div>
  <p>也就是平均每翻 <b>13 張</b>會出現一次。整副牌 52 張翻完，平均會出現 52 × 1/13 ＝ <b>4 次</b>。</p>
  <p>但「平均」不代表「一定」：有時候連續兩張都要拍，有時候翻了二、三十張都沒有——所以才會讓人心臟撲通撲通跳！</p>
  <p><b>反應時間：</b>人從「看到」到「手動起來」，最快大約要 0.2 秒。這個遊戲除了看到，還要先<b>比對</b>牌和數字是不是一樣，所以通常要 0.5 秒以上。多練習可以變快！</p>`,
  3:`<p>每翻一張牌，「中」的機率 p ＝ 1/13。</p>
  <p><b>期望值的加法性：</b>翻 52 張，平均中幾次？</p>
  <div class="ex">52 × 1/13 ＝ <b>4 次</b></div>
  <p>厲害的是：就算各次翻牌之間<b>不是獨立的</b>（牌翻掉就少一張），期望值照樣可以直接相加。</p>
  <p><b>連續都沒中的機率</b>（把每次近似當成獨立）：</p>
  <div class="ex">連續 13 張都沒中：(12/13)¹³ ≈ <b>35%</b><br>連續 26 張都沒中：(12/13)²⁶ ≈ 12%<br>整副 52 張都沒中：(12/13)⁵² ≈ <b>1.6%</b></div>
  <p>所以「喊完一整輪 1～13 都沒人拍」其實很常見，大約每三輪就有一輪。</p>
  <p><b>要等多久才會中？</b>「第 k 張才第一次中」的機率是 (12/13)ᵏ⁻¹ × 1/13，這叫<b>幾何分布</b>，平均等待張數是 1 ÷ p ＝ 13 張。</p>
  <p>💭 有趣的是 (1 － 1/n)ⁿ 在 n 很大時會趨近 1/e ≈ 36.8%（e ≈ 2.718 是數學裡很重要的常數）。上面的 35% 就是 n ＝ 13 的情形。</p>`},
  mount(el){
    const opts = {speed:1300, mode:'easy'};
    const ui = shell(el, `<p>你和電腦各拿半副牌，輪流自動翻牌，同時從 1 數到 13（A＝1、J＝11、Q＝12、K＝13），數完再從 1 開始。</p>
      <ul><li>翻出來的牌和<b>喊的數字一樣</b>時，趕快按「拍！」。</li><li><b>拍得比較慢</b>的人要把中間整疊牌收回去。</li>
      <li>數字不一樣卻拍了，也要收牌。</li><li>先把手上的牌出完的人贏。</li></ul>`,
      [{key:'speed', label:'速度', options:[[1700,'慢'],[1300,'中'],[900,'快']]},{key:'mode', label:'對手', options:[['easy','電腦普通'],['hard','電腦高手']]}], opts, newGame);
    let decks, pile, count, turn, cur, isMatch, resolved, started, over, msg, tick;
    function newGame(){ runId++; const d=newDeck(); decks=[d.slice(0,26),d.slice(26)]; pile=[]; count=0; turn=0; cur=null; isMatch=false; resolved=true; started=false; over=false; msg='準備好了就按「開始」！'; tick=0; draw(); }
    function draw(){
      ui.board.innerHTML = `<div class="sl-top"><span class="badge p1">電腦 ${decks[1].length} 張</span><span class="badge p0">你 ${decks[0].length} 張</span></div>
        <div class="sl-mid"><div class="sl-count"><small>喊</small>${count||'–'}</div>
          <div class="sl-card">${cur?`<div class="kc ${isRed(cur.s)?'red':''}"><b>${RANKS[cur.r]}</b><i>${SUITS[cur.s]}</i><span>${SUITS[cur.s]}</span></div>`:'<div class="kc back"></div>'}<small>中間 ${pile.length} 張</small></div></div>
        <div class="msg">${msg}</div>
        <div class="actions">${started ? `<button class="btn big slapb">🖐 拍！</button>` : `<button class="btn big go">開始</button>`}</div>`;
      ui.setStatus(over ? '遊戲結束' : started ? `${turn===0?'你':'電腦'}翻牌` : '按「開始」');
    }
    function step(){
      if(over) return;
      if(!decks[turn].length){ over=true; draw(); const you=turn===0;
        showWin(you?'🏆':'🤖', you?'你的牌出完了，你贏了！':'電腦的牌出完了…', `你剩 ${decks[0].length} 張，電腦剩 ${decks[1].length} 張。`, newGame); return; }
      cur=decks[turn].pop(); pile.push(cur); count=count%13+1; isMatch=cur.r===count; resolved=false; msg=''; const id=++tick; draw();
      if(isMatch) later(()=>{ if(tick===id && !resolved) settle(0, '電腦先拍到了！整疊牌歸你。'); }, opts.mode==='hard' ? 450+rand(350) : 850+rand(650));
      else { if(opts.mode==='easy' && Math.random()<0.04) later(()=>{ if(tick===id && !resolved) settle(1, '電腦拍錯了！整疊牌歸電腦。'); }, 500);
        later(()=>{ if(tick===id && !resolved){ resolved=true; turn=1-turn; step(); } }, opts.speed); }
    }
    function settle(loser, text){ resolved=true; decks[loser]=shuffle(pile).concat(decks[loser]); pile=[]; count=0; turn=loser; msg=text; draw(); later(()=>{ cur=null; step(); }, 1700); }
    ui.board.addEventListener('click', e=>{
      if(e.target.closest('.go')){ started=true; step(); }
      else if(e.target.closest('.slapb')){ if(over||resolved) return; if(isMatch) settle(1, '👏 你先拍到了！整疊牌歸電腦。'); else settle(0, `拍錯了！喊的是 ${count}，牌是 ${RANKS[cur.r]}。整疊牌歸你。`); }
    });
    newGame();
  }});
