'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

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

const PAYMENT_METHODS = [
  '현대카드', '삼성카드', '신한카드', '국민카드', '롯데카드', '하나카드',
  '토스뱅크', '카카오페이', '네이버페이', '현금', '계좌이체', '기타',
]

export default function AddTransactionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: '식비',
    who: 'both',
    type: 'expense',
    recurring: false,
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
  })

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  function handleTypeChange(type) {
    setForm(f => ({ ...f, type, category: type === 'expense' ? '식비' : '급여' }))
  }

  function handleSubmit() {
    if (!form.name || !form.amount) return
    const amount = form.type === 'expense'
      ? -Math.abs(parseInt(String(form.amount).replace(/,/g, '')))
      : Math.abs(parseInt(String(form.amount).replace(/,/g, '')))
    const icon = categories.find(c => c.name === form.category)?.icon || '💳'
    onAdd({
      name: form.name, amount, category: form.category, icon,
      who: form.who, date: form.date, recurring: form.recurring,
      unnecessary: false, payment_method: form.payment_method || null,
    })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text-primary)',
    background: 'var(--bg-primary)', outline: 'none',
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>내역 추가</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['expense', 'income'].map(type => (
            <button key={type} onClick={() => handleTypeChange(type)} style={{
              flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              background: form.type === type ? 'var(--blue)' : 'var(--bg-primary)',
              color: form.type === type ? 'white' : 'var(--text-secondary)',
            }}>
              {type === 'expense' ? '지출' : '수입'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>내용</label>
            <input style={inputStyle} placeholder="어디서 사용했나요?" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>금액</label>
            <input style={inputStyle} placeholder="0" type="number" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>카테고리</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat.name} onClick={() => setForm(f => ({ ...f, category: cat.name }))} style={{
                  padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                  background: form.category === cat.name ? 'var(--blue-light)' : 'var(--bg-primary)',
                  color: form.category === cat.name ? 'var(--blue)' : 'var(--text-secondary)',
                  fontWeight: form.category === cat.name ? 600 : 400,
                }}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 결제수단 */}
          <div>
            <label style={labelStyle}>결제수단 (선택)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PAYMENT_METHODS.map(pm => (
                <button key={pm} onClick={() => setForm(f => ({ ...f, payment_method: f.payment_method === pm ? '' : pm }))} style={{
                  padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                  background: form.payment_method === pm ? 'var(--blue)' : 'var(--bg-primary)',
                  color: form.payment_method === pm ? 'white' : 'var(--text-secondary)',
                  fontWeight: form.payment_method === pm ? 600 : 400,
                }}>
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>누구 지출</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['both', '공동'], ['h', '남편'], ['w', '아내']].map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, who: val }))} style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: form.who === val ? 'var(--blue)' : 'var(--bg-primary)',
                  color: form.who === val ? 'white' : 'var(--text-secondary)',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>날짜</label>
            <input style={inputStyle} type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>정기 결제</label>
            <div onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))} style={{
              width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
              background: form.recurring ? 'var(--blue)' : 'var(--border)', position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{ position: 'absolute', top: 3, left: form.recurring ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} style={{
          width: '100%', marginTop: 24, padding: '16px', borderRadius: 'var(--radius-md)',
          background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>
          추가하기
        </button>
      </div>
    </div>
  )
}