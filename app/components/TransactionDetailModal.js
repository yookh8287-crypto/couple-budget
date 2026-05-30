'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { supabase } from '@/lib/data'

const CATEGORIES = ['식비', '외식', '카페', '교통', '주거', '구독', '건강', '의료', '여가', '쇼핑', '교육', '금융', '수입', '기타']
const ICONS = {
  '식비': '🛒', '외식': '🍽️', '카페': '☕', '교통': '⛽', '주거': '🏠',
  '구독': '📺', '건강': '🏋️', '의료': '🏥', '여가': '🎮', '쇼핑': '🛍️',
  '교육': '📚', '금융': '💳', '수입': '💰', '기타': '💳',
}

export default function TransactionDetailModal({ tx, onClose, onUpdate }) {
  const [category, setCategory] = useState(tx.category)
  const [memo, setMemo] = useState(tx.memo || '')
  const [saving, setSaving] = useState(false)

  const isIncome = tx.amount > 0

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('transactions')
      .update({ category, icon: ICONS[category] || '💳', memo })
      .eq('id', tx.id)
    if (error) {
      console.error(error)
      alert('저장 중 오류가 발생했어요.')
    } else {
      onUpdate({ ...tx, category, icon: ICONS[category] || '💳', memo })
      onClose()
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 430,
      }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>거래 상세</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={22} />
          </button>
        </div>

        {/* 금액 & 기본 정보 */}
        <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 32 }}>{tx.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{tx.name}</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: isIncome ? 'var(--green)' : 'var(--text-primary)' }}>
            {isIncome ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}원
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            {tx.date} · {tx.who === 'h' ? '남편' : tx.who === 'w' ? '아내' : '공동'}
            {tx.recurring && ' · 정기결제'}
          </div>
        </div>

        {/* 카테고리 변경 */}
        {!isIncome && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>카테고리</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.filter(c => c !== '수입').map(cat => (
                <button key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 20,
                    border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                    background: category === cat ? 'var(--blue)' : 'var(--bg-primary)',
                    color: category === cat ? 'white' : 'var(--text-secondary)',
                    fontWeight: category === cat ? 600 : 400,
                  }}>
                  {ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 메모 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>메모</div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="메모를 입력해주세요"
            style={{
              width: '100%', padding: '12px 14px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text-primary)',
              background: 'var(--bg-primary)', outline: 'none', resize: 'none', height: 80,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--blue)', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Check size={18} />
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}