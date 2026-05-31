'use client'

import { useState } from 'react'
import { X, Check, Repeat } from 'lucide-react'
import { supabase } from '@/lib/data'

const EXPENSE_CATEGORIES = [
  { name: '식비', icon: '🛒' }, { name: '외식', icon: '🍽️' }, { name: '카페', icon: '☕' },
  { name: '교통', icon: '⛽' }, { name: '주거', icon: '🏠' }, { name: '구독', icon: '📺' },
  { name: '건강', icon: '🏋️' }, { name: '의료', icon: '🏥' }, { name: '여가', icon: '🎮' },
  { name: '쇼핑', icon: '🛍️' }, { name: '교육', icon: '📚' }, { name: '금융', icon: '💳' },
  { name: '기타', icon: '💳' },
]

const INCOME_CATEGORIES = [
  { name: '급여', icon: '💰' }, { name: '상여금', icon: '🎁' }, { name: '이자', icon: '🏦' },
  { name: '용돈', icon: '💵' }, { name: '환급', icon: '↩️' }, { name: '기타수입', icon: '💸' },
]

export default function TransactionDetailModal({ tx, onClose, onUpdate, coupleId }) {
  const isIncome = tx.amount > 0
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const [category, setCategory] = useState(tx.category)
  const [memo, setMemo] = useState(tx.memo || '')
  const [saving, setSaving] = useState(false)
  const [addingFixed, setAddingFixed] = useState(false)
  const [fixedDay, setFixedDay] = useState(new Date(tx.date).getDate())
  const [fixedSuccess, setFixedSuccess] = useState(false)

  async function handleSave() {
    setSaving(true)
    const icon = categories.find(c => c.name === category)?.icon || tx.icon
    const { error } = await supabase.from('transactions').update({ category, icon, memo }).eq('id', tx.id)
    if (error) { alert('저장 중 오류가 발생했어요.') }
    else { onUpdate({ ...tx, category, icon, memo }); onClose() }
    setSaving(false)
  }

  async function handleAddFixed() {
    if (!coupleId) return
    setSaving(true)
    const { error } = await supabase.from('fixed_expenses').insert([{
      name: tx.name,
      amount: tx.amount,
      category: tx.category,
      icon: tx.icon,
      who: tx.who,
      day_of_month: fixedDay,
      couple_id: coupleId,
    }])
    if (!error) { setFixedSuccess(true); setAddingFixed(false) }
    else { alert('고정 지출 등록 중 오류가 발생했어요.') }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>거래 상세</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        </div>

        {/* 금액 요약 */}
        <div style={{ textAlign: 'center', marginBottom: 20, padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 32 }}>{tx.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{tx.name}</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: isIncome ? 'var(--green)' : 'var(--text-primary)' }}>
            {isIncome ? '' : '-'}{Math.abs(tx.amount).toLocaleString()}원
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            {tx.date} · {tx.who === 'h' ? '남편' : tx.who === 'w' ? '아내' : '공동'}
            {tx.recurring && ' · 정기결제'}
          </div>
        </div>

        {/* 고정지출 등록 */}
        {!isIncome && (
          <div style={{ marginBottom: 16 }}>
            {fixedSuccess ? (
              <div style={{ padding: '12px 14px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--green)', fontWeight: 600, textAlign: 'center' }}>
                ✅ 고정 지출로 등록됐어요!
              </div>
            ) : addingFixed ? (
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🔁 고정 지출 등록</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>매월</span>
                  <input type="number" min="1" max="31" value={fixedDay}
                    onChange={e => setFixedDay(parseInt(e.target.value))}
                    style={{ width: 60, padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, textAlign: 'center', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>일에 자동 반영</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAddingFixed(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>취소</button>
                  <button onClick={handleAddFixed} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--blue)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    등록하기
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingFixed(true)} style={{
                width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              }}>
                <Repeat size={16} color="var(--blue)" />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>고정 지출로 등록하기</span>
              </button>
            )}
          </div>
        )}

        {/* 카테고리 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>카테고리</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map(cat => (
              <button key={cat.name} onClick={() => setCategory(cat.name)} style={{
                padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                background: category === cat.name ? 'var(--blue)' : 'var(--bg-primary)',
                color: category === cat.name ? 'white' : 'var(--text-secondary)',
                fontWeight: category === cat.name ? 600 : 400,
              }}>{cat.icon} {cat.name}</button>
            ))}
          </div>
        </div>

        {/* 메모 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>메모</div>
          <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모를 입력해주세요"
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none', resize: 'none', height: 80, fontFamily: 'inherit' }} />
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
          background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Check size={18} />
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}