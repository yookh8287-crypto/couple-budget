'use client'

import { useState } from 'react'
import { formatKRW, formatDate } from '@/lib/data'
import TransactionDetailModal from './TransactionDetailModal'

export default function TransactionItem({ tx, onToggleUnnecessary, onUpdate, onToggleExcluded, onToggleHidden, coupleId }) {
  const [showDetail, setShowDetail] = useState(false)
  const isIncome = tx.amount > 0
  const isExcluded = tx.excluded

  return (
    <>
      <div
        className={`tx-item ${tx.unnecessary ? 'unnecessary' : ''}`}
        onClick={() => setShowDetail(true)}
        style={{
          opacity: isExcluded ? 0.4 : 1,
        }}
      >
        <div className="tx-icon-wrap">
          <div className="tx-icon" style={{ filter: isExcluded ? 'grayscale(1)' : 'none' }}>{tx.icon}</div>
          {tx.recurring && <div className="recurring-dot" title="정기 결제" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: isExcluded ? 'var(--text-tertiary)' : 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              textDecoration: isExcluded ? 'line-through' : 'none',
            }}>
              {tx.name}
            </span>
            {tx.who === 'h' && <span className="badge badge-h">남편</span>}
            {tx.who === 'w' && <span className="badge badge-w">아내</span>}
            {tx.recurring && <span className="badge badge-rec">정기</span>}
            {tx.unnecessary && <span className="badge badge-bad">불필요</span>}
            {isExcluded && <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>제외</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {tx.category} · {formatDate(tx.date)}
            {tx.payment_method && <span style={{ marginLeft: 4, color: 'var(--text-tertiary)' }}>· {tx.payment_method}</span>}
            {tx.memo && <span style={{ marginLeft: 4, color: 'var(--text-tertiary)' }}>· {tx.memo}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: isExcluded ? 'var(--text-tertiary)' : isIncome ? 'var(--green)' : 'var(--text-primary)',
            textDecoration: isExcluded ? 'line-through' : 'none',
          }}>
            {isIncome ? '' : '-'}{Math.abs(tx.amount).toLocaleString()}원
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isIncome && (
              <div style={{ fontSize: 14, opacity: tx.unnecessary ? 1 : 0.3 }}
                onClick={e => { e.stopPropagation(); onToggleUnnecessary && onToggleUnnecessary(tx.id) }}>
                🚩
              </div>
            )}
            <div style={{ fontSize: 14, opacity: isExcluded ? 1 : 0.3 }}
              onClick={e => { e.stopPropagation(); onToggleExcluded && onToggleExcluded(tx.id) }}
              title={isExcluded ? '제외 해제' : '합계에서 제외'}>
              🚫
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <TransactionDetailModal
          tx={tx}
          coupleId={coupleId}
          onClose={() => setShowDetail(false)}
          onUpdate={(updated) => { onUpdate && onUpdate(updated); setShowDetail(false) }}
        />
      )}
    </>
  )
}