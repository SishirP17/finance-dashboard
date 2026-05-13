# 💰 Finance Dashboard

A personal finance dashboard that parses bank transaction CSVs, categorizes spending, visualizes money in vs out over time, and uses the Claude API to generate personalized financial suggestions.

Built with Vite + React + Recharts. Deployed via Vercel.

---

## Features

- **CSV upload** — drag and drop or click to browse, works with most bank export formats
- **Auto-categorization** — 15 spending categories detected automatically (Food, Transport, Subscriptions, Housing, and more)
- **Overview charts** — area chart for income vs spending over time, bar chart for net monthly cash flow
- **Category breakdown** — donut chart and ranked bar list with percentages
- **Transaction table** — full sortable list with color-coded amounts and category badges
- **AI advice** — Claude analyzes your spending patterns and gives personalized, numbered suggestions
- **Sample data** — try the app instantly without uploading anything

---

## Project Structure

```
finance-dashboard/
├── api/
│   └── chat.js          # Vercel serverless proxy for Anthropic API
├── src/
│   ├── main.jsx         # React entry point
│   └── App.jsx          # Full application
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## CSV Format

The parser accepts flexible column names. Headers are case-insensitive.

| Column | Accepted names |
|--------|---------------|
| Date | `date`, `transaction date`, `posted date`, `post date` |
| Description | `description`, `memo`, `payee`, `merchant`, `name`, `details` |
| Amount | `amount`, `debit`, `credit`, `transaction amount`, `value` |

**Minimum valid example:**
```csv
Date,Description,Amount
2024-01-05,Salary Paycheck,3200.00
2024-01-06,Netflix,-15.99
2024-01-07,Uber Ride,-12.40
```

Negative amounts are treated as spending, positive as income. Dollar signs and commas in amounts are stripped automatically.

**Works out of the box with:** Chase, Bank of America, Wells Fargo. May need adjustment for banks that use separate Debit/Credit columns (Citi, Capital One, most UK banks).

---

## Spending Categories

Transactions are categorized by matching the description against keyword patterns:

| Category | Example keywords |
|----------|-----------------|
| Food & Dining | starbucks, chipotle, doordash, restaurant |
| Transport | uber, lyft, transit, bart, fare |
| Shopping | amazon, walmart, target, etsy |
| Subscriptions | netflix, spotify, hulu, apple.com |
| Groceries | whole foods, kroger, safeway, trader joe |
| Housing | rent, mortgage, landlord |
| Utilities | electric, gas, comcast, verizon |
| Health & Fitness | gym, yoga, peloton, fitness |
| Healthcare | hospital, pharmacy, cvs, walgreens |
| Travel | hotel, airbnb, flight, expedia |
| Entertainment | movie, concert, bar, theater |
| Income | salary, paycheck, direct deposit |
| Transfers | venmo, paypal, zelle, cashapp |
| Education | tuition, udemy, coursera |
| Cash | atm, withdrawal |

Unmatched transactions are labeled **Other**.

---

## Deploying to Vercel

### 1. Push to GitHub

Create a new repo on GitHub and add all files matching the project structure above.

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** and import your repo
3. Vercel auto-detects Vite — no build config needed
4. Click **Deploy**

### 3. Add the API key

In Vercel → your project → **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

Make sure it's enabled for **Production**. Then go to **Deployments** and redeploy.

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### 4. Verify the proxy is working

Visit `https://your-app.vercel.app/api/chat` in your browser. You should see:

```json
{"error": "Method Not Allowed"}
```

That means the route exists and is working. If you see a 404, check that `api/chat.js` is at the repo root (not inside `src/`), and that it appears in the Vercel dashboard under the **Functions** tab.

---

## Running Locally

```bash
npm create vite@latest finance-dashboard -- --template react
cd finance-dashboard
npm install papaparse recharts
# replace src/App.jsx with App.jsx from this repo
npm run dev
```

For local AI suggestions, create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

And update the fetch URL in `App.jsx` from `/api/chat` to a local proxy, or use the Anthropic SDK directly in a local Express server.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [React 18](https://react.dev) | UI framework |
| [Recharts](https://recharts.org) | Charts and data visualization |
| [PapaParse](https://www.papaparse.com) | CSV parsing |
| [Claude API](https://console.anthropic.com) | AI financial suggestions |
| [Vercel](https://vercel.com) | Hosting and serverless functions |

---

## Known Limitations

- No file size limit enforced (recommend staying under 5MB / ~50k rows)
- Split debit/credit columns (common in Citi, Capital One, UK banks) only reads one side
- Date parsing depends on browser locale — `DD/MM/YYYY` format may be misread
- No duplicate detection — uploading the same CSV twice will double-count transactions
- The `/api/chat` proxy has no rate limiting — don't share the URL publicly if you want to protect your API credits
