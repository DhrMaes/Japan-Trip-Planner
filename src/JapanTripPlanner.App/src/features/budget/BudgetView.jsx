import { useEffect, useState } from 'react'
import { Plus, ReceiptText, Trash2, WalletCards } from 'lucide-react'
import { STORAGE_KEYS, useLocalStorage } from '../../hooks/useLocalStorage.js'

const categories = [
  { id: 'food', label: 'Food', color: '#c94b40' },
  { id: 'transport', label: 'Transport', color: '#3e7080' },
  { id: 'lodging', label: 'Lodging', color: '#375e4a' },
  { id: 'activities', label: 'Activities', color: '#d0923d' },
  { id: 'shopping', label: 'Shopping', color: '#80648b' },
  { id: 'misc', label: 'Misc', color: '#747872' },
]

const initialBudget = {
  currency: 'JPY',
  overallBudget: { amount: 0, currency: 'JPY' },
  categoryBudgets: {},
  expenses: [],
  exchangeRate: 0.0058,
}

function money(amount, currency = 'JPY') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(amount || 0)
}

export default function BudgetView() {
  const [budget, setBudget] = useLocalStorage(STORAGE_KEYS.budget, initialBudget)
  const [form, setForm] = useState({ amount: '', currency: 'JPY', category: 'food', date: new Date().toISOString().slice(0, 10), note: '' })
  const [converterYen, setConverterYen] = useState('10000')
  const [displayCurrency, setDisplayCurrency] = useState(budget.currency === 'EUR' ? 'EUR' : 'JPY')
  const exchangeRate = budget.exchangeRate || 0.0058
  const [rateStatus, setRateStatus] = useState('Saved rate')

  useEffect(() => {
    let active = true
    fetch('https://api.frankfurter.app/latest?from=JPY&to=EUR')
      .then((response) => {
        if (!response.ok) throw new Error('Rate request failed')
        return response.json()
      })
      .then((data) => {
        const onlineRate = Number(data.rates?.EUR)
        if (!onlineRate) throw new Error('Rate missing')
        if (active) {
          setBudget((current) => ({ ...current, exchangeRate: onlineRate, exchangeRateUpdatedAt: new Date().toISOString() }))
          setRateStatus('Live rate')
        }
      })
      .catch(() => {
        if (active) setRateStatus('Offline rate')
      })
    return () => { active = false }
  }, [setBudget])
  const toYen = (amount, currency) => currency === 'EUR' ? amount / exchangeRate : amount
  const fromYen = (amount) => displayCurrency === 'EUR' ? amount * exchangeRate : amount
  const overallBudgetYen = toYen(budget.overallBudget.amount, budget.overallBudget.currency || budget.currency)
  const totalSpentYen = budget.expenses.reduce((sum, expense) => sum + toYen(expense.money.amount, expense.money.currency), 0)
  const totalSpent = fromYen(totalSpentYen)
  const remaining = fromYen(overallBudgetYen - totalSpentYen)
  const totalsByCategory = Object.fromEntries(categories.map((category) => [category.id, fromYen(budget.expenses.filter((expense) => expense.category === category.id).reduce((sum, expense) => sum + toYen(expense.money.amount, expense.money.currency), 0))]))
  const maxCategorySpend = Math.max(...Object.values(totalsByCategory), 1)

  function setOverallBudget(value) {
    setBudget((current) => ({ ...current, overallBudget: { amount: Math.max(0, Number(value) || 0), currency: 'EUR' } }))
  }

  function setCategoryBudget(category, value) {
    setBudget((current) => ({
      ...current,
      categoryBudgets: { ...current.categoryBudgets, [category]: { amount: Math.max(0, Number(value) || 0), currency: current.currency } },
    }))
  }

  function addExpense(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    const expense = { id: crypto.randomUUID(), money: { amount, currency: form.currency }, category: form.category, date: form.date, note: form.note.trim() }
    setBudget((current) => ({ ...current, expenses: [expense, ...current.expenses] }))
    setForm((current) => ({ ...current, amount: '', note: '' }))
  }

  return (
    <div className="feature-view">
      <div className="view-heading">
        <div><p className="eyebrow">Keep tabs on yen</p><h1>Budget</h1><p>{budget.expenses.length} expenses logged</p></div>
        <label className="overall-budget-field"><span>Trip budget (EUR)</span><input type="number" min="0" step="0.01" value={budget.overallBudget.amount || ''} placeholder="Set total" onChange={(event) => setOverallBudget(event.target.value)} /></label>
      </div>

      <section className="budget-summary" aria-label="Budget summary">
        <div><span>Total budget</span><strong>{money(fromYen(overallBudgetYen), displayCurrency)}</strong></div>
        <div><span>Spent so far</span><strong>{money(totalSpent, displayCurrency)}</strong></div>
        <div className={remaining < 0 ? 'negative' : ''}><span>{remaining < 0 ? 'Over budget' : 'Remaining'}</span><strong>{money(Math.abs(remaining), displayCurrency)}</strong></div>
        <div className="budget-progress"><span style={{ width: `${overallBudgetYen ? Math.min((totalSpentYen / overallBudgetYen) * 100, 100) : 0}%` }} /></div>
      </section>

      <div className="budget-layout">
        <div className="budget-main">
          <section className="converter-band">
            <div className="display-currency-control">
              <div><p className="eyebrow">Total display</p><h2>Budget currency</h2></div>
              <label className="currency-slider"><span><b>¥</b><input type="range" min="0" max="1" step="1" value={displayCurrency === 'EUR' ? 1 : 0} aria-label="Total display currency" onChange={(event) => setDisplayCurrency(event.target.value === '1' ? 'EUR' : 'JPY')} /><b>€</b></span><small>Totals shown in {displayCurrency}</small></label>
            </div>
            <div className="converter-label"><p className="eyebrow">Quick conversion</p><h2>Yen to euro</h2></div>
            <label><span>Japanese yen</span><div className="currency-input"><b>¥</b><input type="number" min="0" value={converterYen} onChange={(event) => setConverterYen(event.target.value)} /></div></label>
            <span className="equals">=</span>
            <div className="euro-result">{money((Number(converterYen) || 0) * exchangeRate, 'EUR')}</div>
            <div className="exchange-rate-note"><span>1 JPY in EUR</span><strong>{exchangeRate.toFixed(6)}</strong><small>{rateStatus}</small></div>
          </section>
          <aside className="expense-form-panel">
            <div className="form-icon"><WalletCards size={21} /></div>
            <p className="eyebrow">New transaction</p>
            <h2>Log expense</h2>
            <form onSubmit={addExpense}>
              <label><span>Amount ({form.currency})</span><input type="number" min={form.currency === 'JPY' ? '1' : '0.01'} step={form.currency === 'JPY' ? '1' : '0.01'} required value={form.amount} placeholder="0" onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
              <label><span>Currency</span><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}><option value="JPY">Japanese yen (¥)</option><option value="EUR">Euro (€)</option></select></label>
              <label><span>Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}</select></label>
              <label><span>Date</span><input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <label><span>Note</span><input value={form.note} placeholder="Ramen in Shinjuku" onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
              <button className="primary-button" type="submit"><Plus size={17} /> Add expense</button>
            </form>
          </aside>
          <section className="panel-section">
            <div className="section-heading"><div><p className="eyebrow">Breakdown</p><h2>Spend by category</h2></div><span>{money(totalSpent, displayCurrency)} total</span></div>
            <div className="category-chart">
              {categories.map((category) => {
                const spent = totalsByCategory[category.id]
                const limit = budget.categoryBudgets[category.id]?.amount || 0
                const limitYen = toYen(limit, budget.categoryBudgets[category.id]?.currency || budget.currency)
                const spentYen = budget.expenses.filter((expense) => expense.category === category.id).reduce((sum, expense) => sum + toYen(expense.money.amount, expense.money.currency), 0)
                return (
                  <div className="category-row" key={category.id}>
                    <div className="category-label"><span className="color-dot" style={{ background: category.color }} />{category.label}</div>
                    <div className="bar-track"><span style={{ width: `${(spent / maxCategorySpend) * 100}%`, background: category.color }} /></div>
                    <strong>{money(spent, displayCurrency)}</strong>
                    <label><span>Limit</span><input type="number" min="0" step="1" value={limit || ''} placeholder="Optional" aria-label={`${category.label} budget`} onChange={(event) => setCategoryBudget(category.id, event.target.value)} /></label>
                    {limit > 0 && <small className={spentYen > limitYen ? 'negative-text' : ''}>{Math.round((spentYen / limitYen) * 100)}% used</small>}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="panel-section">
            <div className="section-heading"><div><p className="eyebrow">History</p><h2>Expenses</h2></div></div>
            <div className="expense-list">
              {!budget.expenses.length && <div className="empty-inline"><ReceiptText size={18} /> No expenses logged yet.</div>}
              {budget.expenses.map((expense) => {
                const category = categories.find((item) => item.id === expense.category)
                return (
                  <div className="expense-row" key={expense.id}>
                    <span className="expense-category" style={{ background: category?.color }}><ReceiptText size={16} /></span>
                    <div><strong>{expense.note || category?.label || 'Expense'}</strong><span>{category?.label} · {expense.date || 'No date'}</span></div>
                    <b>{money(expense.money.amount, expense.money.currency)}</b>
                    <button className="icon-button danger" title="Delete expense" onClick={() => setBudget((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== expense.id) }))}><Trash2 size={16} /></button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}