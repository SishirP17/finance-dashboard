import { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Category rules ────────────────────────────────────────────────────────
const CATEGORY_RULES = [
  { pattern: /uber|lyft|taxi|transit|metro|bus|train|mta|bart|fare/i, category: "Transport" },
  { pattern: /amazon|walmart|target|costco|shop|store|retail|ebay|etsy/i, category: "Shopping" },
  { pattern: /netflix|spotify|hulu|disney|apple\.com|youtube|prime|subscription/i, category: "Subscriptions" },
  { pattern: /restaurant|cafe|coffee|donut|burger|pizza|sushi|taco|mcdonald|starbucks|chipotle|grubhub|doordash|ubereats|food|dining|kitchen/i, category: "Food & Dining" },
  { pattern: /grocery|safeway|kroger|whole foods|trader joe|aldi|publix|market/i, category: "Groceries" },
  { pattern: /rent|mortgage|landlord|lease|housing/i, category: "Housing" },
  { pattern: /electric|gas|water|utility|utilities|pg&e|con ed|comcast|internet|phone|verizon|at&t|tmobile/i, category: "Utilities" },
  { pattern: /gym|fitness|yoga|crossfit|peloton|sport|health|wellness/i, category: "Health & Fitness" },
  { pattern: /hospital|doctor|pharmacy|cvs|walgreens|medical|dental|vision|insurance/i, category: "Healthcare" },
  { pattern: /salary|paycheck|direct deposit|income|payroll|employer|wage/i, category: "Income" },
  { pattern: /transfer|venmo|paypal|zelle|cashapp|wire|deposit/i, category: "Transfers" },
  { pattern: /atm|cash|withdrawal/i, category: "Cash" },
  { pattern: /hotel|airbnb|vrbo|motel|booking|expedia|flight|airline|travel/i, category: "Travel" },
  { pattern: /education|tuition|school|university|course|udemy|coursera|textbook/i, category: "Education" },
  { pattern: /entertainment|movie|cinema|theater|concert|ticket|game|bar|club/i, category: "Entertainment" },
];

function categorize(description = "") {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) return rule.category;
  }
  return "Other";
}

// ─── CSV parser ────────────────────────────────────────────────────────────
function parseTransactions(raw) {
  const { data, errors } = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (errors.length && !data.length) throw new Error("CSV parse failed");

  return data.map((row, i) => {
    // Flexible column detection
    const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
    const get = (aliases) => {
      for (const a of aliases) {
        const k = Object.keys(row).find((k) => k.toLowerCase().trim() === a);
        if (k && row[k]) return row[k].toString().trim();
      }
      return "";
    };

    const rawAmount = get(["amount", "debit", "credit", "transaction amount", "value"]);
    const rawDate = get(["date", "transaction date", "posted date", "post date"]);
    const desc = get(["description", "memo", "payee", "merchant", "name", "details"]);

    const amount = parseFloat(rawAmount.replace(/[$,\s]/g, "")) || 0;
    const date = rawDate ? new Date(rawDate) : new Date();

    return {
      id: i,
      date: isNaN(date) ? new Date() : date,
      dateStr: rawDate,
      description: desc || "Unknown",
      amount,
      type: amount >= 0 ? "credit" : "debit",
      category: categorize(desc),
    };
  }).filter((t) => t.amount !== 0);
}

// ─── Color palette ─────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Food & Dining": "#e07b54",
  Transport: "#5b8dd9",
  Shopping: "#9b6dd6",
  Subscriptions: "#50b89a",
  Groceries: "#6abf69",
  Housing: "#d4954a",
  Utilities: "#7499b8",
  "Health & Fitness": "#56b0c8",
  Healthcare: "#e06b7a",
  Income: "#3d9e6b",
  Transfers: "#888",
  Cash: "#aaa",
  Travel: "#f2a93b",
  Education: "#a678c8",
  Entertainment: "#e05c8a",
  Other: "#b0b0b0",
};

// ─── Sample CSV for demo ───────────────────────────────────────────────────
const SAMPLE_CSV = `Date,Description,Amount
2024-01-03,Starbucks Coffee,-4.75
2024-01-05,Salary Paycheck,3200.00
2024-01-06,Netflix Subscription,-15.99
2024-01-07,Uber Ride,-12.40
2024-01-09,Whole Foods Market,-87.32
2024-01-10,Amazon Purchase,-45.99
2024-01-12,Electric Bill,-95.00
2024-01-13,Chipotle,-13.50
2024-01-15,Gym Membership,-40.00
2024-01-16,Target Shopping,-62.18
2024-01-18,Spotify Premium,-9.99
2024-01-20,Doctor Copay,-30.00
2024-01-21,Restaurant Dining,-54.00
2024-01-22,Gas Station Fuel,-48.00
2024-01-24,Venmo Transfer,-150.00
2024-01-26,Coffee Shop,-6.50
2024-01-28,Amazon Prime,-14.99
2024-02-01,Salary Paycheck,3200.00
2024-02-02,Rent Payment,-1400.00
2024-02-04,Grocery Store,-102.45
2024-02-06,Uber Eats,-28.75
2024-02-08,Phone Bill,-65.00
2024-02-10,Movie Theater,-22.00
2024-02-12,Starbucks,-5.25
2024-02-14,Valentine Dinner,-89.00
2024-02-16,Walmart Shopping,-76.50
2024-02-18,Transit Card,-33.00
2024-02-20,Hulu Subscription,-17.99
2024-02-22,Pharmacy CVS,-24.50
2024-02-25,Coffee Shop,-4.75
2024-02-28,Amazon Purchase,-33.99
2024-03-01,Salary Paycheck,3200.00
2024-03-03,Rent Payment,-1400.00
2024-03-05,Grocery Store,-95.20
2024-03-07,Chipotle,-11.25
2024-03-09,Netflix,-15.99
2024-03-11,Uber Ride,-9.80
2024-03-13,Electric Bill,-88.00
2024-03-15,Target,-55.40
2024-03-17,Gym,-40.00
2024-03-19,Restaurant,-47.00
2024-03-21,Spotify,-9.99
2024-03-23,Coffee,-5.50
2024-03-25,Amazon,-29.99
2024-03-27,Internet Bill,-60.00
2024-03-29,Gas,-52.00`;

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#333" }) {
  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "18px 22px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>${Math.abs(p.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef();

  const dark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // CSS variables injection
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
      :root {
        --bg: #f5f4f0;
        --surface: #ffffff;
        --card-bg: #ffffff;
        --border: #e5e2dc;
        --text: #1a1814;
        --muted: #7a7670;
        --accent: #2a6e5a;
        --accent-light: #e8f5f0;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #111210;
          --surface: #1a1c1a;
          --card-bg: #1f211f;
          --border: #2d302d;
          --text: #e8ebe5;
          --muted: #8a9088;
          --accent: #4ea88a;
          --accent-light: #1a2d26;
        }
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: var(--bg); color: var(--text); font-family: 'Sora', sans-serif; }
      .tab-btn { background: none; border: 1px solid transparent; border-radius: 8px; padding: 8px 18px; cursor: pointer; font-family: 'Sora', sans-serif; font-size: 13.5px; font-weight: 500; color: var(--muted); transition: all .15s; }
      .tab-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }
      .tab-btn:hover:not(.active) { background: var(--border); color: var(--text); }
      .upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 48px; text-align: center; cursor: pointer; transition: all .2s; background: var(--surface); }
      .upload-zone.drag { border-color: var(--accent); background: var(--accent-light); }
      .upload-zone:hover { border-color: var(--accent); }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const processCSV = useCallback((text, name = "") => {
    setError("");
    try {
      const txns = parseTransactions(text);
      if (!txns.length) throw new Error("No valid transactions found");
      setTransactions(txns);
      setFileName(name || "transactions.csv");
      setActiveTab("overview");
      setAiAdvice("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processCSV(e.target.result, file.name);
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
    else setError("Please drop a .csv file");
  };

  // ── Derived data ──
  const totalIn = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const netFlow = totalIn - totalOut;
  const txCount = transactions.length;

  // Monthly summary
  const monthlyData = (() => {
    const map = {};
    transactions.forEach((t) => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: key, in: 0, out: 0 };
      if (t.amount > 0) map[key].in += t.amount;
      else map[key].out += Math.abs(t.amount);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
      ...m,
      month: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      net: m.in - m.out,
    }));
  })();

  // Category breakdown
  const categoryData = (() => {
    const map = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const c = t.category;
      map[c] = (map[c] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  })();

  // ── Claude API ──
  const getAIAdvice = async () => {
    setAiLoading(true);
    setAiAdvice("");
    const summary = {
      totalIn: totalIn.toFixed(2),
      totalOut: totalOut.toFixed(2),
      netFlow: netFlow.toFixed(2),
      topCategories: categoryData.slice(0, 6).map((c) => `${c.name}: $${c.value.toFixed(2)}`).join(", "),
      monthCount: monthlyData.length,
      txCount,
    };
    const prompt = `You are a friendly, direct personal finance advisor. Analyze this spending summary and give 4-5 actionable, specific suggestions. Be concrete with numbers. Keep it conversational and encouraging.

Financial Summary:
- Total income: $${summary.totalIn}
- Total spending: $${summary.totalOut}
- Net savings: $${summary.netFlow}
- Top spending categories: ${summary.topCategories}
- Analysis period: ${summary.monthCount} month(s), ${txCount} transactions

Give personalized suggestions with specific dollar amounts and percentages where relevant. Format as a short paragraph intro, then 4-5 numbered suggestions, then a brief encouraging closing.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "No response";
      setAiAdvice(text);
    } catch (e) {
      setAiAdvice("Error connecting to Claude API. Make sure you're running this via the Claude.ai interface.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Render ──
  if (!transactions.length) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>
              Finance Dashboard
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.2, marginBottom: 12, fontFamily: "'Sora', sans-serif" }}>
              Understand your<br />money clearly
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
              Upload a CSV of bank transactions to see where your money goes, visualize trends, and get AI-powered financial suggestions.
            </p>
          </div>

          <div
            className={`upload-zone${dragOver ? " drag" : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Drop your CSV here</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>or click to browse · Supports most bank export formats</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginTop: 12, color: "#b91c1c", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              onClick={() => processCSV(SAMPLE_CSV, "sample-transactions.csv")}
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}
            >
              Try with sample data →
            </button>
          </div>

          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { icon: "📊", label: "Spending by category" },
              { icon: "📈", label: "Income vs expenses" },
              { icon: "🤖", label: "AI suggestions" },
            ].map((f) => (
              <div key={f.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "0 0 48px" }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)" }}>Finance Dashboard</span>
          <span style={{ fontSize: 12, color: "var(--muted)", background: "var(--border)", borderRadius: 6, padding: "2px 8px" }}>{fileName}</span>
        </div>
        <button
          onClick={() => { setTransactions([]); setFileName(""); setAiAdvice(""); }}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: "var(--muted)", fontFamily: "inherit" }}
        >
          ← New file
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard label="Total Income" value={`$${totalIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="var(--accent)" sub={`${transactions.filter((t) => t.amount > 0).length} credits`} />
          <StatCard label="Total Spending" value={`$${totalOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color="#c84b3a" sub={`${transactions.filter((t) => t.amount < 0).length} debits`} />
          <StatCard label="Net Savings" value={`${netFlow >= 0 ? "+" : ""}$${Math.abs(netFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })}`} color={netFlow >= 0 ? "var(--accent)" : "#c84b3a"} sub={netFlow >= 0 ? "Positive cash flow 🎉" : "Spending exceeded income"} />
          <StatCard label="Transactions" value={txCount} color="var(--text)" sub={`${monthlyData.length} month(s) of data`} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {["overview", "categories", "transactions", "ai-advice"].map((t) => (
            <button key={t} className={`tab-btn${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
              {t === "ai-advice" ? "🤖 AI Advice" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Money In vs Out by Month</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d9e6b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3d9e6b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c84b3a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c84b3a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="in" name="Income" stroke="#3d9e6b" fill="url(#inGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="out" name="Spending" stroke="#c84b3a" fill="url(#outGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
              <div style={{ fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Net Cash Flow by Month</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="net" name="Net Flow" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.net >= 0 ? "#3d9e6b" : "#c84b3a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Categories Tab ── */}
        {activeTab === "categories" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Spending by Category</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} dataKey="value">
                    {categoryData.map((c, i) => (
                      <Cell key={i} fill={CAT_COLORS[c.name] || "#888"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: "1 1 300px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {categoryData.map((c) => {
                  const pct = ((c.value / totalOut) * 100).toFixed(1);
                  return (
                    <div key={c.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[c.name] || "#888", display: "inline-block" }} />
                          {c.name}
                        </span>
                        <span style={{ color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>
                          ${c.value.toFixed(2)} <span style={{ opacity: 0.6 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 5, background: "var(--border)", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: CAT_COLORS[c.name] || "#888", borderRadius: 3, transition: "width .4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Transactions Tab ── */}
        {activeTab === "transactions" && (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {["Date", "Description", "Category", "Amount"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Amount" ? "right" : "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...transactions].sort((a, b) => b.date - a.date).map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--bg)" }}>
                      <td style={{ padding: "11px 16px", color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {t.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "11px 16px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ background: `${CAT_COLORS[t.category] || "#888"}22`, color: CAT_COLORS[t.category] || "#888", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontWeight: 600, color: t.amount >= 0 ? "#3d9e6b" : "#c84b3a", whiteSpace: "nowrap" }}>
                        {t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI Advice Tab ── */}
        {activeTab === "ai-advice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>AI Financial Advisor</div>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                Claude will analyze your spending patterns and provide personalized suggestions based on your {txCount} transactions across {monthlyData.length} month(s).
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Savings rate", value: totalIn > 0 ? `${((netFlow / totalIn) * 100).toFixed(1)}%` : "N/A", good: netFlow > 0 },
                  { label: "Top expense", value: categoryData[0]?.name || "—", sub: categoryData[0] ? `$${categoryData[0].value.toFixed(0)}` : "" },
                  { label: "Avg monthly spend", value: monthlyData.length ? `$${(totalOut / monthlyData.length).toFixed(0)}` : "—" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--bg)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: s.good === false ? "#c84b3a" : s.good ? "var(--accent)" : "var(--text)" }}>{s.value}</div>
                    {s.sub && <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              <button
                onClick={getAIAdvice}
                disabled={aiLoading}
                style={{ background: aiLoading ? "var(--border)" : "var(--accent)", color: aiLoading ? "var(--muted)" : "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, transition: "all .15s", display: "flex", alignItems: "center", gap: 8 }}
              >
                {aiLoading ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Analyzing your finances…
                  </>
                ) : (
                  "✨ Get AI Financial Suggestions"
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>

            {aiAdvice && (
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Claude's Suggestions</span>
                </div>
                <div style={{ color: "var(--text)", lineHeight: 1.75, fontSize: 14, whiteSpace: "pre-wrap" }}>
                  {aiAdvice}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
