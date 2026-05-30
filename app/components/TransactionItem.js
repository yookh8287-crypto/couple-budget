'use client'

import { useState } from 'react'
import { formatKRW, formatDate } from '@/lib/data'
import TransactionDetailModal from './TransactionDetailModal'

export default function TransactionItem({ tx, onToggleUnnecessary, onUpdate }) {
  const [showDetail, setShowDetail] = useState(false)
  const isIncome = tx.amount > 0

  return (
    <>
      <div
        className={`tx-item ${tx.unnecessary ? 'unnecessary' : ''}`}
        onClick={() => setShowDetail(true)}
      >
        <div className="tx-icon-wrap">
          <div className="tx-icon">{tx.icon}</div>
          {tx.recurring && <div className="recurring-dot" title="정기 결제" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tx.name}
            </span>
            {tx.who === 'h' && <span className="badge badge-h">남편</span>}
            {tx.who === 'w' && <span className="badge badge-w">아내</span>}
            {tx.recurring && <span className="badge badge-rec">정기</span>}
            {tx.unnecessary && <span className="badge badge-bad">불필요</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {tx.category} · {formatDate(tx.date)}
            {tx.memo && <span style={{ marginLeft: 4, color: 'var(--text-tertiary)' }}>· {tx.memo}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: isIncome ? 'var(--green)' : 'var(--text-primary)' }}>
            {isIncome ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}원
          </div>
          {!isIncome && (
            <div
              style={{ fontSize: 16, marginTop: 2, opacity: tx.unnecessary ? 1 : 0.3 }}
              onClick={e => {
                e.stopPropagation()
                onToggleUnnecessary && onToggleUnnecessary(tx.id)
              }}
            >
              🚩
            </div>
          )}
        </div>
      </div>

      {showDetail && (
        <TransactionDetailModal
          tx={tx}
          onClose={() => setShowDetail(false)}
          onUpdate={(updated) => {
            onUpdate && onUpdate(updated)
            setShowDetail(false)
          }}
        />
      )}
    </>
  )
}