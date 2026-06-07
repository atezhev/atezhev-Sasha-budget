import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, Legend } from "recharts";

const PIE_COLORS = ["#7c6bff","#ff6b9d","#fbbf24","#4ade80","#38bdf8","#f97316","#a78bfa","#34d399","#fb7185","#60a5fa"];
const CURRENCIES = ["TRY","RUB","USD","EUR","GBP"];
const SYM = {RUB:"₽",TRY:"₺",USD:"$",EUR:"€",GBP:"£"};
const RATES = {RUB:1,TRY:3.2,USD:90,EUR:98,GBP:114};
const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

const DEF_SOURCES = [
  {id:"s1",name:"Родители",icon:"👨‍👩‍👧",expected:28000},
  {id:"s2",name:"Подарок",icon:"🎀",expected:3000},
  {id:"s3",name:"Карманные",icon:"💵",expected:5000},
];
const DEF_ACCOUNTS = [
  {id:"a1",name:"Турецкая карта",icon:"💳",cur:"TRY",balance:4200,initBalance:4200},
  {id:"a2",name:"Тинькофф",icon:"🏦",cur:"RUB",balance:12400,initBalance:12400},
  {id:"a3",name:"Инвестиции",icon:"📈",cur:"RUB",balance:15000,initBalance:15000},
  {id:"a4",name:"Накопления",icon:"🎯",cur:"RUB",balance:8000,initBalance:8000},
];
const DEF_CATS = [
  {id:"c1",name:"Одежда и обувь",icon:"👗",budget:5000,cur:"TRY",tags:["одежда","обувь","аксессуары","спорт"]},
  {id:"c2",name:"Здоровье и красота",icon:"💄",budget:3000,cur:"TRY",tags:["аптека","косметика","салон","врач"]},
  {id:"c3",name:"Еда вне дома",icon:"🍕",budget:10000,cur:"TRY",tags:["кафе","ресторан","доставка","фастфуд","кофе","перекус"]},
  {id:"c4",name:"Транспорт",icon:"🚌",budget:2000,cur:"TRY",tags:["такси","автобус","метро","бензин","парковка"]},
  {id:"c5",name:"Подарки, друзья",icon:"🎁",budget:2000,cur:"TRY",tags:["подарок","кино","кафе с друзьями","развлечения"]},
  {id:"c6",name:"Подписки и связь",icon:"📱",budget:2000,cur:"TRY",tags:["связь","стриминг","приложения","интернет"]},
  {id:"c7",name:"Прочее",icon:"🛍️",budget:4000,cur:"TRY",tags:["покупки","бытовое","учёба","разное"]},
];
const DEF_TXS = [
  {id:1,date:"2025-06-07",type:"expense",catId:"c3",icon:"🍕",name:"Еда вне дома",comment:"Кафе на набережной",tag:"кафе",amount:850,cur:"TRY",accId:"a1",acc:"Турецкая карта"},
  {id:2,date:"2025-06-06",type:"expense",catId:"c1",icon:"👗",name:"Одежда и обувь",comment:"Летнее платье",tag:"одежда",amount:1200,cur:"TRY",accId:"a1",acc:"Турецкая карта"},
  {id:3,date:"2025-06-05",type:"expense",catId:"c3",icon:"🍕",name:"Еда вне дома",comment:"Старбакс",tag:"кофе",amount:220,cur:"TRY",accId:"a1",acc:"Турецкая карта"},
  {id:4,date:"2025-05-28",type:"income",srcId:"s1",icon:"👨‍👩‍👧",name:"Родители",comment:"Карманные на месяц",amount:28000,cur:"RUB",accId:"a2",acc:"Тинькофф",amountTo:28000,curTo:"RUB"},
  {id:5,date:"2025-05-15",type:"expense",catId:"c4",icon:"🚌",name:"Транспорт",comment:"Такси",tag:"такси",amount:350,cur:"RUB",accId:"a2",acc:"Тинькофф"},
  {id:6,date:"2025-05-10",type:"transfer",icon:"↔️",name:"Перевод",comment:"В инвестиции",amount:5000,cur:"RUB",accId:"a2",acc:"Тинькофф",amountTo:5000,curTo:"RUB",accToId:"a3",accTo:"Инвестиции"},
  {id:7,date:"2025-04-20",type:"transfer",icon:"↔️",name:"Перевод",comment:"Тинькофф → Турецкая",amount:3000,cur:"RUB",accId:"a2",acc:"Тинькофф",amountTo:937,curTo:"TRY",accToId:"a1",accTo:"Турецкая карта"},
  {id:8,date:"2025-04-10",type:"expense",catId:"c2",icon:"💄",name:"Здоровье и красота",comment:"Крем для загара",tag:"косметика",amount:450,cur:"TRY",accId:"a1",acc:"Турецкая карта"},
  {id:9,date:"2025-03-22",type:"income",srcId:"s2",icon:"🎀",name:"Подарок",comment:"День рождения",amount:3000,cur:"RUB",accId:"a2",acc:"Тинькофф",amountTo:3000,curTo:"RUB"},
];

// ── helpers ───────────────────────────────────────────────────────────────────
const toRub = (n, cur) => n * (RATES[cur] || 1);
const sym = (cur) => SYM[cur] || cur;
const fmtN = (n) => Math.abs(Math.round(n)).toLocaleString("ru");
const fmtV = (n, cur) => `${n < 0 ? "−" : ""}${fmtN(n)}${sym(cur)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [sources, setSources] = useState(DEF_SOURCES);
  const [accounts, setAccounts] = useState(DEF_ACCOUNTS);
  const [cats, setCats] = useState(DEF_CATS);
  const [txs, setTxs] = useState(DEF_TXS);
  const [panel, setPanel] = useState(null); // {type, id}
  const [editTx, setEditTx] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, col = "#7c6bff") => {
    setToast({ msg, col });
    setTimeout(() => setToast(null), 2200);
  };

  // ── computed ──
  const catSpentRub = (catId) =>
    txs.filter(t => t.type === "expense" && t.catId === catId)
      .reduce((s, t) => s + toRub(t.amount, t.cur), 0);

  const catSpentCur = (catId) => {
    const cat = cats.find(c => c.id === catId);
    const cc = cat?.cur || "TRY";
    return txs.filter(t => t.type === "expense" && t.catId === catId)
      .reduce((s, t) => s + (t.cur === cc ? t.amount : toRub(t.amount, t.cur) / RATES[cc]), 0);
  };

  const srcRcvRub = (srcId) =>
    txs.filter(t => t.type === "income" && t.srcId === srcId)
      .reduce((s, t) => s + toRub(t.amountTo || t.amount, t.curTo || t.cur), 0);

  const totalBudRub = cats.reduce((s, c) => s + toRub(c.budget || 0, c.cur || "TRY"), 0);
  const totalSpentRub = cats.reduce((s, c) => s + catSpentRub(c.id), 0);
  const totalExpected = sources.reduce((s, src) => s + (src.expected || 0), 0);
  const totalReceived = sources.reduce((s, src) => s + srcRcvRub(src.id), 0);
  const totalWealthRub = accounts.reduce((s, a) => s + toRub(a.balance, a.cur), 0);

  // ── tx mutations ──
  const applyBal = (t) => {
    if (t.type === "expense")
      setAccounts(p => p.map(a => a.id === t.accId ? { ...a, balance: a.balance - t.amount } : a));
    else if (t.type === "income")
      setAccounts(p => p.map(a => a.id === t.accId ? { ...a, balance: a.balance + (t.amountTo || t.amount) } : a));
    else if (t.type === "transfer")
      setAccounts(p => p.map(a => {
        if (a.id === t.accId) return { ...a, balance: a.balance - t.amount };
        if (a.id === t.accToId) return { ...a, balance: a.balance + (t.amountTo || 0) };
        return a;
      }));
  };
  const revertBal = (t) => {
    if (t.type === "expense")
      setAccounts(p => p.map(a => a.id === t.accId ? { ...a, balance: a.balance + t.amount } : a));
    else if (t.type === "income")
      setAccounts(p => p.map(a => a.id === t.accId ? { ...a, balance: a.balance - (t.amountTo || t.amount) } : a));
    else if (t.type === "transfer")
      setAccounts(p => p.map(a => {
        if (a.id === t.accId) return { ...a, balance: a.balance + t.amount };
        if (a.id === t.accToId) return { ...a, balance: a.balance - (t.amountTo || 0) };
        return a;
      }));
  };

  const addTx = (tx) => {
    const newTx = { ...tx, id: Date.now() };
    setTxs(p => [newTx, ...p]);
    applyBal(newTx);
  };
  const deleteTx = (id) => {
    const t = txs.find(x => x.id === id);
    if (!t) return;
    setTxs(p => p.filter(x => x.id !== id));
    revertBal(t);
    showToast("Удалено");
  };
  const saveTx = (upd) => {
    const old = txs.find(x => x.id === upd.id);
    if (!old) return;
    revertBal(old);
    applyBal(upd);
    setTxs(p => p.map(x => x.id === upd.id ? upd : x));
    setEditTx(null);
    showToast("Сохранено ✓", "#4ade80");
  };

  const pct = Math.min(110, Math.round((totalSpentRub / (totalBudRub || 1)) * 100));
  const barCol = pct >= 100 ? "#ff4d6d" : pct >= 70 ? "#fbbf24" : "#4ade80";

  return (
    <div style={{ background: "#0a0a10", minHeight: "100vh", color: "#f0ede8", fontFamily: "'Nunito',sans-serif", maxWidth: 400, margin: "0 auto", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ background: "linear-gradient(90deg,#7c6bff,#ff6b9d)", padding: "7px 16px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>✨ Демо-версия</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>Данные ненастоящие</span>
      </div>
      {toast && (
        <div style={{ position: "fixed", top: 44, left: "50%", transform: "translateX(-50%)", background: toast.col, color: "#fff", padding: "9px 22px", borderRadius: 20, zIndex: 9999, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          {toast.msg}
        </div>
      )}

      {tab === "home" && (
        <HomeTab
          sources={sources} setSources={setSources}
          accounts={accounts} setAccounts={setAccounts}
          cats={cats} setCats={setCats}
          txs={txs} addTx={addTx}
          catSpentRub={catSpentRub} catSpentCur={catSpentCur}
          srcRcvRub={srcRcvRub}
          totalBudRub={totalBudRub} totalSpentRub={totalSpentRub}
          totalExpected={totalExpected} totalReceived={totalReceived}
          totalWealthRub={totalWealthRub}
          pct={pct} barCol={barCol}
          onPanel={setPanel} showToast={showToast}
        />
      )}
      {tab === "history" && (
        <HistoryTab txs={txs} deleteTx={deleteTx} onEdit={setEditTx} />
      )}
      {tab === "analytics" && (
        <AnalyticsTab
          cats={cats} txs={txs} sources={sources}
          catSpentRub={catSpentRub} srcRcvRub={srcRcvRub}
          totalBudRub={totalBudRub} totalSpentRub={totalSpentRub}
          onOpenCat={id => setPanel({ type: "cat", id })}
        />
      )}

      {panel?.type === "source" && (
        <SourcePanel
          src={sources.find(x => x.id === panel.id)}
          setSrc={v => setSources(p => p.map(x => x.id === v.id ? v : x))}
          delSrc={() => { setSources(p => p.filter(x => x.id !== panel.id)); setPanel(null); }}
          txs={txs} srcRcvRub={srcRcvRub}
          onEdit={setEditTx} deleteTx={deleteTx}
          onClose={() => setPanel(null)} showToast={showToast}
        />
      )}
      {panel?.type === "account" && (
        <AccountPanel
          acc={accounts.find(x => x.id === panel.id)}
          setAcc={v => setAccounts(p => p.map(x => x.id === v.id ? v : x))}
          delAcc={() => { setAccounts(p => p.filter(x => x.id !== panel.id)); setPanel(null); }}
          txs={txs} accounts={accounts} sources={sources} addTx={addTx}
          onEdit={setEditTx} deleteTx={deleteTx}
          onClose={() => setPanel(null)} showToast={showToast}
        />
      )}
      {panel?.type === "cat" && (
        <CatPanel
          cat={cats.find(x => x.id === panel.id)}
          setCat={v => setCats(p => p.map(x => x.id === v.id ? v : x))}
          delCat={() => { setCats(p => p.filter(x => x.id !== panel.id)); setPanel(null); }}
          txs={txs} accounts={accounts}
          catSpentRub={catSpentRub} catSpentCur={catSpentCur}
          addTx={addTx} onEdit={setEditTx} deleteTx={deleteTx}
          onClose={() => setPanel(null)} showToast={showToast}
        />
      )}
      {editTx && (
        <EditTxModal tx={editTx} accounts={accounts} cats={cats} onSave={saveTx} onClose={() => setEditTx(null)} />
      )}

      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 400, background: "#0e0e1a", borderTop: "1px solid #1e1e2a", display: "flex", zIndex: 100 }}>
        {[["home", "🏠", "Главная"], ["history", "📋", "История"], ["analytics", "📊", "Аналитика"]].map(([id, ic, lb]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", color: tab === id ? "#7c6bff" : "#444", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20 }}>{ic}</span>
            <span style={{ fontSize: 10, fontWeight: tab === id ? 800 : 400 }}>{lb}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeTab({ sources, setSources, accounts, setAccounts, cats, setCats, txs, addTx, catSpentRub, catSpentCur, srcRcvRub, totalBudRub, totalSpentRub, totalExpected, totalReceived, totalWealthRub, pct, barCol, onPanel, showToast }) {
  const [addMode, setAddMode] = useState(null);
  const [nf, setNf] = useState({ name: "", icon: "", cur: "TRY", budget: "", expected: "", bal: "" });
  const sn = (k, v) => setNf(p => ({ ...p, [k]: v }));
  const resetAdd = () => { setAddMode(null); setNf({ name: "", icon: "", cur: "TRY", budget: "", expected: "", bal: "" }); };

  const doAdd = (type) => {
    if (!nf.name.trim()) { showToast("Введи название", "#ff4d6d"); return; }
    const id = "x" + Date.now();
    if (type === "src") setSources(p => [...p, { id, name: nf.name, icon: nf.icon || "💰", expected: parseFloat(nf.expected) || 0 }]);
    else if (type === "acc") setAccounts(p => [...p, { id, name: nf.name, icon: nf.icon || "💳", cur: nf.cur, balance: parseFloat(nf.bal) || 0, initBalance: parseFloat(nf.bal) || 0 }]);
    else if (type === "cat") setCats(p => [...p, { id, name: nf.name, icon: nf.icon || "📦", budget: parseFloat(nf.budget) || 0, cur: nf.cur, tags: [] }]);
    showToast("Добавлено ✓", "#4ade80");
    resetAdd();
  };

  const totalLeft = totalBudRub - totalSpentRub;

  return (
    <div style={{ padding: "14px 14px 0" }}>
      {/* Budget summary */}
      <div style={{ background: "#1e1e2a", borderRadius: 18, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p style={{ color: "#555", fontSize: 10, fontWeight: 700, margin: "0 0 2px" }}>ПОТРАЧЕНО</p>
            <p style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>{fmtN(totalSpentRub)}₽</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#555", fontSize: 10, fontWeight: 700, margin: "0 0 2px" }}>ОСТАТОК</p>
            <p style={{ fontWeight: 900, fontSize: 22, margin: 0, color: totalLeft < 0 ? "#ff4d6d" : "#4ade80" }}>{fmtV(totalLeft, "₽")}</p>
          </div>
        </div>
        <div style={{ background: "#0a0a10", borderRadius: 8, height: 9, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: barCol, borderRadius: 8, transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#444", fontSize: 10 }}>Бюджет: {fmtN(totalBudRub)}₽ · {pct}%</span>
          <span style={{ color: "#555", fontSize: 10 }}>Все счета: <span style={{ color: "#7c6bff", fontWeight: 700 }}>{fmtN(totalWealthRub)}₽</span></span>
        </div>
      </div>

      {/* SOURCES */}
      <RowLabel label="1️⃣ ИСТОЧНИКИ ДОХОДА" hint="Тап → аналитика / редактировать" />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 4 }}>
        {sources.map(s => {
          const recv = srcRcvRub(s.id), exp = s.expected || 0;
          const sp = exp > 0 ? Math.min(100, Math.round((recv / exp) * 100)) : 0;
          const sc = sp >= 100 ? "#4ade80" : sp >= 50 ? "#fbbf24" : "#555";
          return (
            <div key={s.id} onClick={() => onPanel({ type: "source", id: s.id })}
              style={{ minWidth: 88, background: "#0f2a1a", borderRadius: 14, padding: "10px 8px", cursor: "pointer", border: "2px solid #1a3a1a", textAlign: "center", flexShrink: 0, userSelect: "none" }}>
              <div style={{ fontSize: 26, marginBottom: 3 }}>{s.icon}</div>
              <p style={{ color: "#4ade80", fontSize: 10, margin: "0 0 4px", fontWeight: 700, lineHeight: 1.2 }}>{s.name}</p>
              {exp > 0 && <>
                <div style={{ background: "#0a1a0a", borderRadius: 3, height: 3, overflow: "hidden", marginBottom: 2 }}>
                  <div style={{ height: "100%", width: `${sp}%`, background: sc, borderRadius: 3 }} />
                </div>
                <p style={{ color: sc, fontSize: 9, margin: 0 }}>{fmtN(recv)}/{fmtN(exp)}₽</p>
              </>}
            </div>
          );
        })}
        {addMode !== "src" && <AddPlusBtn onClick={() => setAddMode("src")} col="#0f1a0f" />}
        {addMode === "src" && (
          <div style={{ minWidth: 180, background: "#0f2a1a", borderRadius: 14, padding: 10, flexShrink: 0, border: "2px solid #4ade80" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <input value={nf.icon} onChange={e => sn("icon", e.target.value)} placeholder="🔥" style={{ ...IS, width: 34, textAlign: "center", fontSize: 18 }} />
              <input value={nf.name} onChange={e => sn("name", e.target.value)} placeholder="Название" style={{ ...IS, flex: 1 }} autoFocus />
            </div>
            <input type="number" value={nf.expected} onChange={e => sn("expected", e.target.value)} placeholder="Ожидается ₽" style={{ ...IS, width: "100%", marginBottom: 6 }} />
            <TwoBtn ok={() => doAdd("src")} cancel={resetAdd} okCol="#4ade80" okTxtCol="#0a0a10" okLabel="✓ Добавить" />
          </div>
        )}
      </div>
      {totalExpected > 0 && (
        <div style={{ background: "#0f1a0f", borderRadius: 10, padding: "6px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>Ожидается: {fmtN(totalExpected)}₽</span>
          <span style={{ color: totalReceived >= totalExpected ? "#4ade80" : "#888", fontSize: 11, fontWeight: 800 }}>Получено: {fmtN(totalReceived)}₽</span>
        </div>
      )}

      {/* ACCOUNTS */}
      <RowLabel label="2️⃣ СЧЕТА / КОШЕЛЬКИ" hint="Тап → пополнить / перевести / история" />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
        {accounts.map(a => (
          <div key={a.id} onClick={() => onPanel({ type: "account", id: a.id })}
            style={{ minWidth: 116, background: "#1e1e2a", borderRadius: 16, padding: 12, cursor: "pointer", border: "2px solid #2a2a3a", flexShrink: 0, userSelect: "none" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{a.icon}</div>
            <p style={{ color: "#777", fontSize: 10, margin: "0 0 2px", fontWeight: 700, lineHeight: 1.2 }}>{a.name}</p>
            <p style={{ fontWeight: 900, fontSize: 17, margin: 0, color: a.balance < 0 ? "#ff4d6d" : "#f0ede8" }}>{fmtV(a.balance, a.cur)}</p>
            {a.cur !== "RUB" && <p style={{ color: "#444", fontSize: 9, margin: "1px 0 0" }}>≈{fmtN(a.balance * RATES[a.cur])}₽</p>}
          </div>
        ))}
        {addMode !== "acc" && <AddPlusBtn onClick={() => setAddMode("acc")} col="#14142a" />}
        {addMode === "acc" && (
          <div style={{ minWidth: 185, background: "#1e1e2a", borderRadius: 16, padding: 10, flexShrink: 0, border: "2px solid #7c6bff" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              <input value={nf.icon} onChange={e => sn("icon", e.target.value)} placeholder="💎" style={{ ...IS, width: 34, textAlign: "center", fontSize: 18 }} />
              <input value={nf.name} onChange={e => sn("name", e.target.value)} placeholder="Название" style={{ ...IS, flex: 1 }} autoFocus />
            </div>
            <select value={nf.cur} onChange={e => sn("cur", e.target.value)} style={{ ...IS, width: "100%", marginBottom: 6 }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{sym(c)} {c}</option>)}
            </select>
            <input type="number" value={nf.bal} onChange={e => sn("bal", e.target.value)} placeholder="Начальный остаток" style={{ ...IS, width: "100%", marginBottom: 6 }} />
            <TwoBtn ok={() => doAdd("acc")} cancel={resetAdd} okLabel="✓ Добавить" />
          </div>
        )}
      </div>

      {/* CATEGORIES */}
      <RowLabel label="3️⃣ КАТЕГОРИИ РАСХОДОВ" hint="Тап → сразу добавить расход / детали" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8 }}>
        {cats.map(cat => {
          const spRub = catSpentRub(cat.id);
          const spCur = catSpentCur(cat.id);
          const budRub = toRub(cat.budget || 0, cat.cur || "TRY");
          const p = Math.min(100, Math.round((spRub / (budRub || 1)) * 100));
          const col = p >= 100 ? "#ff4d6d" : p >= 70 ? "#fbbf24" : "#4ade80";
          return (
            <div key={cat.id} onClick={() => onPanel({ type: "cat", id: cat.id })}
              style={{ background: "#1e1e2a", borderRadius: 12, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</p>
                  <span style={{ fontSize: 11, fontWeight: 800, color: spRub > budRub ? "#ff4d6d" : "#4ade80", flexShrink: 0, marginLeft: 6 }}>
                    {fmtV(cat.budget - spCur, cat.cur || "TRY")}
                  </span>
                </div>
                <div style={{ background: "#0a0a10", borderRadius: 4, height: 5, overflow: "hidden", marginBottom: 3 }}>
                  <div style={{ height: "100%", width: `${p}%`, background: col, borderRadius: 4 }} />
                </div>
                <p style={{ color: "#444", fontSize: 10, margin: 0 }}>{fmtN(spCur)}{sym(cat.cur || "TRY")} / {fmtN(cat.budget)}{sym(cat.cur || "TRY")} · {p}%</p>
              </div>
              <span style={{ color: "#444", fontSize: 16, flexShrink: 0 }}>›</span>
            </div>
          );
        })}
        {addMode !== "cat" && (
          <div onClick={() => setAddMode("cat")} style={{ background: "#14142a", borderRadius: 12, padding: "10px 14px", border: "2px dashed #2a2a4a", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, color: "#2a2a6a" }}>＋</span>
            <p style={{ color: "#3a3a7a", fontSize: 13, margin: 0, fontWeight: 700 }}>Добавить категорию</p>
          </div>
        )}
        {addMode === "cat" && (
          <div style={{ background: "#1e1e2a", borderRadius: 12, padding: 12, border: "2px solid #7c6bff" }}>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 86px", gap: 6, marginBottom: 8 }}>
              <input value={nf.icon} onChange={e => sn("icon", e.target.value)} placeholder="🔥" style={{ ...IS, textAlign: "center", fontSize: 18 }} />
              <input value={nf.name} onChange={e => sn("name", e.target.value)} placeholder="Название" style={IS} autoFocus />
              <select value={nf.cur} onChange={e => sn("cur", e.target.value)} style={IS}>
                {CURRENCIES.map(c => <option key={c} value={c}>{sym(c)} {c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: "#666", fontSize: 12, whiteSpace: "nowrap" }}>Бюджет {sym(nf.cur)}:</span>
              <input type="number" value={nf.budget} onChange={e => sn("budget", e.target.value)} placeholder="0" style={{ ...IS, flex: 1 }} />
            </div>
            <TwoBtn ok={() => doAdd("cat")} cancel={resetAdd} okLabel="✓ Добавить" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── SOURCE PANEL ──────────────────────────────────────────────────────────────
function SourcePanel({ src, setSrc, delSrc, txs, srcRcvRub, onEdit, deleteTx, onClose, showToast }) {
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name: src.name, icon: src.icon, expected: String(src.expected || "") });

  const saveEdit = () => {
    setSrc({ ...src, name: ef.name, icon: ef.icon, expected: parseFloat(ef.expected) || 0 });
    setEditing(false);
    showToast("Сохранено ✓", "#4ade80");
  };

  const recv = srcRcvRub(src.id);
  const exp = src.expected || 0;
  const srcTxs = txs.filter(t => t.srcId === src.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Sheet title={`${src.icon} ${src.name}`} onClose={onClose}
      actions={<>
        <Pill onClick={() => setEditing(e => !e)} col="#252530" txt="#aaa">{editing ? "✕" : "✏️ Ред."}</Pill>
        <Pill onClick={() => { if (window.confirm("Удалить источник?")) delSrc(); }} col="#3a0a0a" txt="#ff4d6d">🗑</Pill>
      </>}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <InfoCard label="Получено" val={fmtN(recv) + "₽"} col="#4ade80" />
        <InfoCard label="Ожидается" val={fmtN(exp) + "₽"} col="#7c6bff" />
      </div>
      {exp > 0 && <PBar val={recv} max={exp} mb={12} />}

      {editing && (
        <div style={{ background: "#252530", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 6, marginBottom: 8 }}>
            <input value={ef.icon} onChange={e => setEf(p => ({ ...p, icon: e.target.value }))} style={{ ...INP, textAlign: "center", fontSize: 20 }} />
            <input value={ef.name} onChange={e => setEf(p => ({ ...p, name: e.target.value }))} style={INP} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: "#666", fontSize: 12, whiteSpace: "nowrap" }}>Ожидается ₽:</span>
            <input type="number" value={ef.expected} onChange={e => setEf(p => ({ ...p, expected: e.target.value }))} style={{ ...INP, flex: 1 }} />
          </div>
          <TwoBtn ok={saveEdit} cancel={() => setEditing(false)} okLabel="✓ Изменить" />
        </div>
      )}

      <Lbl style={{ marginTop: 4, marginBottom: 8 }}>ИСТОРИЯ ПОСТУПЛЕНИЙ ({srcTxs.length})</Lbl>
      <TxList txs={srcTxs} onEdit={onEdit} onDelete={deleteTx} />
    </Sheet>
  );
}

// ── ACCOUNT PANEL ─────────────────────────────────────────────────────────────
function AccountPanel({ acc, setAcc, delAcc, txs, accounts, sources, addTx, onEdit, deleteTx, onClose, showToast }) {
  const [mode, setMode] = useState("income"); // open income by default
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name: acc.name, icon: acc.icon, initBalance: String(acc.initBalance || 0), balance: String(acc.balance) });
  const [inf, setInf] = useState(() => ({ srcId: sources[0]?.id || "", amount: "", amountTo: "", customRate: "", comment: "", date: todayStr() }));
  const [tf, setTf] = useState({ toAccId: "", amount: "", amountTo: "", customRate: "", comment: "", date: todayStr() });
  const si = (k, v) => setInf(p => ({ ...p, [k]: v }));
  const st = (k, v) => setTf(p => ({ ...p, [k]: v }));

  const selSrc = sources.find(x => x.id === inf.srcId);
  const toAcc = accounts.find(x => x.id === tf.toAccId);
  const incNeedConv = acc.cur !== "RUB";
  const tfrNeedConv = toAcc && acc.cur !== toAcc.cur;
  const incAutoRate = incNeedConv ? (1 / RATES[acc.cur]).toFixed(4) : null;
  const tfrAutoRate = tfrNeedConv ? ((RATES[acc.cur] || 1) / (RATES[toAcc.cur] || 1)).toFixed(4) : null;

  useEffect(() => {
    if (incAutoRate && inf.amount && !inf.customRate)
      si("amountTo", (parseFloat(inf.amount) / RATES[acc.cur]).toFixed(2));
  }, [inf.amount, inf.customRate]);

  useEffect(() => {
    if (tfrAutoRate && tf.amount && !tf.customRate)
      st("amountTo", (parseFloat(tf.amount) * parseFloat(tfrAutoRate)).toFixed(2));
  }, [tf.amount, tf.toAccId, tf.customRate]);

  const saveEdit = () => {
    setAcc({ ...acc, name: ef.name, icon: ef.icon, initBalance: parseFloat(ef.initBalance) || 0, balance: parseFloat(ef.balance) || 0 });
    setEditing(false);
    showToast("Сохранено ✓", "#4ade80");
  };

  const confirmIncome = () => {
    const amt = parseFloat(inf.amount) || 0;
    if (!amt) { showToast("Введи сумму", "#ff4d6d"); return; }
    if (!inf.srcId) { showToast("Выбери источник дохода", "#ff4d6d"); return; }
    const amtTo = incNeedConv ? (parseFloat(inf.amountTo) || amt) : amt;
    addTx({
      type: "income",
      srcId: inf.srcId || "manual",
      icon: selSrc?.icon || "💵",
      name: selSrc?.name || "Пополнение",
      amount: incNeedConv ? amt : amt,
      cur: incNeedConv ? "RUB" : acc.cur,
      accId: acc.id, acc: acc.name,
      amountTo: amtTo, curTo: acc.cur,
      comment: inf.comment, date: inf.date
    });
    setInf({ srcId: sources[0]?.id || "s1", amount: "", amountTo: "", customRate: "", comment: "", date: todayStr() });
    showToast("Пополнение добавлено ✓", "#4ade80");
    onClose();
  };

  const confirmTransfer = () => {
    const fa = parseFloat(tf.amount) || 0;
    if (!fa || !toAcc) return;
    const ta = parseFloat(tf.amountTo) || fa;
    addTx({
      type: "transfer", icon: "↔️", name: "Перевод",
      amount: fa, cur: acc.cur, accId: acc.id, acc: acc.name,
      amountTo: ta, curTo: toAcc.cur, accToId: toAcc.id, accTo: toAcc.name,
      comment: tf.comment, date: tf.date
    });
    setTf({ toAccId: "", amount: "", amountTo: "", customRate: "", comment: "", date: todayStr() });
    showToast("Перевод записан ✓", "#fbbf24");
  };

  const accTxs = txs.filter(t => t.accId === acc.id || t.accToId === acc.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Sheet title={`${acc.icon} ${acc.name}`} onClose={onClose}
      actions={<>
        <Pill onClick={() => setEditing(e => !e)} col="#252530" txt="#aaa">{editing ? "✕" : "✏️ Ред."}</Pill>
        <Pill onClick={() => { if (window.confirm("Удалить счёт?")) delAcc(); }} col="#3a0a0a" txt="#ff4d6d">🗑</Pill>
      </>}>

      {/* Balance */}
      <div style={{ background: "#252530", borderRadius: 14, padding: 14, marginBottom: 12, textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px", fontWeight: 700 }}>ТЕКУЩИЙ ОСТАТОК</p>
        <p style={{ fontWeight: 900, fontSize: 28, margin: 0, color: acc.balance < 0 ? "#ff4d6d" : "#f0ede8" }}>{fmtV(acc.balance, acc.cur)}</p>
        {acc.cur !== "RUB" && <p style={{ color: "#555", fontSize: 12, margin: "4px 0 0" }}>≈ {fmtN(acc.balance * RATES[acc.cur])}₽</p>}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ background: "#252530", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 6, marginBottom: 8 }}>
            <input value={ef.icon} onChange={e => setEf(p => ({ ...p, icon: e.target.value }))} style={{ ...INP, textAlign: "center", fontSize: 20 }} />
            <input value={ef.name} onChange={e => setEf(p => ({ ...p, name: e.target.value }))} style={INP} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            <div><Lbl>НАЧ. ОСТАТОК {sym(acc.cur)}</Lbl><input type="number" value={ef.initBalance} onChange={e => setEf(p => ({ ...p, initBalance: e.target.value }))} style={INP} /></div>
            <div><Lbl>ТЕК. ОСТАТОК {sym(acc.cur)}</Lbl><input type="number" value={ef.balance} onChange={e => setEf(p => ({ ...p, balance: e.target.value }))} style={INP} /></div>
          </div>
          <TwoBtn ok={saveEdit} cancel={() => setEditing(false)} okLabel="✓ Изменить" />
        </div>
      )}

      {/* Mode tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["income", "＋ Пополнить", "#4ade80"], ["transfer", "↔ Перевод", "#7c6bff"]].map(([m, label, col]) => (
          <button key={m} onClick={() => setMode(md => md === m ? null : m)}
            style={{ padding: 11, borderRadius: 11, background: mode === m ? "#1a2a1a" : "#1e1e2a", color: col, border: `2px solid ${mode === m ? col : "transparent"}`, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Income form */}
      {mode === "income" && (
        <div style={{ background: "#0f2a1a", borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Lbl>ИСТОЧНИК ДОХОДА</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {sources.map(src => (
              <button key={src.id} onClick={() => si("srcId", inf.srcId === src.id ? "" : src.id)}
                style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: inf.srcId === src.id ? "#4ade80" : "#1e2a1e", color: inf.srcId === src.id ? "#0a0a10" : "#4ade80", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {src.icon} {src.name}
              </button>
            ))}

          </div>
          {incNeedConv ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><Lbl>СУММА (₽)</Lbl><input type="number" value={inf.amount} onChange={e => si("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 20, fontWeight: 800 }} /></div>
                <div><Lbl>ЗАЧИСЛИТЬ ({sym(acc.cur)})</Lbl><input type="number" value={inf.amountTo} onChange={e => si("amountTo", e.target.value)} placeholder="0" inputMode="decimal" style={{ ...INP, fontSize: 20, fontWeight: 800 }} /></div>
              </div>
              <RateRow from="₽" to={sym(acc.cur)} amount={inf.amount} amountTo={inf.amountTo} cr={inf.customRate} setCr={v => si("customRate", v)} auto={incAutoRate} />
            </>
          ) : (
            <><Lbl>СУММА ({sym(acc.cur)})</Lbl><input type="number" value={inf.amount} onChange={e => si("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 26, fontWeight: 900, marginBottom: 8 }} /></>
          )}
          <DateComment date={inf.date} comment={inf.comment} setDate={v => si("date", v)} setComment={v => si("comment", v)} />
          <ActionBtn onClick={confirmIncome} label="Подтвердить пополнение" col="#4ade80" txtCol="#0a0a10" />
        </div>
      )}

      {/* Transfer form */}
      {mode === "transfer" && (
        <div style={{ background: "#1a1a3a", borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <Lbl>НА СЧЁТ</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {accounts.filter(a => a.id !== acc.id).map(a => (
              <button key={a.id} onClick={() => st("toAccId", a.id)}
                style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: tf.toAccId === a.id ? "#7c6bff" : "#1e1e3a", color: tf.toAccId === a.id ? "#fff" : "#aaa", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {a.icon} {a.name}
              </button>
            ))}
          </div>
          {tfrNeedConv ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><Lbl>СПИСАТЬ ({sym(acc.cur)})</Lbl><input type="number" value={tf.amount} onChange={e => st("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 18, fontWeight: 900 }} /></div>
                <div><Lbl>ЗАЧИСЛИТЬ ({sym(toAcc?.cur)})</Lbl><input type="number" value={tf.amountTo} onChange={e => st("amountTo", e.target.value)} placeholder="0" inputMode="decimal" style={{ ...INP, fontSize: 18, fontWeight: 900 }} /></div>
              </div>
              <RateRow from={sym(acc.cur)} to={sym(toAcc?.cur)} amount={tf.amount} amountTo={tf.amountTo} cr={tf.customRate} setCr={v => st("customRate", v)} auto={tfrAutoRate} />
            </>
          ) : (
            <><Lbl>СУММА ({sym(acc.cur)})</Lbl><input type="number" value={tf.amount} onChange={e => st("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 22, fontWeight: 900, marginBottom: 8 }} /></>
          )}
          <DateComment date={tf.date} comment={tf.comment} setDate={v => st("date", v)} setComment={v => st("comment", v)} />
          <ActionBtn onClick={confirmTransfer} label="Подтвердить перевод" col="#7c6bff" txtCol="#fff" />
        </div>
      )}

      <Lbl style={{ marginTop: 4, marginBottom: 8 }}>ВСЕ ОПЕРАЦИИ ({accTxs.length})</Lbl>
      <TxList txs={accTxs} onEdit={onEdit} onDelete={deleteTx} showAcc />
    </Sheet>
  );
}

// ── CAT PANEL ─────────────────────────────────────────────────────────────────
function CatPanel({ cat, setCat, delCat, txs, accounts, catSpentRub, catSpentCur, addTx, onEdit, deleteTx, onClose, showToast }) {
  const catCur = cat.cur || "TRY";
  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({ name: cat.name, icon: cat.icon, budget: String(cat.budget), cur: catCur });
  const [af, setAf] = useState({ accId: accounts[0]?.id || "", amount: "", amountTo: "", customRate: "", tag: "", comment: "", date: todayStr() });
  const sa = (k, v) => setAf(p => ({ ...p, [k]: v }));
  const [newTag, setNewTag] = useState("");

  const selAcc = accounts.find(a => a.id === af.accId);
  const needConv = selAcc && selAcc.cur !== catCur;
  const autoRate = needConv ? ((RATES[selAcc.cur] || 1) / (RATES[catCur] || 1)).toFixed(4) : null;

  useEffect(() => {
    if (autoRate && af.amount && !af.customRate)
      sa("amountTo", (parseFloat(af.amount) * parseFloat(autoRate)).toFixed(2));
  }, [af.amount, af.accId, af.customRate]);

  const saveEdit = () => {
    setCat({ ...cat, name: ef.name, icon: ef.icon, budget: parseFloat(ef.budget) || 0, cur: ef.cur });
    setEditing(false);
    showToast("Сохранено ✓", "#4ade80");
  };

  const confirmExp = () => {
    const amt = parseFloat(af.amount) || 0;
    if (!amt) return;
    addTx({ type: "expense", catId: cat.id, icon: cat.icon, name: cat.name, amount: amt, cur: selAcc?.cur || catCur, accId: af.accId, acc: selAcc?.name || "", tag: af.tag, comment: af.comment, date: af.date });
    sa("amount", "");
    sa("tag", "");
    sa("comment", "");
    showToast("Расход добавлен ✓", "#4ade80");
    onClose();
  };

  const spRub = catSpentRub(cat.id);
  const spCur = catSpentCur(cat.id);
  const budRub = toRub(cat.budget || 0, catCur);
  const pct = Math.min(110, Math.round((spRub / (budRub || 1)) * 100));
  const col = pct >= 100 ? "#ff4d6d" : pct >= 70 ? "#fbbf24" : "#4ade80";
  const tags = cat.tags || [];
  const catTxs = txs.filter(t => t.type === "expense" && t.catId === cat.id).sort((a, b) => b.date.localeCompare(a.date));
  const tagStats = tags.map(tag => ({ tag, v: catTxs.filter(t => t.tag === tag).reduce((s, t) => s + toRub(t.amount, t.cur) / RATES[catCur], 0) })).filter(t => t.v > 0).sort((a, b) => b.v - a.v);

  return (
    <Sheet title={`${cat.icon} ${cat.name}`} onClose={onClose}
      actions={<>
        <Pill onClick={() => setEditing(e => !e)} col="#252530" txt="#aaa">{editing ? "✕" : "✏️ Ред."}</Pill>
        <Pill onClick={() => { if (window.confirm("Удалить категорию?")) delCat(); }} col="#3a0a0a" txt="#ff4d6d">🗑</Pill>
      </>}>

      {/* ── ADD EXPENSE — always at top, open by default ── */}
      <div style={{ background: "#1a0a1a", borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <p style={{ color: "#ff6b9d", fontSize: 12, fontWeight: 800, margin: "0 0 10px" }}>＋ ДОБАВИТЬ РАСХОД</p>

        {/* Account chips */}
        <Lbl>СО СЧЁТА</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {accounts.map(a => (
            <button key={a.id} onClick={() => sa("accId", a.id)}
              style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: af.accId === a.id ? "#7c6bff" : "#252530", color: af.accId === a.id ? "#fff" : "#aaa", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {a.icon} {a.name} {sym(a.cur)}
            </button>
          ))}
        </div>

        {/* Amount — with conversion if needed */}
        {needConv ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><Lbl>СПИСАТЬ ({sym(selAcc?.cur)})</Lbl><input type="number" value={af.amount} onChange={e => sa("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 18, fontWeight: 900 }} /></div>
              <div><Lbl>В КАТ. ({sym(catCur)})</Lbl><input type="number" value={af.amountTo} onChange={e => sa("amountTo", e.target.value)} placeholder="0" inputMode="decimal" style={{ ...INP, fontSize: 18, fontWeight: 900 }} /></div>
            </div>
            <RateRow from={sym(selAcc?.cur)} to={sym(catCur)} amount={af.amount} amountTo={af.amountTo} cr={af.customRate} setCr={v => sa("customRate", v)} auto={autoRate} />
          </>
        ) : (
          <>
            <Lbl>СУММА ({sym(selAcc?.cur || catCur)})</Lbl>
            <input type="number" value={af.amount} onChange={e => sa("amount", e.target.value)} placeholder="0" autoFocus inputMode="decimal" style={{ ...INP, fontSize: 26, fontWeight: 900, marginBottom: 8 }} />
          </>
        )}

        {/* Tag chips */}
        {tags.length > 0 && (
          <>
            <Lbl>ТЕГ</Lbl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {tags.map(t => (
                <button key={t} onClick={() => sa("tag", af.tag === t ? "" : t)}
                  style={{ padding: "5px 11px", borderRadius: 20, border: "none", background: af.tag === t ? "#7c6bff" : "#252530", color: af.tag === t ? "#fff" : "#aaa", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        <DateComment date={af.date} comment={af.comment} setDate={v => sa("date", v)} setComment={v => sa("comment", v)} />
        <ActionBtn onClick={confirmExp} label="Подтвердить расход" col="#7c6bff" txtCol="#fff" />
      </div>

      {/* ── STATS always visible ── */}
      <div>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <InfoCard label={`Потрачено (${sym(catCur)})`} val={`${fmtN(spCur)}${sym(catCur)}`} sub={catCur !== "RUB" ? `≈${fmtN(spRub)}₽` : null} col="#ff6b9d" />
            <InfoCard label={`Бюджет (${sym(catCur)})`} val={`${fmtN(cat.budget)}${sym(catCur)}`} sub={catCur !== "RUB" ? `≈${fmtN(budRub)}₽` : null} col="#7c6bff" />
          </div>
          <PBar val={spRub} max={budRub} mb={12} col={col} />

          {/* Edit */}
          {editing && (
            <div style={{ background: "#252530", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 86px", gap: 6, marginBottom: 8 }}>
                <input value={ef.icon} onChange={e => setEf(p => ({ ...p, icon: e.target.value }))} style={{ ...INP, textAlign: "center", fontSize: 20 }} />
                <input value={ef.name} onChange={e => setEf(p => ({ ...p, name: e.target.value }))} style={INP} />
                <select value={ef.cur} onChange={e => setEf(p => ({ ...p, cur: e.target.value }))} style={INP}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{sym(c)} {c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#666", fontSize: 12, whiteSpace: "nowrap" }}>Бюджет {sym(ef.cur)}:</span>
                <input type="number" value={ef.budget} onChange={e => setEf(p => ({ ...p, budget: e.target.value }))} style={{ ...INP, flex: 1 }} />
              </div>
              <TwoBtn ok={saveEdit} cancel={() => setEditing(false)} okLabel="✓ Изменить" />
            </div>
          )}

          {/* Tags */}
          <Lbl style={{ marginBottom: 6 }}>ТЕГИ</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {tags.map((tag, i) => {
              const tv = tagStats.find(t => t.tag === tag)?.v || 0;
              return (
                <div key={tag} style={{ display: "flex", alignItems: "center", gap: 4, background: "#252530", borderRadius: 20, padding: "4px 10px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{tag}</span>
                  {tv > 0 && <span style={{ fontSize: 10, color: "#666" }}>{fmtN(tv)}{sym(catCur)}</span>}
                  <button onClick={() => setCat({ ...cat, tags: tags.filter(t => t !== tag) })} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newTag.trim()) { setCat({ ...cat, tags: [...tags, newTag.trim()] }); setNewTag(""); } }}
              placeholder="Новый тег..." style={{ ...INP, flex: 1, padding: "6px 10px" }} />
            <button onClick={() => { if (newTag.trim()) { setCat({ ...cat, tags: [...tags, newTag.trim()] }); setNewTag(""); } }}
              style={{ padding: "6px 14px", borderRadius: 9, background: "#7c6bff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>+</button>
          </div>
      </div>

      <Lbl style={{ marginTop: 6, marginBottom: 8 }}>ТРАНЗАКЦИИ ({catTxs.length})</Lbl>
      <TxList txs={catTxs} onEdit={onEdit} onDelete={deleteTx} showTag />
    </Sheet>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function HistoryTab({ txs, deleteTx, onEdit }) {
  const [filter, setFilter] = useState("all");
  const [df, setDf] = useState(""), [dt, setDt] = useState("");
  const items = txs.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
    if (df && t.date < df) return false;
    if (dt && t.date > dt) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>История</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
        {[["all", "Все"], ["expense", "💸 Расходы"], ["income", "💚 Доходы"], ["transfer", "↔️ Переводы"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: filter === v ? "#7c6bff" : "#1e1e2a", color: filter === v ? "#fff" : "#777", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#555", fontSize: 11, fontWeight: 700, width: 28, flexShrink: 0 }}>С:</span>
          <input type="date" value={df} onChange={e => setDf(e.target.value)} style={{ ...INP, flex: 1 }} />
          {df && <button onClick={() => setDf("")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>×</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#555", fontSize: 11, fontWeight: 700, width: 28, flexShrink: 0 }}>По:</span>
          <input type="date" value={dt} onChange={e => setDt(e.target.value)} style={{ ...INP, flex: 1 }} />
          {dt && <button onClick={() => setDt("")} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>×</button>}
        </div>
      </div>
      <TxList txs={items} onEdit={onEdit} onDelete={deleteTx} showTag showAcc />
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function AnalyticsTab({ cats, txs, sources, catSpentRub, srcRcvRub, totalBudRub, totalSpentRub, onOpenCat }) {
  const [period, setPeriod] = useState("thisMonth");
  const [df, setDf] = useState(""), [dt, setDt] = useState("");
  const now = new Date();

  const getRange = () => {
    if (period === "custom") return { from: df, to: dt };
    if (period === "thisMonth") return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: "" };
    if (period === "lastMonth") { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1), e = new Date(now.getFullYear(), now.getMonth(), 0); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10) }; }
    if (period === "3m") return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10), to: "" };
    return { from: "", to: "" };
  };

  const { from, to } = getRange();
  const filt = txs.filter(t => { if (from && t.date < from) return false; if (to && t.date > to) return false; return true; });
  const spF = (catId) => filt.filter(t => t.type === "expense" && t.catId === catId).reduce((s, t) => s + toRub(t.amount, t.cur), 0);
  const totalF = cats.reduce((s, c) => s + spF(c.id), 0);
  const totalInc = filt.filter(t => t.type === "income").reduce((s, t) => s + toRub(t.amountTo || t.amount, t.curTo || t.cur), 0);
  const totalExp = sources.reduce((s, src) => s + (src.expected || 0), 0);

  const pieData = cats.map(c => ({ name: c.name, icon: c.icon, value: Math.round(spF(c.id)), id: c.id, cur: c.cur || "TRY" })).filter(d => d.value > 0);
  const barData = cats.map(c => ({ name: c.icon, Б: Math.round(toRub(c.budget || 0, c.cur || "TRY")), Ф: Math.round(spF(c.id)) }));
  const monthMap = {};
  txs.forEach(t => {
    const d = new Date(t.date), k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[k]) monthMap[k] = { e: 0, i: 0, l: MONTHS[d.getMonth()] };
    if (t.type === "expense") monthMap[k].e += toRub(t.amount, t.cur);
    if (t.type === "income") monthMap[k].i += toRub(t.amountTo || t.amount, t.curTo || t.cur);
  });
  const lineData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => ({ name: v.l, Расходы: Math.round(v.e), Доходы: Math.round(v.i) }));

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Аналитика</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
        {[["thisMonth", "Этот мес."], ["lastMonth", "Прошлый"], ["3m", "3 мес."], ["all", "Всё"], ["custom", "Период"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)} style={{ whiteSpace: "nowrap", padding: "6px 11px", borderRadius: 20, border: "none", background: period === v ? "#7c6bff" : "#1e1e2a", color: period === v ? "#fff" : "#777", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{l}</button>
        ))}
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ color: "#555", fontSize: 11, width: 28 }}>С:</span><input type="date" value={df} onChange={e => setDf(e.target.value)} style={{ ...INP, flex: 1 }} /></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span style={{ color: "#555", fontSize: 11, width: 28 }}>По:</span><input type="date" value={dt} onChange={e => setDt(e.target.value)} style={{ ...INP, flex: 1 }} /></div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <InfoCard label="Потрачено" val={fmtN(totalF) + "₽"} col="#ff6b9d" />
        <InfoCard label="% дохода" val={totalInc > 0 ? Math.round((totalF / totalInc) * 100) + "%" : "—"} col="#fbbf24" />
        <InfoCard label="% ожид." val={totalExp > 0 ? Math.round((totalF / totalExp) * 100) + "%" : "—"} col="#7c6bff" />
      </div>
      <p style={{ color: "#444", fontSize: 10, margin: "0 0 10px", textAlign: "center" }}>Все суммы приведены к ₽ по курсу ЦБ</p>

      {pieData.length > 0 && (
        <div style={{ background: "#1e1e2a", borderRadius: 16, padding: 14, marginBottom: 10 }}>
          <p style={{ fontWeight: 800, fontSize: 13, margin: "0 0 10px" }}>По категориям <span style={{ color: "#555", fontSize: 11, fontWeight: 400 }}>(тап → детали)</span></p>
          <ResponsiveContainer width="100%" height={155}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={62} dataKey="value" label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false} onClick={d => onOpenCat(d.id)}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} cursor="pointer" />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [`${fmtN(v)}₽ (${fmtN(v / RATES[p.payload.cur || "TRY"])}${sym(p.payload.cur || "TRY")})`, p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 8px", marginTop: 6 }}>
            {pieData.map((d, i) => (
              <div key={d.name} onClick={() => onOpenCat(d.id)} style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ fontSize: 10, color: "#888" }}>{d.icon}{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "#1e1e2a", borderRadius: 16, overflow: "hidden", marginBottom: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 58px 40px", gap: 4, padding: "8px 12px", background: "#252530" }}>
          {["Категория", "₽ факт", "₽ план", "% дох."].map(h => <span key={h} style={{ color: "#555", fontSize: 10, fontWeight: 700 }}>{h}</span>)}
        </div>
        {cats.map((c, i) => {
          const sp = spF(c.id), budR = toRub(c.budget || 0, c.cur || "TRY"), pI = totalInc > 0 ? Math.round((sp / totalInc) * 100) : 0;
          const spInCur = sp / RATES[c.cur || "TRY"];
          return (
            <div key={c.id} onClick={() => onOpenCat(c.id)} style={{ display: "grid", gridTemplateColumns: "1fr 58px 58px 40px", gap: 4, padding: "7px 12px", borderTop: i > 0 ? "1px solid #252530" : "none", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{c.icon} {c.name}</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: sp > budR ? "#ff4d6d" : "#f0ede8" }}>{fmtN(sp)}₽</p>
                <p style={{ margin: 0, fontSize: 9, color: "#555" }}>{fmtN(spInCur)}{sym(c.cur || "TRY")}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "#555" }}>{fmtN(budR)}₽</p>
                <p style={{ margin: 0, fontSize: 9, color: "#444" }}>{fmtN(c.budget)}{sym(c.cur || "TRY")}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: pI > 20 ? "#fbbf24" : "#888" }}>{pI}%</span>
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 58px 58px 40px", gap: 4, padding: "7px 12px", borderTop: "2px solid #7c6bff" }}>
          <span style={{ fontWeight: 800, fontSize: 12 }}>Итого</span>
          <span style={{ fontWeight: 800, fontSize: 11, color: totalF > totalBudRub ? "#ff4d6d" : "#f0ede8" }}>{fmtN(totalF)}₽</span>
          <span style={{ fontWeight: 700, fontSize: 11, color: "#555" }}>{fmtN(totalBudRub)}₽</span>
          <span style={{ fontWeight: 800, fontSize: 11, color: "#fbbf24" }}>{totalInc > 0 ? Math.round((totalF / totalInc) * 100) : 0}%</span>
        </div>
      </div>

      <div style={{ background: "#1e1e2a", borderRadius: 16, padding: 14, marginBottom: 10 }}>
        <p style={{ fontWeight: 800, fontSize: 13, margin: "0 0 8px" }}>Бюджет vs Факт (₽)</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
            <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#666" }} />
            <YAxis tick={{ fontSize: 9, fill: "#555" }} />
            <Tooltip formatter={v => `${fmtN(v)}₽`} />
            <Bar dataKey="Б" fill="#2a2a3a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Ф" fill="#7c6bff" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {lineData.length > 1 && (
        <div style={{ background: "#1e1e2a", borderRadius: 16, padding: 14 }}>
          <p style={{ fontWeight: 800, fontSize: 13, margin: "0 0 8px" }}>Динамика (₽)</p>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={lineData} margin={{ top: 0, right: 10, bottom: 0, left: -30 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#666" }} />
              <YAxis tick={{ fontSize: 9, fill: "#555" }} />
              <Tooltip formatter={v => `${fmtN(v)}₽`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Расходы" stroke="#ff6b9d" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Доходы" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── EDIT TX ───────────────────────────────────────────────────────────────────
function EditTxModal({ tx, accounts, cats, onSave, onClose }) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [amountTo, setAmountTo] = useState(String(tx.amountTo || tx.amount));
  const [comment, setComment] = useState(tx.comment || "");
  const [date, setDate] = useState(tx.date);
  const [tag, setTag] = useState(tx.tag || "");
  const isT = tx.type === "transfer", isE = tx.type === "expense";
  const cat = cats.find(c => c.id === tx.catId);
  const needConv = (isT && tx.cur !== tx.curTo) || (tx.type === "income" && tx.cur !== tx.curTo);

  return (
    <Sheet title={`✏️ ${isT ? "Перевод" : tx.name}`} onClose={onClose}>
      {needConv ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div><Lbl>СПИСАНО ({sym(tx.cur)})</Lbl><input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...INP, fontSize: 20, fontWeight: 800 }} /></div>
          <div><Lbl>ЗАЧИСЛЕНО ({sym(tx.curTo || tx.cur)})</Lbl><input type="number" value={amountTo} onChange={e => setAmountTo(e.target.value)} style={{ ...INP, fontSize: 20, fontWeight: 800 }} /></div>
        </div>
      ) : (
        <><Lbl>СУММА ({sym(tx.cur)})</Lbl><input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...INP, fontSize: 24, fontWeight: 900, marginBottom: 10 }} /></>
      )}
      {isE && cat?.tags?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <Lbl>ТЕГ</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {cat.tags.map(t => (
              <button key={t} onClick={() => setTag(tag === t ? "" : t)}
                style={{ padding: "4px 10px", borderRadius: 20, border: "none", background: tag === t ? "#7c6bff" : "#252530", color: tag === t ? "#fff" : "#aaa", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <DateComment date={date} comment={comment} setDate={setDate} setComment={setComment} />
      <div style={{ marginTop: 6 }}>
        <ActionBtn onClick={() => onSave({ ...tx, amount: parseFloat(amount) || 0, amountTo: parseFloat(amountTo) || parseFloat(amount) || 0, comment, date, tag })} label="✓ Сохранить изменения" col="#4ade80" txtCol="#0a0a10" />
      </div>
    </Sheet>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Sheet({ title, onClose, actions, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", background: "#1a1a28", borderRadius: "22px 22px 0 0", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "16px 16px 0", position: "sticky", top: 0, background: "#1a1a28", zIndex: 10, borderRadius: "22px 22px 0 0" }}>
          <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>{title}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {actions}
              <button onClick={onClose} style={{ background: "#252530", border: "none", color: "#888", cursor: "pointer", borderRadius: 10, padding: "5px 10px", fontSize: 13, fontWeight: 700 }}>✕</button>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 16px 40px" }}>{children}</div>
      </div>
    </div>
  );
}

function TxList({ txs, onEdit, onDelete, showTag, showAcc }) {
  if (!txs || txs.length === 0) return <p style={{ color: "#444", textAlign: "center", padding: "20px 0", fontSize: 13 }}>Операций нет</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {txs.map(t => (
        <div key={t.id} onClick={() => onEdit(t)} style={{ background: "#252530", borderRadius: 11, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.name}</p>
              {showTag && t.tag && <span style={{ background: "#1e1e2a", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#888", whiteSpace: "nowrap", flexShrink: 0 }}>{t.tag}</span>}
            </div>
            <p style={{ margin: 0, color: "#555", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.date}{showAcc && t.acc ? " · " + t.acc : ""}{t.comment ? " · " + t.comment : ""}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: t.type === "income" ? "#4ade80" : t.type === "transfer" ? "#fbbf24" : "#f0ede8" }}>
              {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}{fmtN(t.amount)}{sym(t.cur)}
            </p>
            {t.amountTo && t.cur !== t.curTo && <p style={{ margin: 0, color: "#555", fontSize: 10 }}>→{fmtN(t.amountTo)}{sym(t.curTo)}</p>}
            {t.cur !== "RUB" && !t.amountTo && <p style={{ margin: 0, color: "#444", fontSize: 9 }}>≈{fmtN(toRub(t.amount, t.cur))}₽</p>}
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff4d6d", fontSize: 14, flexShrink: 0, padding: "2px 4px" }}>🗑</button>
        </div>
      ))}
    </div>
  );
}

function RateRow({ from, to, amount, amountTo, cr, setCr, auto }) {
  return (
    <div style={{ background: "#0f0f1a", borderRadius: 9, padding: "8px 10px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ color: "#555", fontSize: 10, fontWeight: 700 }}>КУРС {from}/{to}</span>
        <button onClick={() => setCr("")} style={{ fontSize: 10, color: "#7c6bff", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>↻ Авто ЦБ</button>
      </div>
      <input type="number" value={cr || auto || ""} onChange={e => setCr(e.target.value)} style={{ ...INP, padding: "5px 8px", fontSize: 13 }} />
      {amount && amountTo && <p style={{ color: "#7c6bff", fontSize: 11, margin: "4px 0 0" }}>1 {from} = {(parseFloat(amountTo) / parseFloat(amount)).toFixed(4)} {to}</p>}
    </div>
  );
}

function DateComment({ date, comment, setDate, setComment }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
      <div>
        <Lbl>ДАТА</Lbl>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={INP} />
      </div>
      <div>
        <Lbl>КОММЕНТАРИЙ</Lbl>
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Необязательно" style={INP} />
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label, col, txtCol }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: 12, borderRadius: 11, background: col || "#7c6bff", color: txtCol || "#fff", fontSize: 14, fontWeight: 900, border: "none", cursor: "pointer" }}>
      {label}
    </button>
  );
}

function InfoCard({ label, val, sub, col }) {
  return (
    <div style={{ background: "#252530", borderRadius: 11, padding: "10px 12px", textAlign: "center" }}>
      <p style={{ color: "#666", fontSize: 10, margin: "0 0 3px", fontWeight: 700 }}>{label}</p>
      <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: col || "#f0ede8" }}>{val}</p>
      {sub && <p style={{ color: "#555", fontSize: 10, margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

function PBar({ val, max, col, mb = 0 }) {
  const p = Math.min(100, Math.round((val / (max || 1)) * 100));
  const c = col || (p >= 100 ? "#ff4d6d" : p >= 70 ? "#fbbf24" : "#4ade80");
  return (
    <div style={{ background: "#0a0a10", borderRadius: 6, height: 7, overflow: "hidden", marginBottom: mb }}>
      <div style={{ height: "100%", width: `${p}%`, background: c, borderRadius: 6, transition: "width 0.5s" }} />
    </div>
  );
}

function Pill({ onClick, col, txt, children }) {
  return <button onClick={onClick} style={{ padding: "5px 10px", borderRadius: 10, background: col || "#252530", color: txt || "#aaa", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{children}</button>;
}

function TwoBtn({ ok, cancel, okLabel = "✓ Добавить", okCol = "#7c6bff", okTxtCol = "#fff" }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={ok} style={{ flex: 1, padding: 8, borderRadius: 9, background: okCol, color: okTxtCol, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12 }}>{okLabel}</button>
      <button onClick={cancel} style={{ flex: 1, padding: 8, borderRadius: 9, background: "#252530", color: "#888", border: "none", cursor: "pointer", fontSize: 12 }}>✕ Отмена</button>
    </div>
  );
}

function RowLabel({ label, hint }) {
  return <div style={{ marginBottom: 8 }}><p style={{ color: "#666", fontSize: 11, fontWeight: 800, margin: 0 }}>{label}</p><p style={{ color: "#333", fontSize: 10, margin: 0 }}>{hint}</p></div>;
}

function AddPlusBtn({ onClick, col }) {
  return (
    <div onClick={onClick} style={{ minWidth: 56, background: col || "#14142a", borderRadius: 14, border: "2px dashed #2a2a4a", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flexShrink: 0, padding: "10px 8px" }}>
      <span style={{ fontSize: 20, color: "#2a2a6a" }}>＋</span>
      <p style={{ color: "#2a2a6a", fontSize: 9, margin: 0, fontWeight: 700 }}>новый</p>
    </div>
  );
}

function Lbl({ children, style = {} }) {
  return <p style={{ color: "#555", fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px", ...style }}>{children}</p>;
}

const INP = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #2a2a3a", background: "#0a0a10", color: "#f0ede8", fontSize: 14, boxSizing: "border-box" };
const IS = { padding: "6px 8px", borderRadius: 8, border: "1px solid #2a2a3a", background: "#0a0a10", color: "#f0ede8", fontSize: 13, boxSizing: "border-box" };
