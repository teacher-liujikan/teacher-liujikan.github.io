/* ===================== 棋牌 ===================== */
CATS.board = {name:'棋牌', emoji:'♟️', color:'#f0a832'};
const OPP = [['easy','電腦普通'],['hard','電腦高手'],['pvp','兩人對戰']], FIRST = [['me','我先'],['cpu','對方先']];
function endTwoPlayer(ui, mode, winner, again, drawText){
  const n = playerNames(mode);
  if(winner < 0){ ui.setStatus('🤝 平手！'); showWin('🤝','平手！', drawText || '雙方都沒有失誤，勢均力敵！', again); return; }
  ui.setStatus(`🏆 <span class="badge p${winner}">${n[winner]}</span> 獲勝！`);
  const you = mode==='pvp' || winner===0;
  showWin(you?'🎉':'🤖', mode==='pvp' ? `${n[winner]}獲勝！` : (winner===0?'你贏了！':'電腦贏了！'), you ? '漂亮的一手！' : '再想想看，哪一步可以先擋下來？', again);
}

/* ---------- 井字棋 ---------- */
reg({id:'ttt', cat:'board', title:'井字棋', emoji:'⭕',
  desc:'圈圈叉叉，先連成一條線的人贏。其實它有不敗的下法！',
  explain:{
  1:`<p>九個格子，其實<b>不一樣重要</b>！數一數每一格在幾條線上：</p>
  <div class="ex">正中間：<b>4</b> 條線（橫、直、兩條斜）<br>四個角落：<b>3</b> 條線<br>四個邊的中間：<b>2</b> 條線</div>
  <p>所以<b>中間最好，角落第二</b>。</p>
  <p><b>兩個口訣：</b></p>
  <ul><li>自己有兩個連在一條線上 → 快補第三個，贏！</li><li>對手有兩個連在一條線上 → 快擋住！</li></ul>
  <p>💭 高手會同時做出<b>兩條</b>「差一個就連線」的線，對手只能擋一條。</p>`,
  2:`<p>如果兩個人都不犯錯，井字棋一定<b>平手</b>。</p>
  <p><b>為什麼開局只有 3 種？</b>棋盤轉一轉、翻一翻都一樣，所以第一步其實只有：<b>中間、角落、邊</b>三種選擇。</p>
  <div class="ex">先手下<b>角落</b>：後手一定要下<b>中間</b>，下別的地方都會輸！<br>先手下<b>中間</b>：後手一定要下<b>角落</b>，下邊會輸。</div>
  <p><b>必殺技「雙叉」：</b>下一顆棋，同時產生兩條「差一格就連線」的線。對手一次只能擋一條，你就贏了。防守的重點，就是<b>不要讓對手做出雙叉</b>。</p>
  <p>💭 和「電腦高手」下，它永遠不會輸。你能每一盤都逼成平手嗎？</p>`,
  3:`<p>井字棋小到可以把<b>所有可能</b>都算完，是認識「賽局樹」最好的例子。</p>
  <div class="ex">下棋順序最多 9! ＝ 362880 種<br>扣掉提早分出勝負的，完整的對局共 <b>255168</b> 種<br>可能出現的盤面 <b>5478</b> 種；把旋轉、鏡射當成同一種，只剩 <b>765</b> 種</div>
  <p><b>極小化極大法（minimax）：</b>從終局倒推回來——輪到我時選「對我最好」的分支，輪到對手時假設他選「對我最差」的分支。一路推回第一步，就知道這個遊戲的結果：<b>平手</b>。</p>
  <p>像這樣「雙方都下最好時的結果已經被確定」的遊戲，叫做<b>已解遊戲</b>。四子棋、五子棋、西洋跳棋也都被電腦解開了。</p>
  <p>💭 這個網頁的電腦高手，就是用 minimax 把所有變化算完才下的。</p>`},
  mount(el){
    const opts = {mode:'easy', first:'me'};
    const ui = shell(el, `<p>兩個人輪流在九宮格裡畫 ○ 和 ×。</p><ul><li>先把自己的三個記號<b>連成一條線</b>（橫、直、斜都可以）的人贏。</li><li>九格都滿了還沒有人連線，就是平手。</li></ul>`,
      [{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let b, turn, over, busy, win;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    const line = bb => L.find(l=>bb[l[0]]!==null && bb[l[0]]===bb[l[1]] && bb[l[1]]===bb[l[2]]);
    function newGame(){ runId++; b=Array(9).fill(null); turn=opts.first==='me'?0:1; over=false; busy=false; win=null; draw(); maybe(); }
    function draw(){
      ui.board.innerHTML = `<div class="ttt">${b.map((v,i)=>`<button data-i="${i}" class="${v===0?'o':v===1?'x':''} ${win&&win.includes(i)?'win':''}">${v===0?'○':v===1?'×':''}</button>`).join('')}</div>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : turnHTML(playerNames(opts.mode), turn) + (turn===0?'（○）':'（×）'));
    }
    function mm(bb, p, me){ const l=line(bb); if(l) return bb[l[0]]===me ? 10 : -10; if(bb.every(v=>v!==null)) return 0;
      let best = p===me ? -99 : 99;
      for(let i=0;i<9;i++) if(bb[i]===null){ bb[i]=p; const s=mm(bb,1-p,me); bb[i]=null; best = p===me ? Math.max(best,s) : Math.min(best,s); }
      return best; }
    function play(i){
      b[i]=turn; win=line(b);
      if(win || b.every(v=>v!==null)){ over=true; draw(); endTwoPlayer(ui, opts.mode, win?turn:-1, newGame); return; }
      turn=1-turn; draw(); maybe();
    }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ const free=b.map((v,i)=>v===null?i:-1).filter(i=>i>=0); let pick;
        if(opts.mode==='easy' && Math.random()<0.5) pick=free[rand(free.length)];
        else { let bs=-99, c=[]; for(const i of free){ b[i]=1; const s=mm(b,0,1); b[i]=null; if(s>bs){bs=s;c=[i];} else if(s===bs) c.push(i); } pick=c[rand(c.length)]; }
        busy=false; play(pick); }, 600); }
    ui.board.addEventListener('click', e=>{ const x=e.target.closest('.ttt button'); if(!x||over||busy||cpu()) return; const i=+x.dataset.i; if(b[i]===null) play(i); });
    newGame();
  }});

/* ---------- 四子棋 ---------- */
reg({id:'c4', cat:'board', title:'四子棋', emoji:'🔴',
  desc:'棋子會掉到最下面！先把四顆連成一線的人贏。',
  explain:{
  1:`<p>四子棋的棋子會<b>往下掉</b>，所以不能想放哪就放哪，只能選「哪一行」。</p>
  <p><b>小祕訣：</b></p>
  <ul><li><b>搶中間那一行</b>：中間的棋子可以往左、往右、往斜的連，機會最多。</li><li>對手有<b>三顆連在一起</b>，旁邊又有空位 → 趕快擋！</li>
  <li>下之前想一想：我這顆下去，會不會剛好<b>幫對手墊高</b>，讓他下一顆就連成四顆？</li></ul>
  <p>💭 橫的、直的、斜的都要看，斜的最容易漏掉！</p>`,
  2:`<p><b>棋盤上一共有幾條「四連線」？</b>7 行 × 6 列的棋盤：</p>
  <div class="ex">橫的：每列有 4 種位置 × 6 列 ＝ 24<br>直的：每行有 3 種位置 × 7 行 ＝ 21<br>斜的：兩個方向各 4 × 3 ＝ 12，共 24<br>合計 <b>69</b> 條</div>
  <p>正中間那一行的格子，參與的連線最多，所以<b>中間行最有價值</b>。</p>
  <p><b>必勝型：</b>同時有兩個地方「再一顆就連成四顆」，對手只能擋一個。更厲害的是<b>上下相鄰</b>的兩個必勝點：對手擋了下面那格，你就下在它上面。</p>
  <p>💭 因為棋子會往下掉，有些必勝點要等別人先把下面填滿才下得到——這是四子棋特有的策略。</p>`,
  3:`<p>四子棋是<b>已解遊戲</b>：1988 年，James Allen 和 Victor Allis 各自用電腦證明——</p>
  <div class="ex">先手第一步下<b>正中間那一行</b>，之後每步都下對，一定能贏。<br>第一步下中間左右兩行：平手；下更外側：反而後手勝。</div>
  <p>7 × 6 棋盤所有可能出現的盤面約有 <b>4.5 × 10¹²</b>（四兆五千億）種，人不可能背下來，所以高手靠的是原則：</p>
  <ul><li><b>奇偶原則：</b>棋盤有 6 列，雙方輪流下，如果其他行都填滿，先手會拿到奇數列（1、3、5）的格子，後手拿到偶數列。所以先手要在<b>奇數列</b>製造必勝點，後手要在<b>偶數列</b>。</li>
  <li><b>迫移（Zugzwang）：</b>逼對手「不得不下」某一格，下了就幫你墊好腳。</li></ul>
  <p>💭 電腦下棋用的是 minimax 加上「α-β 剪枝」：確定比已知選擇更差的分支就不再往下算，可以省掉大部分的計算。</p>`},
  mount(el){
    const opts = {mode:'easy', first:'me'};
    const ui = shell(el, `<p>兩個人輪流把棋子丟進棋盤，棋子會<b>掉到那一行的最下面</b>。</p><ul><li>點任何一行就會放棋子。</li><li>先把自己的 <b>4 顆</b>連成一線（橫、直、斜）的人贏。</li></ul>`,
      [{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const C=7, R=6, WIN=[];
    for(let r=0;r<R;r++) for(let c=0;c<C;c++) for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
      const w=[]; for(let k=0;k<4;k++){ const rr=r+dr*k, cc=c+dc*k; if(rr<0||rr>=R||cc<0||cc>=C) break; w.push(rr*C+cc); } if(w.length===4) WIN.push(w); }
    let g, turn, over, busy, win, last;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    const drop = (gg,c,p)=>{ for(let r=0;r<R;r++) if(gg[r*C+c]===null){ gg[r*C+c]=p; return r*C+c; } return -1; };
    const won = gg => WIN.find(w=>gg[w[0]]!==null && w.every(i=>gg[i]===gg[w[0]]));
    function evalB(gg, me){ let s=0; for(const w of WIN){ let a=0,o=0; for(const i of w){ if(gg[i]===me) a++; else if(gg[i]!==null) o++; }
        if(a&&o) continue; if(a===3) s+=50; else if(a===2) s+=6; else if(o===3) s-=45; else if(o===2) s-=5; }
      for(let r=0;r<R;r++) if(gg[r*C+3]===me) s+=4; return s; }
    function nega(gg, depth, a, bt, p, me){
      const w=won(gg); if(w) return (gg[w[0]]===p ? 1 : -1) * (100000+depth);
      if(depth===0 || gg.every(v=>v!==null)) return evalB(gg,p);
      let best=-1e9;
      for(const c of [3,2,4,1,5,0,6]){ const i=drop(gg,c,p); if(i<0) continue; const s=-nega(gg,depth-1,-bt,-a,1-p,me); gg[i]=null;
        if(s>best) best=s; if(best>a) a=best; if(a>=bt) break; }
      return best; }
    function newGame(){ runId++; g=Array(C*R).fill(null); turn=opts.first==='me'?0:1; over=false; busy=false; win=null; last=-1; draw(); maybe(); }
    function draw(){
      let h=''; for(let r=R-1;r>=0;r--) for(let c=0;c<C;c++){ const i=r*C+c, v=g[i]; h+=`<button data-c="${c}" class="${v===0?'p0':v===1?'p1':''} ${win&&win.includes(i)?'win':''} ${i===last?'last':''}"></button>`; }
      ui.board.innerHTML = `<div class="c4">${h}</div>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : turnHTML(playerNames(opts.mode), turn));
    }
    function play(c){ const i=drop(g,c,turn); if(i<0) return; last=i; win=won(g);
      if(win || g.every(v=>v!==null)){ over=true; draw(); endTwoPlayer(ui, opts.mode, win?turn:-1, newGame, '棋盤滿了，沒有人連成四顆。'); return; }
      turn=1-turn; draw(); maybe(); }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ const cols=[3,2,4,1,5,0,6].filter(c=>g[(R-1)*C+c]===null); let pick;
        if(opts.mode==='easy' && Math.random()<0.25) pick=cols[rand(cols.length)];
        else { const d=opts.mode==='hard'?6:2; let bs=-1e9, cs=[]; for(const c of cols){ const i=drop(g,c,1); const s=-nega(g,d-1,-1e9,1e9,0,1); g[i]=null; if(s>bs){bs=s;cs=[c];} else if(s===bs) cs.push(c); } pick=cs[rand(cs.length)]; }
        busy=false; play(pick); }, 500); }
    ui.board.addEventListener('click', e=>{ const x=e.target.closest('.c4 button'); if(!x||over||busy||cpu()) return; play(+x.dataset.c); });
    newGame();
  }});

/* ---------- 五子棋 ---------- */
reg({id:'gomoku', cat:'board', title:'五子棋', emoji:'⚫',
  desc:'黑白輪流下，先把五顆棋子連成一線的人贏。',
  explain:{
  1:`<p>先連成 <b>5 顆</b>的人贏，橫的、直的、斜的都算。</p>
  <p><b>最重要的一課：看到「活三」就要擋！</b></p>
  <div class="ex"><b>活三</b>：三顆連在一起，而且<b>兩頭都是空的</b>。<br>如果不擋，對手再下一顆變成「活四」（四顆、兩頭都空），你擋了這頭、他下那頭，就輸了！</div>
  <p><b>小祕訣：</b></p>
  <ul><li>棋子下在<b>中間</b>比下在邊邊好，四面八方都能連。</li><li>自己的棋子盡量下在<b>附近</b>，讓它們互相幫忙。</li><li>每下一步前，先看對手有沒有三顆或四顆連在一起。</li></ul>`,
  2:`<p>五子棋有幾個重要的「棋形」：</p>
  <div class="ex"><b>活四</b>：四顆、兩頭都空 → 擋不住，必勝。<br><b>沖四</b>：四顆、只有一頭空 → 對手一定要擋那一格。<br><b>活三</b>：三顆、兩頭都空 → 不擋就會變活四。</div>
  <p><b>必勝的組合：一顆棋同時做出兩個威脅。</b></p>
  <ul><li><b>四三</b>：同時有一個沖四和一個活三。對手擋四，你的活三就變活四。</li><li><b>雙活三（三三）</b>：對手只能擋一個。</li><li><b>雙四（四四）</b>：兩個四，擋不完。</li></ul>
  <p>所以高手一直在做的事是：一邊用沖四、活三<b>逼對手非擋不可</b>，一邊把棋子佈置成能做出「四三」的形狀。</p>
  <p>💭 先下的人（黑棋）多一顆棋的優勢，其實非常大。</p>`,
  3:`<p><b>先手優勢有多大？</b>1993 年，Victor Allis 用電腦證明：在 15 × 15 棋盤、沒有任何限制的規則下，<b>先手（黑棋）必勝</b>。</p>
  <p>所以正式比賽會加上規則來平衡，例如對黑棋的<b>禁手</b>（不能下三三、四四、六顆以上的長連），或讓雙方交換選邊的開局規則。</p>
  <p><b>數數看：棋盤上有幾個「五連」的位置？</b>n × n 的棋盤：</p>
  <div class="ex">橫的：每列有 (n－4) 種 → n(n－4)<br>直的：n(n－4)<br>斜的：兩個方向各 (n－4)²<br>合計 2n(n－4) ＋ 2(n－4)² ＝ <b>2(n－4)(2n－4)</b></div>
  <p>n ＝ 15 時是 2 × 11 × 26 ＝ <b>572</b> 個。</p>
  <p>電腦判斷好棋的方法，就是幫每一個空格「打分數」：下在這裡能讓自己形成什麼棋形、能破壞對手什麼棋形，把分數加起來選最高的——這個網頁的電腦就是這樣下的。</p>
  <p>💭 一個角落的格子只在 3 個五連裡，正中央的格子卻在 20 個五連裡。這就是「中間比較好」的數學理由。</p>`},
  mount(el){
    const opts = {n:13, mode:'easy', first:'me'};
    const ui = shell(el, `<p>黑棋和白棋輪流下在<b>線的交叉點</b>上。</p><ul><li>先把自己的 <b>5 顆</b>棋子連成一線（橫、直、斜）的人贏。</li><li>下了就不能移動。</li></ul>`,
      [{key:'n', label:'棋盤', options:[[9,'9 路'],[13,'13 路'],[15,'15 路']]},{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const D=[[0,1],[1,0],[1,1],[1,-1]];
    let N, b, turn, over, busy, last, win;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    const at=(r,c)=> r<0||r>=N||c<0||c>=N ? -1 : b[r*N+c];
    function run(r,c,dr,dc,p){ let n=0; while(at(r+dr*(n+1),c+dc*(n+1))===p) n++; return [n, at(r+dr*(n+1),c+dc*(n+1))===0]; }
    function score(r,c,p){ let s=0;
      for(const [dr,dc] of D){ const [a,oa]=run(r,c,dr,dc,p), [z,oz]=run(r,c,-dr,-dc,p), len=a+z+1, open=(oa?1:0)+(oz?1:0);
        if(len>=5) s+=1e6; else if(len===4) s+= open===2?1e5: open===1?1e4:0; else if(len===3) s+= open===2?5e3: open===1?400:0;
        else if(len===2) s+= open===2?200: open===1?30:0; else s+= open===2?10:1; }
      return s; }
    function winLine(r,c,p){ for(const [dr,dc] of D){ const cells=[[r,c]]; for(const sg of [1,-1]){ let k=1; while(at(r+dr*k*sg,c+dc*k*sg)===p){ cells.push([r+dr*k*sg,c+dc*k*sg]); k++; } } if(cells.length>=5) return cells.map(([a,z])=>a*N+z); } return null; }
    function newGame(){ runId++; N=opts.n; b=Array(N*N).fill(0); turn=opts.first==='me'?0:1; over=false; busy=false; last=-1; win=null; draw(); maybe(); }
    function draw(){
      let ln='', st='', hit='';
      for(let i=0;i<N;i++) ln+=`<line x1=".5" y1="${i+.5}" x2="${N-.5}" y2="${i+.5}"/><line y1=".5" x1="${i+.5}" y2="${N-.5}" x2="${i+.5}"/>`;
      b.forEach((v,i)=>{ const r=Math.floor(i/N), c=i%N;
        if(v) st+=`<circle cx="${c+.5}" cy="${r+.5}" r=".43" fill="${v===1?'#1d1b18':'#fbfaf5'}" stroke="${win&&win.includes(i)?'#e0b23e':'#1d1b18'}" stroke-width="${win&&win.includes(i)?.12:.04}"/>${i===last?`<circle cx="${c+.5}" cy="${r+.5}" r=".12" fill="#c9482f"/>`:''}`;
        else hit+=`<rect data-i="${i}" x="${c}" y="${r}" width="1" height="1" fill="transparent"/>`; });
      ui.board.innerHTML = `<svg class="gomoku" viewBox="0 0 ${N} ${N}"><rect width="${N}" height="${N}" rx=".3" fill="#dcb673"/><g stroke="#6b4a1f" stroke-width=".04">${ln}</g>
        <circle cx="${N/2}" cy="${N/2}" r=".1" fill="#6b4a1f"/>${st}${hit}</svg>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : `輪到 <b>${turn===0?'⚫ 黑棋':'⚪ 白棋'}</b>${opts.mode==='pvp'?'':'（你）'}`);
    }
    function play(i){ const p=turn+1, r=Math.floor(i/N), c=i%N; b[i]=p; last=i; win=winLine(r,c,p);
      if(win || b.every(v=>v)){ over=true; draw(); endTwoPlayer(ui, opts.mode, win?turn:-1, newGame, '棋盤下滿了！'); return; }
      turn=1-turn; draw(); maybe(); }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ let best=-1, cs=[];
        for(let i=0;i<N*N;i++){ if(b[i]) continue; const r=Math.floor(i/N), c=i%N; let near=false;
          for(let dr=-2;dr<=2&&!near;dr++) for(let dc=-2;dc<=2;dc++) if(at(r+dr,c+dc)>0){ near=true; break; }
          if(!near) continue;
          let s=score(r,c,2)+score(r,c,1)*0.9; if(opts.mode==='easy') s*=0.55+Math.random()*0.9;
          if(s>best){ best=s; cs=[i]; } else if(s===best) cs.push(i); }
        if(!cs.length) cs=[Math.floor(N/2)*N+Math.floor(N/2)];
        busy=false; play(cs[rand(cs.length)]); }, 450); }
    ui.board.addEventListener('click', e=>{ const x=e.target.closest('rect[data-i]'); if(!x||over||busy||cpu()) return; play(+x.dataset.i); });
    newGame();
  }});

/* ---------- 黑白棋 ---------- */
reg({id:'reversi', cat:'board', title:'黑白棋', emoji:'⚪',
  desc:'夾住對手的棋子就能把它翻成自己的顏色，最後誰的棋子多？',
  explain:{
  1:`<p>用自己的兩顆棋子把對手的棋子<b>夾在中間</b>，被夾住的就會翻成你的顏色。橫的、直的、斜的都可以夾。</p>
  <p><b>最重要的祕密：搶角落！</b></p>
  <div class="ex">角落的棋子<b>永遠不會被夾住</b>（因為它外面沒有格子了），所以一輩子都是你的。</div>
  <p><b>小心：</b>角落<b>旁邊</b>的三格很危險！你下在那裡，對手就有機會踩著你的棋子跳進角落。</p>
  <p>💭 一開始翻比較多不一定比較好。黑白棋常常到最後幾步才大逆轉！</p>`,
  2:`<p>黑白棋的高手不比「現在誰的棋子多」，比的是這三件事：</p>
  <ul><li><b>穩定子：</b>再也不會被翻回去的棋子。角落一定是穩定子，從角落沿著邊連出去的棋子通常也是。</li>
  <li><b>行動力：</b>你有幾個地方可以下。讓對手<b>可以下的地方越少越好</b>，他就會被逼著下到爛位置（例如角落旁邊）。</li>
  <li><b>壞位置：</b>角落斜對面那一格（X 位）最危險，角落旁邊緊貼邊的兩格（C 位）也要小心。</li></ul>
  <div class="ex">前半盤：<b>棋子少一點反而好</b>，因為你的棋子少，對手能夾的地方就少、行動力就低。</div>
  <p><b>數學：</b>8 × 8 棋盤有 64 格，開始已經放了 4 顆，所以最多下 60 步。最後兩人的棋子數相加一定是 64（下滿的話），超過 32 顆就贏。</p>`,
  3:`<p>黑白棋規則簡單，變化卻非常多：可能出現的盤面約有 <b>10²⁸</b> 種。</p>
  <div class="ex">4 × 4 棋盤：後手必勝。<br>6 × 6 棋盤：1993 年算出雙方下最好時<b>後手以 20 比 16 獲勝</b>。<br>8 × 8 棋盤：2023 年有研究者用大量電腦計算後宣布——雙方都下最好時是<b>平手</b>。</div>
  <p><b>電腦怎麼下？</b></p>
  <ul><li><b>評估函數：</b>幫每一格訂權重（角落大加分、X 位大扣分），再加上行動力、穩定子的分數。</li>
  <li><b>搜尋：</b>用 minimax 往後看好幾步，並用 α-β 剪枝省略不必要的分支。</li>
  <li><b>終局完全搜尋：</b>剩下十幾格時，直接把所有變化算完。這時電腦絕對不會失誤。</li></ul>
  <p>💭 <b>奇偶性：</b>一個被圍住的空區如果有奇數個空格，先下進去的人會下到「最後一手」，通常比較有利。</p>`},
  mount(el){
    const opts = {n:8, mode:'easy', first:'me'};
    const ui = shell(el, `<p>黑棋和白棋輪流下。</p><ul><li>每一步都要<b>夾住</b>對手至少一顆棋子（橫、直、斜），被夾住的會翻成你的顏色。</li>
      <li>小圓點是可以下的地方。沒有地方可以下就要<b>跳過</b>。</li><li>兩邊都不能下時結束，<b>棋子多的人贏</b>。</li></ul>`,
      [{key:'n', label:'棋盤', options:[[6,'6 × 6'],[8,'8 × 8']]},{key:'mode', label:'對手', options:OPP},{key:'first', label:'先手', options:FIRST}], opts, newGame);
    const D8=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    let N, b, turn, over, busy, last, msg, W;
    const cpu = ()=>opts.mode!=='pvp' && turn===1;
    function flips(bb,i,p){ if(bb[i]) return []; const r=Math.floor(i/N), c=i%N, out=[];
      for(const [dr,dc] of D8){ const line=[]; let rr=r+dr, cc=c+dc;
        while(rr>=0&&rr<N&&cc>=0&&cc<N&&bb[rr*N+cc]===3-p){ line.push(rr*N+cc); rr+=dr; cc+=dc; }
        if(line.length&&rr>=0&&rr<N&&cc>=0&&cc<N&&bb[rr*N+cc]===p) out.push(...line); }
      return out; }
    const moves=(bb,p)=>{ const m=[]; for(let i=0;i<N*N;i++) if(!bb[i] && flips(bb,i,p).length) m.push(i); return m; };
    const cnt=(bb,p)=>bb.filter(v=>v===p).length;
    function evalB(bb,p){ let s=0; for(let i=0;i<N*N;i++) if(bb[i]) s+=(bb[i]===p?1:-1)*W[i]; return s + 6*(moves(bb,p).length-moves(bb,3-p).length); }
    function search(bb,p,d,a,bt,passed){
      const ms=moves(bb,p);
      if(!ms.length){ if(passed) return (cnt(bb,p)-cnt(bb,3-p))*1000; return -search(bb,3-p,d,-bt,-a,true); }
      if(d===0) return evalB(bb,p);
      let best=-1e9;
      for(const i of ms){ const f=flips(bb,i,p), nb=bb.slice(); nb[i]=p; f.forEach(k=>nb[k]=p);
        const s=-search(nb,3-p,d-1,-bt,-a,false); if(s>best) best=s; if(best>a) a=best; if(a>=bt) break; }
      return best; }
    function newGame(){ runId++; N=opts.n; b=Array(N*N).fill(0); const h=N/2;
      b[(h-1)*N+h-1]=2; b[h*N+h]=2; b[(h-1)*N+h]=1; b[h*N+h-1]=1;
      W=Array.from({length:N*N},(_,i)=>{ const r=Math.floor(i/N), c=i%N, er=r===0||r===N-1, ec=c===0||c===N-1, nr=r===1||r===N-2, nc=c===1||c===N-2;
        if(er&&ec) return 120; if(nr&&nc) return -40; if((er&&nc)||(ec&&nr)) return -20; if(er||ec) return 15; return 2; });
      turn=opts.first==='me'?0:1; over=false; busy=false; last=-1; msg=''; draw(); maybe(); }
    function draw(){
      const ms = (!over && !cpu()) ? moves(b,turn+1) : [];
      ui.board.innerHTML = `<div class="rv-score"><span>⚫ ${cnt(b,1)}</span><span>⚪ ${cnt(b,2)}</span></div>
        <div class="reversi" style="grid-template-columns:repeat(${N},1fr)">${b.map((v,i)=>`<button data-i="${i}" class="${i===last?'last':''}">${v?`<i class="${v===1?'bk':'wh'}"></i>`:ms.includes(i)?'<u></u>':''}</button>`).join('')}</div>
        <div class="msg">${msg}</div>`;
      if(!over) ui.setStatus(cpu() ? '🤔 電腦想一想…' : `輪到 <b>${turn===0?'⚫ 黑棋':'⚪ 白棋'}</b>${opts.mode==='pvp'?'':'（你）'}`);
    }
    function finish(){ over=true; draw(); const a=cnt(b,1), z=cnt(b,2);
      endTwoPlayer(ui, opts.mode, a===z?-1:(a>z?0:1), newGame, `${a} 比 ${z}，一樣多！`);
      document.getElementById('mText').innerHTML = `⚫ ${a}　比　⚪ ${z}`; }
    function play(i){ const p=turn+1, f=flips(b,i,p); b[i]=p; f.forEach(k=>b[k]=p); last=i; msg='';
      if(moves(b,3-p).length) turn=1-turn;
      else if(moves(b,p).length) msg=`${p===1?'白棋':'黑棋'}沒有地方可以下，跳過一次！`;
      else { finish(); return; }
      draw(); maybe(); }
    function maybe(){ if(!cpu()||over) return; busy=true;
      later(()=>{ const ms=moves(b,2); let pick;
        if(opts.mode==='easy'){ const sc=ms.map(i=>flips(b,i,2).length+W[i]/20+Math.random()*3); pick=ms[sc.indexOf(Math.max(...sc))]; }
        else { const empty=b.filter(v=>!v).length, d = empty<=10 ? 12 : (N===8?4:5); let bs=-1e9;
          for(const i of ms){ const f=flips(b,i,2), nb=b.slice(); nb[i]=2; f.forEach(k=>nb[k]=2); const s=-search(nb,1,d-1,-1e9,1e9,false); if(s>bs){ bs=s; pick=i; } } }
        busy=false; play(pick); }, 600); }
    ui.board.addEventListener('click', e=>{ const x=e.target.closest('.reversi button'); if(!x||over||busy||cpu()) return; const i=+x.dataset.i;
      if(flips(b,i,turn+1).length) play(i); else if(!b[i]){ msg='這裡夾不到對手的棋子，要下在有小圓點的地方。'; draw(); } });
    newGame();
  }});

/* ---------- 撲克牌共用 ---------- */
const SUITS = ['♠','♥','♦','♣'], RANKS = ['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const isRed = s => s===1 || s===2;
function newDeck(){ const d=[]; for(let s=0;s<4;s++) for(let r=1;r<=13;r++) d.push({r,s}); return shuffle(d); }

/* ---------- 接龍 ---------- */
reg({id:'klondike', cat:'board', title:'接龍', emoji:'🃏',
  desc:'經典的單人撲克牌遊戲：紅黑交錯往下接，把四種花色從 A 收到 K。',
  explain:{
  1:`<p><b>兩個接牌規則：</b></p>
  <div class="ex">下面的七排：<b>紅黑交錯</b>，數字<b>一張比一張小 1</b>。<br>例如：黑 9 → 紅 8 → 黑 7<br><br>右上的四格：<b>同一種花色</b>，從 A 開始<b>一張比一張大 1</b>。<br>例如：♥A → ♥2 → ♥3 …</div>
  <p>J 是 11，Q 是 12，K 是 13，A 是 1。</p>
  <p><b>小祕訣：</b></p>
  <ul><li>先想辦法<b>翻開蓋住的牌</b>，蓋最多的那幾排優先。</li><li>A 和 2 一出現就收上去。</li><li>空的位置只能放 <b>K</b>，所以沒有 K 的時候不要急著清空一排。</li></ul>`,
  2:`<p><b>先算一算牌：</b>一副牌 4 種花色 × 13 張 ＝ 52 張。</p>
  <div class="ex">七排各有 1、2、3、4、5、6、7 張：1＋2＋…＋7 ＝ <b>28</b> 張<br>其中翻開的 7 張，蓋住的 28 － 7 ＝ <b>21</b> 張<br>左上的牌堆：52 － 28 ＝ <b>24</b> 張</div>
  <p><b>不是每一局都解得開！</b>有些牌一發下來就註定無解（例如需要的牌互相壓住）。數學家用電腦模擬了大量牌局，估計大約<b>八成</b>的牌局理論上有解，但因為我們看不到蓋住的牌，實際能贏的比例低很多。</p>
  <p><b>策略：</b></p>
  <ul><li>有兩種走法時，選<b>能翻開新牌</b>的那一種。</li><li>不要太早把牌收到右上角——有時候它還要留在下面讓別的牌接。</li>
  <li>同樣是紅 6，要接到哪張黑 7 上面？先想想哪一排更需要被清開。</li></ul>`,
  3:`<p><b>一副牌有幾種排列？</b>第 1 張有 52 種可能，第 2 張剩 51 種…</p>
  <div class="ex">52! ＝ 52 × 51 × 50 × … × 1 ≈ <b>8 × 10⁶⁷</b></div>
  <p>這個數字大到無法想像：宇宙年齡大約只有 4 × 10¹⁷ 秒。就算從宇宙誕生起每秒洗一億次牌，到現在也只洗了 10²⁶ 次左右。所以——</p>
  <div class="ex">你每一次把牌洗勻，幾乎可以確定是<b>人類史上第一次</b>出現這個順序。</div>
  <p>這就是<b>階乘</b>的成長速度：10! 約 363 萬，20! 約 2.4 × 10¹⁸，比指數函數還快。</p>
  <p><b>機率小題：</b>發牌後七張翻開的牌裡，至少有一張 A 的機率是多少？用「1 － 一張 A 都沒有」來算：</p>
  <div class="ex">1 － (48×47×46×45×44×43×42) ÷ (52×51×50×49×48×47×46) ≈ <b>45%</b></div>
  <p>💭 「接龍到底有多少比例解得開」至今沒有公式，只能靠電腦模擬估計，是機率研究裡有名的難題。</p>`},
  mount(el){
    const ui = shell(el, `<p>目標：把 52 張牌依<b>花色</b>從 A 到 K 收到右上的四格。</p>
      <ul><li><b>點一張牌</b>，它會自動移到可以放的地方。</li><li>下面七排：<b>紅黑交錯、數字遞減</b>（黑 9 上可以放紅 8）。</li>
      <li>空的排只能放 <b>K</b>。</li><li>點左上的牌堆可以翻新牌。</li></ul>`, [], {}, newGame);
    let stock, waste, found, tab, hist, moves, msg;
    const snap=()=>JSON.stringify({stock,waste,found,tab});
    function newGame(){ runId++; const d=newDeck(); tab=[]; for(let i=0;i<7;i++){ const col=d.splice(0,i+1).map(c=>({...c,up:false})); col[i].up=true; tab.push(col); }
      stock=d; waste=[]; found=[[],[],[],[]]; hist=[]; moves=0; msg=''; draw(); }
    const canFound=c=>found[c.s].length===c.r-1;
    const canTab=(c,col)=> col.length ? (col[col.length-1].up && isRed(col[col.length-1].s)!==isRed(c.s) && col[col.length-1].r===c.r+1) : c.r===13;
    function card(c, attr, style=''){ return c.up===false ? `<button class="kc back" ${attr} style="${style}"></button>` :
      `<button class="kc ${isRed(c.s)?'red':''}" ${attr} style="${style}"><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i><span>${SUITS[c.s]}</span></button>`; }
    function draw(){
      const done = found.reduce((a,f)=>a+f.length,0);
      const auto = !stock.length && !waste.length && tab.every(col=>col.every(c=>c.up)) && done<52;
      ui.board.innerHTML = `<div class="kl">
        <div class="kl-top">
          <div class="slot">${stock.length?`<button class="kc back" data-a="stock"></button>`:`<button class="kc empty" data-a="stock">↻</button>`}</div>
          <div class="slot">${waste.length?card(waste[waste.length-1],'data-a="waste"'):''}</div><div></div>
          ${found.map((f,s)=>`<div class="slot f">${f.length?card({...f[f.length-1]},''):`<span class="kc empty ${isRed(s)?'red':''}">${SUITS[s]}</span>`}</div>`).join('')}
        </div>
        <div class="kl-tab">${tab.map((col,j)=>`<div class="col">${col.length?col.map((c,k)=>card(c, `data-a="tab" data-j="${j}" data-k="${k}"`, k?`margin-top:${col[k-1].up?-100:-118}%`:'')).join(''):'<span class="kc empty"></span>'}</div>`).join('')}</div></div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${hist.length?'':'disabled'}>↩ 上一步</button>${auto?'<button class="btn big autob">✨ 自動收牌</button>':''}</div>`;
      ui.setStatus(`已收 ${big(done)} / 52 張　｜　${moves} 步`);
    }
    function after(){ moves++; tab.forEach(col=>{ if(col.length && !col[col.length-1].up) col[col.length-1].up=true; }); msg='';
      draw(); if(found.every(f=>f.length===13)) showWin('🃏','全部收完了！',`你用了 <b>${moves}</b> 步完成接龍。`, newGame, '再來一局'); }
    function place(cards, fromCol){
      const c=cards[0];
      if(cards.length===1 && canFound(c)){ found[c.s].push({r:c.r,s:c.s}); return true; }
      const order=[...tab.keys()].filter(j=>j!==fromCol && tab[j].length).concat([...tab.keys()].filter(j=>j!==fromCol && !tab[j].length));
      for(const j of order) if(canTab(c,tab[j])){ tab[j].push(...cards.map(x=>({...x,up:true}))); return true; }
      return false;
    }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('[data-a]');
      if(x){ const a=x.dataset.a, before=snap();
        if(a==='stock'){ if(stock.length){ const c=stock.pop(); waste.push(c); } else if(waste.length){ stock=waste.reverse(); waste=[]; } else return; hist.push(before); moves++; msg=''; draw(); return; }
        if(a==='waste'){ const c=waste[waste.length-1]; if(place([c],-1)){ waste.pop(); hist.push(before); after(); } else { msg=`${SUITS[c.s]}${RANKS[c.r]} 現在沒有地方可以放。`; draw(); } return; }
        const j=+x.dataset.j, k=+x.dataset.k, col=tab[j]; if(!col[k].up) return;
        if(k===0 && col[0].r===13 && !(col.length===1 && canFound(col[0])) && !tab.some((t,i)=>i!==j&&t.length&&canTab(col[0],t))) { msg='K 已經在最上面了。'; draw(); return; }
        const cards=col.slice(k);
        if(place(cards,j)){ col.splice(k); hist.push(before); after(); } else { msg=`${SUITS[cards[0].s]}${RANKS[cards[0].r]} 現在沒有地方可以放。`; draw(); }
      }
      else if(e.target.closest('.undo')){ ({stock,waste,found,tab}=JSON.parse(hist.pop())); msg=''; draw(); }
      else if(e.target.closest('.autob')){ (function step(){ for(const col of tab){ const c=col[col.length-1]; if(c && canFound(c)){ col.pop(); found[c.s].push(c); moves++; draw(); if(found.every(f=>f.length===13)){ showWin('🃏','全部收完了！',`你用了 <b>${moves}</b> 步完成接龍。`, newGame, '再來一局'); return; } later(step,70); return; } } })(); }
    });
    newGame();
  }});

/* ---------- 排七 ---------- */
reg({id:'sevens', cat:'board', title:'排七', emoji:'7️⃣',
  desc:'從 7 開始往兩邊接牌。沒牌可出就要蓋牌，蓋的點數越少越好！',
  explain:{
  1:`<p>每一種花色都從 <b>7</b> 開始，往兩邊照順序接：</p>
  <div class="ex">往大的接：7 → 8 → 9 → 10 → J → Q → K<br>往小的接：7 → 6 → 5 → 4 → 3 → 2 → A</div>
  <p>所以桌上有 ♥7、♥8 的時候，下一張只能出 <b>♥6</b> 或 <b>♥9</b>。</p>
  <p><b>蓋牌會扣分：</b>A 是 1 分、2 是 2 分……J 是 11、Q 是 12、K 是 13 分。最後蓋牌<b>分數加起來最少</b>的人贏。</p>
  <p><b>小祕訣：</b></p>
  <ul><li>一定要蓋牌的時候，<b>蓋數字小的</b>（蓋 A 只扣 1 分，蓋 K 要扣 13 分！）。</li><li>手上的 K、Q 這些大牌，要想辦法早點出掉。</li></ul>`,
  2:`<p><b>排七的精髓是「卡牌」。</b></p>
  <div class="ex">你手上有 ♠8，桌上只有 ♠7。只要你<b>不出 ♠8</b>，別人手上的 ♠9、♠10、J、Q、K 通通出不去，只能蓋牌！</div>
  <p>所以 <b>6 和 8</b> 是最有威力的牌，接著是 5 和 9。高手會：</p>
  <ul><li><b>先出「不會幫到別人」的牌</b>：例如自己同時有 ♥8 和 ♥9，出了 ♥8 之後能接的 ♥9 也在自己手上。</li>
  <li><b>把關鍵的 6、8 留到最後</b>，但要小心：規則是「有牌能出就一定要出」，手上只剩它能出時就非出不可。</li></ul>
  <p><b>算分數：</b>一種花色的點數總和是 1＋2＋…＋13 ＝ <b>91</b>，四種花色共 <b>364</b> 分。</p>
  <p><b>蓋牌的學問：</b>蓋小牌扣分少；但如果手上某個花色又大又接不上（像單獨一張 K），有時不如早點蓋掉別的牌、把出牌機會留給它。</p>
  <p>💭 看別人蓋牌的時機，可以猜出他缺哪個花色、哪張牌被誰卡住。</p>`,
  3:`<p><b>等差級數：</b>一種花色的總點數</p>
  <div class="ex">1 ＋ 2 ＋ … ＋ 13 ＝ 13 × (1＋13) ÷ 2 ＝ <b>91</b></div>
  <p>一副牌 364 分，平均每張牌 364 ÷ 52 ＝ <b>7 分</b>——剛好就是「7」！所以隨便蓋一張牌，平均扣 7 分（這叫<b>期望值</b>）；蓋 A 比平均少 6 分，蓋 K 比平均多 6 分。</p>
  <p><b>發牌有幾種可能？</b>52 張牌分給 4 人、每人 13 張：</p>
  <div class="ex">C(52,13) × C(39,13) × C(26,13) × C(13,13) ＝ 52! ÷ (13!)⁴ ≈ <b>5.4 × 10²⁸</b> 種</div>
  <p><b>機率：</b>你拿到某一張指定的牌（例如 ♠7）的機率是 13 ÷ 52 ＝ ¼。你一張 7 都沒拿到的機率是 C(48,13) ÷ C(52,13) ≈ 30%。</p>
  <p><b>資訊不完全的賽局：</b>井字棋、五子棋所有資訊都攤在桌上；排七看不到別人的手牌和蓋牌，所以要靠<b>推理</b>：桌上有 ♦7 很久了，♦6 一直沒人出——♦6 不是被卡在某人手上，就是已經被蓋掉。每一次有人蓋牌，都透露了「他這時沒有任何能出的牌」。</p>`},
  mount(el){
    const ui = shell(el, `<p>你和三位電腦玩家，每人 13 張牌。</p>
      <ul><li>拿到 <b>♠7</b> 的人先出。之後每種花色都從 7 開始，往大、往小<b>照順序接</b>。</li>
      <li>輪到你時，<b>亮起來的牌</b>可以出。有牌能出就一定要出。</li><li>沒有牌可以出，就要選一張<b>蓋牌</b>（扣分：A＝1 … K＝13）。</li>
      <li>全部出完後，<b>蓋牌點數最少</b>的人贏。</li></ul>`, [], {}, newGame);
    const NAME=['你','電腦甲','電腦乙','電腦丙'];
    let hands, cover, table, turn, over, log, started;
    const can = c => !started ? (c.s===0 && c.r===7) : (c.r===7 || (table[c.s] && (c.r===table[c.s][0]-1 || c.r===table[c.s][1]+1)));
    function newGame(){ runId++; const d=newDeck(); hands=[0,1,2,3].map(i=>d.slice(i*13,i*13+13).sort((a,b)=>a.s-b.s||a.r-b.r)); cover=[[],[],[],[]];
      table=[null,null,null,null]; started=false; over=false; log='';
      turn=hands.findIndex(h=>h.some(c=>c.s===0&&c.r===7)); log=`${NAME[turn]}有 ♠7，先出牌。`; draw(); next(); }
    function draw(){
      const mine=hands[0], any=mine.some(can), myTurn=turn===0&&!over;
      ui.board.innerHTML = `<div class="sv-players">${[1,2,3].map(p=>`<div class="${turn===p&&!over?'on':''}"><b>${NAME[p]}</b>手牌 ${hands[p].length}・蓋 ${cover[p].length}</div>`).join('')}</div>
        <div class="sv-table">${SUITS.map((sy,s)=>`<div class="sv-row ${isRed(s)?'red':''}"><em>${sy}</em>${RANKS.slice(1).map((rk,i)=>{ const r=i+1, on=table[s]&&r>=table[s][0]&&r<=table[s][1]; return `<span class="${on?'on':''} ${r===7?'seven':''}">${rk}</span>`; }).join('')}</div>`).join('')}</div>
        <div class="msg" style="color:var(--ink)">${log}</div>
        <div class="sv-hand">${mine.map((c,i)=>`<button class="kc ${isRed(c.s)?'red':''} ${myTurn&&can(c)?'ok':''} ${myTurn&&!any?'cov':''}" data-i="${i}"><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i><span>${SUITS[c.s]}</span></button>`).join('')}</div>
        <div class="sv-mine">你蓋了 ${cover[0].length} 張${cover[0].length?`（${cover[0].map(c=>SUITS[c.s]+RANKS[c.r]).join('、')}），共 <b>${cover[0].reduce((a,c)=>a+c.r,0)}</b> 分`:''}</div>`;
      if(!over) ui.setStatus(turn===0 ? (any ? '輪到<span class="badge p0">你</span>：選一張亮起來的牌' : '沒有牌可以出 😢 選一張<b>蓋牌</b>') : `🤔 ${NAME[turn]}出牌中…`);
    }
    function put(p,i){ const c=hands[p].splice(i,1)[0]; started=true;
      if(!table[c.s]) table[c.s]=[7,7]; else { table[c.s][0]=Math.min(table[c.s][0],c.r); table[c.s][1]=Math.max(table[c.s][1],c.r); }
      log=`${NAME[p]}出了 <b class="${isRed(c.s)?'redt':''}">${SUITS[c.s]}${RANKS[c.r]}</b>`; }
    function hide(p,i){ const c=hands[p].splice(i,1)[0]; cover[p].push(c); log=`${NAME[p]}蓋了一張牌`; }
    function advance(){
      if(hands.every(h=>!h.length)){ over=true; draw();
        const sc=cover.map(cv=>cv.reduce((a,c)=>a+c.r,0)), best=Math.min(...sc), rows=[0,1,2,3].sort((a,b)=>sc[a]-sc[b]).map(p=>`${NAME[p]}：<b>${sc[p]}</b> 分（蓋 ${cover[p].length} 張）`).join('<br>');
        ui.setStatus(sc[0]===best?'🏆 你贏了！':'這局結束了');
        showWin(sc[0]===best?'🏆':'🃏', sc[0]===best?'你的扣分最少！':`${NAME[sc.indexOf(best)]}獲勝`, rows, newGame, '再來一局'); return; }
      do { turn=(turn+1)%4; } while(!hands[turn].length);
      draw(); next();
    }
    function next(){ if(over || turn===0) return;
      later(()=>{ const h=hands[turn], ok=h.map((c,i)=>can(c)?i:-1).filter(i=>i>=0);
        if(ok.length){ const val=i=>{ const c=h[i], has=r=>h.some(x=>x.s===c.s&&x.r===r);
            const keep = c.r===7 ? (has(6)||has(8)) : c.r>7 ? (c.r===13||has(c.r+1)) : (c.r===1||has(c.r-1));
            return (keep?20:0) + c.r/2 + Math.abs(c.r-7) + Math.random(); };
          put(turn, ok.reduce((a,i)=>val(i)>val(a)?i:a, ok[0])); }
        else hide(turn, h.reduce((a,c,i)=>c.r<h[a].r?i:a, 0));
        advance(); }, 850); }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('.sv-hand .kc'); if(!x||over||turn!==0) return; const i=+x.dataset.i, c=hands[0][i];
      if(hands[0].some(can)){ if(!can(c)){ log='這張現在不能出，請選亮起來的牌。'; draw(); return; } put(0,i); }
      else hide(0,i);
      advance();
    });
    newGame();
  }});
