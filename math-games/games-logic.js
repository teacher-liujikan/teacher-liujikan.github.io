/* ===================== 推理 ===================== */

/* ---------- 捻 ---------- */
reg({id:'nim', cat:'logic', title:'捻', emoji:'🪨',
  desc:'輪流拿石頭，想辦法拿到（或不拿到）最後一顆！',
  explain:`<p>捻（Nim）是很古老的遊戲，而且它<b>有必勝的方法</b>！</p>
  <p><b>先看最簡單的：只剩兩排。</b></p>
  <div class="ex">如果兩排<b>一樣多</b>，後拿的人贏！<br>對手在一排拿幾顆，你就在另一排拿一樣多，永遠保持兩排相同，最後一顆一定是你拿到。</div>
  <p>所以輪到你的時候，如果兩排不一樣多，就把多的那排拿到<b>跟另一排一樣</b>。</p>
  <p><b>三排以上：把每一排拆成 4、2、1。</b></p>
  <div class="ex">3 ＝ 2＋1　　5 ＝ 4＋1　　7 ＝ 4＋2＋1<br>數一數：「4」有 2 個 ✔　「2」有 2 個 ✔　「1」有 <b>3 個</b> ✘<br>只要拿走 1 顆，讓「1」也變成雙數個，就把難題丟給對手了！</div>
  <p><b>必勝祕訣：每次拿完，讓 4、2、1 每一種都是「雙數個」。</b>對手不管怎麼拿都會破壞平衡，你再把它補回來。</p>
  <p>這個方法其實就是電腦用的<b>二進位</b>。1901 年數學家布頓（Bouton）證明了它一定有效。</p>
  <p>💭「拿最後一顆輸」的玩法幾乎一樣，只有到最後每排都只剩 1 顆時要反過來：留給對手<b>單數排</b>。</p>`,
  mount(el){
    const opts = {level:'357', mode:'easy', rule:'win', first:'me'};
    const ui = shell(el, `
      <p>桌上有幾排石頭，兩邊輪流拿。</p>
      <ul><li>每次只能從<b>同一排</b>拿，至少 1 顆，想拿幾顆都可以。</li>
      <li>點一顆石頭，會選到它和它<b>右邊</b>所有石頭，再按「拿走」。</li>
      <li>可以選「拿最後一顆贏」或「拿最後一顆輸」。</li></ul>`,
      [{key:'level', label:'石頭', options:[['135','1‧3‧5'],['357','3‧5‧7'],['4567','4‧5‧6‧7']]},
       {key:'mode',  label:'對手', options:[['easy','電腦普通'],['hard','電腦高手'],['pvp','兩人對戰']]},
       {key:'rule',  label:'規則', options:[['win','拿最後一顆贏'],['lose','拿最後一顆輸']]},
       {key:'first', label:'先手', options:[['me','我先'],['cpu','對方先']]}], opts, newGame);
    const memo = new Map();
    function winning(h, rule){
      if(h.every(n=>n===0)) return rule==='lose';
      const key = rule + [...h].sort().join(',');
      if(memo.has(key)) return memo.get(key);
      let r = false;
      outer: for(let i=0;i<h.length;i++) for(let c=1;c<=h[i];c++){ const n=h.slice(); n[i]-=c; if(!winning(n,rule)){ r=true; break outer; } }
      memo.set(key, r); return r;
    }
    let heaps, turn, sel, cpuSel, busy, over;
    const names = ()=>playerNames(opts.mode);
    const cpuTurn = ()=>opts.mode!=='pvp' && turn===1;
    function newGame(){ runId++; heaps=opts.level.split('').map(Number); turn=opts.first==='me'?0:1; sel=null; cpuSel=null; busy=false; over=false; draw(); maybeCpu(); }
    function draw(){
      ui.board.innerHTML = `<div class="nim">${heaps.map((n,i)=>`
        <div class="nim-row"><span class="row-tag">第 ${i+1} 排</span><div class="stones">${
          Array.from({length:n},(_,j)=>{ let cls='';
            if(sel && sel.i===i && j>=n-sel.c) cls='picked';
            if(cpuSel && cpuSel.i===i && j>=n-cpuSel.c) cls='cpu';
            return `<button class="stone ${cls}" data-i="${i}" data-j="${j}" aria-label="石頭"></button>`; }).join('')}${n===0?'<span class="empty">（空了）</span>':''}</div></div>`).join('')}</div>
        <div class="actions"><button class="btn big take" ${sel?'':'disabled'}>✋ 拿走${sel?' '+sel.c+' 顆':''}</button>
          <button class="btn ghost clear" ${sel?'':'disabled'}>取消</button></div>`;
      if(!over) ui.setStatus(cpuTurn() ? '🤔 電腦想一想…' : turnHTML(names(), turn));
    }
    ui.board.addEventListener('click', e=>{
      if(busy || over || cpuTurn()) return;
      const s = e.target.closest('.stone');
      if(s){ const i=+s.dataset.i, c=heaps[i]-(+s.dataset.j); sel=(sel&&sel.i===i&&sel.c===c)?null:{i,c}; draw(); return; }
      if(e.target.closest('.take') && sel) doMove(sel.i, sel.c);
      else if(e.target.closest('.clear')){ sel=null; draw(); }
    });
    function doMove(i,c){
      heaps[i]-=c; sel=null; cpuSel=null;
      if(heaps.every(n=>n===0)){
        over=true; const winner=opts.rule==='win'?turn:1-turn, n=names(); draw();
        ui.setStatus(`🏆 <span class="badge p${winner}">${n[winner]}</span> 獲勝！`);
        const youWin = opts.mode==='pvp' || winner===0;
        showWin(youWin?'🎉':'🤖', opts.mode==='pvp'?`${n[winner]}獲勝！`:(winner===0?'你贏了！':'電腦贏了！'),
          youWin?(opts.mode==='hard'?'打敗電腦高手，你找到祕訣了嗎？':'太厲害了！'):'再想想看：拿完之後，要留下什麼樣子給電腦？', newGame);
        return;
      }
      turn=1-turn; draw(); maybeCpu();
    }
    function cpuMove(){
      const moves=[]; heaps.forEach((n,i)=>{ for(let c=1;c<=n;c++) moves.push({i,c}); });
      const good=moves.filter(m=>{ const h=heaps.slice(); h[m.i]-=m.c; return !winning(h,opts.rule); });
      if(good.length && (opts.mode==='hard' || Math.random()<0.5)) return good[rand(good.length)];
      return moves[rand(moves.length)];
    }
    function maybeCpu(){
      if(!cpuTurn() || over) return; busy=true; draw();
      later(()=>{ const m=cpuMove(); cpuSel=m; draw(); ui.setStatus(`電腦從第 ${m.i+1} 排拿 ${m.c} 顆`);
        later(()=>{ busy=false; doMove(m.i,m.c); }, 900); }, 800);
    }
    newGame();
  }});

/* ---------- 河內塔 ---------- */
reg({id:'hanoi', cat:'logic', title:'河內塔', emoji:'🗼',
  desc:'把一整座圓盤塔搬到另一根柱子，大的不能壓小的。',
  explain:`<p>河內塔是法國數學家<b>盧卡斯</b>在 1883 年發明的。最少步數有漂亮的規律：</p>
  <div class="ex">1 個：1 步　　2 個：3 步　　3 個：7 步<br>4 個：15 步　　5 個：31 步　　6 個：63 步</div>
  <p><b>規律一：</b>每多 1 個圓盤，步數是<b>「前一個 × 2 ＋ 1」</b>。</p>
  <p><b>為什麼？</b>想搬 4 個圓盤：</p>
  <ul><li>先把上面 3 個搬到中間（7 步）</li><li>把最大的搬到目的地（1 步）</li><li>再把那 3 個搬到最大的上面（7 步）</li></ul>
  <p>7 ＋ 1 ＋ 7 ＝ 15。把大問題變成「比較小的同一個問題」，這種想法叫做<b>遞迴</b>，是寫程式最重要的觀念之一。</p>
  <p><b>規律二：</b>步數都是「2 連乘幾次再減 1」：2×2×2 － 1 ＝ 7，2×2×2×2 － 1 ＝ 15。</p>
  <p><b>小技巧：</b>最小的圓盤每隔一步就要動一次，而且永遠往同一個方向繞圈。</p>
  <p>💭 傳說有座廟裡有 64 個金盤，僧侶搬完時世界就結束。就算 1 秒搬 1 個，也要 <b>五千多億年</b>！</p>`,
  mount(el){
    const opts = {n:3};
    const ui = shell(el, `
      <p>把所有圓盤從 <b>A 柱</b> 搬到 <b>C 柱</b>。</p>
      <ul><li>一次只能搬<b>最上面</b>的 1 個圓盤。</li><li><b>大的不能放在小的上面</b>。</li>
      <li>先點一根柱子拿起圓盤，再點另一根柱子放下。</li></ul>`,
      [{key:'n', label:'圓盤', options:[[3,'3 個'],[4,'4 個'],[5,'5 個'],[6,'6 個'],[7,'7 個']]}], opts, newGame);
    const colors = ['#e4572e','#f39237','#ffc93c','#3bb273','#2d7dd2','#7d5ba6','#e05297'];
    let pegs, held, moves, msg, bad;
    function newGame(){ runId++; pegs=[Array.from({length:opts.n},(_,k)=>opts.n-k),[],[]]; held=null; moves=0; msg=''; bad=-1; draw(); }
    const best = ()=>2**opts.n-1;
    const discHTML = s => `<div class="disc" style="width:${30+(s-1)*(62/(opts.n-1))}%;background:${colors[(s-1)%7]}">${s}</div>`;
    function draw(){
      ui.board.innerHTML = `<div class="hanoi">${pegs.map((p,i)=>`<button class="peg ${held===i?'sel':''} ${bad===i?'bad':''}" data-p="${i}">
          <div class="lift">${held===i?discHTML(p[p.length-1]):''}</div>
          <div class="stack">${(held===i?p.slice(0,-1):p).map(discHTML).join('')}</div><div class="base"></div>
          <div class="label">${'ABC'[i]} 柱${i===2?' 🏁':''}</div></button>`).join('')}</div>
        <div class="msg" style="margin-top:22px">${msg}</div>`;
      ui.setStatus(`步數 ${big(moves)}　｜　最少 ${best()} 步`); bad=-1;
    }
    ui.board.addEventListener('click', e=>{
      const pe=e.target.closest('.peg'); if(!pe) return; const p=+pe.dataset.p; msg='';
      if(held===null){ if(pegs[p].length) held=p; else msg='這根柱子是空的喔！'; }
      else if(held===p) held=null;
      else { const top=pegs[held][pegs[held].length-1], dest=pegs[p];
        if(dest.length && dest[dest.length-1]<top){ msg='大的不能放在小的上面喔！'; bad=p; }
        else { dest.push(pegs[held].pop()); held=null; moves++;
          if(pegs[2].length===opts.n){ draw(); const perfect=moves===best();
            showWin(perfect?'🏆':'🎉', perfect?'完美！最少步數！':'完成了！', `你用了 <b>${moves}</b> 步，最少是 <b>${best()}</b> 步。${perfect?'':'<br>再試試看能不能更少？'}`, newGame); return; } } }
      draw();
    });
    newGame();
  }});

/* ---------- 數字推盤 ---------- */
reg({id:'slide', cat:'logic', title:'數字推盤', emoji:'🔀',
  desc:'滑動數字方塊，把它們排回正確順序。',
  explain:`<p>數字推盤在 1880 年代風靡全世界，大家都搶著玩 4×4 的「15 數字推盤」。</p>
  <p><b>解題祕訣：一排一排來。</b></p>
  <ul><li>先把<b>第一排</b>排好，之後就不要再動它。</li><li>再排<b>最左邊那一行</b>。</li>
  <li>剩下的小方陣再用同樣的方法，問題越變越小。</li></ul>
  <p>每一排的<b>最後兩個</b>最難：要先把它們「一上一下」排在角落，再一起轉進去。</p>
  <p><b>有趣的數學：有一半的排法是永遠解不開的！</b></p>
  <div class="ex">當年有人出題：把排好的推盤只對調 14 和 15，懸賞 1000 美元徵求解法。<br>結果沒有人拿到獎金——因為數學家證明了：<b>只對調兩塊，一定無解</b>。</div>
  <p>原因跟「單數、雙數」有關：每滑動一步，順序的混亂程度只會以固定的方式改變，所以有些排法怎麼滑都到不了。（這個遊戲的題目是從排好的樣子倒著打亂的，所以一定有解，放心！）</p>`,
  mount(el){
    const opts = {n:3};
    const ui = shell(el, `
      <p>把數字排回 <b>1、2、3……</b> 的順序，空格在最後。</p>
      <ul><li>點<b>空格旁邊</b>的數字，它就會滑進空格。</li>
      <li>點同一排（或同一行）遠一點的數字，可以一次推好幾格。</li></ul>`,
      [{key:'n', label:'大小', options:[[3,'3 × 3'],[4,'4 × 4']]}], opts, newGame);
    let tiles, moves;
    function neighbors(i){ const n=opts.n, r=Math.floor(i/n), c=i%n, out=[]; if(r>0) out.push(i-n); if(r<n-1) out.push(i+n); if(c>0) out.push(i-1); if(c<n-1) out.push(i+1); return out; }
    const solved = ()=>tiles.every((v,i)=> i===tiles.length-1 ? v===0 : v===i+1);
    function newGame(){
      runId++; const n=opts.n, N=n*n;
      do { tiles=Array.from({length:N},(_,i)=>(i+1)%N); let b=N-1, prev=-1;
        for(let t=0;t<(n===3?150:400);t++){ const nb=neighbors(b).filter(x=>x!==prev), pick=nb[rand(nb.length)]; tiles[b]=tiles[pick]; tiles[pick]=0; prev=b; b=pick; }
      } while(solved());
      moves=0; draw();
    }
    function draw(){
      ui.board.innerHTML = `<div class="slide" style="grid-template-columns:repeat(${opts.n},1fr)">${tiles.map((v,i)=>`<button class="tile ${v===0?'blank':''} ${v===i+1?'right':''}" data-i="${i}">${v||''}</button>`).join('')}</div>`;
      ui.setStatus(`步數 ${big(moves)}`);
    }
    ui.board.addEventListener('click', e=>{
      const t=e.target.closest('.tile'); if(!t) return;
      const n=opts.n, i=+t.dataset.i, b=tiles.indexOf(0), tr=Math.floor(i/n), tc=i%n, br=Math.floor(b/n), bc=b%n;
      if(tr===br && tc!==bc){ const d=tc>bc?1:-1; for(let c=bc;c!==tc;c+=d) tiles[br*n+c]=tiles[br*n+c+d]; tiles[i]=0; moves++; }
      else if(tc===bc && tr!==br){ const d=tr>br?1:-1; for(let r=br;r!==tr;r+=d) tiles[r*n+bc]=tiles[(r+d)*n+bc]; tiles[i]=0; moves++; }
      else return;
      draw(); if(solved()) showWin('🎉','排好了！',`你用了 <b>${moves}</b> 步完成！`, newGame);
    });
    newGame();
  }});

/* ---------- 點燈 ---------- */
reg({id:'lights', cat:'logic', title:'點燈遊戲', emoji:'💡',
  desc:'點一下會切換十字形的燈，想辦法把燈全部關掉。',
  explain:`<p>這個遊戲有兩個重要的發現：</p>
  <p><b>發現一：同一盞燈點兩次，等於沒點。</b>（亮 → 暗 → 亮，又變回來了。）所以每一盞燈只有兩種選擇：<b>點 1 次</b>或<b>不點</b>。</p>
  <p><b>發現二：先點誰、後點誰，結果都一樣。</b>順序不重要，重要的是「哪幾盞要點」。</p>
  <div class="ex">一盞燈最後是亮還是暗，只看它<b>被切換了幾次</b>：<br>切換單數次 → 跟原來相反<br>切換雙數次 → 跟原來一樣</div>
  <p>又是<b>單數、雙數</b>的問題！</p>
  <p><b>實用技巧——「追燈法」：</b></p>
  <ul><li>從第二排開始：上面那排哪一格亮著，就點它<b>正下方</b>那一格，把上面的燈關掉。</li>
  <li>一排一排往下追，亮著的燈會被趕到最後一排。</li><li>再看最後一排剩下的樣子，回頭調整第一排要點哪幾盞。</li></ul>
  <p>💭 3×3 的盤面一共只有 2×2×…×2（9 個 2 連乘）＝ 512 種點法，電腦一下子就能全部試完。</p>`,
  mount(el){
    const opts = {n:3};
    const ui = shell(el, `
      <p>目標：<b>把所有的燈都關掉</b>！</p>
      <ul><li>點一盞燈，它和它<b>上、下、左、右</b>的燈都會切換（亮變暗、暗變亮）。</li><li>斜對角的燈不會變。</li></ul>`,
      [{key:'n', label:'大小', options:[[3,'3 × 3'],[4,'4 × 4'],[5,'5 × 5']]}], opts, newGame);
    let grid, moves;
    function toggle(i){ const n=opts.n, r=Math.floor(i/n), c=i%n;
      [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{ const rr=r+dr, cc=c+dc; if(rr>=0&&rr<n&&cc>=0&&cc<n) grid[rr*n+cc]=!grid[rr*n+cc]; }); }
    function newGame(){ runId++; const N=opts.n*opts.n;
      do { grid=Array(N).fill(false); const k=opts.n+rand(opts.n); for(let t=0;t<k;t++) toggle(rand(N)); } while(grid.every(x=>!x));
      moves=0; draw(); }
    function draw(){
      ui.board.innerHTML = `<div class="lights" style="grid-template-columns:repeat(${opts.n},1fr)">${grid.map((on,i)=>`<button class="bulb ${on?'on':''}" data-i="${i}">${on?'💡':''}</button>`).join('')}</div>`;
      ui.setStatus(`還有 ${big(grid.filter(Boolean).length)} 盞燈亮著　｜　步數 ${moves}`);
    }
    ui.board.addEventListener('click', e=>{ const b=e.target.closest('.bulb'); if(!b) return; toggle(+b.dataset.i); moves++; draw();
      if(grid.every(x=>!x)) showWin('🌙','燈全關了！',`你用了 <b>${moves}</b> 步！`, newGame); });
    newGame();
  }});

/* ---------- 數獨 ---------- */
reg({id:'sudoku', cat:'logic', title:'數獨', emoji:'🔳',
  desc:'每一排、每一行、每個粗框裡，數字都不能重複。',
  explain:`<p>數獨不用計算，靠的是<b>推理</b>。兩個最好用的方法：</p>
  <p><b>方法一：這一格只能放誰？（排除法）</b></p>
  <div class="ex">看一個空格：把同一排、同一行、同一個粗框裡<b>已經出現的數字</b>都刪掉。<br>如果只剩下一個數字，那就是答案！</div>
  <p><b>方法二：這個數字只能放哪？</b></p>
  <div class="ex">盯著一個數字（例如 3）：在某個粗框裡，哪些空格可以放 3？<br>如果其他空格都被別的 3「擋住」，只剩一格，3 就放那裡！</div>
  <p><b>先從線索最多的地方下手</b>——空格最少的那一排、那一行或那個框。</p>
  <p>數獨的祖先叫<b>拉丁方陣</b>，是數學家<b>歐拉</b>在兩百多年前研究的：每一排、每一行都不重複的方陣。數獨再加上「粗框裡也不能重複」的規則。</p>
  <p>💭 好的數獨題目<b>只有一個答案</b>，而且每一步都能用推理得到，完全不用猜！</p>`,
  mount(el){
    const opts = {n:4};
    const ui = shell(el, `
      <p>把數字填進空格裡。</p>
      <ul><li><b>每一橫排</b>、<b>每一直行</b>的數字都不能重複。</li><li><b>每個粗框</b>裡的數字也不能重複。</li>
      <li>先點空格，再點下面的數字。填錯的會變紅色。</li></ul>`,
      [{key:'n', label:'大小', options:[[4,'4 × 4'],[6,'6 × 6']]}], opts, newGame);
    let N, BR, BC, sol, g, given, sel;
    const boxOf=(r,c)=>Math.floor(r/BR)*10+Math.floor(c/BC);
    const okAt=(a,r,c,v)=>{ for(let i=0;i<N;i++){ if(a[r][i]===v||a[i][c]===v) return false; }
      const r0=Math.floor(r/BR)*BR, c0=Math.floor(c/BC)*BC; for(let i=r0;i<r0+BR;i++) for(let j=c0;j<c0+BC;j++) if(a[i][j]===v) return false; return true; };
    function count(a, limit){ let cnt=0;
      (function go(){ if(cnt>=limit) return; let r=-1,c=-1; outer: for(let i=0;i<N;i++) for(let j=0;j<N;j++) if(!a[i][j]){ r=i;c=j; break outer; }
        if(r<0){ cnt++; return; } for(let v=1;v<=N;v++) if(okAt(a,r,c,v)){ a[r][c]=v; go(); a[r][c]=0; } })();
      return cnt; }
    function newGame(){
      runId++; N=opts.n; BR=2; BC=N===4?2:3;
      sol=Array.from({length:N},()=>Array(N).fill(0));
      (function fill(k){ if(k===N*N) return true; const r=Math.floor(k/N), c=k%N;
        for(const v of shuffle(Array.from({length:N},(_,i)=>i+1))) if(okAt(sol,r,c,v)){ sol[r][c]=v; if(fill(k+1)) return true; sol[r][c]=0; } return false; })(0);
      g=sol.map(r=>r.slice()); let removed=0; const target=N===4?10:21;
      for(const k of shuffle(Array.from({length:N*N},(_,i)=>i))){ if(removed>=target) break; const r=Math.floor(k/N), c=k%N, v=g[r][c];
        g[r][c]=0; if(count(g.map(x=>x.slice()),2)===1) removed++; else g[r][c]=v; }
      given=g.map(r=>r.map(v=>v>0)); sel=null; draw();
    }
    function bad(r,c){ const v=g[r][c]; if(!v) return false;
      for(let i=0;i<N;i++) for(let j=0;j<N;j++) if((i!==r||j!==c) && g[i][j]===v && (i===r||j===c||boxOf(i,j)===boxOf(r,c))) return true; return false; }
    function draw(){
      ui.board.innerHTML = `<div class="sudoku" style="grid-template-columns:repeat(${N},1fr);--n:${N}">${g.map((row,r)=>row.map((v,c)=>
          `<button data-r="${r}" data-c="${c}" class="${given[r][c]?'given':''} ${sel&&sel[0]===r&&sel[1]===c?'sel':''} ${bad(r,c)?'bad':''} ${c%BC===BC-1&&c<N-1?'br':''} ${r%BR===BR-1&&r<N-1?'bb':''}">${v||''}</button>`).join('')).join('')}</div>
        <div class="pad">${Array.from({length:N},(_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join('')}<button data-v="0">⌫</button></div>`;
      ui.setStatus(`還有 ${big(g.flat().filter(v=>!v).length)} 個空格`);
    }
    ui.board.addEventListener('click', e=>{
      const cb=e.target.closest('.sudoku button'), pb=e.target.closest('.pad button');
      if(cb){ const r=+cb.dataset.r, c=+cb.dataset.c; if(!given[r][c]) sel=[r,c]; }
      else if(pb && sel) g[sel[0]][sel[1]]=+pb.dataset.v;
      else return;
      draw();
      if(g.every((row,r)=>row.every((v,c)=>v&&!bad(r,c)))) showWin('🎉','數獨完成！','每一排、每一行、每個粗框都沒有重複！', newGame, '下一題');
    });
    newGame();
  }});

/* ---------- 皇后 ---------- */
reg({id:'queens', cat:'logic', title:'皇后問題', emoji:'👑',
  desc:'在棋盤上放皇后，讓她們誰也攻擊不到誰。',
  explain:`<p>西洋棋的皇后可以走<b>橫的、直的、斜的</b>，想走幾格就走幾格，所以很難讓她們和平相處。</p>
  <p><b>推理一：</b>每一橫排最多只能有 1 個皇后（不然會互相攻擊）。要放 N 個皇后在 N 排，所以<b>每一排剛好 1 個</b>，每一行也剛好 1 個。</p>
  <p><b>推理二：</b>所以可以「一排一排放」：第一排選一格，第二排找安全的格子…如果某一排<b>完全沒地方放</b>，就退回上一排換個位置。這種「走不通就退回去」的方法叫做<b>回溯法</b>，電腦解謎題最常用它。</p>
  <div class="ex">2 × 2、3 × 3：放不出來！<br>4 × 4：<b>2</b> 種放法（其實是同一種照鏡子）<br>5 × 5：10 種　　6 × 6：只有 4 種<br>8 × 8：<b>92</b> 種</div>
  <p><b>小祕訣：</b>試試「馬步」——每往下一排，就往旁邊移 2 格，像西洋棋的馬（或象棋的馬走日字）。5×5 用這招就能解開，其他大小也可以從這個想法出發！</p>
  <p>💭 八皇后問題是 1848 年提出的，大數學家<b>高斯</b>也研究過，他當時只找到 72 種，後來才有人找齊 92 種。</p>`,
  mount(el){
    const opts = {n:4};
    const ui = shell(el, `
      <p>在 N × N 的棋盤上放 <b>N 個皇后</b>。</p>
      <ul><li>皇后會攻擊<b>同一橫排、同一直行、同一條斜線</b>上的棋子。</li><li>讓所有皇后<b>互相攻擊不到</b>！</li>
      <li>點格子放皇后，再點一次拿走。淡紅色是被攻擊到的格子。</li></ul>`,
      [{key:'n', label:'棋盤', options:[[4,'4 × 4'],[5,'5 × 5'],[6,'6 × 6'],[8,'8 × 8']]}], opts, newGame);
    let q;
    function newGame(){ runId++; q=[]; draw(); }
    const hit=(a,b)=>a[0]===b[0]||a[1]===b[1]||Math.abs(a[0]-b[0])===Math.abs(a[1]-b[1]);
    function draw(){
      const N=opts.n;
      ui.board.innerHTML = `<div class="queens" style="grid-template-columns:repeat(${N},1fr)">${Array.from({length:N*N},(_,i)=>{ const r=Math.floor(i/N), c=i%N;
        const has=q.some(p=>p[0]===r&&p[1]===c), att=q.some(p=>!(p[0]===r&&p[1]===c)&&hit(p,[r,c]));
        return `<button data-r="${r}" data-c="${c}" class="${(r+c)%2?'dk':''} ${att?'att':''} ${has&&att?'clash':''}">${has?'👑':''}</button>`; }).join('')}</div>`;
      ui.setStatus(`已放 ${big(q.length)} / ${N} 個皇后`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.queens button'); if(!b) return; const r=+b.dataset.r, c=+b.dataset.c;
      const i=q.findIndex(p=>p[0]===r&&p[1]===c); if(i>=0) q.splice(i,1); else q.push([r,c]);
      draw();
      if(q.length===opts.n && q.every((a,i)=>q.every((b,j)=>i===j||!hit(a,b)))) showWin('👑','和平共處！',`${opts.n} 個皇后誰也攻擊不到誰！`, newGame);
    });
    newGame();
  }});

/* ---------- 過河 ---------- */
reg({id:'river', cat:'logic', title:'狼、羊、菜過河', emoji:'🛶',
  desc:'農夫要帶狼、羊和菜過河，船一次只能載一樣…',
  explain:`<p>這是一千兩百多年前就有的謎題！</p>
  <p><b>第一步怎麼想？</b></p>
  <ul><li>帶狼走 → 羊吃菜 ✘</li><li>帶菜走 → 狼吃羊 ✘</li><li>所以第一步<b>只能帶羊</b>。（狼不吃菜！）</li></ul>
  <p><b>卡住的地方：</b>接著不管帶狼還是帶菜過去，都會和羊留在一起…</p>
  <p><b>關鍵：把羊再帶回來！</b>大部分的人卡住，是因為覺得「帶過去的東西不應該再帶回來」。但有時候<b>先退一步，才能往前走</b>。</p>
  <div class="ex">① 帶羊過去　② 空船回來　③ 帶狼過去　④ <b>帶羊回來</b><br>⑤ 帶菜過去　⑥ 空船回來　⑦ 帶羊過去　完成！</div>
  <p>（③ 和 ⑤ 的狼和菜可以對調，所以有 2 種解法，都是 7 步。）</p>
  <p><b>數學家怎麼解？</b>把每一種「誰在哪一岸」的情況都列出來，刪掉會出事的，再看怎麼從開始走到結束——像在地圖上找路一樣。<b>羊</b>是關鍵，因為只有牠跟另外兩個都不能獨處。</p>`,
  mount(el){
    const ui = shell(el, `
      <p>農夫要把<b>狼、羊、菜</b>都帶到對岸。</p>
      <ul><li>船很小，農夫一次只能帶<b>一樣</b>東西（也可以空船）。</li>
      <li>農夫不在的時候：<b>狼會吃羊</b>、<b>羊會吃菜</b>。</li><li>點農夫旁邊的東西，就會一起坐船過河。</li></ul>`, [], {}, newGame);
    const IT={wolf:'🐺',sheep:'🐑',cab:'🥬'}, NAME={wolf:'狼',sheep:'羊',cab:'菜'};
    let pos, steps, msg;
    function newGame(){ runId++; pos={farmer:0,wolf:0,sheep:0,cab:0}; steps=0; msg=''; draw(); }
    function draw(){
      const bank=s=>`<div class="bank">${Object.keys(IT).filter(k=>pos[k]===s).map(k=>`<button class="item" data-k="${k}" ${pos.farmer===s?'':'disabled'}>${IT[k]}<small>${NAME[k]}</small></button>`).join('')}</div>`;
      ui.board.innerHTML = `<div class="river">${bank(0)}<div class="water-r"><div class="boat ${pos.farmer?'right':''}">🧑‍🌾<br>🛶</div></div>${bank(1)}</div>
        <div class="river-lab"><span>這一岸</span><span>河</span><span>對岸 🏁</span></div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn big alone">🚣 農夫自己划過去</button></div>`;
      ui.setStatus(`划了 ${big(steps)} 趟　｜　最少 7 趟`);
    }
    function cross(k){
      const from=pos.farmer; pos.farmer=1-from; if(k) pos[k]=1-from; steps++; msg='';
      let bad='';
      if(pos.wolf===from && pos.sheep===from) bad='🐺 農夫不在，狼把羊吃掉了！';
      else if(pos.sheep===from && pos.cab===from) bad='🐑 農夫不在，羊把菜吃掉了！';
      draw();
      if(bad) showWin('😱','糟糕！',bad+'<br>再想想看，該怎麼安排？', newGame, '重來一次');
      else if(pos.wolf&&pos.sheep&&pos.cab) showWin(steps===7?'🏆':'🎉','全部過河了！',`你划了 <b>${steps}</b> 趟，最少是 7 趟。`, newGame);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.item'); if(b){ cross(b.dataset.k); return; }
      if(e.target.closest('.alone')) cross(null);
    });
    newGame();
  }});

/* ---------- 幾A幾B ---------- */
reg({id:'ab', cat:'logic', title:'幾A幾B', emoji:'🔐',
  desc:'猜出電腦的密碼！每猜一次，電腦會給你 A 和 B 的線索。',
  explain:`<p>每一次的「幾 A 幾 B」都是一條<b>線索</b>，要像偵探一樣把線索合起來推理。</p>
  <div class="ex"><b>A</b>：數字對，位置也對<br><b>B</b>：數字對，但位置不對<br>A ＋ B ＝ 你猜的數字裡，有幾個是密碼用到的數字</div>
  <p><b>推理技巧：</b></p>
  <ul><li><b>0A0B 是好消息！</b>這幾個數字全部可以刪掉。</li>
  <li>先用前幾次找出<b>「是哪幾個數字」</b>（例如先猜 0123，再猜 4567），再去排<b>位置</b>。</li>
  <li>每次只<b>換一個數字</b>，看 A、B 怎麼變，就知道那個數字是不是密碼。</li>
  <li>新猜的答案，要<b>符合前面每一條線索</b>——不符合的就不用猜了。</li></ul>
  <p><b>一共有幾種密碼？</b>4 位數字不重複：第一位有 10 種選擇、第二位剩 9 種、第三位 8 種、第四位 7 種。</p>
  <div class="ex">10 × 9 × 8 × 7 ＝ <b>5040</b> 種</div>
  <p>聽起來很多，但每條線索都能刪掉一大堆。用最好的策略，<b>7 次以內</b>一定能猜中！</p>`,
  mount(el){
    const opts = {d:3};
    const ui = shell(el, `
      <p>電腦想了一組<b>數字不重複</b>的密碼。</p>
      <ul><li>輸入你猜的數字，按 OK。</li><li><b>A</b>＝數字對、位置也對。</li><li><b>B</b>＝數字對、位置不對。</li>
      <li>例如密碼 123，猜 135 → <b>1A1B</b>（1 位置對；3 有但位置錯）。</li></ul>`,
      [{key:'d', label:'位數', options:[[3,'3 位數'],[4,'4 位數']]}], opts, newGame);
    let secret, input, log, msg;
    function newGame(){ runId++; secret=shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,opts.d).join(''); input=''; log=[]; msg=''; draw(); }
    function draw(){
      ui.board.innerHTML = `<div class="g-row"><div><div class="g-input">${input.padEnd(opts.d,'＿')}</div>${padHTML()}</div>
        <div class="g-log ab">${log.map((l,i)=>`<div><i>${log.length-i}</i><b>${l.g}</b><span>${l.a}A${l.b}B</span></div>`).join('')||'<div class="empty">猜過的紀錄會出現在這裡</div>'}</div></div>
        <div class="msg">${msg}</div>`;
      ui.setStatus(`已經猜了 ${big(log.length)} 次`);
    }
    ui.board.addEventListener('click', e=>{
      const k=e.target.closest('.keypad button'); if(!k) return; const d=k.dataset.d; msg='';
      if(d==='del') input=input.slice(0,-1);
      else if(d==='ok'){
        if(input.length<opts.d){ msg=`要輸入 ${opts.d} 個數字喔！`; draw(); return; }
        let a=0,b=0; [...input].forEach((ch,i)=>{ if(secret[i]===ch) a++; else if(secret.includes(ch)) b++; });
        log.unshift({g:input,a,b}); input='';
        if(a===opts.d){ draw(); showWin('🔓','密碼解開了！',`密碼是 <b>${secret}</b>，你猜了 <b>${log.length}</b> 次。`, newGame); return; }
      } else if(input.includes(d)) msg='數字不能重複喔！';
      else if(input.length<opts.d) input+=d;
      draw();
    });
    newGame();
  }});

/* ---------- 孔明棋 ---------- */
reg({id:'peg', cat:'logic', title:'孔明棋', emoji:'⚫',
  desc:'跳過一顆棋子就把它吃掉，最後只剩一顆就成功！',
  explain:`<p>孔明棋（又叫單人跳棋）三百多年前在法國宮廷就很流行。</p>
  <p><b>先算一算：</b>每跳一步，一定剛好<b>少一顆</b>棋子。</p>
  <div class="ex">完整棋盤有 32 顆，要剩 1 顆，就要跳 <b>31 步</b>，一步都不能浪費！</div>
  <p><b>玩的祕訣：</b></p>
  <ul><li><b>不要讓棋子落單。</b>孤零零待在角落、旁邊沒有同伴的棋子，沒人能跳過去吃它，也沒辦法自己跳出來。</li>
  <li><b>先清外圍，再往中間集中。</b>四個「手臂」上的棋子要早點處理。</li>
  <li><b>倒著想：</b>最後一步一定是兩顆相鄰的棋子，一顆跳過另一顆。那再前一步呢？</li></ul>
  <p><b>數學家的發現：</b>把棋盤的洞斜斜地輪流塗上三種顏色，每跳一步，三種顏色的棋子數量都會「單數變雙數、雙數變單數」。用這個方法可以證明：完整棋盤從中間空格開始，如果最後只剩一顆，它只可能停在<b>正中間</b>或<b>四個手臂最外面那排的中間</b>，其他位置絕對辦不到！</p>
  <p>💭 先從「十字」和「加號」這些小題目練習，再挑戰完整棋盤。</p>`,
  mount(el){
    const PAT={
      cross:[[1,3],[2,2],[2,3],[2,4],[3,3],[4,3]],
      plus:[[1,3],[2,3],[3,1],[3,2],[3,3],[3,4],[3,5],[4,3],[5,3]],
      fire:[[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,2],[2,3],[2,4],[3,2],[3,4]],
      pyr:[[1,3],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[3,4],[3,5],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6]],
      full:null };
    const opts = {p:'cross'};
    const ui = shell(el, `
      <p>目標：<b>最後只剩下 1 顆棋子</b>。</p>
      <ul><li>棋子可以<b>跳過</b>旁邊（上下左右）的一顆棋子，落在後面的空洞。</li><li>被跳過的棋子會被拿走。</li>
      <li>不能斜跳，也不能只移動不跳。</li><li>先點要跳的棋子，再點它要落下的空洞。</li></ul>`,
      [{key:'p', label:'題目', options:[['cross','十字（6 顆）'],['plus','加號（9 顆）'],['fire','壁爐（11 顆）'],['pyr','金字塔（16 顆）'],['full','完整（32 顆）']]}], opts, newGame);
    const valid=(r,c)=>r>=0&&r<7&&c>=0&&c<7&&((r>=2&&r<=4)||(c>=2&&c<=4));
    let b, sel, hist, msg;
    function newGame(){
      runId++; b=Array.from({length:7},()=>Array(7).fill(false));
      if(PAT[opts.p]) PAT[opts.p].forEach(([r,c])=>b[r][c]=true);
      else { for(let r=0;r<7;r++) for(let c=0;c<7;c++) b[r][c]=valid(r,c); b[3][3]=false; }
      sel=null; hist=[]; msg=''; draw();
    }
    const cnt=()=>b.flat().filter(Boolean).length;
    const canJump=(r,c,dr,dc)=>valid(r+2*dr,c+2*dc)&&b[r][c]&&b[r+dr][c+dc]&&!b[r+2*dr][c+2*dc];
    const anyMove=()=>{ for(let r=0;r<7;r++) for(let c=0;c<7;c++) for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) if(valid(r,c)&&canJump(r,c,dr,dc)) return true; return false; };
    function draw(){
      const tg = sel ? [[0,1],[0,-1],[1,0],[-1,0]].filter(([dr,dc])=>canJump(sel[0],sel[1],dr,dc)).map(([dr,dc])=>(sel[0]+2*dr)+','+(sel[1]+2*dc)) : [];
      ui.board.innerHTML = `<div class="pegb">${Array.from({length:49},(_,i)=>{ const r=Math.floor(i/7), c=i%7;
        if(!valid(r,c)) return '<span></span>';
        return `<button data-r="${r}" data-c="${c}" class="${b[r][c]?'peg-on':''} ${sel&&sel[0]===r&&sel[1]===c?'sel':''} ${tg.includes(r+','+c)?'tg':''}"></button>`; }).join('')}</div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${hist.length?'':'disabled'}>↩ 上一步</button></div>`;
      ui.setStatus(`還剩 ${big(cnt())} 顆棋子`);
    }
    ui.board.addEventListener('click', e=>{
      const x=e.target.closest('.pegb button'); msg='';
      if(x){ const r=+x.dataset.r, c=+x.dataset.c;
        if(b[r][c]) sel=(sel&&sel[0]===r&&sel[1]===c)?null:[r,c];
        else if(sel){ const dr=(r-sel[0])/2, dc=(c-sel[1])/2;
          if(Math.abs(dr)+Math.abs(dc)===1 && canJump(sel[0],sel[1],dr,dc)){
            hist.push(b.map(row=>row.slice())); b[sel[0]][sel[1]]=false; b[sel[0]+dr][sel[1]+dc]=false; b[r][c]=true; sel=null;
            if(cnt()===1){ draw(); showWin(b[3][3]?'🏆':'🎉','只剩一顆了！', b[3][3]?'而且剛好停在正中間，完美！':'成功！下次試試看讓最後一顆停在正中間？', newGame); return; }
            if(!anyMove()) msg=`沒有棋子可以跳了，還剩 ${cnt()} 顆。按「上一步」或「重新開始」再試試！`;
          } else msg='要跳過旁邊的一顆棋子，落在它後面的空洞才行喔！';
        } else msg='先點一顆棋子！';
      }
      else if(e.target.closest('.undo')){ b=hist.pop(); sel=null; }
      else return;
      draw();
    });
    newGame();
  }});

/* ---------- 天平找假幣 ---------- */
reg({id:'coin', cat:'logic', title:'天平找假幣', emoji:'⚖️',
  desc:'有一枚假金幣比較重，用天平秤最少次數把它找出來！',
  explain:`<p>天平秤一次，會有<b>三種結果</b>：左邊重、右邊重、一樣重。聰明的秤法要讓三種結果<b>都能提供線索</b>。</p>
  <p><b>祕訣：分成三堆！</b>（不是兩堆喔）</p>
  <div class="ex">9 枚金幣 → 分成 3、3、3<br>左邊放 3 枚、右邊放 3 枚，剩下 3 枚放桌上：<br>・左邊重 → 假幣在左邊那 3 枚<br>・右邊重 → 假幣在右邊那 3 枚<br>・一樣重 → 假幣在<b>桌上</b>那 3 枚！</div>
  <p>不管哪種結果，嫌疑犯都從 9 枚變成 3 枚。再秤一次（1 枚對 1 枚，1 枚放桌上），就找到了！</p>
  <p><b>規律：每秤一次，嫌疑犯變成 3 分之 1。</b></p>
  <div class="ex">秤 1 次：最多 3 枚<br>秤 2 次：最多 3 × 3 ＝ 9 枚<br>秤 3 次：最多 3 × 3 × 3 ＝ 27 枚<br>秤 4 次：81 枚</div>
  <p>如果分成兩堆（每次對半分），9 枚可能要秤 3 次；分三堆只要 2 次。<b>沒放上天平的那一堆，也給了你線索</b>——這就是這個謎題最妙的地方！</p>
  <p>💭 這個遊戲的電腦很調皮：它會讓假幣躲在嫌疑犯最多的那一堆，所以不能靠運氣，一定要有十足把握才行。</p>`,
  mount(el){
    const opts = {n:9};
    const ui = shell(el, `
      <p>這些金幣裡有<b>一枚假的，比較重</b>，其他都一樣重。</p>
      <ul><li>點金幣可以把它放上<b>左盤 → 右盤 → 拿回桌上</b>。</li><li>兩邊放一樣多枚，再按「秤秤看」。</li>
      <li>秤的次數有限！確定之後按「指出假幣」，再點那枚金幣。</li></ul>`,
      [{key:'n', label:'金幣', options:[[3,'3 枚（秤 1 次）'],[9,'9 枚（秤 2 次）'],[27,'27 枚（秤 3 次）']]}], opts, newGame);
    let place, cand, used, tilt, accuse, msg, over;
    const maxW=()=>({3:1,9:2,27:3})[opts.n];
    function newGame(){ runId++; place=Array(opts.n).fill(0); cand=new Set(place.map((_,i)=>i)); used=0; tilt=null; accuse=false; msg=''; over=false; draw(); }
    function draw(){
      const coin=i=>`<button class="coin ${opts.n>9?'sm':''}" data-i="${i}">${i+1}</button>`;
      const pan=s=>`<div class="pan ${tilt===null?'':tilt===0?'':((tilt<0)===(s===1)?'down':'up')}"><div class="pan-in">${place.map((p,i)=>p===s?coin(i):'').join('')}</div><span>${s===1?'左盤':'右盤'}</span></div>`;
      ui.board.innerHTML = `<div class="scale">${pan(1)}<div class="pivot">⚖️<small>${tilt===null?'':tilt===0?'一樣重':tilt<0?'左邊重':'右邊重'}</small></div>${pan(2)}</div>
        <div class="table ${accuse?'acc':''}">${place.map((p,i)=>p===0?coin(i):'').join('')||'<span class="empty">桌上沒有金幣</span>'}</div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn big weigh" ${used>=maxW()||accuse?'disabled':''}>⚖️ 秤秤看</button><button class="btn ghost off">全部拿下來</button>
          <button class="btn big green accb">${accuse?'取消':'🔍 指出假幣'}</button></div>`;
      ui.setStatus(accuse ? '點你認為是假幣的那一枚！' : `已經秤了 ${big(used)} / ${maxW()} 次`);
    }
    ui.board.addEventListener('click', e=>{
      if(over) return; const c=e.target.closest('.coin'); msg='';
      if(c){ const i=+c.dataset.i;
        if(accuse){
          over=true;
          if(cand.size===1 && cand.has(i)){ draw(); showWin('🏆','找到假幣了！',`${i+1} 號就是假幣！你只秤了 <b>${used}</b> 次。`, newGame); }
          else { const other=[...cand].filter(x=>x!==i), f=other[rand(other.length)];
            draw(); showWin('🙈','還不能確定喔！',`假幣其實是 <b>${f+1}</b> 號。<br>${cand.size>1?`秤完之後還有 ${cand.size} 枚都有可能是假的，`:''}要有十足的把握才行！`, newGame, '再試一次'); }
          return;
        }
        place[i]=(place[i]+1)%3; tilt=null;
      }
      else if(e.target.closest('.weigh')){
        const L=place.filter(p=>p===1).length, R=place.filter(p=>p===2).length;
        if(!L || L!==R){ msg='兩邊要放一樣多枚，才比得出來喔！'; draw(); return; }
        const g={'-1':[],'1':[],'0':[]}; cand.forEach(i=>g[place[i]===1?-1:place[i]===2?1:0].push(i));
        const mx=Math.max(g[-1].length,g[1].length,g[0].length), pick=shuffle([-1,1,0].filter(k=>g[k].length===mx))[0];
        tilt=pick; cand=new Set(g[pick]); used++;
        msg = used>=maxW() ? '次數用完了！按「指出假幣」，選出假的那一枚。' : '';
      }
      else if(e.target.closest('.off')){ place.fill(0); tilt=null; }
      else if(e.target.closest('.accb')) accuse=!accuse;
      else return;
      draw();
    });
    newGame();
  }});

/* ---------- 青蛙交換 ---------- */
reg({id:'frog', cat:'logic', title:'青蛙換位', emoji:'🐸',
  desc:'左邊和右邊的青蛙要互相交換位置，只能往前跳！',
  explain:`<p>先玩玩看，把<b>最少步數</b>記下來，會發現規律：</p>
  <div class="ex">每邊 1 隻：<b>3</b> 步　　每邊 2 隻：<b>8</b> 步<br>每邊 3 隻：<b>15</b> 步　　每邊 4 隻：<b>24</b> 步</div>
  <p>3、8、15、24…相差 5、7、9，每次多 2！</p>
  <p><b>另一種看法：</b>3 ＝ 1×3，8 ＝ 2×4，15 ＝ 3×5，24 ＝ 4×6。每邊有幾隻，就乘上「比它多 2」的數。</p>
  <p><b>為什麼？</b>以每邊 3 隻為例：</p>
  <ul><li>每隻綠青蛙都要「越過」3 隻黃青蛙，所以一共要<b>跳</b> 3 × 3 ＝ 9 次。</li>
  <li>每隻青蛙都要前進 4 格，6 隻一共 24 格；跳 9 次已經走了 18 格，剩下 6 格要用<b>走</b>的，走 6 次。</li>
  <li>9 ＋ 6 ＝ <b>15</b> 步。</li></ul>
  <p><b>不卡住的祕訣：</b></p>
  <ul><li><b>不要讓兩隻同顏色的青蛙前後黏在一起擠在中間</b>——後面那隻會被擋住，對面的也跳不過兩隻。</li>
  <li>正確的節奏是兩邊輪流：綠 1 次、黃 2 次、綠 3 次、黃 3 次、綠 3 次、黃 2 次、綠 1 次。</li></ul>
  <p>💭 這種「先玩小的例子 → 列表 → 找規律 → 想為什麼」的方法，就是數學家研究問題的方法！</p>`,
  mount(el){
    const opts = {n:3};
    const ui = shell(el, `
      <p>讓<b>綠青蛙</b>和<b>黃青蛙</b>互相交換位置。</p>
      <ul><li>綠青蛙只能往<b>右</b>，黃青蛙只能往<b>左</b>，不能回頭。</li>
      <li>青蛙可以<b>走</b>到前面的空荷葉，或<b>跳過一隻</b>不同顏色的青蛙到空荷葉。</li><li>點青蛙讓牠前進。</li></ul>`,
      [{key:'n', label:'每邊', options:[[1,'1 隻'],[2,'2 隻'],[3,'3 隻'],[4,'4 隻']]}], opts, newGame);
    let a, steps, hist, msg;
    function newGame(){ runId++; a=[...Array(opts.n).fill('L'),'_',...Array(opts.n).fill('R')]; steps=0; hist=[]; msg=''; draw(); }
    function dest(i){ const d=a[i]==='L'?1:-1, o=a[i]==='L'?'R':'L';
      if(a[i+d]==='_') return i+d; if(a[i+d]===o && a[i+2*d]==='_') return i+2*d; return -1; }
    const stuck=()=>a.every((v,i)=>v==='_'||dest(i)<0);
    const won=()=>a.join('')==='R'.repeat(opts.n)+'_'+'L'.repeat(opts.n);
    function draw(){
      ui.board.innerHTML = `<div class="frogs">${a.map((v,i)=>`<button data-i="${i}" class="${v==='L'?'fl':v==='R'?'fr':''}">${v==='_'?'':'🐸'}<small>${v==='L'?'➡':v==='R'?'⬅':''}</small></button>`).join('')}</div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${hist.length?'':'disabled'}>↩ 上一步</button></div>`;
      ui.setStatus(`步數 ${big(steps)}　｜　最少 ${opts.n*(opts.n+2)} 步`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.frogs button'); msg='';
      if(b){ const i=+b.dataset.i; if(a[i]==='_') return; const t=dest(i);
        if(t<0){ msg='這隻青蛙前面被擋住了，動不了！'; }
        else { hist.push(a.slice()); a[t]=a[i]; a[i]='_'; steps++;
          if(won()){ draw(); showWin('🐸','交換成功！',`一共 <b>${steps}</b> 步。<br>換不同的隻數，把步數記下來，找找看規律！`, newGame); return; }
          if(stuck()) msg='卡住了！沒有青蛙可以動。按「上一步」退回去想想看。'; } }
      else if(e.target.closest('.undo')){ a=hist.pop(); steps--; }
      else return;
      draw();
    });
    newGame();
  }});
