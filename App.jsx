import { useState, useEffect, useCallback } from "react";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "clothes", name: "Одежда и обувь", budget: 5000, icon: "👗" },
  { id: "health", name: "Здоровье и красота", budget: 3000, icon: "💄" },
  { id: "food", name: "Еда вне дома", budget: 10000, icon: "🍕" },
  { id: "transport", name: "Транспорт", budget: 2000, icon: "🚌" },
  { id: "gifts", name: "Подарки, друзья, мероприятия", budget: 2000, icon: "🎁" },
  { id: "subscriptions", name: "Подписки и связь", budget: 2000, icon: "📱" },
  { id: "other", name: "Прочее", budget: 4000, icon: "🛍️" },
];
const TOTAL_BUDGET = 28000;
const ACCOUNTS = [
  { id: "turkish", name: "Турецкая карта", currency: "TRY", symbol: "₺" },
  { id: "tinkoff", name: "Тинькофф рублёвый", currency: "RUB", symbol: "₽" },
];

const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const fmt = (n, sym = "₽") => `${Math.round(n).toLocaleString("ru")} ${sym}`;
const fmtTRY = (n) => fmt(n, "₺");
const fmtRUB = (n) => fmt(n, "₽");

const daysLeftInJune = () => {
  const now = new Date();
  const end = new Date(now.getFullYear(), 5, 30);
  const diff = Math.ceil((end - now) / 86400000);
  return Math.max(0, diff);
};

const today = () => new Date().toISOString().slice(0, 10);

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [rate, setRate] = useState(LS.get("rate", 3.2));
  const [rateDate, setRateDate] = useState(LS.get("rateDate", ""));
  const [rateLoading, setRateLoading] = useState(false);
  const [expenses, setExpenses] = useState(LS.get("expenses", []));
  const [transfers, setTransfers] = useState(LS.get("transfers", []));
  const [wallets, setWallets] = useState(LS.get("wallets", { turkish: 0, tinkoff: 0, turkishInit: 0, tinkoffInit: 0 }));
  const [setupDone, setSetupDone] = useState(LS.get("setupDone", false));
  const [setupTRY, setSetupTRY] = useState("");
  const [setupRUB, setSetupRUB] = useState("");
  const [toast, setToast] = useState(null);

  // persist
  useEffect(() => { LS.set("expenses", expenses); }, [expenses]);
  useEffect(() => { LS.set("transfers", transfers); }, [transfers]);
  useEffect(() => { LS.set("wallets", wallets); }, [wallets]);
  useEffect(() => { LS.set("rate", rate); }, [rate]);
  useEffect(() => { LS.set("rateDate", rateDate); }, [rateDate]);
  useEffect(() => { LS.set("setupDone", setupDone); }, [setupDone]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // fetch CBR rate
  const fetchRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      const json = await res.json();
      const tryRate = json.Valute?.TRY;
      if (tryRate) {
        const r = tryRate.Value / tryRate.Nominal;
        setRate(parseFloat(r.toFixed(4)));
        setRateDate(new Date(json.Date).toLocaleDateString("ru"));
        showToast("Курс обновлён ✓");
      }
    } catch {
      showToast("Не удалось загрузить курс — введите вручную");
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => { fetchRate(); }, []);

  // computed
  const toRub = (amount, currency) => currency === "TRY" ? amount * rate : amount;

  const totalSpent = expenses.reduce((s, e) => s + toRub(e.amount, e.currency), 0);
  const totalLeft = TOTAL_BUDGET - totalSpent;

  const spentByCategory = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = expenses.filter(e => e.category === c.id).reduce((s, e) => s + toRub(e.amount, e.currency), 0);
    return acc;
  }, {});

  const walletTotalRub = wallets.turkish * rate + wallets.tinkoff;

  // setup
  if (!setupDone) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f14", color: "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <div style={{ width: "100%", maxWidth: 420, background: "#18181f", borderRadius: 24, padding: 32, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>💰</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, textAlign: "center", marginBottom: 4 }}>Бюджет Саши</h1>
          <p style={{ textAlign: "center", color: "#888", marginBottom: 28, fontSize: 14 }}>Июнь 2025 · Первый запуск</p>
          <p style={{ marginBottom: 16, color: "#bbb", fontSize: 14 }}>Укажи начальные остатки по счетам:</p>
          <label style={{ display: "block", marginBottom: 6, color: "#ccc", fontSize: 13 }}>Турецкая карта (₺)</label>
          <input type="number" value={setupTRY} onChange={e => setSetupTRY(e.target.value)} placeholder="0"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #333", background: "#0f0f14", color: "#f0ede8", fontSize: 18, marginBottom: 16, boxSizing: "border-box" }} />
          <label style={{ display: "block", marginBottom: 6, color: "#ccc", fontSize: 13 }}>Тинькофф рублёвый (₽)</label>
          <input type="number" value={setupRUB} onChange={e => setSetupRUB(e.target.value)} placeholder="0"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #333", background: "#0f0f14", color: "#f0ede8", fontSize: 18, marginBottom: 28, boxSizing: "border-box" }} />
          <button onClick={() => {
            const t = parseFloat(setupTRY) || 0;
            const r = parseFloat(setupRUB) || 0;
            setWallets({ turkish: t, tinkoff: r, turkishInit: t, tinkoffInit: r });
            setSetupDone(true);
          }} style={{ width: "100%", padding: "16px", borderRadius: 14, background: "#7c6bff", color: "#fff", fontSize: 17, fontWeight: 700, border: "none", cursor: "pointer" }}>
            Начать →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", color: "#f0ede8", fontFamily: "'Nunito', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#7c6bff", color: "#fff", padding: "10px 22px", borderRadius: 20, zIndex: 9999, fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Content */}
      {tab === "home" && <HomeTab expenses={expenses} wallets={wallets} rate={rate} rateDate={rateDate} rateLoading={rateLoading} fetchRate={fetchRate} setRate={setRate} totalSpent={totalSpent} totalLeft={totalLeft} spentByCategory={spentByCategory} walletTotalRub={walletTotalRub} />}
      {tab === "add" && <AddExpenseTab expenses={expenses} setExpenses={setExpenses} wallets={wallets} setWallets={setWallets} rate={rate} showToast={showToast} toRub={toRub} onDone={() => setTab("home")} />}
      {tab === "list" && <ExpenseListTab expenses={expenses} setExpenses={setExpenses} wallets={wallets} setWallets={setWallets} rate={rate} toRub={toRub} showToast={showToast} />}
      {tab === "transfer" && <TransferTab transfers={transfers} setTransfers={setTransfers} wallets={wallets} setWallets={setWallets} rate={rate} showToast={showToast} onDone={() => setTab("home")} />}
      {tab === "report" && <ReportTab expenses={expenses} transfers={transfers} wallets={wallets} rate={rate} rateDate={rateDate} toRub={toRub} totalSpent={totalSpent} totalLeft={totalLeft} spentByCategory={spentByCategory} showToast={showToast} />}

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#18181f", borderTop: "1px solid #252530", display: "flex", zIndex: 100 }}>
        {[
          { id: "home", icon: "🏠", label: "Главная" },
          { id: "add", icon: "➕", label: "Расход" },
          { id: "list", icon: "📋", label: "История" },
          { id: "transfer", icon: "↔️", label: "Перевод" },
          { id: "report", icon: "📊", label: "Отчёт" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", color: tab === t.id ? "#7c6bff" : "#666", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ expenses, wallets, rate, rateDate, rateLoading, fetchRate, setRate, totalSpent, totalLeft, spentByCategory, walletTotalRub }) {
  const [editRate, setEditRate] = useState(false);
  const [rateInput, setRateInput] = useState(rate);
  const pct = Math.min(100, (totalSpent / 28000) * 100);
  const barColor = pct > 100 ? "#ff4d6d" : pct > 70 ? "#fbbf24" : "#4ade80";

  return (
    <div style={{ padding: "24px 16px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 2 }}>Бюджет Саши · Июнь</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, margin: 0 }}>
          {daysLeftInJune()} дней до конца месяца
        </h1>
      </div>

      {/* Rate */}
      <div style={{ background: "#18181f", borderRadius: 16, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {editRate ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
            <span style={{ color: "#888", fontSize: 13 }}>Курс ₺:</span>
            <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} step="0.01"
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #7c6bff", background: "#0f0f14", color: "#f0ede8", fontSize: 15 }} />
            <button onClick={() => { setRate(parseFloat(rateInput) || rate); setEditRate(false); }}
              style={{ padding: "6px 12px", borderRadius: 8, background: "#7c6bff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>✓</button>
            <button onClick={() => setEditRate(false)}
              style={{ padding: "6px 10px", borderRadius: 8, background: "#333", color: "#fff", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <>
            <div>
              <span style={{ color: "#888", fontSize: 12 }}>Курс ЦБ РФ · {rateDate || "нет данных"}</span>
              <div style={{ fontWeight: 800, fontSize: 18 }}>1 ₺ = {rate} ₽</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={fetchRate} style={{ padding: "6px 10px", borderRadius: 8, background: "#252530", color: "#aaa", border: "none", cursor: "pointer", fontSize: 13 }}>
                {rateLoading ? "..." : "↻"}
              </button>
              <button onClick={() => { setRateInput(rate); setEditRate(true); }}
                style={{ padding: "6px 10px", borderRadius: 8, background: "#252530", color: "#aaa", border: "none", cursor: "pointer", fontSize: 13 }}>✏️</button>
            </div>
          </>
        )}
      </div>

      {/* Wallets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#1e1b3a", borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ color: "#888", fontSize: 11, margin: "0 0 4px" }}>Турецкая карта</p>
          <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{fmtTRY(wallets.turkish)}</p>
          <p style={{ color: "#666", fontSize: 11, margin: "2px 0 0" }}>≈ {fmtRUB(wallets.turkish * rate)}</p>
        </div>
        <div style={{ background: "#1a2b1a", borderRadius: 14, padding: "12px 14px" }}>
          <p style={{ color: "#888", fontSize: 11, margin: "0 0 4px" }}>Тинькофф</p>
          <p style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>{fmtRUB(wallets.tinkoff)}</p>
        </div>
      </div>
      <div style={{ background: "#252530", borderRadius: 14, padding: "10px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#888", fontSize: 13 }}>Итого на счетах:</span>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{fmtRUB(walletTotalRub)}</span>
      </div>

      {/* Budget overview */}
      <div style={{ background: "#18181f", borderRadius: 20, padding: "20px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 2px" }}>Потрачено</p>
            <p style={{ fontWeight: 900, fontSize: 24, margin: 0, color: totalLeft < 0 ? "#ff4d6d" : "#f0ede8" }}>{fmtRUB(Math.abs(totalSpent))}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 2px" }}>Остаток</p>
            <p style={{ fontWeight: 900, fontSize: 24, margin: 0, color: totalLeft < 0 ? "#ff4d6d" : "#4ade80" }}>{fmtRUB(Math.abs(totalLeft))}{totalLeft < 0 ? " 🔴" : ""}</p>
          </div>
        </div>
        <div style={{ background: "#252530", borderRadius: 8, height: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 8, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "#666", fontSize: 11 }}>0</span>
          <span style={{ color: "#666", fontSize: 11 }}>Бюджет: {fmtRUB(28000)} · {Math.round(pct)}%</span>
        </div>
      </div>

      {/* Categories */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>По категориям</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CATEGORIES.map(cat => {
          const spent = spentByCategory[cat.id] || 0;
          const left = cat.budget - spent;
          const p = Math.min(100, (spent / cat.budget) * 100);
          const color = p >= 100 ? "#ff4d6d" : p >= 70 ? "#fbbf24" : "#4ade80";
          return (
            <div key={cat.id} style={{ background: "#18181f", borderRadius: 16, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>{cat.icon} {cat.name}</span>
                <span style={{ color: left < 0 ? "#ff4d6d" : "#4ade80", fontWeight: 700, fontSize: 14 }}>
                  {left < 0 ? `−${fmtRUB(Math.abs(left))}` : fmtRUB(left)}
                </span>
              </div>
              <div style={{ background: "#252530", borderRadius: 6, height: 7, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 6, transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666", fontSize: 12 }}>Потрачено: {fmtRUB(spent)}</span>
                <span style={{ color: "#666", fontSize: 12 }}>{Math.round(p)}% из {fmtRUB(cat.budget)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADD EXPENSE TAB ───────────────────────────────────────────────────────────
function AddExpenseTab({ expenses, setExpenses, wallets, setWallets, rate, showToast, toRub, onDone }) {
  const [form, setForm] = useState({
    date: today(), amount: "", currency: "TRY", category: "food", account: "turkish", comment: ""
  });

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "account") next.currency = v === "turkish" ? "TRY" : "RUB";
    return next;
  });

  const submit = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) { showToast("Введи сумму"); return; }
    const amt = parseFloat(form.amount);
    const exp = { id: Date.now(), ...form, amount: amt };
    setExpenses(prev => [exp, ...prev]);
    setWallets(w => {
      const next = { ...w };
      if (form.account === "turkish") next.turkish = Math.max(0, w.turkish - amt);
      else next.tinkoff = Math.max(0, w.tinkoff - amt);
      return next;
    });
    showToast("Расход добавлен ✓");
    setForm({ date: today(), amount: "", currency: "TRY", category: "food", account: "turkish", comment: "" });
    onDone();
  };

  const rubPreview = form.amount ? toRub(parseFloat(form.amount) || 0, form.currency) : null;

  return (
    <div style={{ padding: "24px 16px 16px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 24 }}>Добавить расход</h1>

      <Field label="Дата">
        <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />
      </Field>

      <Field label="Счёт">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACCOUNTS.map(a => (
            <button key={a.id} onClick={() => set("account", a.id)}
              style={{ padding: "12px", borderRadius: 12, border: `2px solid ${form.account === a.id ? "#7c6bff" : "transparent"}`, background: form.account === a.id ? "#1e1b3a" : "#252530", color: "#f0ede8", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {a.name}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Валюта">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["TRY", "RUB"].map(c => (
            <button key={c} onClick={() => set("currency", c)}
              style={{ padding: "12px", borderRadius: 12, border: `2px solid ${form.currency === c ? "#7c6bff" : "transparent"}`, background: form.currency === c ? "#1e1b3a" : "#252530", color: "#f0ede8", cursor: "pointer", fontWeight: 700, fontSize: 16 }}>
              {c === "TRY" ? "₺ Лиры" : "₽ Рубли"}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`Сумма ${form.currency === "TRY" ? "(₺)" : "(₽)"}`}>
        <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0"
          style={{ ...inputStyle, fontSize: 28, fontWeight: 800 }} inputMode="decimal" autoFocus />
        {rubPreview !== null && form.currency === "TRY" && (
          <p style={{ color: "#7c6bff", fontSize: 13, marginTop: 4 }}>≈ {fmtRUB(rubPreview)} по курсу {rate} ₽/₺</p>
        )}
      </Field>

      <Field label="Категория">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => set("category", c.id)}
              style={{ padding: "10px 8px", borderRadius: 12, border: `2px solid ${form.category === c.id ? "#7c6bff" : "transparent"}`, background: form.category === c.id ? "#1e1b3a" : "#252530", color: "#f0ede8", cursor: "pointer", fontWeight: 600, fontSize: 12, textAlign: "left" }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Комментарий (необязательно)">
        <input type="text" value={form.comment} onChange={e => set("comment", e.target.value)} placeholder="Что купила?" style={inputStyle} />
      </Field>

      <button onClick={submit} style={{ width: "100%", padding: "18px", borderRadius: 16, background: "#7c6bff", color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer", marginTop: 8 }}>
        Добавить расход
      </button>
    </div>
  );
}

// ─── EXPENSE LIST ──────────────────────────────────────────────────────────────
function ExpenseListTab({ expenses, setExpenses, wallets, setWallets, rate, toRub, showToast }) {
  const [filterCat, setFilterCat] = useState("all");
  const [filterAcc, setFilterAcc] = useState("all");

  const filtered = expenses.filter(e =>
    (filterCat === "all" || e.category === filterCat) &&
    (filterAcc === "all" || e.account === filterAcc)
  );

  const del = (exp) => {
    setExpenses(prev => prev.filter(e => e.id !== exp.id));
    setWallets(w => {
      const next = { ...w };
      if (exp.account === "turkish") next.turkish += exp.amount;
      else next.tinkoff += exp.amount;
      return next;
    });
    showToast("Расход удалён");
  };

  const catName = (id) => CATEGORIES.find(c => c.id === id)?.name || id;
  const catIcon = (id) => CATEGORIES.find(c => c.id === id)?.icon || "🛒";

  return (
    <div style={{ padding: "24px 16px 16px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 16 }}>История расходов</h1>

      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
          {[{ id: "all", name: "Все категории" }, ...CATEGORIES].map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              style={{ whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 20, border: "none", background: filterCat === c.id ? "#7c6bff" : "#252530", color: filterCat === c.id ? "#fff" : "#aaa", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              {c.icon ? `${c.icon} ` : ""}{c.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ id: "all", name: "Все счета" }, ...ACCOUNTS].map(a => (
            <button key={a.id} onClick={() => setFilterAcc(a.id)}
              style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: filterAcc === a.id ? "#7c6bff" : "#252530", color: filterAcc === a.id ? "#fff" : "#aaa", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: "40px 0" }}>Расходов пока нет 🎉</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(e => (
          <div key={e.id} style={{ background: "#18181f", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{catIcon(e.category)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{catName(e.category)}</div>
              <div style={{ color: "#666", fontSize: 12 }}>{e.date} · {ACCOUNTS.find(a => a.id === e.account)?.name}</div>
              {e.comment && <div style={{ color: "#888", fontSize: 12 }}>{e.comment}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                {e.currency === "TRY" ? fmtTRY(e.amount) : fmtRUB(e.amount)}
              </div>
              {e.currency === "TRY" && <div style={{ color: "#666", fontSize: 11 }}>≈ {fmtRUB(toRub(e.amount, e.currency))}</div>}
            </div>
            <button onClick={() => del(e)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff4d6d", fontSize: 18, padding: "4px" }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRANSFER TAB ──────────────────────────────────────────────────────────────
function TransferTab({ transfers, setTransfers, wallets, setWallets, rate, showToast, onDone }) {
  const [form, setForm] = useState({ date: today(), from: "tinkoff", to: "turkish", amtFrom: "", curFrom: "RUB", amtTo: "", curTo: "TRY", comment: "" });
  const [showHistory, setShowHistory] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calcRate = () => {
    const from = parseFloat(form.amtFrom);
    const to = parseFloat(form.amtTo);
    if (!from || !to) return null;
    if (form.curFrom === "RUB" && form.curTo === "TRY") return (from / to).toFixed(3);
    if (form.curFrom === "TRY" && form.curTo === "RUB") return (to / from).toFixed(3);
    return null;
  };

  const submit = () => {
    const f = parseFloat(form.amtFrom), t = parseFloat(form.amtTo);
    if (!f || !t) { showToast("Заполни суммы"); return; }
    const tr = { id: Date.now(), ...form, amtFrom: f, amtTo: t, exchRate: calcRate() };
    setTransfers(prev => [tr, ...prev]);
    setWallets(w => {
      const next = { ...w };
      if (form.from === "turkish") next.turkish = Math.max(0, w.turkish - f);
      else next.tinkoff = Math.max(0, w.tinkoff - f);
      if (form.to === "turkish") next.turkish += t;
      else next.tinkoff += t;
      return next;
    });
    showToast("Перевод записан ✓");
    setForm({ date: today(), from: "tinkoff", to: "turkish", amtFrom: "", curFrom: "RUB", amtTo: "", curTo: "TRY", comment: "" });
    onDone();
  };

  const delTransfer = (tr) => {
    setTransfers(prev => prev.filter(t => t.id !== tr.id));
    setWallets(w => {
      const next = { ...w };
      if (tr.from === "turkish") next.turkish += tr.amtFrom;
      else next.tinkoff += tr.amtFrom;
      if (tr.to === "turkish") next.turkish -= tr.amtTo;
      else next.tinkoff -= tr.amtTo;
      return next;
    });
    showToast("Перевод удалён");
  };

  return (
    <div style={{ padding: "24px 16px 16px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 24 }}>Перевод между счетами</h1>

      <Field label="Дата">
        <input type="date" value={form.date} onChange={e => setF("date", e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Откуда">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACCOUNTS.map(a => (
            <button key={a.id} onClick={() => { setF("from", a.id); setF("curFrom", a.currency); }}
              style={{ padding: "10px", borderRadius: 12, border: `2px solid ${form.from === a.id ? "#ff9f43" : "transparent"}`, background: form.from === a.id ? "#2a1f10" : "#252530", color: "#f0ede8", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {a.name}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Куда">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACCOUNTS.map(a => (
            <button key={a.id} onClick={() => { setF("to", a.id); setF("curTo", a.currency); }}
              style={{ padding: "10px", borderRadius: 12, border: `2px solid ${form.to === a.id ? "#4ade80" : "transparent"}`, background: form.to === a.id ? "#0f2a16" : "#252530", color: "#f0ede8", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {a.name}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label={`Списано (${form.curFrom === "TRY" ? "₺" : "₽"})`}>
          <input type="number" value={form.amtFrom} onChange={e => setF("amtFrom", e.target.value)} placeholder="0"
            style={{ ...inputStyle, fontSize: 22, fontWeight: 800 }} inputMode="decimal" />
        </Field>
        <Field label={`Зачислено (${form.curTo === "TRY" ? "₺" : "₽"})`}>
          <input type="number" value={form.amtTo} onChange={e => setF("amtTo", e.target.value)} placeholder="0"
            style={{ ...inputStyle, fontSize: 22, fontWeight: 800 }} inputMode="decimal" />
        </Field>
      </div>

      {calcRate() && (
        <p style={{ color: "#7c6bff", fontSize: 13, marginBottom: 12 }}>Курс обмена: {calcRate()} ₽/₺</p>
      )}

      <Field label="Комментарий">
        <input type="text" value={form.comment} onChange={e => setF("comment", e.target.value)} placeholder="Необязательно" style={inputStyle} />
      </Field>

      <button onClick={submit} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "#ff9f43", color: "#fff", fontSize: 17, fontWeight: 800, border: "none", cursor: "pointer", marginBottom: 20 }}>
        Записать перевод
      </button>

      <button onClick={() => setShowHistory(!showHistory)}
        style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#252530", color: "#aaa", border: "none", cursor: "pointer", fontWeight: 600 }}>
        {showHistory ? "Скрыть историю" : `История переводов (${transfers.length})`}
      </button>

      {showHistory && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {transfers.length === 0 && <p style={{ color: "#666", textAlign: "center", padding: 20 }}>Переводов нет</p>}
          {transfers.map(t => (
            <div key={t.id} style={{ background: "#18181f", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 20, marginTop: 2 }}>↔️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {ACCOUNTS.find(a => a.id === t.from)?.name} → {ACCOUNTS.find(a => a.id === t.to)?.name}
                </div>
                <div style={{ color: "#888", fontSize: 12 }}>{t.date}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  -{t.curFrom === "TRY" ? fmtTRY(t.amtFrom) : fmtRUB(t.amtFrom)} → +{t.curTo === "TRY" ? fmtTRY(t.amtTo) : fmtRUB(t.amtTo)}
                  {t.exchRate && <span style={{ color: "#666" }}> · {t.exchRate} ₽/₺</span>}
                </div>
                {t.comment && <div style={{ color: "#666", fontSize: 12 }}>{t.comment}</div>}
              </div>
              <button onClick={() => delTransfer(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff4d6d", fontSize: 16 }}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REPORT TAB ───────────────────────────────────────────────────────────────
function ReportTab({ expenses, transfers, wallets, rate, rateDate, toRub, totalSpent, totalLeft, spentByCategory, showToast }) {
  const copyReport = () => {
    const lines = ["Июнь — отчёт по расходам Саши\n"];
    CATEGORIES.forEach(c => {
      const sp = Math.round(spentByCategory[c.id] || 0);
      const left = c.budget - sp;
      lines.push(`${c.name}: бюджет ${c.budget.toLocaleString("ru")} ₽, потрачено ${sp.toLocaleString("ru")} ₽, ${left >= 0 ? "осталось" : "перерасход"} ${Math.abs(left).toLocaleString("ru")} ₽`);
    });
    lines.push(`\nВсего бюджет: 28 000 ₽`);
    lines.push(`Всего потрачено: ${Math.round(totalSpent).toLocaleString("ru")} ₽`);
    lines.push(`Осталось: ${Math.round(totalLeft).toLocaleString("ru")} ₽`);

    const trkRub = expenses.filter(e => e.account === "turkish").reduce((s, e) => s + toRub(e.amount, e.currency), 0);
    const tinkRub = expenses.filter(e => e.account === "tinkoff").reduce((s, e) => s + toRub(e.amount, e.currency), 0);
    const inTry = expenses.filter(e => e.currency === "TRY").reduce((s, e) => s + e.amount, 0);
    const inRub = expenses.filter(e => e.currency === "RUB").reduce((s, e) => s + e.amount, 0);
    const toTrk = transfers.filter(t => t.to === "turkish").reduce((s, t) => s + (t.curTo === "TRY" ? t.amtTo : 0), 0);
    const fromTinkoff = transfers.filter(t => t.from === "tinkoff").reduce((s, t) => s + (t.curFrom === "RUB" ? t.amtFrom : 0), 0);
    const rates = transfers.filter(t => t.exchRate).map(t => parseFloat(t.exchRate));
    const avgRate = rates.length ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(3) : "—";

    lines.push(`\nКошельки и переводы:`);
    lines.push(`Турецкая карта: начальный остаток ${Math.round(wallets.turkishInit).toLocaleString("ru")} ₺, текущий остаток ${Math.round(wallets.turkish).toLocaleString("ru")} ₺`);
    lines.push(`Тинькофф: начальный остаток ${Math.round(wallets.tinkoffInit).toLocaleString("ru")} ₽, текущий остаток ${Math.round(wallets.tinkoff).toLocaleString("ru")} ₽`);
    lines.push(`Переведено на турецкую карту: ${Math.round(fromTinkoff).toLocaleString("ru")} ₽`);
    lines.push(`Получено на турецкую карту: ${Math.round(toTrk).toLocaleString("ru")} ₺`);
    lines.push(`Средний фактический курс переводов: ${avgRate} ₽ за 1 ₺`);
    lines.push(`Курс ЦБ для пересчёта расходов: ${rate} ₽ за 1 ₺`);

    navigator.clipboard.writeText(lines.join("\n")).then(() => showToast("Отчёт скопирован ✓")).catch(() => showToast("Не удалось скопировать"));
  };

  const trkRub = expenses.filter(e => e.account === "turkish").reduce((s, e) => s + toRub(e.amount, e.currency), 0);
  const tinkRub = expenses.filter(e => e.account === "tinkoff").reduce((s, e) => s + toRub(e.amount, e.currency), 0);
  const inTry = expenses.filter(e => e.currency === "TRY").reduce((s, e) => s + e.amount, 0);
  const inRub = expenses.filter(e => e.currency === "RUB").reduce((s, e) => s + e.amount, 0);
  const toTrk = transfers.filter(t => t.to === "turkish").reduce((s, t) => s + (t.curTo === "TRY" ? t.amtTo : 0), 0);
  const fromTinkoff = transfers.filter(t => t.from === "tinkoff").reduce((s, t) => s + (t.curFrom === "RUB" ? t.amtFrom : 0), 0);
  const rates = transfers.filter(t => t.exchRate).map(t => parseFloat(t.exchRate));
  const avgRate = rates.length ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(3) : "—";

  return (
    <div style={{ padding: "24px 16px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, margin: 0 }}>Отчёт за июнь</h1>
        <button onClick={copyReport}
          style={{ padding: "10px 16px", borderRadius: 12, background: "#7c6bff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          📋 Копировать
        </button>
      </div>

      {/* Category table */}
      <div style={{ background: "#18181f", borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 14px", background: "#252530", display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 4 }}>
          {["Категория", "Бюджет", "Трат.", "Ост."].map(h => (
            <span key={h} style={{ color: "#888", fontSize: 11, fontWeight: 700 }}>{h}</span>
          ))}
        </div>
        {CATEGORIES.map((cat, i) => {
          const sp = spentByCategory[cat.id] || 0;
          const left = cat.budget - sp;
          const p = Math.round((sp / cat.budget) * 100);
          return (
            <div key={cat.id} style={{ padding: "10px 14px", borderTop: i > 0 ? "1px solid #252530" : "none", display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{cat.icon} {cat.name}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{(cat.budget / 1000).toFixed(0)}к ₽</span>
              <span style={{ fontSize: 12, color: sp > cat.budget ? "#ff4d6d" : "#f0ede8" }}>{Math.round(sp).toLocaleString("ru")} ₽</span>
              <span style={{ fontSize: 12, color: left < 0 ? "#ff4d6d" : "#4ade80", fontWeight: 700 }}>{left < 0 ? "−" : ""}{Math.abs(Math.round(left)).toLocaleString("ru")}</span>
            </div>
          );
        })}
        <div style={{ padding: "12px 14px", borderTop: "2px solid #7c6bff", display: "grid", gridTemplateColumns: "1fr 80px 80px 60px", gap: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>Итого</span>
          <span style={{ fontWeight: 700, fontSize: 12 }}>28 000 ₽</span>
          <span style={{ fontWeight: 700, fontSize: 12, color: totalSpent > 28000 ? "#ff4d6d" : "#f0ede8" }}>{Math.round(totalSpent).toLocaleString("ru")} ₽</span>
          <span style={{ fontWeight: 800, fontSize: 12, color: totalLeft < 0 ? "#ff4d6d" : "#4ade80" }}>{totalLeft < 0 ? "−" : ""}{Math.abs(Math.round(totalLeft)).toLocaleString("ru")}</span>
        </div>
      </div>

      {/* By account/currency */}
      <div style={{ background: "#18181f", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>По счетам и валютам</h3>
        {[
          ["С турецкой карты", fmtRUB(trkRub)],
          ["С Тинькофф", fmtRUB(tinkRub)],
          ["В лирах", fmtTRY(inTry)],
          ["В рублях", fmtRUB(inRub)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #252530" }}>
            <span style={{ color: "#aaa", fontSize: 14 }}>{k}</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Wallets report */}
      <div style={{ background: "#18181f", borderRadius: 16, padding: "16px", marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800 }}>Кошельки и переводы</h3>
        {[
          ["Нач. остаток Турецкая", fmtTRY(wallets.turkishInit)],
          ["Тек. остаток Турецкая", fmtTRY(wallets.turkish)],
          ["Нач. остаток Тинькофф", fmtRUB(wallets.tinkoffInit)],
          ["Тек. остаток Тинькофф", fmtRUB(wallets.tinkoff)],
          ["Переведено с Тинькофф", fmtRUB(fromTinkoff)],
          ["Получено на Турецкую", fmtTRY(toTrk)],
          ["Средний курс переводов", avgRate === "—" ? "—" : `${avgRate} ₽/₺`],
          ["Курс ЦБ (для расходов)", `${rate} ₽/₺${rateDate ? ` · ${rateDate}` : ""}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #252530" }}>
            <span style={{ color: "#aaa", fontSize: 13 }}>{k}</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #333",
  background: "#0f0f14", color: "#f0ede8", fontSize: 16, boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#888", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {children}
    </div>
  );
}
