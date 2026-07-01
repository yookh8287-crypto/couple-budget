'use client'

import { useState } from 'react'
import TransactionItem from '@/app/components/TransactionItem'
import TransactionFilter, { applyFilter } from '@/app/components/TransactionFilter'
import { formatKRW, filterByMember } from '@/lib/data'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAYS = ['일','월','화','수','목','금','토']

export default function TransactionScreen({ transactions, onToggleUnnecessary, onUpdate, onToggleExcluded, onToggleHidden, coupleId }) {
  const [member, setMember] = useState('all')
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [filter, setFilter] = useState('latest')

  function changeMonth(d) {
    let m = monthIdx + d
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonthIdx(m)
    setYear(y)
    setSelectedDate(null)
  }

  const monthFiltered = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx
  })

  // 멤버 필터만 적용 (excluded 항목도 목록에 표시)
  const memberFiltered = filterByMember(monthFiltered, member)

  // 달력 및 합계 계산에서만 excluded 제외
  const activeFiltered = memberFiltered.filter(t => !t.excluded)

  // 달력 데이터 (excluded 제외)
  const firstDay = new Date(year, monthIdx, 1).getDay()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()

  const dayTotals = {}
  activeFiltered.forEach(t => {
    const day = new Date(t.date).getDate()
    if (!dayTotals[day]) dayTotals[day] = { income: 0, expense: 0 }
    if (t.amount > 0) dayTotals[day].income += t.amount
    else dayTotals[day].expense += Math.abs(t.amount)
  })

  // 목록은 excluded 포함 (TransactionItem에서 그레이+취소선 처리)
  const displayList = selectedDate
    ? memberFiltered.filter(t => new Date(t.date).getDate() === selectedDate)
    : applyFilter(memberFiltered, filter)

  const totalIncome = activeFiltered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpense = activeFiltered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>내역</span>
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

      {/* 월 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 16px 0' }}>
        <div className="stat-box">
          <div className="stat-label">수입</div>
          <div className="stat-value color-income">{formatKRW(totalIncome)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">지출</div>
          <div className="stat-value">-{formatKRW(totalExpense)}</div>
        </div>
      </div>

      {/* 달력 */}
      <div className="card" style={{ marginTop: 10, padding: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === 0 ? 'var(--red)' : i === 6 ? 'var(--blue)' : 'var(--text-secondary)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const totals = dayTotals[day]
            const isSelected = selectedDate === day
            const isToday = new Date().getDate() === day && new Date().getMonth() === monthIdx && new Date().getFullYear() === year
            const dayOfWeek = (firstDay + i) % 7
            return (
              <div key={day}
                onClick={() => setSelectedDate(selectedDate === day ? null : day)}
                style={{
                  textAlign: 'center', padding: '4px 2px', borderRadius: 8, cursor: 'pointer',
                  background: isSelected ? 'var(--blue)' : isToday ? 'var(--blue-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isSelected ? 'white' : dayOfWeek === 0 ? 'var(--red)' : dayOfWeek === 6 ? 'var(--blue)' : 'var(--text-primary)', marginBottom: 2 }}>{day}</div>
                {totals?.expense > 0 && <div style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--red)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>-{(totals.expense / 10000).toFixed(0)}만</div>}
                {totals?.income > 0 && <div style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--green)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(totals.income / 10000).toFixed(0)}만</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 필터 & 리스트 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {selectedDate ? `${monthIdx + 1}월 ${selectedDate}일 내역` : '전체 내역'} · {displayList.length}건
        </span>
        {selectedDate && (
          <button onClick={() => setSelectedDate(null)} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>전체 보기</button>
        )}
      </div>

      {!selectedDate && <TransactionFilter value={filter} onChange={setFilter} />}

      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', margin: '6px 16px 0', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            내역이 없어요
          </div>
        ) : (
          displayList.map(tx => (
            <TransactionItem key={tx.id} tx={tx} onToggleUnnecessary={onToggleUnnecessary} onUpdate={onUpdate} onToggleExcluded={onToggleExcluded} onToggleHidden={onToggleHidden} coupleId={coupleId} />
          ))
        )}
      </div>
    </div>
  )
}