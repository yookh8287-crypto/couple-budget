'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { supabase } from '@/lib/data'

const DEFAULT_EXPENSE_CATS = [
  { name: '식비', icon: '🛒' }, { name: '외식', icon: '🍽️' }, { name: '카페', icon: '☕' },
  { name: '교통', icon: '⛽' }, { name: '주거', icon: '🏠' }, { name: '구독', icon: '📺' },
  { name: '건강', icon: '🏋️' }, { name: '의료', icon: '🏥' }, { name: '여가', icon: '🎮' },
  { name: '쇼핑', icon: '🛍️' }, { name: '교육', icon: '📚' }, { name: '금융', icon: '💳' },
  { name: '기타', icon: '💳' },
]

const DEFAULT_INCOME_CATS = [
  { name: '급여', icon: '💰' }, { name: '상여금', icon: '🎁' }, { name: '이자', icon: '🏦' },
  { name: '용돈', icon: '💵' }, { name: '환급', icon: '↩️' }, { name: '기타수입', icon: '💸' },
]

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
      background: value ? 'var(--blue)' : 'var(--border)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function TransactionDetailModal({ tx, coupleId, onClose, onUpdate }) {
  const isIncome = tx.amount > 0

  const [category, setCategory] = useState(tx.category || '')
  const [memo, setMemo] = useState(tx.memo || '')
  const [unnecessary, setUnnecessary] = useState(tx.unnecessary || false)
  const [excluded, setExcluded] = useState(tx.excluded || false)
  const [recurring, setRecurring] = useState(tx.recurring || false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState(isIncome ? DEFAULT_INCOME_CATS : DEFAULT_EXPENSE_CATS)

  // Supabase에서 커플 카테고리 불러오기
  useEffect(() => {
    if (!coupleId) return
    const type = isIncome ? 'income' : 'expense'
    supabase.from('categories').select('*').eq('couple_id', coupleId).eq('type', type).order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) setCategories(data)
      })
  }, [coupleId, isIncome])

  async function handleSave() {
    setSaving(true)
    try {
      const icon = categories.find(c => c.name === category)?.icon || tx.icon
      const updates = { category, icon, memo, unnecessary, excluded, recurring }

      const { error } = await supabase.from('transactions').update(updates).eq('id', tx.id)
      if (error) throw error

      // 정기지출 토글 ON → fixed_expenses에 자동 등록
      if (recurring && !tx.recurring) {
        // 이미 등록된 고정지출인지 확인
        const { data: existing } = await supabase
          .from('fixed_expenses')
          .select('id')
          .eq('couple_id', coupleId)
          .eq('name', tx.name)
          .maybeSingle()

        if (!existing) {
          const day = new Date(tx.date).getDate()
          await supabase.from('fixed_expenses').insert({
            couple_id: coupleId,
            name: tx.name,
            amount: Math.abs(tx.amount),
            category: category,
            icon: icon,
            who: tx.who || 'both',
            day_of_month: day,
          })
        }
      }

      // 정기지출 토글 OFF → fixed_expenses에서 제거
      if (!recurring && tx.recurring) {
        await supabase.from('fixed_expenses')
          .delete()
          .eq('couple_id', coupleId)
          .eq('name', tx.name)
      }

      onUpdate({ ...tx, ...updates })
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>내역 상세</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        </div>

        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 거래 요약 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 36 }}>{tx.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{tx.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tx.date}{tx.payment_method ? ` · ${tx.payment_method}` : ''}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: isIncome ? 'var(--green)' : 'var(--text-primary)' }}>
              {isIncome ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}원
            </div>
          </div>

          {/* 카테고리 - Supabase에서 불러온 목록 */}
          <div>
            <label style={labelStyle}>카테고리</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat.name} onClick={() => setCategory(cat.name)} style={{
                  padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)',
                  fontSize: 13, cursor: 'pointer',
                  background: category === cat.name ? 'var(--blue-light)' : 'var(--bg-primary)',
                  color: category === cat.name ? 'var(--blue)' : 'var(--text-secondary)',
                  fontWeight: category === cat.name ? 700 : 400,
                }}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label style={labelStyle}>메모</label>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              style={{
                width: '100%', padding: '12px 14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none',
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 토글 옵션 - 지출만 */}
          {!isIncome && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🚩 불필요한 소비</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>분석탭에서 따로 집계돼요</div>
                </div>
                <Toggle value={unnecessary} onChange={() => setUnnecessary(v => !v)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🚫 합계에서 제외</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>수입/지출 합계에 포함되지 않아요</div>
                </div>
                <Toggle value={excluded} onChange={() => setExcluded(v => !v)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🔁 정기 지출</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {recurring && !tx.recurring ? '고정지출로 자동 등록돼요' : '매월 반복되는 지출이에요'}
                  </div>
                </div>
                <Toggle value={recurring} onChange={() => setRecurring(v => !v)} />
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--blue)', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Check size={18} /> {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}