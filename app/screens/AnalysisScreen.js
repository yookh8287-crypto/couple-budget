'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { getCategoryTotals, filterByMember, formatKRW } from '@/lib/data'
import { SlidersHorizontal, X, Check } from 'lucide-react'

const COLORS = ['#3182f6', '#1b9e75', '#f59e0b', '#f04452', '#8b5cf6', '#06b6d4', '#6b7684', '#ff6b00']
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const PAYMENT_METHODS = ['전체', '현대카드', '삼성카드', '신한카드', '국민카드', '토스뱅크', '카카오페이', '현금', '기타']

function MonthSelector({ year, monthIdx, onChange, label }) {
  function change(d) {
    let m = monthIdx + d, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    onChange(y, m)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label && <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button onClick={() => change(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 5px', lineHeight: 1 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 68, textAlign: 'center', color: 'var(--text-primary)' }}>{year}년 {MONTHS[monthIdx]}</span>
        <button onClick={() => change(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 5px', lineHeight: 1 }}>›</button>
      </div>
    </div>
  )
}

export default function AnalysisScreen({ transactions }) {
  const now = new Date()

  // 탭: 'overview' | 'compare'
  const [tab, setTab] = useState('overview')

  // 전체 탭 월
  const [year, setYear] = useState(now.getFullYear())
  const [monthIdx, setMonthIdx] = useState(now.getMonth())

  // 비교 탭 - A월, B월
  const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const [aYear, setAYear] = useState(prevY)
  const [aMonth, setAMonth] = useState(prevM)
  const [bYear, setBYear] = useState(now.getFullYear())
  const [bMonth, setBMonth] = useState(now.getMonth())

  // 필터
  const [showFilter, setShowFilter] = useState(false)
  const [filterWho, setFilterWho] = useState('all') // all | h | w
  const [filterPayment, setFilterPayment] = useState('전체')

  // 필터 임시 상태 (패널 열려있는 동안)
  const [tempWho, setTempWho] = useState('all')
  const [tempPayment, setTempPayment] = useState('전체')

  function openFilter() {
    setTempWho(filterWho)
    setTempPayment(filterPayment)
    setShowFilter(true)
  }
  function applyFilter() {
    setFilterWho(tempWho)
    setFilterPayment(tempPayment)
    setShowFilter(false)
  }

  // 필터 적용 함수
  function applyFilters(txList) {
    let result = txList
    if (filterWho !== 'all') result = result.filter(t => t.who === filterWho || t.who === 'both')
    if (filterPayment !== '전체') result = result.filter(t => (t.payment_method || '') === filterPayment)
    return result
  }

  // 월 필터링
  function filterMonth(y, m) {
    return transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === y && d.getMonth() === m && !t.excluded
    })
  }

  const monthTx = useMemo(() => applyFilters(filterMonth(year, monthIdx)), [transactions, year, monthIdx, filterWho, filterPayment])
  const aTx = useMemo(() => applyFilters(filterMonth(aYear, aMonth)), [transactions, aYear, aMonth, filterWho, filterPayment])
  const bTx = useMemo(() => applyFilters(filterMonth(bYear, bMonth)), [transactions, bYear, bMonth, filterWho, filterPayment])

  // 전체 탭 데이터
  const expenses = monthTx.filter(t => t.amount < 0)
  const incomes = monthTx.filter(t => t.amount > 0)
  const totalExpense = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
  const categoryTotals = getCategoryTotals(monthTx)
  const unnecessaryItems = expenses.filter(t => t.unnecessary)
  const unnecessaryTotal = unnecessaryItems.reduce((s, t) => s + Math.abs(t.amount), 0)
  const husbandExp = monthTx.filter(t => t.amount < 0 && (t.who === 'h' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
  const wifeExp = monthTx.filter(t => t.amount < 0 && (t.who === 'w' || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)

  // 비교 탭 데이터
  const aExpenses = aTx.filter(t => t.amount < 0)
  const bExpenses = bTx.filter(t => t.amount < 0)
  const aTotalExp = aExpenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const bTotalExp = bExpenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const diff = bTotalExp - aTotalExp
  const aCatTotals = getCategoryTotals(aTx)
  const bCatTotals = getCategoryTotals(bTx)
  const aUnnecessary = aExpenses.filter(t => t.unnecessary).reduce((s, t) => s + Math.abs(t.amount), 0)
  const bUnnecessary = bExpenses.filter(t => t.unnecessary).reduce((s, t) => s + Math.abs(t.amount), 0)

  const compareData = [...new Set([...aCatTotals.map(c => c.name), ...bCatTotals.map(c => c.name)])]
    .slice(0, 7)
    .map(name => ({
      name,
      [MONTHS[aMonth]]: aCatTotals.find(c => c.name === name)?.amount || 0,
      [MONTHS[bMonth]]: bCatTotals.find(c => c.name === name)?.amount || 0,
    }))

  // 활성 필터 개수
  const activeFilterCount = (filterWho !== 'all' ? 1 : 0) + (filterPayment !== '전체' ? 1 : 0)

  const aLabel = `${aYear}년 ${MONTHS[aMonth]}`
  const bLabel = `${bYear}년 ${MONTHS[bMonth]}`

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* 상단바 */}
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>소비 분석</span>
          <button onClick={openFilter} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${activeFilterCount > 0 ? 'var(--blue)' : 'var(--border)'}`,
            background: activeFilterCount > 0 ? 'var(--blue-light)' : 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            color: activeFilterCount > 0 ? 'var(--blue)' : 'var(--text-secondary)',
          }}>
            <SlidersHorizontal size={14} />
            필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 0, margin: '12px 16px 0', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
        {[['overview', '전체'], ['compare', '월별 비교']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            flex: 1, padding: '9px 0', borderRadius: 6,
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === val ? 'var(--bg-primary)' : 'transparent',
            color: tab === val ? 'var(--blue)' : 'var(--text-secondary)',
            boxShadow: tab === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── 전체 탭 ── */}
      {tab === 'overview' && (
        <>
          {/* 월 선택 */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px 0' }}>
            <MonthSelector year={year} monthIdx={monthIdx} onChange={(y, m) => { setYear(y); setMonthIdx(m) }} />
          </div>

          {/* 요약 카드 */}
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '수입', value: totalIncome, color: 'var(--green)' },
                { label: '지출', value: totalExpense, color: 'var(--red)' },
                { label: '🚩 불필요', value: unnecessaryTotal, color: 'var(--red)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color }}>{formatKRW(value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 카테고리별 */}
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>카테고리별 지출</div>
            {categoryTotals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-secondary)' }}>지출 내역이 없어요</div>
            ) : (
              <>
                <div style={{ height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryTotals.map(c => ({ name: c.name, value: c.amount }))} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={2}>
                        {categoryTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={val => formatKRW(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {categoryTotals.map((cat, i) => {
                    const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
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

          {/* 사용자별 */}
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>사용자별 지출</div>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: '남편', value: husbandExp }, { name: '아내', value: wifeExp }]} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
                    <Cell fill="#3182f6" /><Cell fill="#f06292" />
                  </Pie>
                  <Tooltip formatter={val => formatKRW(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {[['👨 남편', husbandExp, '#3182f6'], ['👩 아내', wifeExp, '#f06292']].map(([label, val, color]) => {
              const total = husbandExp + wifeExp
              const pct = total > 0 ? Math.round(val / total * 100) : 0
              return (
                <div key={label} style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

          {/* 불필요 소비 목록 */}
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
        </>
      )}

      {/* ── 월별 비교 탭 ── */}
      {tab === 'compare' && (
        <>
          {/* A월 / B월 선택 */}
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
              <MonthSelector year={aYear} monthIdx={aMonth} onChange={(y, m) => { setAYear(y); setAMonth(m) }} label="비교 월" />
              <span style={{ fontSize: 18, color: 'var(--text-tertiary)', fontWeight: 300 }}>vs</span>
              <MonthSelector year={bYear} monthIdx={bMonth} onChange={(y, m) => { setBYear(y); setBMonth(m) }} label="기준 월" />
            </div>
          </div>

          {/* 총지출 비교 */}
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>총 지출 비교</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{aLabel}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{formatKRW(aTotalExp)}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{bLabel}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{formatKRW(bTotalExp)}</div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', background: diff > 0 ? 'var(--red-light)' : 'var(--green-light)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: diff > 0 ? 'var(--red)' : 'var(--green)' }}>
                {diff === 0 ? '두 달이 동일해요' : `${bLabel}이 ${formatKRW(Math.abs(diff))} ${diff > 0 ? '더 많아요 ▲' : '더 적어요 ▼'}`}
              </span>
            </div>
          </div>

          {/* 카테고리 비교 바차트 */}
          {compareData.length > 0 && (
            <div className="card" style={{ marginTop: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>카테고리별 비교</div>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={v => `${Math.round(v/10000)}만`} />
                    <Tooltip formatter={val => formatKRW(val)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={MONTHS[aMonth]} fill="var(--text-tertiary)" radius={[4,4,0,0]} />
                    <Bar dataKey={MONTHS[bMonth]} fill="var(--blue)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 불필요 소비 비교 */}
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚩 불필요한 소비 비교</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{aLabel}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--red)' }}>{formatKRW(aUnnecessary)}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{bLabel}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--red)' }}>{formatKRW(bUnnecessary)}</div>
              </div>
            </div>
            {(() => {
              const d = bUnnecessary - aUnnecessary
              return (
                <div style={{ padding: '10px 14px', background: d > 0 ? 'var(--red-light)' : 'var(--green-light)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: d > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {d === 0 ? '두 달이 동일해요' : `불필요 소비 ${formatKRW(Math.abs(d))} ${d > 0 ? '증가 ▲' : '감소 ▼'}`}
                  </span>
                </div>
              )
            })()}
          </div>

          {/* 사용자별 비교 */}
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>사용자별 비교</div>
            {[['👨 남편', 'h', '#3182f6'], ['👩 아내', 'w', '#f06292']].map(([label, who, color]) => {
              const aVal = aTx.filter(t => t.amount < 0 && (t.who === who || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
              const bVal = bTx.filter(t => t.amount < 0 && (t.who === who || t.who === 'both')).reduce((s, t) => s + Math.abs(t.amount), 0)
              const d = bVal - aVal
              return (
                <div key={who} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: who === 'h' ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 12, color: d > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                      {d === 0 ? '동일' : `${d > 0 ? '+' : ''}${formatKRW(d)}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{aLabel}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 2 }}>{formatKRW(aVal)}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{bLabel}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 2 }}>{formatKRW(bVal)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 필터 패널 ── */}
      {showFilter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowFilter(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, padding: '20px 20px 40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>필터</span>
              <button onClick={() => setShowFilter(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>

            {/* 사용자 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>사용자</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['all', '전체'], ['h', '👨 남편'], ['w', '👩 아내']].map(([val, label]) => (
                  <button key={val} onClick={() => setTempWho(val)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${tempWho === val ? 'var(--blue)' : 'var(--border)'}`,
                    background: tempWho === val ? 'var(--blue-light)' : 'var(--bg-primary)',
                    color: tempWho === val ? 'var(--blue)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* 결제수단 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>결제수단</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PAYMENT_METHODS.map(pm => (
                  <button key={pm} onClick={() => setTempPayment(pm)} style={{
                    padding: '8px 14px', borderRadius: 20,
                    border: `1px solid ${tempPayment === pm ? 'var(--blue)' : 'var(--border)'}`,
                    background: tempPayment === pm ? 'var(--blue-light)' : 'var(--bg-primary)',
                    color: tempPayment === pm ? 'var(--blue)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: tempPayment === pm ? 700 : 500, cursor: 'pointer',
                  }}>{pm}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setTempWho('all'); setTempPayment('전체') }} style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'none',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)',
              }}>초기화</button>
              <button onClick={applyFilter} style={{
                flex: 2, padding: '14px', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--blue)', color: 'white',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}><Check size={16} /> 적용하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}