'use client'

import { useState, useEffect } from 'react'
import { getCategoryTotals, formatKRW, getBudgets } from '@/lib/data'
import { AlertTriangle } from 'lucide-react'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function BudgetScreen({ transactions, coupleId }) {
  const [budgets, setBudgets] = useState([])
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (coupleId) getBudgets(coupleId).then(setBudgets)
  }, [coupleId])

  function changeMonth(d) {
    let m = monthIdx + d
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonthIdx(m)
    setYear(y)
  }

  const monthFiltered = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx
  })

  const expenses = monthFiltered.filter(t => t.amount < 0)
  const income = monthFiltered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const unnecessaryTotal = expenses.filter(t => t.unnecessary).reduce((s, t) => s + Math.abs(t.amount), 0)
  const categoryTotals = getCategoryTotals(monthFiltered)

  const expensePct = income > 0 ? Math.round((totalExpense / income) * 100) : 0
  const savingPct = Math.max(0, 100 - expensePct)
  const wastePct = income > 0 ? Math.round((unnecessaryTotal / income) * 100) : 0

  const overBudget = budgets.filter(b => {
    const spent = categoryTotals.find(c => c.name === b.category)?.amount || 0
    return spent > b.budget
  })

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>예산 관리</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 6px' }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 72, textAlign: 'center' }}>{year}년 {MONTHS[monthIdx]}</span>
            <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 6px' }}>›</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>소득 대비 지출 비율</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div className="stat-box" style={{ textAlign: 'center' }}>
            <div className="stat-label">지출 비율</div>
            <div className="stat-value color-red">{expensePct}%</div>
          </div>
          <div className="stat-box" style={{ textAlign: 'center' }}>
            <div className="stat-label">저축 가능</div>
            <div className="stat-value color-income">{savingPct}%</div>
          </div>
          <div className="stat-box" style={{ textAlign: 'center' }}>
            <div className="stat-label">불필요 소비</div>
            <div className="stat-value color-blue">{wastePct}%</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>수입 {formatKRW(income)} 대비</span>
          <span>지출 {formatKRW(totalExpense)}</span>
        </div>
        <div className="progress-bar" style={{ height: 10, borderRadius: 5 }}>
          <div className="progress-fill fill-red" style={{ width: `${Math.min(expensePct, 100)}%`, height: 10, borderRadius: 5 }} />
        </div>
      </div>

      {overBudget.map(b => (
        <div key={b.category} className="alert-box alert-danger" style={{ marginTop: 10 }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{b.icon} {b.category} 예산이 초과됐어요!</span>
        </div>
      ))}

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>카테고리별 예산 현황</div>
        {budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            예산 데이터를 불러오는 중...
          </div>
        ) : (
          budgets.map(b => {
            const spent = categoryTotals.find(c => c.name === b.category)?.amount || 0
            const pct = Math.min(Math.round((spent / b.budget) * 100), 100)
            const isOver = spent > b.budget
            const fillClass = isOver ? 'fill-red' : pct >= 80 ? 'fill-amber' : 'fill-green'
            return (
              <div key={b.id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{b.icon} {b.category}</span>
                  <span style={{ color: isOver ? 'var(--red)' : 'var(--text-secondary)', fontWeight: isOver ? 700 : 400 }}>
                    {formatKRW(spent)} / {formatKRW(b.budget)}
                    {isOver && <span style={{ marginLeft: 4, fontSize: 11, background: 'var(--red-light)', color: 'var(--red)', padding: '1px 5px', borderRadius: 4 }}>초과</span>}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}