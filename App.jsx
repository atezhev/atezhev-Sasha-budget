import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Legend } from "recharts";

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0d0a1a",
  card: "rgba(255,255,255,0.07)",
  cardBorder: "rgba(255,255,255,0.12)",
  glass: "rgba(255,255,255,0.05)",
  pink: "#ff6eb4",
  purple: "#b57bee",
  mint: "#5eead4",
  yellow: "#fbbf24",
  coral: "#ff7c6e",
  text: "#f8f0ff",
  muted: "rgba(248,240,255,0.45)",
  dim: "rgba(248,240,255,0.2)",
  grad1: "linear-gradient(135deg,#ff6eb4,#b57bee)",
  grad2: "linear-gradient(135deg,#5eead4,#b57bee)",
  grad3: "linear-gradient(135deg,#fbbf24,#ff7c6e)",
  grad4: "linear-gradient(135deg,#ff7c6e,#ff6eb4)",
};

const PIE_COLORS = ["#ff6eb4","#b57bee","#5eead4","#fbbf24","#ff7c6e","#60a5fa","#a78bfa","#34d399"];
const CURRENCIES = ["TRY","RUB","USD","EUR","GBP"];
const SYM = {RUB:"₽",TRY:"₺",USD:"$",EUR:"€",GBP:"£"};
const RATES_DEFAULT = {RUB:1,TRY:3.2,USD:90,EUR:98,GBP:114};
let RATES = {...RATES_DEFAULT};
const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

const DEF_SOURCES = [
  {id:"s1",name:"Родители",icon:"💝",expected:28000},
  {id:"s2",name:"Подарок",icon:"🎀",expected:3000},
  {id:"s3",name:"Карманные",icon:"💸",expected:5000},
];
const DEF_ACCOUNTS = [
  {id:"a1",name:"Турецкая карта",icon:"🌊",cur:"TRY",balance:0,initBalance:0},
  {id:"a2",name:"Тинькофф",icon:"🦋",cur:"RUB",balance:0,initBalance:0},
  {id:"a3",name:"Инвестиции",icon:"🌱",cur:"RUB",balance:0,initBalance:0},
  {id:"a4",name:"Накопления",icon:"⭐",cur:"RUB",balance:0,initBalance:0},
];
const DEF_CATS = [
  {id:"c1",name:"Одежда и обувь",icon:"👗",budget:5000,cur:"TRY",tags:["одежда","обувь","аксессуары","спорт"],grad:T.grad1},
  {id:"c2",name:"Красота",icon:"💄",budget:3000,cur:"TRY",tags:["аптека","косметика","салон","врач"],grad:"linear-gradient(135deg,#f472b6,#fb7185)"},
  {id:"c3",name:"Еда вне дома",icon:"🍜",budget:10000,cur:"TRY",tags:["кафе","ресторан","доставка","кофе","перекус"],grad:T.grad3},
  {id:"c4",name:"Транспорт",icon:"🛵",budget:2000,cur:"TRY",tags:["такси","автобус","метро"],grad:T.grad2},
  {id:"c5",name:"Подарки, друзья",icon:"🎉",budget:2000,cur:"TRY",tags:["подарок","кино","развлечения"],grad:"linear-gradient(135deg,#a78bfa,#818cf8)"},
  {id:"c6",name:"Подписки",icon:"📱",budget:2000,cur:"TRY",tags:["связь","стриминг","приложения"],grad:"linear-gradient(135deg,#38bdf8,#818cf8)"},
  {id:"c7",name:"Прочее",icon:"✨",budget:4000,cur:"TRY",tags:["покупки","бытовое","учёба"],grad:"linear-gradient(135deg,#5eead4,#60a5fa)"},
];

const LS = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};
const toRub=(n,cur)=>n*(RATES[cur]||1);
const sym=(cur)=>SYM[cur]||cur;
const fN=(n)=>Math.abs(Math.round(n)).toLocaleString("ru");
const fV=(n,cur)=>`${n<0?"−":""}${fN(n)}${sym(cur)}`;
const todayStr=()=>new Date().toISOString().slice(0,10);

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("home");
  const [sources,setSources]=useState(()=>LS.get("sources2",DEF_SOURCES));
  const [accounts,setAccounts]=useState(()=>LS.get("accounts2",DEF_ACCOUNTS));
  const [cats,setCats]=useState(()=>LS.get("cats2",DEF_CATS));
  const [txs,setTxs]=useState(()=>LS.get("txs2",[]));
  const [rates,setRates]=useState(()=>LS.get("rates2",RATES_DEFAULT));
  const [rateDate,setRateDate]=useState(()=>LS.get("rateDate2",""));
  const [panel,setPanel]=useState(null);
  const [editTx,setEditTx]=useState(null);
  const [toast,setToast]=useState(null);

  useEffect(()=>{LS.set("sources2",sources);},[sources]);
  useEffect(()=>{LS.set("accounts2",accounts);},[accounts]);
  useEffect(()=>{LS.set("cats2",cats);},[cats]);
  useEffect(()=>{LS.set("txs2",txs);},[txs]);
  useEffect(()=>{LS.set("rates2",rates);},[rates]);
  useEffect(()=>{LS.set("rateDate2",rateDate);},[rateDate]);
  useEffect(()=>{Object.assign(RATES,rates);},[rates]);
  useEffect(()=>{Object.assign(RATES,rates);},[]);

  useEffect(()=>{
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r=>r.json()).then(json=>{
        const nr={RUB:1};
        ["TRY","USD","EUR","GBP"].forEach(c=>{if(json.Valute?.[c])nr[c]=parseFloat((json.Valute[c].Value/json.Valute[c].Nominal).toFixed(4));});
        setRates(nr);setRateDate(new Date(json.Date).toLocaleDateString("ru"));
      }).catch(()=>{});
  },[]);

  const showToast=(msg,col=T.grad1)=>{setToast({msg,col});setTimeout(()=>setToast(null),2400);};

  const catSpentRub=(catId)=>txs.filter(t=>t.type==="expense"&&t.catId===catId).reduce((s,t)=>s+toRub(t.amount,t.cur),0);
  const catSpentCur=(catId)=>{const cat=cats.find(c=>c.id===catId);const cc=cat?.cur||"TRY";return txs.filter(t=>t.type==="expense"&&t.catId===catId).reduce((s,t)=>s+(t.cur===cc?t.amount:toRub(t.amount,t.cur)/RATES[cc]),0);};
  const srcRcvRub=(srcId)=>txs.filter(t=>t.type==="income"&&t.srcId===srcId).reduce((s,t)=>s+toRub(t.amountTo||t.amount,t.curTo||t.cur),0);

  const totalBudRub=cats.reduce((s,c)=>s+toRub(c.budget||0,c.cur||"TRY"),0);
  const totalSpentRub=cats.reduce((s,c)=>s+catSpentRub(c.id),0);
  const totalWealthRub=accounts.reduce((s,a)=>s+toRub(a.balance,a.cur),0);
  const pct=Math.min(110,Math.round((totalSpentRub/(totalBudRub||1))*100));

  const applyBal=(t)=>{
    if(t.type==="expense") setAccounts(p=>p.map(a=>a.id===t.accId?{...a,balance:a.balance-t.amount}:a));
    else if(t.type==="income") setAccounts(p=>p.map(a=>a.id===t.accId?{...a,balance:a.balance+(t.amountTo||t.amount)}:a));
    else if(t.type==="transfer") setAccounts(p=>p.map(a=>{if(a.id===t.accId)return{...a,balance:a.balance-t.amount};if(a.id===t.accToId)return{...a,balance:a.balance+(t.amountTo||0)};return a;}));
  };
  const revertBal=(t)=>{
    if(t.type==="expense") setAccounts(p=>p.map(a=>a.id===t.accId?{...a,balance:a.balance+t.amount}:a));
    else if(t.type==="income") setAccounts(p=>p.map(a=>a.id===t.accId?{...a,balance:a.balance-(t.amountTo||t.amount)}:a));
    else if(t.type==="transfer") setAccounts(p=>p.map(a=>{if(a.id===t.accId)return{...a,balance:a.balance+t.amount};if(a.id===t.accToId)return{...a,balance:a.balance-(t.amountTo||0)};return a;}));
  };
  const addTx=(tx)=>{const n={...tx,id:Date.now()};setTxs(p=>[n,...p]);applyBal(n);};
  const deleteTx=(id)=>{const t=txs.find(x=>x.id===id);if(!t)return;setTxs(p=>p.filter(x=>x.id!==id));revertBal(t);showToast("Удалено 🗑");};
  const saveTx=(upd)=>{const old=txs.find(x=>x.id===upd.id);if(!old)return;revertBal(old);applyBal(upd);setTxs(p=>p.map(x=>x.id===upd.id?upd:x));setEditTx(null);showToast("Сохранено ✓");};

  return (
    <div style={{background:T.bg,minHeight:"100vh",color:T.text,fontFamily:"'Nunito',sans-serif",maxWidth:480,margin:"0 auto",paddingBottom:88,overflowX:"hidden",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900;1000&display=swap" rel="stylesheet"/>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes pop { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .card-press:active { transform: scale(0.97) !important; transition: transform 0.1s !important; }
      `}</style>

      {/* Decorative bg blobs */}
      <div style={{position:"fixed",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(181,123,238,0.18),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:200,left:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,110,180,0.12),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:100,right:-40,width:250,height:250,borderRadius:"50%",background:"radial-gradient(circle,rgba(94,234,212,0.1),transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,padding:"14px 20px 10px",background:"rgba(13,10,26,0.85)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{margin:0,fontSize:11,color:T.muted,fontWeight:600}}>привет, Саша 👋</p>
            <p style={{margin:0,fontSize:18,fontWeight:900,background:T.grad1,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Мой бюджет</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{margin:0,fontSize:10,color:T.muted}}>курс ЦБ {rateDate||"..."}</p>
            <p style={{margin:0,fontSize:13,fontWeight:800,color:T.mint}}>1₺ = {rates.TRY}₽</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",background:toast.col,padding:"10px 24px",borderRadius:24,zIndex:9999,fontWeight:800,fontSize:13,color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",whiteSpace:"nowrap",animation:"pop 0.2s ease"}}>{toast.msg}</div>}

      <div style={{position:"relative",zIndex:1}}>
        {tab==="home"&&<HomeTab sources={sources} setSources={setSources} accounts={accounts} setAccounts={setAccounts} cats={cats} setCats={setCats} txs={txs} addTx={addTx} catSpentRub={catSpentRub} catSpentCur={catSpentCur} srcRcvRub={srcRcvRub} totalBudRub={totalBudRub} totalSpentRub={totalSpentRub} totalWealthRub={totalWealthRub} pct={pct} rates={rates} onPanel={setPanel} showToast={showToast}/>}
        {tab==="history"&&<HistoryTab txs={txs} deleteTx={deleteTx} onEdit={setEditTx}/>}
        {tab==="analytics"&&<AnalyticsTab cats={cats} txs={txs} sources={sources} catSpentRub={catSpentRub} srcRcvRub={srcRcvRub} totalBudRub={totalBudRub} onOpenCat={id=>setPanel({type:"cat",id})}/>}

        {panel?.type==="source"&&<SourcePanel src={sources.find(x=>x.id===panel.id)} setSrc={v=>setSources(p=>p.map(x=>x.id===v.id?v:x))} delSrc={()=>{setSources(p=>p.filter(x=>x.id!==panel.id));setPanel(null);}} txs={txs} srcRcvRub={srcRcvRub} onEdit={setEditTx} deleteTx={deleteTx} onClose={()=>setPanel(null)} showToast={showToast}/>}
        {panel?.type==="account"&&<AccountPanel acc={accounts.find(x=>x.id===panel.id)} setAcc={v=>setAccounts(p=>p.map(x=>x.id===v.id?v:x))} delAcc={()=>{setAccounts(p=>p.filter(x=>x.id!==panel.id));setPanel(null);}} txs={txs} accounts={accounts} sources={sources} addTx={addTx} onEdit={setEditTx} deleteTx={deleteTx} onClose={()=>setPanel(null)} showToast={showToast}/>}
        {panel?.type==="cat"&&<CatPanel cat={cats.find(x=>x.id===panel.id)} setCat={v=>setCats(p=>p.map(x=>x.id===v.id?v:x))} delCat={()=>{setCats(p=>p.filter(x=>x.id!==panel.id));setPanel(null);}} txs={txs} accounts={accounts} catSpentRub={catSpentRub} catSpentCur={catSpentCur} addTx={addTx} onEdit={setEditTx} deleteTx={deleteTx} onClose={()=>setPanel(null)} showToast={showToast}/>}
        {editTx&&<EditTxModal tx={editTx} accounts={accounts} cats={cats} onSave={saveTx} onClose={()=>setEditTx(null)}/>}
      </div>

      {/* Bottom Nav */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,zIndex:100,padding:"0 16px 20px",paddingBottom:"max(20px,env(safe-area-inset-bottom))"}}>
        <div style={{background:"rgba(20,15,35,0.92)",backdropFilter:"blur(24px)",borderRadius:28,border:"1px solid rgba(255,255,255,0.1)",display:"flex",padding:"6px"}}>
          {[["home","🏠","Главная"],["history","💫","История"],["analytics","📊","Аналитика"]].map(([id,ic,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 4px",background:tab===id?T.grad1:"none",borderRadius:22,border:"none",cursor:"pointer",color:tab===id?"#fff":T.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.2s",fontFamily:"'Nunito',sans-serif"}}>
              <span style={{fontSize:18}}>{ic}</span>
              <span style={{fontSize:9,fontWeight:tab===id?900:600}}>{lb}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeTab({sources,setSources,accounts,setAccounts,cats,setCats,txs,addTx,catSpentRub,catSpentCur,srcRcvRub,totalBudRub,totalSpentRub,totalWealthRub,pct,rates,onPanel,showToast}) {
  const [addMode,setAddMode]=useState(null);
  const [nf,setNf]=useState({name:"",icon:"",cur:"TRY",budget:"",expected:"",bal:""});
  const sn=(k,v)=>setNf(p=>({...p,[k]:v}));
  const reset=()=>{setAddMode(null);setNf({name:"",icon:"",cur:"TRY",budget:"",expected:"",bal:""});};
  const doAdd=(type)=>{
    if(!nf.name.trim()){showToast("Введи название 🌸",T.coral);return;}
    const id="x"+Date.now();
    if(type==="src") setSources(p=>[...p,{id,name:nf.name,icon:nf.icon||"💰",expected:parseFloat(nf.expected)||0}]);
    else if(type==="acc") setAccounts(p=>[...p,{id,name:nf.name,icon:nf.icon||"💳",cur:nf.cur,balance:parseFloat(nf.bal)||0,initBalance:parseFloat(nf.bal)||0}]);
    else if(type==="cat") setCats(p=>[...p,{id,name:nf.name,icon:nf.icon||"✨",budget:parseFloat(nf.budget)||0,cur:nf.cur,tags:[],grad:T.grad1}]);
    showToast("Добавлено ✨",T.grad2); reset();
  };
  const totalLeft=totalBudRub-totalSpentRub;

  return (
    <div style={{padding:"16px 16px 0"}}>
      {/* Hero budget card */}
      <div style={{background:"linear-gradient(135deg,rgba(181,123,238,0.25),rgba(255,110,180,0.15))",borderRadius:28,padding:"20px 22px",marginBottom:16,border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(10px)",animation:"slideUp 0.4s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <p style={{color:T.muted,fontSize:11,fontWeight:700,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.8px"}}>Потрачено</p>
            <p style={{fontWeight:900,fontSize:28,margin:0,color:T.text}}>{fN(totalSpentRub)}<span style={{fontSize:16}}>₽</span></p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{color:T.muted,fontSize:11,fontWeight:700,margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.8px"}}>Остаток</p>
            <p style={{fontWeight:900,fontSize:28,margin:0,background:totalLeft<0?"none":T.grad2,WebkitBackgroundClip:totalLeft<0?"none":"text",WebkitTextFillColor:totalLeft<0?"#ff6eb4":"transparent",color:totalLeft<0?"#ff6eb4":"inherit"}}>{fV(totalLeft,"₽")}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,height:10,overflow:"hidden",marginBottom:6}}>
          <div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:pct>=100?"linear-gradient(90deg,#ff7c6e,#ff6eb4)":T.grad1,borderRadius:10,transition:"width 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:T.muted,fontSize:11}}>Бюджет: {fN(totalBudRub)}₽</span>
          <span style={{color:T.dim,fontSize:11}}>💼 Всего на счетах: <span style={{color:T.mint,fontWeight:800}}>{fN(totalWealthRub)}₽</span></span>
        </div>
      </div>

      {/* SOURCES */}
      <SectionHeader label="💝 Источники дохода" hint="тап → детали"/>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10,marginBottom:4}}>
        {sources.map((s,i)=>{
          const recv=srcRcvRub(s.id),exp=s.expected||0;
          const sp=exp>0?Math.min(100,Math.round((recv/exp)*100)):0;
          const grads=["linear-gradient(135deg,#ff6eb4,#b57bee)","linear-gradient(135deg,#5eead4,#60a5fa)","linear-gradient(135deg,#fbbf24,#ff7c6e)"];
          const g=grads[i%grads.length];
          return (
            <div key={s.id} onClick={()=>onPanel({type:"source",id:s.id})} className="card-press"
              style={{minWidth:100,background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"12px 10px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",textAlign:"center",flexShrink:0,backdropFilter:"blur(10px)"}}>
              <div style={{width:44,height:44,borderRadius:14,background:g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 6px"}}>
                {s.icon}
              </div>
              <p style={{color:T.text,fontSize:11,margin:"0 0 5px",fontWeight:800,lineHeight:1.2}}>{s.name}</p>
              {exp>0&&<>
                <div style={{background:"rgba(255,255,255,0.1)",borderRadius:4,height:4,overflow:"hidden",marginBottom:3}}>
                  <div style={{height:"100%",width:`${sp}%`,background:g,borderRadius:4}}/>
                </div>
                <p style={{color:T.muted,fontSize:9,margin:0}}>{fN(recv)}/{fN(exp)}₽</p>
              </>}
            </div>
          );
        })}
        {/* Add source button */}
        {addMode!=="src"&&(
          <div onClick={()=>setAddMode("src")} className="card-press"
            style={{minWidth:70,background:"rgba(255,110,180,0.08)",borderRadius:20,border:"1.5px dashed rgba(255,110,180,0.4)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,flexShrink:0,padding:"12px 8px"}}>
            <div style={{width:36,height:36,borderRadius:12,background:"rgba(255,110,180,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>＋</div>
            <p style={{color:"rgba(255,110,180,0.6)",fontSize:9,margin:0,fontWeight:700}}>новый</p>
          </div>
        )}
        {addMode==="src"&&<AddCard col="rgba(255,110,180,0.12)" border="rgba(255,110,180,0.5)" width={180}>
          <EmojiNameRow nf={nf} sn={sn} placeholder="Источник" emoji="💝"/>
          <FInput type="number" value={nf.expected} onChange={e=>sn("expected",e.target.value)} placeholder="Ожидается ₽" mb={8}/>
          <TwoBtn ok={()=>doAdd("src")} cancel={reset} okGrad={T.grad1}/>
        </AddCard>}
      </div>
      {sources.reduce((s,src)=>s+(src.expected||0),0)>0&&(
        <div style={{background:"rgba(94,234,212,0.08)",borderRadius:14,padding:"7px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",border:"1px solid rgba(94,234,212,0.15)"}}>
          <span style={{color:T.mint,fontSize:11,fontWeight:700}}>Ожидается: {fN(sources.reduce((s,src)=>s+(src.expected||0),0))}₽</span>
          <span style={{color:T.muted,fontSize:11,fontWeight:600}}>Получено: {fN(sources.reduce((s,src)=>s+srcRcvRub(src.id),0))}₽</span>
        </div>
      )}

      {/* ACCOUNTS */}
      <SectionHeader label="💳 Счета и кошельки" hint="тап → пополнить / перевести"/>
      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:10,marginBottom:14}}>
        {accounts.map((a,i)=>{
          const grads=["linear-gradient(135deg,#38bdf8,#818cf8)","linear-gradient(135deg,#fb923c,#f43f5e)","linear-gradient(135deg,#34d399,#059669)","linear-gradient(135deg,#fbbf24,#f59e0b)"];
          const g=grads[i%grads.length];
          return (
            <div key={a.id} onClick={()=>onPanel({type:"account",id:a.id})} className="card-press"
              style={{minWidth:130,background:"rgba(255,255,255,0.06)",borderRadius:22,padding:"14px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",flexShrink:0,backdropFilter:"blur(10px)"}}>
              <div style={{width:42,height:42,borderRadius:13,background:g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:8}}>{a.icon}</div>
              <p style={{color:T.muted,fontSize:10,margin:"0 0 3px",fontWeight:700,lineHeight:1.2}}>{a.name}</p>
              <p style={{fontWeight:900,fontSize:19,margin:0,color:a.balance<0?"#ff6eb4":T.text}}>{fV(a.balance,a.cur)}</p>
              {a.cur!=="RUB"&&<p style={{color:T.dim,fontSize:9,margin:"2px 0 0"}}>≈{fN(a.balance*RATES[a.cur])}₽</p>}
            </div>
          );
        })}
        {addMode!=="acc"&&(
          <div onClick={()=>setAddMode("acc")} className="card-press"
            style={{minWidth:70,background:"rgba(129,140,248,0.08)",borderRadius:22,border:"1.5px dashed rgba(129,140,248,0.4)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,flexShrink:0,padding:"14px 8px"}}>
            <div style={{width:36,height:36,borderRadius:12,background:"rgba(129,140,248,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>＋</div>
            <p style={{color:"rgba(129,140,248,0.6)",fontSize:9,margin:0,fontWeight:700}}>новый</p>
          </div>
        )}
        {addMode==="acc"&&<AddCard col="rgba(129,140,248,0.1)" border="rgba(129,140,248,0.4)" width={190}>
          <EmojiNameRow nf={nf} sn={sn} placeholder="Название" emoji="💳"/>
          <select value={nf.cur} onChange={e=>sn("cur",e.target.value)} style={{...IS,width:"100%",marginBottom:6}}>{CURRENCIES.map(c=><option key={c} value={c}>{sym(c)} {c}</option>)}</select>
          <FInput type="number" value={nf.bal} onChange={e=>sn("bal",e.target.value)} placeholder="Начальный остаток" mb={8}/>
          <TwoBtn ok={()=>doAdd("acc")} cancel={reset} okGrad="linear-gradient(135deg,#818cf8,#b57bee)"/>
        </AddCard>}
      </div>

      {/* CATEGORIES */}
      <SectionHeader label="🛍️ Категории расходов" hint="тап → добавить / детали"/>
      <div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:8}}>
        {cats.map(cat=>{
          const spRub=catSpentRub(cat.id);
          const spCur=catSpentCur(cat.id);
          const budRub=toRub(cat.budget||0,cat.cur||"TRY");
          const p=Math.min(100,Math.round((spRub/(budRub||1))*100));
          const over=spRub>budRub;
          return (
            <div key={cat.id} onClick={()=>onPanel({type:"cat",id:cat.id})} className="card-press"
              style={{background:"rgba(255,255,255,0.05)",borderRadius:20,padding:"14px 16px",cursor:"pointer",border:"1px solid rgba(255,255,255,0.08)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:46,height:46,borderRadius:14,background:cat.grad||T.grad1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <p style={{margin:0,fontWeight:800,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</p>
                  <span style={{fontSize:12,fontWeight:900,color:over?"#ff6eb4":T.mint,flexShrink:0,marginLeft:8}}>{fV(cat.budget-spCur,cat.cur||"TRY")}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.1)",borderRadius:6,height:6,overflow:"hidden",marginBottom:4}}>
                  <div style={{height:"100%",width:`${p}%`,background:over?"linear-gradient(90deg,#ff7c6e,#ff6eb4)":cat.grad||T.grad1,borderRadius:6,transition:"width 0.5s"}}/>
                </div>
                <p style={{color:T.muted,fontSize:10,margin:0}}>{fN(spCur)}{sym(cat.cur||"TRY")} / {fN(cat.budget)}{sym(cat.cur||"TRY")} · {p}%</p>
              </div>
              <span style={{color:T.dim,fontSize:18}}>›</span>
            </div>
          );
        })}
        {/* Add category */}
        {addMode!=="cat"&&(
          <div onClick={()=>setAddMode("cat")} className="card-press"
            style={{background:"rgba(94,234,212,0.05)",borderRadius:20,padding:"14px 16px",border:"1.5px dashed rgba(94,234,212,0.3)",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:46,height:46,borderRadius:14,background:"rgba(94,234,212,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>＋</div>
            <p style={{color:"rgba(94,234,212,0.6)",fontSize:14,margin:0,fontWeight:800}}>Добавить категорию</p>
          </div>
        )}
        {addMode==="cat"&&(
          <div style={{background:"rgba(94,234,212,0.08)",borderRadius:20,padding:14,border:"1.5px solid rgba(94,234,212,0.3)"}}>
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr 88px",gap:6,marginBottom:8}}>
              <input value={nf.icon} onChange={e=>sn("icon",e.target.value)} placeholder="✨" style={{...IS,textAlign:"center",fontSize:20}}/>
              <input value={nf.name} onChange={e=>sn("name",e.target.value)} placeholder="Название" style={IS} autoFocus/>
              <select value={nf.cur} onChange={e=>sn("cur",e.target.value)} style={IS}>{CURRENCIES.map(c=><option key={c} value={c}>{sym(c)} {c}</option>)}</select>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
              <span style={{color:T.muted,fontSize:12,whiteSpace:"nowrap"}}>Бюджет {sym(nf.cur)}:</span>
              <input type="number" value={nf.budget} onChange={e=>sn("budget",e.target.value)} placeholder="0" style={{...IS,flex:1}}/>
            </div>
            <TwoBtn ok={()=>doAdd("cat")} cancel={reset} okGrad={T.grad2} okLabel="✓ Добавить"/>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SOURCE PANEL ──────────────────────────────────────────────────────────────
function SourcePanel({src,setSrc,delSrc,txs,srcRcvRub,onEdit,deleteTx,onClose,showToast}) {
  const [editing,setEditing]=useState(false);
  const [ef,setEf]=useState({name:src.name,icon:src.icon,expected:String(src.expected||"")});
  const recv=srcRcvRub(src.id),exp=src.expected||0;
  const srcTxs=txs.filter(t=>t.srcId===src.id).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <Sheet title={`${src.icon} ${src.name}`} grad={T.grad1} onClose={onClose}
      actions={<><GhostBtn onClick={()=>setEditing(e=>!e)}>{editing?"✕":"✏️"}</GhostBtn><GhostBtn onClick={()=>{if(window.confirm("Удалить?"))delSrc();}} danger>🗑</GhostBtn></>}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <StatCard label="Получено" val={fN(recv)+"₽"} col={T.mint}/>
        <StatCard label="Ожидается" val={fN(exp)+"₽"} col={T.purple}/>
      </div>
      {exp>0&&<PBarStyled val={recv} max={exp} grad={T.grad1} mb={14}/>}
      {editing&&<EditBox mb={12}>
        <EmojiNameRow nf={ef} sn={(k,v)=>setEf(p=>({...p,[k]:v}))} placeholder="Источник" emoji="💝"/>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <span style={{color:T.muted,fontSize:12,whiteSpace:"nowrap"}}>Ожидается ₽:</span>
          <input type="number" value={ef.expected} onChange={e=>setEf(p=>({...p,expected:e.target.value}))} style={{...INP,flex:1}}/>
        </div>
        <TwoBtn ok={()=>{setSrc({...src,name:ef.name,icon:ef.icon,expected:parseFloat(ef.expected)||0});setEditing(false);showToast("Сохранено ✓");}} cancel={()=>setEditing(false)} okLabel="✓ Изменить" okGrad={T.grad1}/>
      </EditBox>}
      <SLabel>история поступлений ({srcTxs.length})</SLabel>
      <TxList txs={srcTxs} onEdit={onEdit} onDelete={deleteTx}/>
    </Sheet>
  );
}

// ── ACCOUNT PANEL ─────────────────────────────────────────────────────────────
function AccountPanel({acc,setAcc,delAcc,txs,accounts,sources,addTx,onEdit,deleteTx,onClose,showToast}) {
  const [mode,setMode]=useState("income");
  const [editing,setEditing]=useState(false);
  const [ef,setEf]=useState({name:acc.name,icon:acc.icon,initBalance:String(acc.initBalance||0),balance:String(acc.balance)});
  const [inf,setInf]=useState(()=>({srcId:sources[0]?.id||"",amount:"",amountTo:"",customRate:"",comment:"",date:todayStr()}));
  const [tf,setTf]=useState({toAccId:"",amount:"",amountTo:"",customRate:"",comment:"",date:todayStr()});
  const si=(k,v)=>setInf(p=>({...p,[k]:v}));
  const st=(k,v)=>setTf(p=>({...p,[k]:v}));
  const selSrc=sources.find(x=>x.id===inf.srcId);
  const toAcc=accounts.find(x=>x.id===tf.toAccId);
  const incNeedConv=acc.cur!=="RUB";
  const tfrNeedConv=toAcc&&acc.cur!==toAcc.cur;
  const incAutoRate=incNeedConv?(1/RATES[acc.cur]).toFixed(4):null;
  const tfrAutoRate=tfrNeedConv?((RATES[acc.cur]||1)/(RATES[toAcc.cur]||1)).toFixed(4):null;
  useEffect(()=>{if(incAutoRate&&inf.amount&&!inf.customRate)si("amountTo",(parseFloat(inf.amount)/RATES[acc.cur]).toFixed(2));},[inf.amount,inf.customRate]);
  useEffect(()=>{if(tfrAutoRate&&tf.amount&&!tf.customRate)st("amountTo",(parseFloat(tf.amount)*parseFloat(tfrAutoRate)).toFixed(2));},[tf.amount,tf.toAccId,tf.customRate]);
  const confirmIncome=()=>{
    const amt=parseFloat(inf.amount)||0;
    if(!amt){showToast("Введи сумму 🌸",T.coral);return;}
    if(!inf.srcId){showToast("Выбери источник 💝",T.coral);return;}
    const amtTo=incNeedConv?(parseFloat(inf.amountTo)||amt):amt;
    addTx({type:"income",srcId:inf.srcId,icon:selSrc?.icon||"💵",name:selSrc?.name||"Пополнение",amount:incNeedConv?amt:amt,cur:incNeedConv?"RUB":acc.cur,accId:acc.id,acc:acc.name,amountTo:amtTo,curTo:acc.cur,comment:inf.comment,date:inf.date});
    setInf({srcId:sources[0]?.id||"",amount:"",amountTo:"",customRate:"",comment:"",date:todayStr()});
    showToast("Пополнение добавлено 💸",T.grad2); onClose();
  };
  const confirmTransfer=()=>{
    const fa=parseFloat(tf.amount)||0;
    if(!fa||!toAcc){showToast("Выбери счёт и сумму",T.coral);return;}
    const ta=parseFloat(tf.amountTo)||fa;
    addTx({type:"transfer",icon:"↔️",name:"Перевод",amount:fa,cur:acc.cur,accId:acc.id,acc:acc.name,amountTo:ta,curTo:toAcc.cur,accToId:toAcc.id,accTo:toAcc.name,comment:tf.comment,date:tf.date});
    setTf({toAccId:"",amount:"",amountTo:"",customRate:"",comment:"",date:todayStr()});
    showToast("Перевод записан ↔️",T.grad2); onClose();
  };
  const accTxs=txs.filter(t=>t.accId===acc.id||t.accToId===acc.id).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <Sheet title={`${acc.icon} ${acc.name}`} grad="linear-gradient(135deg,#38bdf8,#818cf8)" onClose={onClose}
      actions={<><GhostBtn onClick={()=>setEditing(e=>!e)}>{editing?"✕":"✏️"}</GhostBtn><GhostBtn onClick={()=>{if(window.confirm("Удалить счёт?"))delAcc();}} danger>🗑</GhostBtn></>}>
      <div style={{textAlign:"center",padding:"16px 0 18px"}}>
        <p style={{color:T.muted,fontSize:11,fontWeight:700,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.8px"}}>Текущий остаток</p>
        <p style={{fontWeight:900,fontSize:34,margin:0,color:acc.balance<0?"#ff6eb4":T.text}}>{fV(acc.balance,acc.cur)}</p>
        {acc.cur!=="RUB"&&<p style={{color:T.dim,fontSize:12,margin:"4px 0 0"}}>≈ {fN(acc.balance*RATES[acc.cur])}₽</p>}
      </div>
      {editing&&<EditBox mb={14}>
        <EmojiNameRow nf={ef} sn={(k,v)=>setEf(p=>({...p,[k]:v}))} placeholder="Счёт" emoji="💳"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
          <div><SLabel>Нач. остаток {sym(acc.cur)}</SLabel><input type="number" value={ef.initBalance} onChange={e=>setEf(p=>({...p,initBalance:e.target.value}))} style={INP}/></div>
          <div><SLabel>Тек. остаток {sym(acc.cur)}</SLabel><input type="number" value={ef.balance} onChange={e=>setEf(p=>({...p,balance:e.target.value}))} style={INP}/></div>
        </div>
        <TwoBtn ok={()=>{setAcc({...acc,name:ef.name,icon:ef.icon,initBalance:parseFloat(ef.initBalance)||0,balance:parseFloat(ef.balance)||0});setEditing(false);showToast("Сохранено ✓");}} cancel={()=>setEditing(false)} okLabel="✓ Изменить" okGrad="linear-gradient(135deg,#38bdf8,#818cf8)"/>
      </EditBox>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["income","＋ Пополнить","linear-gradient(135deg,#5eead4,#34d399)"],["transfer","↔ Перевод","linear-gradient(135deg,#818cf8,#b57bee)"]].map(([m,lbl,g])=>(
          <button key={m} onClick={()=>setMode(md=>md===m?null:m)} style={{padding:"12px",borderRadius:16,background:mode===m?g:"rgba(255,255,255,0.06)",color:mode===m?"#fff":T.muted,border:`1.5px solid ${mode===m?"transparent":"rgba(255,255,255,0.1)"}`,cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"'Nunito',sans-serif",transition:"all 0.2s"}}>{lbl}</button>
        ))}
      </div>
      {mode==="income"&&<div style={{background:"rgba(94,234,212,0.06)",borderRadius:20,padding:16,marginBottom:14,border:"1px solid rgba(94,234,212,0.15)"}}>
        <SLabel>Источник дохода</SLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {sources.map(s=><Chip key={s.id} active={inf.srcId===s.id} col="#5eead4" onClick={()=>si("srcId",s.id)}>{s.icon} {s.name}</Chip>)}
        </div>
        {incNeedConv?(
          <><ConvRow fromLbl={`Сумма (₽)`} toLbl={`Зачислить (${sym(acc.cur)})`} fromVal={inf.amount} toVal={inf.amountTo} setFrom={v=>si("amount",v)} setTo={v=>si("amountTo",v)}/>
          <RateBox from="₽" to={sym(acc.cur)} amount={inf.amount} amountTo={inf.amountTo} cr={inf.customRate} setCr={v=>si("customRate",v)} auto={incAutoRate}/></>
        ):(
          <><SLabel>Сумма ({sym(acc.cur)})</SLabel><input type="number" value={inf.amount} onChange={e=>si("amount",e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{...INP,fontSize:28,fontWeight:900,marginBottom:10,textAlign:"center"}}/></>
        )}
        <DateCommentRow date={inf.date} comment={inf.comment} setDate={v=>si("date",v)} setComment={v=>si("comment",v)}/>
        <ActionButton onClick={confirmIncome} label="Подтвердить пополнение 💚" grad="linear-gradient(135deg,#5eead4,#34d399)" txtCol="#0a1a14"/>
      </div>}
      {mode==="transfer"&&<div style={{background:"rgba(129,140,248,0.06)",borderRadius:20,padding:16,marginBottom:14,border:"1px solid rgba(129,140,248,0.15)"}}>
        <SLabel>Перевести на счёт</SLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {accounts.filter(a=>a.id!==acc.id).map(a=><Chip key={a.id} active={tf.toAccId===a.id} col="#818cf8" onClick={()=>st("toAccId",a.id)}>{a.icon} {a.name}</Chip>)}
        </div>
        {tfrNeedConv?(
          <><ConvRow fromLbl={`Списать (${sym(acc.cur)})`} toLbl={`Зачислить (${sym(toAcc?.cur)})`} fromVal={tf.amount} toVal={tf.amountTo} setFrom={v=>st("amount",v)} setTo={v=>st("amountTo",v)}/>
          <RateBox from={sym(acc.cur)} to={sym(toAcc?.cur)} amount={tf.amount} amountTo={tf.amountTo} cr={tf.customRate} setCr={v=>st("customRate",v)} auto={tfrAutoRate}/></>
        ):(
          <><SLabel>Сумма ({sym(acc.cur)})</SLabel><input type="number" value={tf.amount} onChange={e=>st("amount",e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{...INP,fontSize:28,fontWeight:900,marginBottom:10,textAlign:"center"}}/></>
        )}
        <DateCommentRow date={tf.date} comment={tf.comment} setDate={v=>st("date",v)} setComment={v=>st("comment",v)}/>
        <ActionButton onClick={confirmTransfer} label="Подтвердить перевод ↔️" grad="linear-gradient(135deg,#818cf8,#b57bee)"/>
      </div>}
      <SLabel>все операции ({accTxs.length})</SLabel>
      <TxList txs={accTxs} onEdit={onEdit} onDelete={deleteTx} showAcc/>
    </Sheet>
  );
}

// ── CAT PANEL ─────────────────────────────────────────────────────────────────
function CatPanel({cat,setCat,delCat,txs,accounts,catSpentRub,catSpentCur,addTx,onEdit,deleteTx,onClose,showToast}) {
  const catCur=cat.cur||"TRY";
  const [editing,setEditing]=useState(false);
  const [ef,setEf]=useState({name:cat.name,icon:cat.icon,budget:String(cat.budget),cur:catCur});
  const [af,setAf]=useState({accId:accounts[0]?.id||"",amount:"",amountTo:"",customRate:"",tag:"",comment:"",date:todayStr()});
  const sa=(k,v)=>setAf(p=>({...p,[k]:v}));
  const [newTag,setNewTag]=useState("");
  const selAcc=accounts.find(a=>a.id===af.accId);
  const needConv=selAcc&&selAcc.cur!==catCur;
  const autoRate=needConv?((RATES[selAcc.cur]||1)/(RATES[catCur]||1)).toFixed(4):null;
  useEffect(()=>{if(autoRate&&af.amount&&!af.customRate)sa("amountTo",(parseFloat(af.amount)*parseFloat(autoRate)).toFixed(2));},[af.amount,af.accId,af.customRate]);
  const confirmExp=()=>{
    const amt=parseFloat(af.amount)||0;
    if(!amt){showToast("Введи сумму 🌸",T.coral);return;}
    addTx({type:"expense",catId:cat.id,icon:cat.icon,name:cat.name,amount:amt,cur:selAcc?.cur||catCur,accId:af.accId,acc:selAcc?.name||"",tag:af.tag,comment:af.comment,date:af.date});
    sa("amount","");sa("tag","");sa("comment","");
    showToast("Расход добавлен 🛍️",cat.grad||T.grad1); onClose();
  };
  const spRub=catSpentRub(cat.id),spCur=catSpentCur(cat.id);
  const budRub=toRub(cat.budget||0,catCur);
  const pct=Math.min(110,Math.round((spRub/(budRub||1))*100));
  const over=spRub>budRub;
  const tags=cat.tags||[];
  const catTxs=txs.filter(t=>t.type==="expense"&&t.catId===cat.id).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <Sheet title={`${cat.icon} ${cat.name}`} grad={cat.grad||T.grad1} onClose={onClose}
      actions={<><GhostBtn onClick={()=>setEditing(e=>!e)}>{editing?"✕":"✏️"}</GhostBtn><GhostBtn onClick={()=>{if(window.confirm("Удалить?"))delCat();}} danger>🗑</GhostBtn></>}>

      {/* Add expense — always open */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,padding:16,marginBottom:14,border:"1px solid rgba(255,255,255,0.08)"}}>
        <p style={{fontWeight:900,fontSize:13,margin:"0 0 12px",background:cat.grad||T.grad1,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>＋ ДОБАВИТЬ РАСХОД</p>
        <SLabel>Со счёта</SLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {accounts.map(a=><Chip key={a.id} active={af.accId===a.id} col="#b57bee" onClick={()=>sa("accId",a.id)}>{a.icon} {a.name} {sym(a.cur)}</Chip>)}
        </div>
        {needConv?(
          <><ConvRow fromLbl={`Списать (${sym(selAcc?.cur)})`} toLbl={`В кат. (${sym(catCur)})`} fromVal={af.amount} toVal={af.amountTo} setFrom={v=>sa("amount",v)} setTo={v=>sa("amountTo",v)}/>
          <RateBox from={sym(selAcc?.cur)} to={sym(catCur)} amount={af.amount} amountTo={af.amountTo} cr={af.customRate} setCr={v=>sa("customRate",v)} auto={autoRate}/></>
        ):(
          <><SLabel>Сумма ({sym(selAcc?.cur||catCur)})</SLabel><input type="number" value={af.amount} onChange={e=>sa("amount",e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{...INP,fontSize:28,fontWeight:900,marginBottom:10,textAlign:"center"}}/></>
        )}
        {tags.length>0&&<><SLabel>Тег</SLabel><div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>{tags.map(t=><Chip key={t} active={af.tag===t} col="#ff6eb4" onClick={()=>sa("tag",af.tag===t?"":t)}>{t}</Chip>)}</div></>}
        <DateCommentRow date={af.date} comment={af.comment} setDate={v=>sa("date",v)} setComment={v=>sa("comment",v)}/>
        <ActionButton onClick={confirmExp} label="Подтвердить расход" grad={cat.grad||T.grad1}/>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <StatCard label={`Потрачено ${sym(catCur)}`} val={`${fN(spCur)}${sym(catCur)}`} sub={catCur!=="RUB"?`≈${fN(spRub)}₽`:null} col={over?"#ff6eb4":T.mint}/>
        <StatCard label={`Бюджет ${sym(catCur)}`} val={`${fN(cat.budget)}${sym(catCur)}`} sub={catCur!=="RUB"?`≈${fN(budRub)}₽`:null} col={T.purple}/>
      </div>
      <PBarStyled val={spRub} max={budRub} grad={over?"linear-gradient(90deg,#ff7c6e,#ff6eb4)":cat.grad||T.grad1} mb={14}/>

      {/* Edit */}
      {editing&&<EditBox mb={14}>
        <div style={{display:"grid",gridTemplateColumns:"44px 1fr 88px",gap:6,marginBottom:8}}>
          <input value={ef.icon} onChange={e=>setEf(p=>({...p,icon:e.target.value}))} style={{...IS,textAlign:"center",fontSize:20}}/>
          <input value={ef.name} onChange={e=>setEf(p=>({...p,name:e.target.value}))} style={IS}/>
          <select value={ef.cur} onChange={e=>setEf(p=>({...p,cur:e.target.value}))} style={IS}>{CURRENCIES.map(c=><option key={c} value={c}>{sym(c)} {c}</option>)}</select>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <span style={{color:T.muted,fontSize:12,whiteSpace:"nowrap"}}>Бюджет {sym(ef.cur)}:</span>
          <input type="number" value={ef.budget} onChange={e=>setEf(p=>({...p,budget:e.target.value}))} style={{...INP,flex:1}}/>
        </div>
        {/* Tags editor */}
        <SLabel>Теги</SLabel>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
          {tags.map((tag,i)=><div key={tag} style={{display:"flex",alignItems:"center",gap:3,background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"3px 10px",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:PIE_COLORS[i%PIE_COLORS.length]}}/>
            <span style={{fontSize:11,fontWeight:600}}>{tag}</span>
            <button onClick={()=>setCat({...cat,tags:tags.filter(t=>t!==tag)})} style={{background:"none",border:"none",color:"#ff6eb4",cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>×</button>
          </div>)}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newTag.trim()){setCat({...cat,tags:[...tags,newTag.trim()]});setNewTag("");}}} placeholder="Новый тег..." style={{...INP,flex:1,padding:"6px 12px"}}/>
          <button onClick={()=>{if(newTag.trim()){setCat({...cat,tags:[...tags,newTag.trim()]});setNewTag("");}}} style={{padding:"6px 16px",borderRadius:12,background:T.grad1,color:"#fff",border:"none",cursor:"pointer",fontWeight:800,fontSize:14}}>+</button>
        </div>
        <TwoBtn ok={()=>{setCat({...cat,name:ef.name,icon:ef.icon,budget:parseFloat(ef.budget)||0,cur:ef.cur});setEditing(false);showToast("Сохранено ✓");}} cancel={()=>setEditing(false)} okLabel="✓ Изменить" okGrad={cat.grad||T.grad1}/>
      </EditBox>}

      <SLabel>транзакции ({catTxs.length})</SLabel>
      <TxList txs={catTxs} onEdit={onEdit} onDelete={deleteTx} showTag/>
    </Sheet>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryTab({txs,deleteTx,onEdit}) {
  const [filter,setFilter]=useState("all");
  const [df,setDf]=useState(""); const [dt,setDt]=useState("");
  const items=txs.filter(t=>{if(filter!=="all"&&t.type!==filter)return false;if(df&&t.date<df)return false;if(dt&&t.date>dt)return false;return true;}).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <div style={{padding:16}}>
      <p style={{fontWeight:900,fontSize:22,margin:"0 0 14px",background:T.grad1,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>История 💫</p>
      <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
        {[["all","Все"],["expense","💸 Расходы"],["income","💚 Доходы"],["transfer","↔️ Переводы"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"7px 14px",borderRadius:20,border:"none",background:filter===v?T.grad1:"rgba(255,255,255,0.06)",color:filter===v?"#fff":T.muted,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",fontFamily:"'Nunito',sans-serif"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:T.muted,fontSize:11,fontWeight:700,width:28,flexShrink:0}}>С:</span><input type="date" value={df} onChange={e=>setDf(e.target.value)} style={{...INP,flex:1}}/>{df&&<button onClick={()=>setDf("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>×</button>}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:T.muted,fontSize:11,fontWeight:700,width:28,flexShrink:0}}>По:</span><input type="date" value={dt} onChange={e=>setDt(e.target.value)} style={{...INP,flex:1}}/>{dt&&<button onClick={()=>setDt("")} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18}}>×</button>}</div>
      </div>
      <TxList txs={items} onEdit={onEdit} onDelete={deleteTx} showTag showAcc/>
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function AnalyticsTab({cats,txs,sources,catSpentRub,srcRcvRub,totalBudRub,onOpenCat}) {
  const [period,setPeriod]=useState("thisMonth");
  const [df,setDf]=useState(""); const [dt,setDt]=useState("");
  const now=new Date();
  const getRange=()=>{if(period==="custom")return{from:df,to:dt};if(period==="thisMonth")return{from:new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),to:""};if(period==="lastMonth"){const s=new Date(now.getFullYear(),now.getMonth()-1,1),e=new Date(now.getFullYear(),now.getMonth(),0);return{from:s.toISOString().slice(0,10),to:e.toISOString().slice(0,10)};}if(period==="3m")return{from:new Date(now.getFullYear(),now.getMonth()-2,1).toISOString().slice(0,10),to:""};return{from:"",to:""};};
  const {from,to}=getRange();
  const filt=txs.filter(t=>{if(from&&t.date<from)return false;if(to&&t.date>to)return false;return true;});
  const spF=(catId)=>filt.filter(t=>t.type==="expense"&&t.catId===catId).reduce((s,t)=>s+toRub(t.amount,t.cur),0);
  const totalF=cats.reduce((s,c)=>s+spF(c.id),0);
  const totalInc=filt.filter(t=>t.type==="income").reduce((s,t)=>s+toRub(t.amountTo||t.amount,t.curTo||t.cur),0);
  const pieData=cats.map(c=>({name:c.name,icon:c.icon,value:Math.round(spF(c.id)),id:c.id,cur:c.cur||"TRY"})).filter(d=>d.value>0);
  const monthMap={};
  txs.forEach(t=>{const d=new Date(t.date),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;if(!monthMap[k])monthMap[k]={e:0,i:0,l:MONTHS[d.getMonth()]};if(t.type==="expense")monthMap[k].e+=toRub(t.amount,t.cur);if(t.type==="income")monthMap[k].i+=toRub(t.amountTo||t.amount,t.curTo||t.cur);});
  const lineData=Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>({name:v.l,Расходы:Math.round(v.e),Доходы:Math.round(v.i)}));
  return (
    <div style={{padding:16}}>
      <p style={{fontWeight:900,fontSize:22,margin:"0 0 14px",background:"linear-gradient(135deg,#5eead4,#b57bee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Аналитика 📊</p>
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto"}}>
        {[["thisMonth","Этот мес."],["lastMonth","Прошлый"],["3m","3 мес."],["all","Всё"],["custom","Период"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{whiteSpace:"nowrap",padding:"7px 12px",borderRadius:20,border:"none",background:period===v?"linear-gradient(135deg,#5eead4,#818cf8)":"rgba(255,255,255,0.06)",color:period===v?"#0a1a14":T.muted,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{l}</button>
        ))}
      </div>
      {period==="custom"&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:T.muted,fontSize:11,width:28}}>С:</span><input type="date" value={df} onChange={e=>setDf(e.target.value)} style={{...INP,flex:1}}/></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:T.muted,fontSize:11,width:28}}>По:</span><input type="date" value={dt} onChange={e=>setDt(e.target.value)} style={{...INP,flex:1}}/></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[{l:"Потрачено",v:fN(totalF)+"₽",c:"#ff6eb4"},{l:"% дохода",v:totalInc>0?Math.round((totalF/totalInc)*100)+"%":"—",c:T.yellow},{l:"Осталось",v:fV(totalBudRub-totalF,"₽"),c:totalF>totalBudRub?"#ff6eb4":T.mint}].map(x=>(
          <StatCard key={x.l} label={x.l} val={x.v} col={x.c}/>
        ))}
      </div>
      {pieData.length>0&&<div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,padding:16,marginBottom:12,border:"1px solid rgba(255,255,255,0.07)"}}>
        <p style={{fontWeight:800,fontSize:13,margin:"0 0 10px",color:T.text}}>По категориям <span style={{color:T.muted,fontWeight:400,fontSize:11}}>(тап → детали)</span></p>
        <ResponsiveContainer width="100%" height={155}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={62} dataKey="value" label={({percent})=>`${Math.round(percent*100)}%`} labelLine={false} onClick={d=>onOpenCat(d.id)}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} cursor="pointer"/>)}</Pie><Tooltip formatter={(v,n,p)=>[`${fN(v)}₽`,p.payload.name]} contentStyle={{background:"#1a1030",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:T.text}}/></PieChart></ResponsiveContainer>
        <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",marginTop:6}}>{pieData.map((d,i)=><div key={d.name} onClick={()=>onOpenCat(d.id)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}><div style={{width:7,height:7,borderRadius:"50%",background:PIE_COLORS[i%PIE_COLORS.length]}}/><span style={{fontSize:10,color:T.muted}}>{d.icon}{d.name}</span></div>)}</div>
      </div>}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,overflow:"hidden",marginBottom:12,border:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 58px 58px 40px",gap:4,padding:"10px 14px",background:"rgba(255,255,255,0.04)"}}>
          {["Категория","₽ факт","₽ план","% дох."].map(h=><span key={h} style={{color:T.dim,fontSize:10,fontWeight:700}}>{h}</span>)}
        </div>
        {cats.map((c,i)=>{const sp=spF(c.id),budR=toRub(c.budget||0,c.cur||"TRY"),pI=totalInc>0?Math.round((sp/totalInc)*100):0;const spInCur=sp/RATES[c.cur||"TRY"];return(
          <div key={c.id} onClick={()=>onOpenCat(c.id)} style={{display:"grid",gridTemplateColumns:"1fr 58px 58px 40px",gap:4,padding:"9px 14px",borderTop:"1px solid rgba(255,255,255,0.05)",alignItems:"center",cursor:"pointer"}}>
            <span style={{fontSize:12,fontWeight:700}}>{c.icon} {c.name}</span>
            <div><p style={{margin:0,fontSize:11,color:sp>budR?"#ff6eb4":T.text}}>{fN(sp)}₽</p><p style={{margin:0,fontSize:9,color:T.dim}}>{fN(spInCur)}{sym(c.cur||"TRY")}</p></div>
            <div><p style={{margin:0,fontSize:11,color:T.muted}}>{fN(budR)}₽</p><p style={{margin:0,fontSize:9,color:T.dim}}>{fN(c.budget)}{sym(c.cur||"TRY")}</p></div>
            <span style={{fontSize:11,fontWeight:700,color:pI>20?T.yellow:T.muted}}>{pI}%</span>
          </div>
        );})}
        <div style={{display:"grid",gridTemplateColumns:"1fr 58px 58px 40px",gap:4,padding:"9px 14px",borderTop:"2px solid rgba(181,123,238,0.4)"}}>
          <span style={{fontWeight:900,fontSize:12}}>Итого</span>
          <span style={{fontWeight:900,fontSize:11,color:totalF>totalBudRub?"#ff6eb4":T.text}}>{fN(totalF)}₽</span>
          <span style={{fontWeight:700,fontSize:11,color:T.muted}}>{fN(totalBudRub)}₽</span>
          <span style={{fontWeight:900,fontSize:11,color:T.yellow}}>{totalInc>0?Math.round((totalF/totalInc)*100):0}%</span>
        </div>
      </div>
      {lineData.length>1&&<div style={{background:"rgba(255,255,255,0.04)",borderRadius:22,padding:16,border:"1px solid rgba(255,255,255,0.07)"}}>
        <p style={{fontWeight:800,fontSize:13,margin:"0 0 10px",color:T.text}}>Динамика ₽</p>
        <ResponsiveContainer width="100%" height={130}><LineChart data={lineData} margin={{top:0,right:10,bottom:0,left:-30}}><XAxis dataKey="name" tick={{fontSize:10,fill:T.muted}}/><YAxis tick={{fontSize:9,fill:T.dim}}/><Tooltip formatter={v=>`${fN(v)}₽`} contentStyle={{background:"#1a1030",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:T.text}}/><Legend wrapperStyle={{fontSize:11}}/><Line type="monotone" dataKey="Расходы" stroke="#ff6eb4" strokeWidth={2.5} dot={{r:3,fill:"#ff6eb4"}}/><Line type="monotone" dataKey="Доходы" stroke="#5eead4" strokeWidth={2.5} dot={{r:3,fill:"#5eead4"}}/></LineChart></ResponsiveContainer>
      </div>}
    </div>
  );
}

// ── EDIT TX ───────────────────────────────────────────────────────────────────
function EditTxModal({tx,accounts,cats,onSave,onClose}) {
  const [amount,setAmount]=useState(String(tx.amount));
  const [amountTo,setAmountTo]=useState(String(tx.amountTo||tx.amount));
  const [comment,setComment]=useState(tx.comment||"");
  const [date,setDate]=useState(tx.date);
  const [tag,setTag]=useState(tx.tag||"");
  const isT=tx.type==="transfer",isE=tx.type==="expense";
  const cat=cats.find(c=>c.id===tx.catId);
  const needConv=(isT&&tx.cur!==tx.curTo)||(tx.type==="income"&&tx.cur!==tx.curTo);
  return (
    <Sheet title={`✏️ ${isT?"Перевод":tx.name}`} grad={T.grad1} onClose={onClose}>
      {needConv?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div><SLabel>Списано ({sym(tx.cur)})</SLabel><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{...INP,fontSize:20,fontWeight:800}}/></div>
        <div><SLabel>Зачислено ({sym(tx.curTo||tx.cur)})</SLabel><input type="number" value={amountTo} onChange={e=>setAmountTo(e.target.value)} style={{...INP,fontSize:20,fontWeight:800}}/></div>
      </div>:<><SLabel>Сумма ({sym(tx.cur)})</SLabel><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} style={{...INP,fontSize:26,fontWeight:900,marginBottom:12,textAlign:"center"}}/></>}
      {isE&&cat?.tags?.length>0&&<div style={{marginBottom:12}}><SLabel>Тег</SLabel><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{cat.tags.map(t=><Chip key={t} active={tag===t} col="#ff6eb4" onClick={()=>setTag(tag===t?"":t)}>{t}</Chip>)}</div></div>}
      <DateCommentRow date={date} comment={comment} setDate={setDate} setComment={setComment}/>
      <div style={{marginTop:6}}><ActionButton onClick={()=>onSave({...tx,amount:parseFloat(amount)||0,amountTo:parseFloat(amountTo)||parseFloat(amount)||0,comment,date,tag})} label="✓ Сохранить изменения" grad={T.grad2} txtCol="#0a1a14"/></div>
    </Sheet>
  );
}

// ── SHARED ────────────────────────────────────────────────────────────────────
function Sheet({title,grad,onClose,actions,children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(5,3,15,0.88)",zIndex:1000,display:"flex",alignItems:"flex-end",backdropFilter:"blur(8px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(180deg,#1a1030 0%,#0d0a1a 100%)",borderRadius:"28px 28px 0 0",maxHeight:"92vh",overflowY:"auto",border:"1px solid rgba(255,255,255,0.08)",borderBottom:"none",animation:"slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)"}}>
        <div style={{padding:"16px 20px 0",position:"sticky",top:0,background:"rgba(26,16,48,0.95)",backdropFilter:"blur(20px)",zIndex:10,borderRadius:"28px 28px 0 0"}}>
          <div style={{width:40,height:4,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 14px"}}/>
          {/* Gradient accent line */}
          <div style={{height:2,background:grad,borderRadius:2,margin:"0 0 14px",opacity:0.8}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <p style={{fontWeight:900,fontSize:18,margin:0}}>{title}</p>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {actions}
              <button onClick={onClose} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:T.muted,cursor:"pointer",borderRadius:12,padding:"6px 12px",fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>✕</button>
            </div>
          </div>
        </div>
        <div style={{padding:"0 20px 48px"}}>{children}</div>
      </div>
    </div>
  );
}

function TxList({txs,onEdit,onDelete,showTag,showAcc}) {
  if(!txs||txs.length===0) return <div style={{textAlign:"center",padding:"24px 0",color:T.dim}}><p style={{fontSize:28,margin:"0 0 6px"}}>✨</p><p style={{fontSize:13,margin:0}}>Операций пока нет</p></div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {txs.map(t=>(
        <div key={t.id} onClick={()=>onEdit(t)} style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{width:38,height:38,borderRadius:11,background:t.type==="income"?"rgba(94,234,212,0.15)":t.type==="transfer"?"rgba(129,140,248,0.15)":"rgba(255,110,180,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{t.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
              <p style={{margin:0,fontWeight:800,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{t.name}</p>
              {showTag&&t.tag&&<span style={{background:"rgba(255,110,180,0.15)",borderRadius:10,padding:"1px 7px",fontSize:9,color:"#ff6eb4",whiteSpace:"nowrap",flexShrink:0,border:"1px solid rgba(255,110,180,0.2)"}}>{t.tag}</span>}
            </div>
            <p style={{margin:0,color:T.dim,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.date}{showAcc&&t.acc?" · "+t.acc:""}{t.comment?" · "+t.comment:""}</p>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <p style={{margin:0,fontWeight:900,fontSize:14,color:t.type==="income"?"#5eead4":t.type==="transfer"?"#a78bfa":"#ff6eb4"}}>
              {t.type==="income"?"+":t.type==="expense"?"-":""}{fN(t.amount)}{sym(t.cur)}
            </p>
            {t.amountTo&&t.cur!==t.curTo&&<p style={{margin:0,color:T.dim,fontSize:10}}>→{fN(t.amountTo)}{sym(t.curTo)}</p>}
            {t.cur!=="RUB"&&!t.amountTo&&<p style={{margin:0,color:T.dim,fontSize:9}}>≈{fN(toRub(t.amount,t.cur))}₽</p>}
          </div>
          <button onClick={e=>{e.stopPropagation();onDelete(t.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,110,180,0.5)",fontSize:16,flexShrink:0,padding:"2px 4px"}}>🗑</button>
        </div>
      ))}
    </div>
  );
}

// ── MINI COMPONENTS ───────────────────────────────────────────────────────────
function SectionHeader({label,hint}) {
  return <div style={{marginBottom:10}}><p style={{color:T.text,fontSize:12,fontWeight:900,margin:0,letterSpacing:"0.2px"}}>{label}</p><p style={{color:T.dim,fontSize:10,margin:0}}>{hint}</p></div>;
}
function SLabel({children,style={}}) {
  return <p style={{color:T.muted,fontSize:10,fontWeight:800,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.6px",...style}}>{children}</p>;
}
function StatCard({label,val,sub,col}) {
  return <div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:"12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
    <p style={{color:T.muted,fontSize:10,margin:"0 0 3px",fontWeight:700}}>{label}</p>
    <p style={{fontWeight:900,fontSize:15,margin:0,color:col||T.text}}>{val}</p>
    {sub&&<p style={{color:T.dim,fontSize:9,margin:"2px 0 0"}}>{sub}</p>}
  </div>;
}
function PBarStyled({val,max,grad,mb=0}) {
  const p=Math.min(100,Math.round((val/(max||1))*100));
  return <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,height:8,overflow:"hidden",marginBottom:mb}}>
    <div style={{height:"100%",width:`${p}%`,background:grad||T.grad1,borderRadius:8,transition:"width 0.6s cubic-bezier(0.34,1.2,0.64,1)"}}/>
  </div>;
}
function Chip({active,col,onClick,children}) {
  return <button onClick={onClick} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?col:"rgba(255,255,255,0.1)"}`,background:active?`${col}22`:"rgba(255,255,255,0.04)",color:active?col:T.muted,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Nunito',sans-serif",transition:"all 0.15s"}}>{children}</button>;
}
function GhostBtn({onClick,children,danger}) {
  return <button onClick={onClick} style={{background:danger?"rgba(255,110,180,0.1)":"rgba(255,255,255,0.07)",border:`1px solid ${danger?"rgba(255,110,180,0.2)":"rgba(255,255,255,0.1)"}`,color:danger?"#ff6eb4":T.muted,cursor:"pointer",borderRadius:12,padding:"6px 10px",fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{children}</button>;
}
function ActionButton({onClick,label,grad,txtCol}) {
  return <button onClick={onClick} style={{width:"100%",padding:"14px",borderRadius:18,background:grad||T.grad1,color:txtCol||"#fff",fontSize:15,fontWeight:900,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:`0 4px 20px rgba(0,0,0,0.3)`}}>{label}</button>;
}
function TwoBtn({ok,cancel,okLabel="✓ Добавить",okGrad=T.grad1,cancelLabel="✕ Отмена"}) {
  return <div style={{display:"flex",gap:8}}>
    <button onClick={ok} style={{flex:1,padding:"10px",borderRadius:14,background:okGrad,color:"#fff",border:"none",cursor:"pointer",fontWeight:900,fontSize:12,fontFamily:"'Nunito',sans-serif"}}>{okLabel}</button>
    <button onClick={cancel} style={{flex:1,padding:"10px",borderRadius:14,background:"rgba(255,255,255,0.06)",color:T.muted,border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",fontSize:12,fontFamily:"'Nunito',sans-serif"}}>{cancelLabel}</button>
  </div>;
}
function EditBox({children,mb=0}) {
  return <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:14,marginBottom:mb,border:"1px solid rgba(255,255,255,0.08)"}}>{children}</div>;
}
function AddCard({children,col,border,width}) {
  return <div style={{minWidth:width,background:col,borderRadius:20,padding:10,flexShrink:0,border:`1.5px solid ${border}`}}>{children}</div>;
}
function EmojiNameRow({nf,sn,placeholder,emoji}) {
  return <div style={{display:"flex",gap:4,marginBottom:6}}>
    <input value={nf.icon} onChange={e=>sn("icon",e.target.value)} placeholder={emoji} style={{...IS,width:38,textAlign:"center",fontSize:20}}/>
    <input value={nf.name} onChange={e=>sn("name",e.target.value)} placeholder={placeholder} style={{...IS,flex:1}} autoFocus/>
  </div>;
}
function FInput({type="text",value,onChange,placeholder,mb=0}) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{...IS,width:"100%",marginBottom:mb}}/>;
}
function ConvRow({fromLbl,toLbl,fromVal,toVal,setFrom,setTo}) {
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
    <div><SLabel>{fromLbl}</SLabel><input type="number" value={fromVal} onChange={e=>setFrom(e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{...INP,fontSize:18,fontWeight:900}}/></div>
    <div><SLabel>{toLbl}</SLabel><input type="number" value={toVal} onChange={e=>setTo(e.target.value)} placeholder="0" inputMode="decimal" style={{...INP,fontSize:18,fontWeight:900}}/></div>
  </div>;
}
function RateBox({from,to,amount,amountTo,cr,setCr,auto}) {
  return <div style={{background:"rgba(0,0,0,0.2)",borderRadius:12,padding:"8px 12px",marginBottom:10,border:"1px solid rgba(255,255,255,0.06)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
      <span style={{color:T.dim,fontSize:10,fontWeight:700}}>КУРС {from}/{to}</span>
      <button onClick={()=>setCr("")} style={{fontSize:10,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>↻ Авто ЦБ</button>
    </div>
    <input type="number" value={cr||auto||""} onChange={e=>setCr(e.target.value)} style={{...INP,padding:"5px 10px",fontSize:13}}/>
    {amount&&amountTo&&<p style={{color:T.purple,fontSize:11,margin:"5px 0 0"}}>1 {from} = {(parseFloat(amountTo)/parseFloat(amount)).toFixed(4)} {to}</p>}
  </div>;
}
function DateCommentRow({date,comment,setDate,setComment}) {
  return <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
    <div><SLabel>Дата</SLabel><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={INP}/></div>
    <div><SLabel>Комментарий</SLabel><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Необязательно" style={INP}/></div>
  </div>;
}

const INP={width:"100%",padding:"10px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:T.text,fontSize:14,boxSizing:"border-box",fontFamily:"'Nunito',sans-serif",outline:"none"};
const IS={padding:"7px 10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:T.text,fontSize:13,boxSizing:"border-box",fontFamily:"'Nunito',sans-serif"};
