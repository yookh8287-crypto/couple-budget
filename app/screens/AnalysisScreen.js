'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getCategoryTotals, filterByMember, formatKRW } from '@/lib/data'

const COLORS = ['#3182f6', '#1b9e75', '#f59e0b', '#f04452', '#8b5cf6', '#06b6d4', '#6b7684']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function AnalysisScreen({ transactions }) {
  const [member, setMember] = useState('all')
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

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

  const filtered = filterByMember(monthFiltered, member)
  const expenses = filtered.filter(t => t.amount < 0)
  const categoryTotals = getCategoryTotals(filtered)
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const unnecessaryItems = expenses.filter(t => t.unnecessary)
  const unnecessaryTotal = unnecessaryItems.reduce((s, t) => s + Math.abs(t.amount), 0)
  const chartData = categoryTotals.map(c => ({ name: c.name, value: c.amount }))

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>소비 분석</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 6px' }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, minWidth: 72, textAlign: 'center' }}>{year}년 {MONTHS[monthIdx]}</span>
            <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 6px' }}>›</button>
          </div>
        </div>
      </div>

      <div className="member-tabs">
        {[['all', '전체'], ['h', '👨 남편'], ['w', '👩 아내']].map(([val, label]) => (
          <button key={val} className={`member-tab ${member === val ? 'active' : ''}`} onClick={() => setMember(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>카테고리별 지출</div>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {year}년 {MONTHS[monthIdx]} 지출 내역이 없어요
          </div>
        ) : (
          <>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => formatKRW(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {categoryTotals.map((cat, i) => {
                const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0
                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatKRW(cat.amount)} · {pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>🚩 불필요한 소비</span>
          <span style={{ fontSize: 11, background: 'var(--red-light)', color: 'var(--red)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
            {unnecessaryItems.length}건 · {formatKRW(unnecessaryTotal)}
          </span>
        </div>
        {unnecessaryItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            표시된 불필요한 소비가 없어요<br />
            <span style={{ fontSize: 12 }}>거래 내역에서 🚩를 눌러 표시할 수 있어요</span>
          </div>
        ) : (
          unnecessaryItems.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{tx.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tx.category}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>-{formatKRW(Math.abs(tx.amount))}</span>
            </div>
          ))
        )}
        {unnecessaryItems.length > 0 && totalExpense > 0 && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--red-light)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
              전체 지출의 {Math.round((unnecessaryTotal / totalExpense) * 100)}%가 불필요한 소비예요
            </span>
          </div>
        )}
      </div>
    </div>
  )
}