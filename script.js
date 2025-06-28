/* 0/1-Knapsack visualiser with live-code highlighting
   — full rewrite to keep it simple for you
================================================================ */
const $ = id => document.getElementById(id);

const startBtn   = $("startBtn");
const resetBtn   = $("resetBtn");
const resultBox  = $("result");
const tblWrap    = $("tableWrapper");
const knapInner  = $("knapsackInner");
const speedRange = $("speedRange");
const codeBox    = $("codeBox");

/* ────────────────────────────────────────────────────────── */
/* 1.  Python snippet to display                                   */
const PY_SOURCE = [
`1  def knapsack_01(values, weights, C):`,
`2      n = len(values)`,
`3      dp   = [[0]*(C+1) for _ in range(n+1)]`,
`4      keep = [[False]*(C+1) for _ in range(n+1)]`,
``,
`5      for i in range(1, n+1):                # ❶ loop over items`,
`6          wt, val = weights[i-1], values[i-1]`,
`7          for w in range(0, C+1):            # ❷ loop over capacities`,
`8              if wt <= w:                    # ❸ can it fit?`,
`9                  take = val + dp[i-1][w-wt] # ❹ profit if we take it`,
`10                 skip = dp[i-1][w]          # ❺ profit if we skip it`,
`11                 if take > skip:            # ❻ better to take?`,
`12                     dp[i][w]   = take      # ❼ add item`,
`13                     keep[i][w] = True`,
`14                 else:`,
`15                     dp[i][w] = skip        # ❽ reject item`,
`16             else:`,
`17                 dp[i][w] = dp[i-1][w]      # ❾ too heavy → reject`,
``,
`18     # ------- reconstruct chosen items -------`,
`19     w, picked = C, []`,
`20     for i in range(n, 0, -1):`,
`21         if keep[i][w]:`,
`22             picked.append(i-1)             # store 0-based index`,
`23             w -= weights[i-1]`,
`24     picked.reverse()`,
`25     return dp[n][C], picked`
];

/* 2.  Helper to (re)draw the snippet                               */
function renderCode(){
  codeBox.innerHTML = PY_SOURCE
     .map(line => `<span class="codeLine">${line}</span>`)
     .join("\n");
  return Array.from(codeBox.querySelectorAll(".codeLine"));
}

/* 3.  Highlight utility                                            */
async function flash(lineEls, num){
  lineEls.forEach(el => el.classList.remove("active"));
  if(lineEls[num-1]){
     lineEls[num-1].classList.add("active");
  }
  await new Promise(r => setTimeout(r, +speedRange.value/2));
}

/* 4.  Reset button                                                 */
resetBtn.onclick = () => {
  tblWrap.innerHTML = knapInner.innerHTML = codeBox.innerHTML = "";
  resultBox.textContent = "";
};

/* 5.  Start / main routine                                         */
startBtn.onclick = async () => {
  /* ----- clean slate ----- */
  tblWrap.innerHTML = knapInner.innerHTML = resultBox.textContent = "";
  const codeLines = renderCode();

  /* ----- parse & validate user input ----- */
  const values  = $("values").value.trim().split(/\s+/).map(Number);
  const weights = $("weights").value.trim().split(/\s+/).map(Number);
  const C       = +$("capacity").value;

  if (!values.length || values.length !== weights.length ||
      C <= 0 || weights.some(w=>w<=0)){
    alert("Enter equal-length positive arrays and a capacity > 0"); return;
  }

  /* ----- build empty table ----- */
  const n = values.length;
  const dp = Array.from({length:n+1},()=>Array(C+1).fill(0));
  const cell = Array.from({length:n+1},()=>Array(C+1));

  const table = document.createElement("table");
  const header = document.createElement("tr");
  header.innerHTML = "<th>i/w</th>" +
                     Array.from({length:C+1},(_,w)=>`<th>${w}</th>`).join("");
  table.appendChild(header);

  for(let i=0;i<=n;i++){
    const tr=document.createElement("tr");
    tr.innerHTML=`<th>${i}</th>`+Array.from({length:C+1},()=>"<td>0</td>").join("");
    table.appendChild(tr);
    Array.from(tr.children).slice(1)  // skip row-label
         .forEach((td,w)=>{cell[i][w]=td});
  }
  tblWrap.appendChild(table);

  /* ----- DP with animation & code-highlight ----- */
  const pause = ()=>new Promise(r=>setTimeout(r,+speedRange.value));

  for(let i=1;i<=n;i++){
    await flash(codeLines,5); await flash(codeLines,6);
    for(let w=1;w<=C;w++){
      await flash(codeLines,7);
      if(weights[i-1] <= w){
        await flash(codeLines,8);
        const take = values[i-1]+dp[i-1][w-weights[i-1]];
        const skip = dp[i-1][w];
        dp[i][w]= take>skip? take: skip;
        await flash(codeLines,11);
        await flash(codeLines, take>skip?12:15);
      }else{
        dp[i][w]=dp[i-1][w];
        await flash(codeLines,17);
      }
      /* update UI cell */
      const td = cell[i][w];
      td.textContent = dp[i][w];
      td.classList.add("current");
      await pause();
      td.classList.remove("current");
    }
  }

  /* ----- traceback ----- */
  await flash(codeLines,18);
  let w=C, chosen=[];
  for(let i=n;i>0;i--){
    await flash(codeLines,20);
    if(dp[i][w]!==dp[i-1][w]){
      await flash(codeLines,21);
      chosen.push(i);
      w-=weights[i-1];
      await flash(codeLines,23);
    }
  }

  /* ----- animate chosen items into the knapsack ----- */
  chosen.reverse().forEach((idx,pos)=>{
     const div=document.createElement("div");
     div.className="itemBlock";
     div.style.height=`${(weights[idx-1]/C)*100}%`;
     div.style.animationDelay=`${pos*200}ms`;
     div.textContent=`#${idx} (v${values[idx-1]}, w${weights[idx-1]})`;
     knapInner.appendChild(div);
  });
  await new Promise(r=>setTimeout(r,chosen.length*200+600));

  resultBox.textContent=`Max profit: ${dp[n][C]} | Items: ${chosen.join(", ")}`;
};
