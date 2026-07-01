'use client'

import { useState, useEffect } from 'react'
import TransactionItem from '@/app/components/TransactionItem'
import TransactionFilter, { applyFilter } from '@/app/components/TransactionFilter'
import { formatKRW, filterByMember, getSavings } from '@/lib/data'
import { X } from 'lucide-react'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function HomeScreen({ transactions, onToggleUnnecessary, onUpdate, onToggleExcluded, onToggleHidden, coupleId }) {
  const [member, setMember] = useState('all')
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [savings, setSavings] = useState([])
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('latest')
  const [modalFilter, setModalFilter] = useState('latest')

  useEffect(() => {
    if (coupleId) {
      getSavings(coupleId).then(setSavings).catch(() => setSavings([]))
    }
  }, [coupleId])

  function changeMonth(d) {
    let m = monthIdx + d
    let y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setMonthIdx(m)
    setYear(y)
  }

  function openModal(type) {
    setModal(type)
    setModalFilter('latest')
  }

  const monthFiltered = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === monthIdx
  })

  // 멤버 필터만 적용 (excluded 항목도 목록에 표시)
  const filtered = filterByMember(monthFiltered, member)

  // 합계 계산에서만 excluded 제외
  const activeFiltered = filtered.filter(t => !t.excluded)
  const incomeList = activeFiltered.filter(t => t.amount > 0)
  const expenseList = activeFiltered.filter(t => t.amount < 0)
  const income = incomeList.reduce((s, t) => s + t.amount, 0)
  const expense = expenseList.reduce((s, t) => s + Math.abs(t.amount), 0)
  const remain = income - expense
  const budget = 5000000
  const budgetPct = Math.min(Math.round((expense / budget) * 100), 100)
  const fillClass = budgetPct >= 100 ? 'fill-red' : budgetPct >= 80 ? 'fill-amber' : 'fill-green'

  // 목록은 excluded 포함해서 표시 (TransactionItem에서 그레이+취소선 처리)
  const filteredAndSorted = applyFilter(filtered, filter)

  const modalConfig = {
    income: { title: '수입 내역', list: applyFilter(incomeList, modalFilter), summary: formatKRW(income), summaryColor: 'var(--green)', count: incomeList.length },
    expense: { title: '지출 내역', list: applyFilter(expenseList, modalFilter), summary: `-${formatKRW(expense)}`, summaryColor: 'var(--text-primary)', count: expenseList.length },
    all: { title: '전체 거래 내역', list: applyFilter(filtered, modalFilter), summary: null, count: filtered.length },
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>우리 가계부</span>
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
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{year}년 {MONTHS[monthIdx]} 순 지출 (지출-수입)</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 14, color: remain < 0 ? 'var(--red)' : 'var(--text-primary)' }}>{remain < 0 ? '-' : ''}{formatKRW(Math.abs(remain))}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div className="stat-box" onClick={() => openModal('income')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">총 수입 <span style={{ fontSize: 10, color: 'var(--blue)' }}>▶ 보기</span></div>
            <div className="stat-value color-income">{formatKRW(income)}</div>
          </div>
          <div className="stat-box" onClick={() => openModal('expense')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">총 지출 <span style={{ fontSize: 10, color: 'var(--blue)' }}>▶ 보기</span></div>
            <div className="stat-value">-{formatKRW(expense)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
          <span>예산 사용률 (예산 {formatKRW(budget)})</span>
          <span>{budgetPct}%</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${fillClass}`} style={{ width: `${budgetPct}%` }} />
        </div>
      </div>

      {savings.length > 0 && (
        <div className="card" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>🐷 저축 목표</span>
            <span style={{ fontSize: 11, background: 'var(--green-light)', color: 'var(--green)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{savings.length}개 진행 중</span>
          </div>
          {savings.map(s => {
            const pct = Math.round((s.current / s.target) * 100)
            return (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s.icon} {s.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatKRW(s.current)} / {formatKRW(s.target)} ({pct}%)</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${pct >= 80 ? 'fill-green' : 'fill-amber'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>최근 거래 내역</span>
        <button onClick={() => openModal('all')} style={{ fontSize: 12, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          자세히 보기 →
        </button>
      </div>

      <TransactionFilter value={filter} onChange={setFilter} />

      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', margin: '4px 16px 0', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {filteredAndSorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            {year}년 {MONTHS[monthIdx]} 거래 내역이 없어요<br />
            <span style={{ fontSize: 12 }}>+ 버튼으로 추가해보세요</span>
          </div>
        ) : (
          filteredAndSorted.slice(0, 5).map(tx => (
            <TransactionItem key={tx.id} tx={tx} onToggleUnnecessary={onToggleUnnecessary} onUpdate={onUpdate} onToggleExcluded={onToggleExcluded} onToggleHidden={onToggleHidden} coupleId={coupleId} />
          ))
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 20px 8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{modalConfig[modal].title}</span>
                <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={22} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {modalConfig[modal].summary && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: modalConfig[modal].summaryColor }}>
                    {modalConfig[modal].summary}
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  총 {modalConfig[modal].count}건
                </span>
              </div>
            </div>
            <div style={{ padding: '0 0 4px' }}>
              <TransactionFilter value={modalFilter} onChange={setModalFilter} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 20 }}>
              {modalConfig[modal].list.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--text-secondary)' }}>내역이 없어요</div>
              ) : (
                modalConfig[modal].list.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} onToggleUnnecessary={onToggleUnnecessary} onUpdate={onUpdate} onToggleExcluded={onToggleExcluded} onToggleHidden={onToggleHidden} coupleId={coupleId} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}