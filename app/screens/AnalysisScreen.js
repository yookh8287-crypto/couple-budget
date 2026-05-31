'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { getCategoryTotals, filterByMember, formatKRW } from '@/lib/data'

const COLORS = ['#3182f6', '#1b9e75', '#f59e0b', '#f04452', '#8b5cf6', '#06b6d4', '#6b7684', '#ff6b00']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function AnalysisScreen({ transactions }) {
  const [member, setMember] = useState('all')
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState('category')

  function changeMonth(d) {
    let m = monthIdx + d, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonthIdx(m); setYear(y)
  }

  const monthFiltered = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx && !t.excluded
  })
  const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1
  const prevYear = monthIdx === 0 ? year - 1 : year
  const prevMonthFiltered = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === prevYear && d.getMonth() === prevMonthIdx && !t.excluded
  })

  const filtered = filterByMember(monthFiltered, member)
  const prevFiltered = filterByMember(prevMonthFiltered, member)
  const expenses = filtered.filter(t => t.amount < 0)
  const prevExpenses = prevFiltered.filter(t => t.amount < 0)
  const categoryTotals = getCategoryTotals(filtered)
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const prevTotalExpense = prevExpenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const diffExpense = totalExpense - prevTotalExpense

  // 불필요한 소비
  const unnecessaryItems = expenses.filter(t => t.unnecessary)
  const unnecessaryTotal = unnecessaryItems.reduce((s, t) => s + Math.abs(t.amount), 0)
  const prevUnnecessaryItems = prevExpenses.filter(t => t.unnecessary)
  const prevUnnecessaryTotal = prevUnnecessaryItems.reduce((s, t) => s + Math.abs(t.amount), 0)
  const diffUnnecessary = unnecessaryTotal - prevUnnecessaryTotal

  // 사용자별
  const husbandExpense = monthFiltered.filter(t => t.amount < 0 && (t.who === 'h' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
  const wifeExpense = monthFiltered.filter(t => t.amount < 0 && (t.who === 'w' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalUserExpense = husbandExpense + wifeExpense
  const husbandUnnecessary = monthFiltered.filter(t => t.amount < 0 && t.unnecessary && (t.who === 'h' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
  const wifeUnnecessary = monthFiltered.filter(t => t.amount < 0 && t.unnecessary && (t.who === 'w' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)

  // 전월 비교
  const prevCategoryTotals = getCategoryTotals(prevFiltered)
  const compareCategories = [...new Set([...categoryTotals.map(c => c.name), ...prevCategoryTotals.map(c => c.name)])].slice(0, 6)
  const compareData = compareCategories.map(name => ({
    name,
    이번달: categoryTotals.find(c => c.name === name)?.amount || 0,
    저번달: prevCategoryTotals.find(c => c.name === name)?.amount || 0,
  }))

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
          <button key={val} className={`member-tab ${member === val ? 'active' : ''}`} onClick={() => setMember(val)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0' }}>
        {[['category', '카테고리별'], ['user', '사용자별'], ['compare', '전월 비교']].map(([val, label]) => (
          <button key={val} onClick={() => setViewMode(val)} style={{
            flex: 1, padding: '7px 0', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: viewMode === val ? 'var(--blue)' : 'var(--bg-primary)',
            color: viewMode === val ? 'white' : 'var(--text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      {/* 카테고리별 */}
      {viewMode === 'category' && (
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>카테고리별 지출</div>
          {categoryTotals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-secondary)' }}>지출 내역이 없어요</div>
          ) : (
            <>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals.map(c => ({ name: c.name, value: c.amount }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                      {categoryTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
      )}

      {/* 사용자별 */}
      {viewMode === 'user' && (
        <>
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>사용자별 지출</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: '남편', value: husbandExpense }, { name: '아내', value: wifeExpense }]} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    <Cell fill="#3182f6" /><Cell fill="#f06292" />
                  </Pie>
                  <Tooltip formatter={(val) => formatKRW(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {[['👨 남편', husbandExpense, '#3182f6'], ['👩 아내', wifeExpense, '#f06292']].map(([label, val, color]) => {
              const pct = totalUserExpense > 0 ? Math.round(val / totalUserExpense * 100) : 0
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontWeight: 600 }}>{label}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{formatKRW(val)} · {pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: color }} /></div>
                </div>
              )
            })}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚩 사용자별 불필요한 소비</div>
            {[['👨 남편', husbandUnnecessary, '#3182f6'], ['👩 아내', wifeUnnecessary, '#f06292']].map(([label, val, color]) => {
              const total = husbandUnnecessary + wifeUnnecessary
              const pct = total > 0 ? Math.round(val / total * 100) : 0
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span style={{ color: 'var(--red)' }}>{formatKRW(val)} · {pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill fill-red" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 전월 비교 */}
      {viewMode === 'compare' && (
        <>
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>전월 대비 지출</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="stat-box"><div className="stat-label">{MONTHS[prevMonthIdx]}</div><div className="stat-value">{formatKRW(prevTotalExpense)}</div></div>
              <div className="stat-box"><div className="stat-label">{MONTHS[monthIdx]}</div><div className="stat-value">{formatKRW(totalExpense)}</div></div>
            </div>
            <div style={{ padding: '10px 14px', background: diffExpense > 0 ? 'var(--red-light)' : 'var(--green-light)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: diffExpense > 0 ? 'var(--red)' : 'var(--green)' }}>
                {diffExpense > 0 ? '▲' : '▼'} 전월 대비 {formatKRW(Math.abs(diffExpense))} {diffExpense > 0 ? '더 썼어요' : '절약했어요'}
              </span>
            </div>
            {compareData.length > 0 && (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={v => `${Math.round(v/10000)}만`} />
                    <Tooltip formatter={(val) => formatKRW(val)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="저번달" fill="var(--text-tertiary)" radius={[4,4,0,0]} />
                    <Bar dataKey="이번달" fill="var(--blue)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚩 불필요한 소비 비교</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div className="stat-box"><div className="stat-label">{MONTHS[prevMonthIdx]} 불필요</div><div className="stat-value color-red">{formatKRW(prevUnnecessaryTotal)}</div></div>
              <div className="stat-box"><div className="stat-label">{MONTHS[monthIdx]} 불필요</div><div className="stat-value color-red">{formatKRW(unnecessaryTotal)}</div></div>
            </div>
            <div style={{ padding: '10px 14px', background: diffUnnecessary > 0 ? 'var(--red-light)' : 'var(--green-light)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: diffUnnecessary > 0 ? 'var(--red)' : 'var(--green)' }}>
                {diffUnnecessary > 0 ? '▲' : '▼'} 전월 대비 불필요 소비 {formatKRW(Math.abs(diffUnnecessary))} {diffUnnecessary > 0 ? '증가' : '감소'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* 불필요한 소비 목록 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>🚩 불필요한 소비</span>
          <span style={{ fontSize: 11, background: 'var(--red-light)', color: 'var(--red)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
            {unnecessaryItems.length}건 · {formatKRW(unnecessaryTotal)}
          </span>
        </div>
        {unnecessaryItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>표시된 불필요한 소비가 없어요</div>
        ) : (
          unnecessaryItems.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{tx.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tx.category}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>-{formatKRW(Math.abs(tx.amount))}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}