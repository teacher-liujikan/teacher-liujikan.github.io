/* ---------- 日曆拼圖（原創版面與積木組合） ---------- */
reg({id:'calendar', cat:'geo', title:'日曆拼圖', emoji:'📅',
  desc:'用九塊積木把日曆蓋起來，只露出今天的月份和日期。每天都是新題目！',
  explain:{
  1:`<p><b>先數一數格子：</b></p>
  <div class="ex">月份 12 格 ＋ 日期 31 格 ＝ <b>43 格</b><br>要露出 1 個月份和 1 個日期，所以要蓋住 43 － 2 ＝ <b>41 格</b></div>
  <p><b>再數積木：</b></p>
  <div class="ex">4 格的積木有 4 塊：4 × 4 ＝ 16 格<br>5 格的積木有 5 塊：5 × 5 ＝ 25 格<br>16 ＋ 25 ＝ <b>41 格</b>，剛剛好！</div>
  <p><b>小祕訣：</b></p>
  <ul><li>先放<b>角落</b>和<b>今天日期旁邊</b>的位置，那裡最難填。</li><li>不要留下 1 格、2 格、3 格的小洞，因為最小的積木也要 4 格。</li><li>放不下就轉一轉、翻個面。</li></ul>`,
  2:`<p><b>一年有幾道題目？</b>每一天都是不同的題目，閏年有 <b>366</b> 題。這個版面我用程式把 366 天全部檢查過，<b>每一天都拼得出來</b>，而且通常不只一種拼法。</p>
  <p><b>一塊積木有幾種擺法？</b>旋轉 4 個方向 × 翻面 2 種，最多 8 種；但對稱的積木轉了、翻了會和原來一樣：</p>
  <div class="ex">長條（I）：只有 2 種<br>T 形、閃電形（S）、U 形、V 形、Z 形：各 4 種<br>L 形（4 格和 5 格的）、P 形：各 8 種</div>
  <p>所以<b>越不對稱的積木，擺法越多</b>；卡住的時候，先試著翻動 L 形和 P 形。</p>
  <p><b>面積相同，形狀不同：</b>四塊 4 格積木面積都是 4，周長卻不全一樣；五塊 5 格積木裡，P 形的周長是 10，其他都是 12。</p>
  <p>💭 試試看你的生日那一天！</p>`,
  3:`<p><b>有幾個月日組合？</b>12 個月 × 31 天 ＝ 372 種，但其中 6 個不是真的日期（2/30、2/31、4/31、6/31、9/31、11/31），所以是 <b>366</b> 題。</p>
  <p><b>精確覆蓋問題：</b>「用給定的積木，把指定的格子不重疊、不遺漏地蓋滿」在數學上叫做精確覆蓋。電腦用<b>回溯法</b>解它：</p>
  <ul><li>找到第一個還沒蓋住的格子。</li><li>試每一塊還沒用的積木、每一種方向，看能不能蓋住它。</li><li>能放就放，再往下找；走不通就退回來換一種。</li></ul>
  <p>按「提示」時，程式就是這樣在一瞬間算出答案的。</p>
  <p><b>塗色論證：</b>把日曆像西洋棋盤一樣黑白相間塗色。</p>
  <div class="ex">5 格的積木：蓋住的黑格和白格一定<b>相差奇數</b>（3 和 2，或 4 和 1）<br>T 形：相差 2（3 和 1）<br>其他 4 格積木：相差 0（2 和 2）</div>
  <p>把九塊的差加起來，就限制了「露出的兩格」可能是什麼顏色的組合。這類不變量常用來證明某些拼圖<b>不可能</b>完成。</p>
  <p>💭 設計這種拼圖最難的地方，就是挑出一組積木，讓 366 天<b>全部</b>有解——只能靠程式一組一組去試。</p>`},
  mount(el){
    const ui = shell(el, `<p>把 9 塊積木全部放上日曆，<b>只露出今天的月份和日期</b>。</p>
      <ul><li>先點一塊積木，再點日曆上的格子放下去。</li><li>放之前可以按「旋轉」和「翻面」。</li><li>點日曆上的積木可以把它拿起來。</li>
      <li>可以換成別的日期，例如你的生日。</li></ul>`, [], {}, ()=>reset());
    const P={I:[[0,0],[0,1],[0,2],[0,3]],T:[[0,0],[0,1],[0,2],[1,1]],S:[[0,1],[0,2],[1,0],[1,1]],J:[[0,0],[1,0],[2,0],[2,1]],
      L:[[0,0],[1,0],[2,0],[3,0],[3,1]],P:[[0,0],[0,1],[1,0],[1,1],[2,0]],U:[[0,0],[0,2],[1,0],[1,1],[1,2]],V:[[0,0],[1,0],[2,0],[2,1],[2,2]],Z:[[0,0],[0,1],[1,1],[2,1],[2,2]]};
    const NAMES=Object.keys(P), COL={I:'#2f6690',T:'#7d5ba6',S:'#3f7d5a',J:'#c9772b',L:'#b5482f',P:'#17868a',U:'#b8862f',V:'#5d6dbe',Z:'#c0527a'};
    const R=6, C=8, DIM=[31,29,31,30,31,30,31,31,30,31,30,31];
    const exists=(r,c)=> r<0||r>=R||c<0||c>=C ? false : r<3 ? true : r===3 ? c<7 : (c>=1&&c<=6);
    const norm=c=>{ const mr=Math.min(...c.map(p=>p[0])), mc=Math.min(...c.map(p=>p[1])); return c.map(([r,q])=>[r-mr,q-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); };
    const allOri=n=>{ const out=[], seen=new Set(); for(const f of [0,1]){ let s=P[n].map(([r,q])=>f?[r,-q]:[r,q]); for(let k=0;k<4;k++){ s=s.map(([r,q])=>[q,-r]); const m=norm(s), key=JSON.stringify(m); if(!seen.has(key)){ seen.add(key); out.push(m); } } } return out; };
    const now=new Date(); let mo=now.getMonth(), dy=now.getDate()-1, g, ori, sel, msg;
    const mCell=()=>[4+Math.floor(mo/6), 1+mo%6], dCell=()=>[Math.floor(dy/8), dy%8];
    const isTarget=(r,c)=>{ const a=mCell(), z=dCell(); return (r===a[0]&&c===a[1])||(r===z[0]&&c===z[1]); };
    const label=(r,c)=> r<4 ? String(r*8+c+1) : `${(r-4)*6+c}月`;
    const placed=n=>g.some(row=>row.includes(n));
    function reset(){ runId++; g=Array.from({length:R},()=>Array(C).fill(null)); ori={}; NAMES.forEach(n=>ori[n]=norm(P[n])); sel=NAMES[0]; msg=''; draw(); }
    function solve(){
      const b=Array.from({length:R},(_,r)=>Array.from({length:C},(_,c)=>!exists(r,c)||isTarget(r,c)?'#':null)), used={};
      (function dfs(){ let r=-1,c=-1; o: for(let i=0;i<R;i++) for(let j=0;j<C;j++) if(!b[i][j]){ r=i; c=j; break o; } if(r<0) return true;
        for(const n of NAMES){ if(used[n]) continue; for(const o of allOri(n)){ const [ar,ac]=o[0], cs=o.map(([a,z])=>[r+a-ar,c+z-ac]);
          if(cs.every(([a,z])=>a>=0&&a<R&&z>=0&&z<C&&!b[a][z])){ cs.forEach(([a,z])=>b[a][z]=n); used[n]=1; if(dfs()) return true; used[n]=0; cs.forEach(([a,z])=>b[a][z]=null); } } }
        return false; })();
      return b; }
    function mini(n){ const c=ori[n], h=Math.max(...c.map(p=>p[0]))+1, w=Math.max(...c.map(p=>p[1]))+1;
      return `<svg viewBox="0 0 ${w*10} ${h*10}" style="width:${w*16}px;height:${h*16}px">${c.map(([r,q])=>`<rect x="${q*10+.5}" y="${r*10+.5}" width="9" height="9" rx="1.5" fill="${COL[n]}"/>`).join('')}</svg>`; }
    function draw(){
      const left=NAMES.filter(n=>!placed(n));
      let cells=''; for(let r=0;r<R;r++) for(let c=0;c<C;c++){
        if(!exists(r,c)){ cells+='<span></span>'; continue; }
        const v=g[r][c], t=isTarget(r,c);
        cells+=`<button data-r="${r}" data-c="${c}" class="${t?'target':''} ${r>=4?'mon':''}" style="${v?`background:${COL[v]};color:transparent;box-shadow:inset 0 0 0 2px rgba(255,255,255,.3)`:''}">${label(r,c)}</button>`; }
      ui.board.innerHTML = `<div class="cal-date"><button data-d="m-1">◀</button><b>${mo+1} 月</b><button data-d="m1">▶</button><button data-d="d-1">◀</button><b>${dy+1} 日</b><button data-d="d1">▶</button><button data-d="today" class="today">今天</button></div>
        <div class="cal">${cells}</div>
        <div class="pento-tray">${left.map(n=>`<button class="${sel===n?'on':''}" data-n="${n}">${mini(n)}</button>`).join('')||'<span class="empty">積木都放上去了</span>'}</div>
        <div class="actions"><button class="btn ghost rot">⟳ 旋轉</button><button class="btn ghost flp">⇋ 翻面</button><button class="btn ghost hintb">💡 提示</button><button class="btn ghost clr">全部拿起來</button></div>
        <div class="msg">${msg}</div>`;
      ui.setStatus(`${mo+1} 月 ${dy+1} 日　｜　還有 ${big(left.length)} 塊`);
    }
    ui.board.addEventListener('click', e=>{
      const db=e.target.closest('[data-d]'), cb=e.target.closest('.cal button'), tb=e.target.closest('.pento-tray button'); msg='';
      if(db){ const k=db.dataset.d;
        if(k==='today'){ const t=new Date(); mo=t.getMonth(); dy=t.getDate()-1; }
        else if(k[0]==='m'){ mo=(mo+ +k.slice(1)+12)%12; dy=Math.min(dy,DIM[mo]-1); } else dy=(dy+ +k.slice(1)+DIM[mo])%DIM[mo];
        reset(); return; }
      if(tb) sel=tb.dataset.n;
      else if(e.target.closest('.rot')){ if(sel&&!placed(sel)) ori[sel]=norm(ori[sel].map(([r,q])=>[q,-r])); }
      else if(e.target.closest('.flp')){ if(sel&&!placed(sel)) ori[sel]=norm(ori[sel].map(([r,q])=>[r,-q])); }
      else if(e.target.closest('.clr')){ reset(); return; }
      else if(e.target.closest('.hintb')){
        const s=solve(), n=NAMES.find(k=>{ for(let r=0;r<R;r++) for(let c=0;c<C;c++) if((s[r][c]===k)!==(g[r][c]===k)) return true; return false; });
        if(n){ const need=new Set(); for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(s[r][c]===n && g[r][c] && g[r][c]!==n) need.add(g[r][c]);
          need.add(n); g.forEach(row=>row.forEach((v,i)=>{ if(need.has(v)) row[i]=null; }));
          for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(s[r][c]===n) g[r][c]=n;
          sel=NAMES.find(k=>!placed(k))||null; msg='幫你放好一塊了（擋到的積木先拿起來）。'; } }
      else if(cb){
        const r=+cb.dataset.r, c=+cb.dataset.c, v=g[r][c];
        if(v){ g.forEach(row=>row.forEach((x,i)=>{ if(x===v) row[i]=null; })); sel=v; }
        else if(isTarget(r,c)) msg='這一格是今天的日期，要露出來，不能蓋住喔！';
        else if(!sel || placed(sel)) msg='先點一塊下面的積木！';
        else { const fits=cs=>cs.every(([a,z])=>exists(a,z)&&!g[a][z]&&!isTarget(a,z)); let ok=false;
          for(const [ar,ac] of [...ori[sel],[0,0]]){ const cs=ori[sel].map(([a,z])=>[r+a-ar,c+z-ac]); if(fits(cs)){ cs.forEach(([a,z])=>g[a][z]=sel); ok=true; break; } }
          if(!ok) msg='這裡放不下，轉一轉或換個位置試試！'; else sel=NAMES.find(n=>!placed(n))||null; }
      } else return;
      draw();
      if(NAMES.every(placed)) showWin('📅','拼好了！',`只露出 <b>${mo+1} 月 ${dy+1} 日</b>！<br>同一天通常不只一種拼法，還能找到別的嗎？`, reset);
    });
    reset();
  }});
