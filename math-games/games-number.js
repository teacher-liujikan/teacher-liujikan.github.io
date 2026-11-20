/* ===================== 數與量 ===================== */

/* ---------- 搶數字 ---------- */
reg({id:'grab', cat:'num', title:'搶數字', emoji:'🔢',
  desc:'輪流數數，誰先說到 20 就贏！先搶哪些數字最好？',
  explain:`<p>這個遊戲的祕密是<b>「倒著想」</b>。</p>
  <p>假設要搶 20，每次最多說 3 個數：</p>
  <ul><li>如果我說到 <b>16</b>，對手不管說 1、2、3 個（到 17、18、19），我都能接著說到 20。</li>
  <li>想搶到 16，就要先搶到 <b>12</b>；再往前是 <b>8</b>、<b>4</b>。</li></ul>
  <div class="ex">關鍵數字：4 → 8 → 12 → 16 → 20<br>每次相差 4，也就是（最多能說的個數 ＋ 1）。</div>
  <p>對手說 1 個，我就說 3 個；他說 2 個，我說 2 個；他說 3 個，我說 1 個——兩個人合起來永遠是 4 個！</p>
  <p>💭 想一想：搶 30、每次最多 4 個，關鍵數字是哪些？（提示：用 30 除以 5 看餘數）</p>`,
  mount(el){
    const opts = {target:20, step:3, mode:'easy', first:'me'};
    const ui = shell(el, `
      <p>兩邊輪流從 1 開始往下數。</p>
      <ul><li>每次可以說 <b>1 個</b>到<b>規定的個數</b>（例如最多 3 個）。</li>
      <li>數字要接著數，不能跳過。</li><li><b>說到最後那個數字的人贏！</b></li></ul>`,
      [{key:'target', label:'搶到', options:[[20,'20'],[30,'30'],[50,'50']]},
       {key:'step',   label:'每次', options:[[2,'最多 2 個'],[3,'最多 3 個'],[4,'最多 4 個']]},
       {key:'mode',   label:'對手', options:[['easy','電腦普通'],['hard','電腦高手'],['pvp','兩人對戰']]},
       {key:'first',  label:'先手', options:[['me','我先'],['cpu','對方先']]}], opts, newGame);
    let cur, owner, turn, busy, over, fresh;
    const names = ()=>playerNames(opts.mode);
    const cpuTurn = ()=>opts.mode!=='pvp' && turn===1;
    function newGame(){ runId++; cur=0; owner=[]; turn=opts.first==='me'?0:1; busy=false; over=false; fresh=[]; draw(); maybeCpu(); }
    function draw(){
      const btns = [];
      for(let k=1;k<=opts.step && cur+k<=opts.target;k++){
        const said = Array.from({length:k},(_,x)=>cur+1+x).join('、');
        btns.push(`<button class="btn big green say" data-k="${k}" ${busy||over||cpuTurn()?'disabled':''}>說「${said}」</button>`);
      }
      ui.board.innerHTML = `<div class="track">${Array.from({length:opts.target},(_,x)=>{
        const n=x+1, o=owner[n];
        return `<div class="num ${o!==undefined?'p'+o:''} ${n===opts.target?'goal':''} ${fresh.includes(n)?'new':''}">${n}</div>`;
      }).join('')}</div><div class="actions">${over?'':btns.join('')}</div>`;
      fresh = [];
      if(!over) ui.setStatus(cpuTurn() ? '🤔 電腦想一想…' : `${turnHTML(names(), turn)}　現在數到 <b>${cur}</b>`);
    }
    ui.board.addEventListener('click', e=>{
      const b = e.target.closest('.say'); if(!b || busy || over || cpuTurn()) return; say(+b.dataset.k);
    });
    function say(k){
      for(let x=0;x<k;x++){ cur++; owner[cur]=turn; fresh.push(cur); }
      if(cur===opts.target){
        over = true; draw(); const n = names();
        ui.setStatus(`🏆 <span class="badge p${turn}">${n[turn]}</span> 搶到 ${opts.target}！`);
        const youWin = opts.mode==='pvp' || turn===0;
        showWin(youWin?'🎉':'🤖', opts.mode==='pvp'?`${n[turn]}獲勝！`:(turn===0?'你贏了！':'電腦贏了！'),
          youWin?'你搶到最後一個數字了！':`提示：看看紅色、藍色數字，誰說到了 ${opts.target-(opts.step+1)}？`, newGame);
        return;
      }
      turn = 1-turn; draw(); maybeCpu();
    }
    function maybeCpu(){
      if(!cpuTurn() || over) return;
      busy = true; draw();
      later(()=>{
        let k = (opts.target-cur) % (opts.step+1);
        if(k===0 || (opts.mode==='easy' && Math.random()<0.5)) k = 1+rand(opts.step);
        busy = false; say(Math.min(k, opts.target-cur));
      }, 900);
    }
    newGame();
  }});

/* ---------- 魔方陣 ---------- */
reg({id:'magic', cat:'num', title:'魔方陣', emoji:'✨',
  desc:'把 1～9 放進九宮格，每條線加起來都是 15。',
  explain:`<p><b>為什麼每條線是 15？</b></p>
  <p>1＋2＋3＋…＋9 ＝ 45。三橫排把 9 個數剛好分成 3 組，每組一樣多，所以 45 ÷ 3 ＝ <b>15</b>。</p>
  <p><b>為什麼中間一定是 5？</b></p>
  <p>中間那格同時在 4 條線上（1 橫、1 直、2 斜）。用 1～9 湊出 15 的方法裡，只有 5 出現在 4 種組合中：</p>
  <div class="ex">1＋5＋9　2＋5＋8　3＋5＋7　4＋5＋6</div>
  <p><b>角落放什麼？</b>角落在 3 條線上，雙數 2、4、6、8 剛好各有 3 種湊法；單數 1、3、7、9 只有 2 種，所以放在邊的中間。</p>
  <p>💭 把做好的魔方陣轉一轉、照鏡子翻一翻，一共可以變出 8 種樣子，但其實都是同一個！</p>`,
  mount(el){
    const ui = shell(el, `
      <p>把 <b>1 到 9</b> 放進九宮格，每個數字只用一次。</p>
      <ul><li>讓<b>每一橫排、每一直行、兩條斜線</b>加起來都是 <b>15</b>。</li>
      <li>先點下面的數字，再點格子放進去。點格子裡的數字可以拿掉。</li>
      <li>綠色＝等於 15，紅色＝不是 15。</li></ul>`, [], {}, newGame);
    const lines = {r0:[0,1,2], r1:[3,4,5], r2:[6,7,8], c0:[0,3,6], c1:[1,4,7], c2:[2,5,8], d1:[0,4,8], d2:[2,4,6]};
    let cells, pick, msg;
    function newGame(){ runId++; cells = Array(9).fill(null); pick = null; msg=''; draw(); }
    function sumHTML(key, label=''){
      const vals = lines[key].map(i=>cells[i]);
      const full = vals.every(v=>v!==null), s = vals.reduce((a,v)=>a+(v||0),0);
      return `<div class="sum ${full?(s===15?'ok':'no'):''}">${label}${s||''}</div>`;
    }
    function draw(){
      let g = `<div></div><div></div><div></div>${sumHTML('d2','↙ ')}`;
      for(let r=0;r<3;r++){
        for(let c=0;c<3;c++){ const i=r*3+c; g += `<button class="mcell ${cells[i]?'filled':''}" data-i="${i}">${cells[i]||''}</button>`; }
        g += sumHTML('r'+r,'→ ');
      }
      g += sumHTML('c0','↓ ')+sumHTML('c1','↓ ')+sumHTML('c2','↓ ')+sumHTML('d1','↘ ');
      ui.board.innerHTML = `<div class="magic">${g}</div>
        <div class="pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}" class="${pick===n?'on':''} ${cells.includes(n)?'used':''}">${n}</button>`).join('')}</div>
        <div class="actions"><button class="btn ghost hint">💡 給我提示</button></div>
        <div class="msg" style="color:var(--ink)">${msg}</div>`;
      const ok = Object.keys(lines).filter(k=>{ const v=lines[k].map(i=>cells[i]); return v.every(x=>x!==null) && v.reduce((a,b)=>a+b,0)===15; }).length;
      ui.setStatus(pick ? `準備放 ${big(pick)}，點一個格子` : `已完成 ${big(ok)} / 8 條線`);
    }
    ui.board.addEventListener('click', e=>{
      const nb = e.target.closest('[data-n]'), cb = e.target.closest('.mcell'), hb = e.target.closest('.hint');
      msg = '';
      if(nb){ const n=+nb.dataset.n; pick = pick===n?null:n; }
      else if(cb){
        const i=+cb.dataset.i;
        if(pick){ const old=cells.indexOf(pick); if(old>=0) cells[old]=null; cells[i]=pick; pick=null; }
        else if(cells[i]) cells[i]=null;
      }
      else if(hb){
        if(cells[4]!==5){ const old=cells.indexOf(5); if(old>=0) cells[old]=null; cells[4]=5; msg='提示：正中間放 5 是關鍵！'; }
        else msg='提示：四個角落放雙數 2、4、6、8 試試看。';
      } else return;
      draw();
      const win = Object.values(lines).every(l=>l.every(i=>cells[i]!==null) && l.reduce((a,i)=>a+cells[i],0)===15);
      if(win) showWin('✨','完成魔方陣！','8 條線加起來都是 15！', newGame);
    });
    newGame();
  }});

/* ---------- 24 點 ---------- */
function solve24(nums){
  function rec(a){
    if(a.length===1) return a[0].v===24 ? a[0].e : null;
    for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++){
      const x=a[i], y=a[j], rest=a.filter((_,k)=>k!==i&&k!==j);
      const bg=x.v>=y.v?x:y, sm=x.v>=y.v?y:x;
      const c=[{v:x.v+y.v,e:`(${x.e}＋${y.e})`},{v:x.v*y.v,e:`(${x.e}×${y.e})`},{v:bg.v-sm.v,e:`(${bg.e}－${sm.e})`}];
      if(sm.v>0 && bg.v%sm.v===0) c.push({v:bg.v/sm.v,e:`(${bg.e}÷${sm.e})`});
      for(const n of c){ const r=rec([...rest,n]); if(r) return r; }
    }
    return null;
  }
  const r = rec(nums.map(v=>({v,e:String(v)})));
  return r ? r.slice(1,-1) : null;
}
reg({id:'tf', cat:'num', title:'24 點', emoji:'🃏',
  desc:'用 4 個數字和 ＋－×÷，算出 24！',
  explain:`<p>24 是一個「好朋友很多」的數字，它可以這樣乘出來：</p>
  <div class="ex">3 × 8　　4 × 6　　2 × 12　　1 × 24</div>
  <p><b>祕訣：先想最後一步！</b></p>
  <ul><li>有 <b>8</b> 嗎？想辦法用其他數字湊出 <b>3</b>。</li>
  <li>有 <b>6</b> 嗎？想辦法湊出 <b>4</b>。有 <b>4</b> 就湊 <b>6</b>，有 <b>3</b> 就湊 <b>8</b>。</li>
  <li>也可以用加減：20＋4、30－6、25－1、12＋12。</li></ul>
  <div class="ex">例：2、3、4、8<br>有 8，所以想辦法用 2、3、4 湊出 3：<br>4 － 3 ＝ 1，1 ＋ 2 ＝ 3，最後 3 × 8 ＝ 24 ✔</div>
  <p>算的順序不一樣，答案就不一樣，所以這個遊戲也在練習<b>「先算哪一步」</b>（就像算式裡的括號）。</p>`,
  mount(el){
    const opts = {max:9};
    const ui = shell(el, `
      <p>用 4 張數字卡，算出 <b>24</b>！每張都要用到，而且只能用一次。</p>
      <ul><li>點一張卡 → 點 ＋－×÷ → 再點另一張卡，兩張就會合成一張。</li>
      <li>最後剩下一張 24 就過關。</li><li>算錯了可以按「上一步」。</li></ul>`,
      [{key:'max', label:'數字', options:[[9,'1～9'],[13,'1～13']]}], opts, newGame);
    let start, cards, sel, op, hist, msg, hint;
    function newGame(){
      runId++;
      do { start = Array.from({length:4},()=>1+rand(opts.max)); } while(!solve24(start));
      reset();
    }
    function reset(){ cards = start.slice(); sel=null; op=null; hist=[]; msg=''; hint=''; draw(); }
    function draw(){
      ui.board.innerHTML = `<div class="tf-cards">${cards.map((v,i)=> v===null ? `<div class="tf-card gone"></div>` :
          `<button class="tf-card ${sel===i?'on':''}" data-i="${i}">${v}</button>`).join('')}</div>
        <div class="tf-ops">${['＋','－','×','÷'].map(o=>`<button class="${op===o?'on':''}" data-o="${o}">${o}</button>`).join('')}</div>
        <div class="msg">${msg}</div>
        <div class="actions"><button class="btn ghost undo" ${hist.length?'':'disabled'}>↩ 上一步</button>
          <button class="btn ghost again">重來</button><button class="btn ghost hintb">💡 看一種解法</button>
          <button class="btn next">換一題</button></div>
        <div class="msg" style="color:var(--ink)">${hint}</div>`;
      ui.setStatus(sel===null ? '先點一張數字卡' : op===null ? '再點一個符號' : '再點另一張數字卡');
    }
    ui.board.addEventListener('click', e=>{
      const cb=e.target.closest('.tf-card[data-i]'), ob=e.target.closest('[data-o]');
      if(cb){
        const i=+cb.dataset.i; msg='';
        if(sel===null || op===null || i===sel){ sel = (sel===i && op===null) ? null : i; if(sel===null) op=null; }
        else {
          const a=cards[sel], b=cards[i]; let r=null;
          if(op==='＋') r=a+b; else if(op==='×') r=a*b;
          else if(op==='－'){ if(a<b) msg=`${a} 不夠減 ${b} 喔！`; else r=a-b; }
          else { if(b===0 || a%b!==0) msg=`${a} ÷ ${b} 除不盡喔！`; else r=a/b; }
          if(r!==null){
            hist.push(cards.slice()); cards[sel]=null; cards[i]=r; sel=i; op=null;
            const left = cards.filter(v=>v!==null);
            if(left.length===1){
              if(left[0]===24){ draw(); showWin('🎉','算出 24 了！',`題目：${start.join('、')}`, newGame, '下一題'); return; }
              msg = `算出 ${left[0]}，不是 24。按「上一步」再試試！`;
            }
          } else op=null;
        }
      } else if(ob){ if(sel!==null) op = ob.dataset.o; else msg='先點一張數字卡喔！'; }
      else if(e.target.closest('.undo')){ cards = hist.pop(); sel=null; op=null; msg=''; }
      else if(e.target.closest('.again')){ reset(); return; }
      else if(e.target.closest('.hintb')){ hint = '其中一種：' + solve24(start) + ' ＝ 24'; }
      else if(e.target.closest('.next')){ newGame(); return; }
      else return;
      draw();
    });
    newGame();
  }});

/* ---------- 猜數字（高低） ---------- */
reg({id:'guess', cat:'num', title:'終極密碼', emoji:'🎯',
  desc:'電腦心裡想一個數字，用最少次數猜中它！',
  explain:`<p>最聰明的猜法是<b>每次都猜正中間</b>。</p>
  <p>1～100 先猜 50：不管電腦說「太大」還是「太小」，都能一口氣<b>刪掉一半</b>的數字！</p>
  <div class="ex">100 個 → 50 個 → 25 個 → 12 個 → 6 個 → 3 個 → 1 個<br>最多 <b>7 次</b>一定猜中。</div>
  <p>如果從 1、2、3… 一個一個猜，運氣不好要猜 100 次呢！</p>
  <p>💭 1～1000 要幾次？只要 <b>10 次</b>！因為 2 連乘 10 次是 1024，比 1000 還大。每多猜 1 次，能處理的範圍就變成 2 倍。</p>
  <p>查字典、翻電話簿、電腦找資料，用的都是這個「對半找」的方法。</p>`,
  mount(el){
    const opts = {max:100};
    const ui = shell(el, `
      <p>電腦在範圍內想了一個數字。</p>
      <ul><li>用數字鍵輸入你猜的數，按 OK。</li><li>電腦會說「太大」或「太小」。</li>
      <li>看看你能不能在<b>目標次數</b>內猜中！</li></ul>`,
      [{key:'max', label:'範圍', options:[[50,'1～50'],[100,'1～100'],[1000,'1～1000']]}], opts, newGame);
    let secret, lo, hi, tries, input, log, msg;
    const best = ()=>Math.ceil(Math.log2(opts.max+1));
    function newGame(){ runId++; secret=1+rand(opts.max); lo=1; hi=opts.max; tries=0; input=''; log=[]; msg=''; draw(); }
    function draw(){
      const L=(lo-1)/opts.max*100, W=(hi-lo+1)/opts.max*100;
      ui.board.innerHTML = `<div class="g-range">答案在 <b>${lo}</b> ～ <b>${hi}</b> 之間</div>
        <div class="g-bar"><div style="left:${L}%;width:${W}%"></div></div>
        <div class="g-row"><div><div class="g-input">${input||'？'}</div>${padHTML()}</div>
        <div class="g-log">${log.map(l=>`<div>${l}</div>`).join('')||'<div class="empty">猜過的數字會出現在這裡</div>'}</div></div>
        <div class="msg">${msg}</div>`;
      ui.setStatus(`已經猜 ${big(tries)} 次　｜　目標 ${best()} 次內`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.keypad button'); if(!b) return; const d=b.dataset.d; msg='';
      if(d==='del') input=input.slice(0,-1);
      else if(d==='ok'){
        const g=+input; if(!input) return;
        if(g<1 || g>opts.max){ msg=`要猜 1～${opts.max} 的數字喔！`; input=''; draw(); return; }
        tries++; input='';
        if(g===secret){ draw(); showWin(tries<=best()?'🏆':'🎉','猜中了！',`答案是 <b>${secret}</b>，你猜了 <b>${tries}</b> 次。${tries<=best()?'':`<br>目標是 ${best()} 次內，再挑戰？`}`, newGame); return; }
        if(g>secret){ log.unshift(`${g}　⬇ 太大了`); hi=Math.min(hi,g-1); } else { log.unshift(`${g}　⬆ 太小了`); lo=Math.max(lo,g+1); }
      } else if(input.length<4) input += d;
      draw();
    });
    newGame();
  }});

/* ---------- 讀心術卡片 ---------- */
reg({id:'mind', cat:'num', title:'讀心術卡片', emoji:'🔮',
  desc:'心裡想一個數字，電腦問幾個問題就能猜中！',
  explain:`<p>這個魔術的祕密藏在每張卡片的<b>第一個數字</b>：</p>
  <div class="ex">1、2、4、8、16（每個都是前一個的 2 倍）</div>
  <p>把你回答「有」的卡片，<b>第一個數字加起來</b>，就是你想的數！</p>
  <p>例如想的是 <b>13</b>：13 ＝ 8 ＋ 4 ＋ 1，所以 13 只會出現在開頭是 8、4、1 的三張卡片上。</p>
  <p><b>為什麼一定猜得中？</b>因為任何數字都可以用 1、2、4、8、16 相加湊出來，而且每個最多用一次、湊法只有一種。</p>
  <div class="ex">5 ＝ 4＋1　　10 ＝ 8＋2　　21 ＝ 16＋4＋1　　31 ＝ 16＋8＋4＋2＋1</div>
  <p>這就是電腦使用的<b>二進位</b>：電腦只認得「有」和「沒有」（1 和 0），卻能表示所有的數字。</p>
  <p>💭 你也可以自己做一套卡片，表演給家人看！</p>`,
  mount(el){
    const opts = {n:5};
    const ui = shell(el, `
      <p>在心裡偷偷想一個數字，不要說出來！</p>
      <ul><li>電腦會給你看幾張卡片。</li><li>你只要回答卡片上「有」或「沒有」你想的數字。</li>
      <li>電腦就能猜出來！你知道它怎麼辦到的嗎？</li></ul>`,
      [{key:'n', label:'卡片', options:[[4,'4 張（1～15）'],[5,'5 張（1～31）'],[6,'6 張（1～63）']]}], opts, newGame);
    let order, k, sum;
    function newGame(){ runId++; order=shuffle(Array.from({length:opts.n},(_,i)=>i)); k=-1; sum=0; draw(); }
    function draw(){
      const max=2**opts.n-1;
      if(k<0){
        ui.board.innerHTML = `<div class="mind-big">🤫</div><div class="g-range">在心裡想一個 <b>1 ～ ${max}</b> 的數字</div>
          <div class="actions"><button class="btn big go">想好了！</button></div>`;
        ui.setStatus('想一個數字，記在心裡');
      } else if(k<opts.n){
        const bit=1<<order[k], nums=[]; for(let i=1;i<=max;i++) if(i&bit) nums.push(i);
        ui.board.innerHTML = `<div class="mind-card" style="grid-template-columns:repeat(${opts.n>=6?8:opts.n===5?4:4},1fr)">${nums.map(n=>`<span>${n}</span>`).join('')}</div>
          <div class="g-range">這張卡片上<b>有</b>你想的數字嗎？</div>
          <div class="actions"><button class="btn big green yes">⭕ 有</button><button class="btn big no" style="background:var(--red);box-shadow:0 4px 0 #a83a1a">❌ 沒有</button></div>`;
        ui.setStatus(`第 ${big(k+1)} / ${opts.n} 張卡片`);
      } else {
        ui.board.innerHTML = sum===0 ? `<div class="mind-big">🤔</div><div class="g-range">每一張都沒有？你想的數字不在 1～${max} 裡喔！</div>
          <div class="actions"><button class="btn big re">再玩一次</button></div>` :
          `<div class="g-range">你想的數字是…</div><div class="mind-answer">${sum}</div>
          <div class="actions"><button class="btn big re">再玩一次</button><button class="btn ghost big ex">🎓 為什麼猜得到？</button></div>`;
        ui.setStatus('🔮 猜中了嗎？');
      }
    }
    ui.board.addEventListener('click', e=>{
      if(e.target.closest('.go')) k=0;
      else if(e.target.closest('.yes')){ sum += 1<<order[k]; k++; }
      else if(e.target.closest('.no')) k++;
      else if(e.target.closest('.re')){ newGame(); return; }
      else if(e.target.closest('.ex')){ showExplain(); return; }
      else return;
      draw();
    });
    newGame();
  }});

/* ---------- 質數篩 ---------- */
reg({id:'sieve', cat:'num', title:'質數篩子', emoji:'🧮',
  desc:'在百數表上把倍數一批一批篩掉，留下來的就是質數！',
  explain:`<p><b>質數</b>是只能被 1 和自己整除的數，像 2、3、5、7、11…（1 不是質數）。</p>
  <p>兩千多年前，希臘數學家<b>埃拉托斯特尼</b>想出這個「篩子」的方法：</p>
  <ul><li>2 是質數，把 2 的倍數（4、6、8…）通通劃掉。</li>
  <li>剩下最小的是 3，把 3 的倍數劃掉。</li><li>接著是 5、7…一直做下去。</li></ul>
  <p><b>為什麼篩到 7 就可以停？</b></p>
  <p>下一個質數是 11，可是 11 × 11 ＝ 121，已經超過 100 了。100 以內 11 的倍數（22、33、44…）都是 11 乘上比它小的數，早就被 2、3、5、7 劃掉了！</p>
  <div class="ex">100 以內一共有 <b>25</b> 個質數。<br>2 是唯一的雙數質數。</div>
  <p>💭 觀察一下：每種顏色（每個質數的倍數）在百數表上排成什麼圖案？</p>`,
  mount(el){
    const ui = shell(el, `
      <p>找出 1～100 裡所有的<b>質數</b>！</p>
      <ul><li>每次點<b>還沒被劃掉的最小數字</b>，它就是質數（會被圈起來）。</li>
      <li>它的倍數會自動被劃掉。</li><li>一直做到沒有東西可以劃為止。</li></ul>
      <p class="tip">💡 1 不是質數，所以一開始就劃掉了。</p>`, [], {}, newGame);
    const colors = {2:'#ffd6cc',3:'#cfe3fa',5:'#d3f0df',7:'#ffe7a8'};
    let st, msg, done;
    function newGame(){ runId++; st=Array(101).fill(0); st[1]='x'; msg=''; done=false; draw(); }
    const smallest = ()=>{ for(let i=2;i<=100;i++) if(st[i]===0) return i; return 0; };
    function draw(){
      ui.board.innerHTML = `<div class="sieve">${Array.from({length:100},(_,i)=>{ const n=i+1, s=st[n];
        return `<button data-n="${n}" class="${s==='p'?'prime':s?'cross':''}" style="${s&&s!=='p'&&s!=='x'?`background:${colors[s]}`:''}">${n}</button>`; }).join('')}</div>
        <div class="msg">${msg}</div>`;
      ui.setStatus(`已經找到 ${big(st.filter(s=>s==='p').length)} 個質數`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.sieve button'); if(!b || done) return; const n=+b.dataset.n;
      if(st[n]!==0){ msg = st[n]==='p' ? '' : `${n} 已經被劃掉了。`; draw(); return; }
      if(n!==smallest()){ msg='要從「還沒被劃掉的最小數字」開始喔！找找看是哪一個？'; draw(); return; }
      st[n]='p'; let cnt=0; for(let m=n*2;m<=100;m+=n) if(st[m]===0){ st[m]=n; cnt++; }
      msg = `${n} 是質數！劃掉了 ${cnt} 個 ${n} 的倍數。`;
      if(n>=7){
        done=true; draw();
        later(()=>{ for(let i=2;i<=100;i++) if(st[i]===0) st[i]='p'; msg='剩下的通通都是質數！'; draw();
          later(()=>showWin('🧮','篩完了！','100 以內一共有 <b>25</b> 個質數。<br>為什麼篩到 7 就可以停了？看看數學講解！', newGame), 900); }, 900);
        return;
      }
      draw();
    });
    newGame();
  }});

/* ---------- 因數收稅員 ---------- */
reg({id:'taxman', cat:'num', title:'因數收稅員', emoji:'💰',
  desc:'拿走一個數字，收稅員就會拿走它所有的因數。你能贏過他嗎？',
  explain:`<p>你拿一個數，收稅員就拿走它<b>還在桌上的因數</b>。所以要選「因數已經被拿光、只剩一點點」的數！</p>
  <p><b>第一步最重要：拿最大的質數。</b></p>
  <p>質數的因數只有 1 和自己，所以收稅員只能拿到 1。而且 1 被拿走之後，其他質數就再也不能選了（因為沒有因數可以繳稅），所以一定要挑最大的那個質數！</p>
  <div class="ex">1～12 的好玩法：<br>拿 11（稅 1）→ 拿 9（稅 3）→ 拿 10（稅 2、5）→ 拿 8（稅 4）→ 拿 12（稅 6）<br>你 50 分，收稅員 28 分（包含最後剩下、沒人能選的 7）</div>
  <p><b>第二個祕訣：</b>先拿「質數 × 質數」的數（像 9、25），它們的因數很少。</p>
  <p>💭 玩這個遊戲會一直用到<b>因數</b>：12 的因數有 1、2、3、4、6、12，你都找得出來嗎？</p>`,
  mount(el){
    const opts = {n:12};
    const ui = shell(el, `
      <p>桌上有 1 到 N 的數字卡，你和收稅員比誰拿的總和多。</p>
      <ul><li>你拿走一個數字，收稅員就拿走<b>桌上所有它的因數</b>。</li>
      <li>收稅員一定要拿得到稅！<b>沒有因數留在桌上的數字不能選</b>。</li>
      <li>都不能選的時候，剩下的全部歸收稅員。</li></ul>`,
      [{key:'n', label:'數字', options:[[12,'1～12'],[20,'1～20'],[30,'1～30']]}], opts, newGame);
    let own, me, tax, msg, over;
    const facs = n => { const f=[]; for(let d=1;d<n;d++) if(n%d===0 && !own[d]) f.push(d); return f; };
    function newGame(){ runId++; own=Array(opts.n+1).fill(0); me=0; tax=0; msg='亮亮的數字可以選'; over=false; draw(); }
    function draw(){
      ui.board.innerHTML = `<div class="tax-score"><div class="badge p0">你　${me}</div><div class="badge p1">收稅員　${tax}</div></div>
        <div class="tax-grid">${Array.from({length:opts.n},(_,i)=>{ const n=i+1;
          const cls = own[n]===1?'mine':own[n]===2?'his':(facs(n).length?'ok':'dead');
          return `<button data-n="${n}" class="${cls}">${n}</button>`; }).join('')}</div>
        <div class="msg" style="color:var(--ink)">${msg}</div>`;
      ui.setStatus(over ? (me>tax?'🏆 你贏了！':'收稅員贏了') : `桌上還有 ${big(own.slice(1).filter(o=>!o).length)} 張`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('.tax-grid button'); if(!b || over) return; const n=+b.dataset.n;
      if(own[n]) return;
      const f=facs(n);
      if(!f.length){ msg=`${n} 的因數都被拿走了，收稅員收不到稅，不能選！`; draw(); return; }
      own[n]=1; me+=n; f.forEach(d=>{ own[d]=2; tax+=d; });
      msg = `你拿 ${n}，收稅員拿走 ${f.join('、')}。`;
      let any=false; for(let k=1;k<=opts.n;k++) if(!own[k] && facs(k).length) any=true;
      if(!any){
        const rest=[]; for(let k=1;k<=opts.n;k++) if(!own[k]){ own[k]=2; tax+=k; rest.push(k); }
        over=true; if(rest.length) msg += ` 剩下的 ${rest.join('、')} 都歸收稅員。`;
        draw();
        showWin(me>tax?'🎉':'💰', me>tax?'你贏過收稅員了！':'收稅員贏了…', `你 <b>${me}</b> 分，收稅員 <b>${tax}</b> 分。${me>tax?'<br>還能拿到更高分嗎？':'<br>提示：第一步拿哪個數，收稅員拿最少？'}`, newGame);
        return;
      }
      draw();
    });
    newGame();
  }});

/* ---------- 冰雹數 ---------- */
reg({id:'hail', cat:'num', title:'冰雹數', emoji:'🌨️',
  desc:'雙數除以 2、單數乘 3 加 1，數字會像冰雹一樣上上下下！',
  explain:`<p>規則超簡單：<b>雙數 ÷ 2，單數 × 3 ＋ 1</b>，一直做下去。</p>
  <div class="ex">6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1</div>
  <p>數字忽大忽小，像冰雹在雲裡上上下下，最後掉到地面（1）。</p>
  <p><b>神奇的地方：</b>不管從哪個數開始，到目前為止試過的每一個數，最後都會回到 1！</p>
  <p>但是——<b>沒有人能證明「所有的數」都會這樣</b>。這個問題叫做<b>考拉茲猜想</b>，已經難倒全世界的數學家 80 多年了。電腦已經檢查過非常非常大的數，都沒有例外，可是「檢查很多」不等於「證明全部」。</p>
  <p>💭 試試 27：它要走 111 步，中間還會衝到 9232！</p>
  <p>數學裡還有很多像這樣「小學生看得懂、數學家解不開」的問題喔。</p>`,
  mount(el){
    const opts = {start:6};
    const ui = shell(el, `
      <p>從一個數字出發，照規則一直算下去：</p>
      <ul><li>如果是<b>雙數（偶數）</b>：÷ 2</li><li>如果是<b>單數（奇數）</b>：× 3 ＋ 1</li>
      <li>你來判斷要按哪一個！看看最後會變成多少？</li></ul>`,
      [{key:'start', label:'起點', options:[[6,'6'],[7,'7'],[12,'12'],[19,'19'],[27,'27'],['r','隨機']]}], opts, newGame);
    let seq, msg, auto;
    function newGame(){ runId++; seq=[opts.start==='r' ? 2+rand(49) : opts.start]; msg=''; auto=false; draw(); }
    function chart(){
      const W=600,H=220,max=Math.max(...seq),n=seq.length;
      const pts=seq.map((v,i)=>`${n===1?W/2:10+i*(W-20)/(n-1)},${H-10-(v/max)*(H-30)}`);
      return `<svg class="hail-chart" viewBox="0 0 ${W} ${H}"><polyline points="${pts.join(' ')}" fill="none" stroke="#2d7dd2" stroke-width="3" stroke-linejoin="round"/>
        ${n<=40?pts.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="5" fill="#2d7dd2"/>`).join(''):''}</svg>`;
    }
    function draw(){
      const cur=seq[seq.length-1], end=cur===1 && seq.length>1;
      ui.board.innerHTML = `${chart()}
        <div class="hail-seq">${seq.map((v,i)=>`<span class="${i===seq.length-1?'cur':''}">${v}</span>`).join('<i>→</i>')}</div>
        <div class="msg">${msg}</div>
        <div class="actions">${end||auto?'':`<button class="btn big even" style="background:var(--blue);box-shadow:0 4px 0 #1d5a9c">雙數　÷ 2</button>
          <button class="btn big odd">單數　× 3 ＋ 1</button><button class="btn ghost autob">⏩ 自動算完</button>`}</div>`;
      ui.setStatus(`走了 ${big(seq.length-1)} 步　｜　最高 ${Math.max(...seq)}`);
    }
    function step(){ const c=seq[seq.length-1]; seq.push(c%2===0 ? c/2 : c*3+1); }
    function finish(){ draw(); showWin('🌨️','掉到 1 了！',`從 <b>${seq[0]}</b> 出發，走了 <b>${seq.length-1}</b> 步，最高衝到 <b>${Math.max(...seq)}</b>。<br>換個起點試試看？`, newGame); }
    function run(){ if(seq[seq.length-1]===1){ auto=false; finish(); return; } step(); draw(); later(run, seq.length>40?40:160); }
    ui.board.addEventListener('click', e=>{
      const c=seq[seq.length-1]; msg='';
      if(e.target.closest('.even')){ if(c%2) msg=`${c} 是單數喔！`; else step(); }
      else if(e.target.closest('.odd')){ if(c%2===0) msg=`${c} 是雙數喔！`; else step(); }
      else if(e.target.closest('.autob')){ auto=true; run(); return; }
      else return;
      if(seq[seq.length-1]===1) finish(); else draw();
    });
    newGame();
  }});

/* ---------- 倒水問題 ---------- */
reg({id:'jug', cat:'num', title:'倒水問題', emoji:'🫗',
  desc:'只有 3 公升和 5 公升的水壺，怎麼量出剛好 4 公升？',
  explain:`<p>水壺沒有刻度，所以只能做三件事：<b>裝滿、倒光、倒到另一壺</b>。祕訣是利用兩個水壺的<b>差</b>。</p>
  <div class="ex">3 公升和 5 公升量出 4 公升：<br>① 裝滿 5 → ② 倒進 3（5 壺剩 <b>2</b>）→ ③ 倒掉 3<br>④ 把 2 倒進 3 壺 → ⑤ 再裝滿 5 → ⑥ 倒進 3 壺（只能再裝 1）<br>5 壺剩下 5 － 1 ＝ <b>4</b> ✔</div>
  <p>用算式看：5 ＋ 5 － 3 － 3 ＝ 4。也就是「裝滿 5 壺 2 次、倒掉 3 壺 2 次」。</p>
  <p><b>一個固定的好方法：</b>一直重複「裝滿大壺 → 倒進小壺 → 小壺滿了就倒掉」，大壺裡會依序出現各種水量。</p>
  <p>💭 進階：4 公升和 6 公升的水壺，量得出 3 公升嗎？<br>量不出來！因為 4 和 6 都是雙數，怎麼加減都是雙數。兩個水壺的容量要「互質」（除了 1 沒有共同的因數），才能量出每一種水量。</p>`,
  mount(el){
    const opts = {lv:'3,5,4'};
    const ui = shell(el, `
      <p>有兩個<b>沒有刻度</b>的水壺和一個水龍頭。</p>
      <ul><li><b>裝滿</b>：把水壺裝到滿。</li><li><b>倒掉</b>：把水壺倒光。</li>
      <li><b>倒過去</b>：倒進另一個水壺，直到倒光或對方滿了。</li>
      <li>讓其中一個水壺剛好是<b>目標水量</b>就過關！</li></ul>`,
      [{key:'lv', label:'題目', options:[['3,5,4','3 和 5 → 4'],['4,7,5','4 和 7 → 5'],['4,9,6','4 和 9 → 6'],['5,8,6','5 和 8 → 6']]}], opts, newGame);
    let cap, t, w, steps, best;
    function bfs(){
      const seen=new Set(['0,0']); let q=[[0,0]], d=0;
      while(q.length){ const nq=[];
        for(const [a,b] of q){ if(a===t||b===t) return d;
          const p1=Math.min(a,cap[1]-b), p2=Math.min(b,cap[0]-a);
          for(const s of [[cap[0],b],[a,cap[1]],[0,b],[a,0],[a-p1,b+p1],[a+p2,b-p2]]){ const k=s.join(','); if(!seen.has(k)){ seen.add(k); nq.push(s); } } }
        q=nq; d++; }
      return -1;
    }
    function newGame(){ runId++; const p=opts.lv.split(',').map(Number); cap=[p[0],p[1]]; t=p[2]; w=[0,0]; steps=0; best=bfs(); draw(); }
    function draw(){
      const maxc=Math.max(...cap);
      ui.board.innerHTML = `<div class="g-range">目標：量出剛好 <b>${t}</b> 公升</div>
        <div class="jugs">${[0,1].map(i=>`<div class="jug-col">
          <div class="jug" style="height:${cap[i]/maxc*230}px"><div class="water" style="height:${w[i]/cap[i]*100}%"></div><span>${w[i]}</span></div>
          <div class="jug-name">${cap[i]} 公升壺</div>
          <button class="btn" data-a="fill" data-i="${i}" style="background:var(--blue);box-shadow:0 4px 0 #1d5a9c">🚰 裝滿</button>
          <button class="btn ghost" data-a="empty" data-i="${i}">倒掉</button>
          <button class="btn green" data-a="pour" data-i="${i}">${i===0?'倒過去 ➡':'⬅ 倒過去'}</button></div>`).join('')}</div>`;
      ui.setStatus(`步數 ${big(steps)}　｜　最少 ${best} 步`);
    }
    ui.board.addEventListener('click', e=>{
      const b=e.target.closest('[data-a]'); if(!b) return; const i=+b.dataset.i, o=1-i, before=w.join();
      if(b.dataset.a==='fill') w[i]=cap[i]; else if(b.dataset.a==='empty') w[i]=0;
      else { const p=Math.min(w[i],cap[o]-w[o]); w[i]-=p; w[o]+=p; }
      if(w.join()!==before) steps++;
      draw();
      if(w.includes(t)) showWin(steps===best?'🏆':'🎉', `量出 ${t} 公升了！`, `你用了 <b>${steps}</b> 步，最少是 <b>${best}</b> 步。`, newGame);
    });
    newGame();
  }});

/* ---------- 數字黑洞 ---------- */
reg({id:'kap', cat:'num', title:'數字黑洞', emoji:'🕳️',
  desc:'排出最大的數減最小的數，一直減下去…會掉進神祕的黑洞！',
  explain:`<p>隨便選 4 個數字（不能全部一樣），排成<b>最大的數</b>和<b>最小的數</b>，相減；把答案的 4 個數字再重排、再相減…</p>
  <div class="ex">3524 → 5432 － 2345 ＝ 3087<br>8730 － 0378 ＝ 8352<br>8532 － 2358 ＝ <b>6174</b><br>7641 － 1467 ＝ <b>6174</b>（跑不出去了！）</div>
  <p>不管一開始選什麼，<b>最多 7 步</b>一定會掉進 <b>6174</b>。這個數叫做<b>卡布列克常數</b>，是印度數學家卡布列克在 1949 年發現的。</p>
  <p>三位數也有黑洞：<b>495</b>（954 － 459 ＝ 495）。</p>
  <p><b>小發現：</b>每一步算出來的答案，一定是 <b>9 的倍數</b>（把每一位數字加起來會是 9、18 或 27）。可以拿來檢查自己有沒有算錯！</p>
  <p>💭 這也是練習「排出最大數、最小數」和借位減法的好遊戲。</p>`,
  mount(el){
    const opts = {d:4};
    const ui = shell(el, `
      <p>輸入幾個數字（不能全部一樣）。</p>
      <ul><li>用這些數字排出<b>最大的數</b>和<b>最小的數</b>。</li><li>大的減小的，得到新的數。</li>
      <li>一直重複，看看會發生什麼事！</li></ul>
      <p class="tip">💡 可以先自己用紙筆算，再按「下一步」對答案。</p>`,
      [{key:'d', label:'位數', options:[[3,'三位數'],[4,'四位數']]}], opts, newGame);
    let input, rows, cur, msg, done;
    const hole = ()=>opts.d===4?6174:495;
    const pad = n => String(n).padStart(opts.d,'0');
    function newGame(){ runId++; input=''; rows=[]; cur=null; msg=''; done=false; draw(); }
    function draw(){
      if(cur===null){
        ui.board.innerHTML = `<div class="g-range">輸入一個${opts.d===4?'四':'三'}位數</div><div class="g-input">${input.padEnd(opts.d,'＿')}</div>${padHTML()}
          <div class="actions"><button class="btn ghost rnd">🎲 幫我選</button></div><div class="msg">${msg}</div>`;
        ui.setStatus('選一個數字開始');
      } else {
        ui.board.innerHTML = `<div class="g-range">起點：<b>${pad(rows.length?rows[0].from:cur)}</b></div>
          <div class="kap-rows">${rows.map((r,i)=>`<div><i>第 ${i+1} 步</i>${r.hi} － ${r.lo} ＝ <b class="${r.res===hole()?'hole':''}">${pad(r.res)}</b></div>`).join('')}</div>
          <div class="msg" style="color:var(--ink)">${msg}</div>
          <div class="actions">${done?`<button class="btn big re">換一個數字</button>`:`<button class="btn big nx">下一步：把 ${pad(cur)} 重新排</button>`}</div>`;
        ui.setStatus(`走了 ${big(rows.length)} 步`);
      }
    }
    function begin(s){
      if(s.length<opts.d){ msg=`要輸入 ${opts.d} 個數字喔！`; return; }
      if(new Set(s).size===1){ msg='數字不能全部一樣喔！'; input=''; return; }
      cur=+s; msg=''; if(cur===hole()){ msg='哇，你直接選到黑洞了！'; }
    }
    ui.board.addEventListener('click', e=>{
      const k=e.target.closest('.keypad button');
      if(k){ const d=k.dataset.d; msg='';
        if(d==='del') input=input.slice(0,-1); else if(d==='ok') begin(input); else if(input.length<opts.d) input+=d; }
      else if(e.target.closest('.rnd')){ do { input=Array.from({length:opts.d},()=>rand(10)).join(''); } while(new Set(input).size===1); begin(input); }
      else if(e.target.closest('.nx')){
        const ds=pad(cur).split('').sort(), lo=ds.join(''), hi=ds.slice().reverse().join(''), res=+hi-+lo;
        rows.push({from:cur,hi,lo,res}); cur=res;
        if(res===hole()){ done=true; msg=`🕳️ 掉進黑洞 ${hole()} 了！再算一次還是 ${hole()}，永遠出不去。`; }
      }
      else if(e.target.closest('.re')){ newGame(); return; }
      else return;
      draw();
    });
    newGame();
  }});
