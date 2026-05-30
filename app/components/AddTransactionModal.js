'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = ['식비', '외식', '교통', '구독', '건강', '의료', '여가', '카페', '쇼핑', '기타']
const ICONS = { '식비': '🛒', '외식': '🍽️', '교통': '⛽', '구독': '📺', '건강': '🏋️', '의료': '🏥', '여가': '🎮', '카페': '☕', '쇼핑': '🛍️', '기타': '💳' }

export default function AddTransactionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: '식비',
    who: 'both',
    type: 'expense',
    recurring: false,
    date: new Date().toISOString().split('T')[0],
  })

  function handleSubmit() {
    if (!form.name || !form.amount) return
    const amount = form.type === 'expense'
      ? -Math.abs(parseInt(String(form.amount).replace(/,/g, '')))
      : Math.abs(parseInt(String(form.amount).replace(/,/g, '')))
    onAdd({
      name: form.name,
      amount,
      category: form.type === 'income' ? '수입' : form.category,
      icon: form.type === 'income' ? '💰' : ICONS[form.category] || '💳',
      who: form.who,
      date: form.date,
      recurring: form.recurring,
      unnecessary: false,
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 430,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>내역 추가</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['expense', 'income'].map(type => (
            <button key={type}
              onClick={() => setForm(f => ({ ...f, type }))}
              style={{
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

          {form.type === 'expense' && (
            <div>
              <label style={labelStyle}>카테고리</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)',
                      fontSize: 13, cursor: 'pointer',
                      background: form.category === cat ? 'var(--blue-light)' : 'var(--bg-primary)',
                      color: form.category === cat ? 'var(--blue)' : 'var(--text-secondary)',
                      fontWeight: form.category === cat ? 600 : 400,
                    }}>
                    {ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>누구 지출</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['both', '공동'], ['h', '남편'], ['w', '아내']].map(([val, label]) => (
                <button key={val}
                  onClick={() => setForm(f => ({ ...f, who: val }))}
                  style={{
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>정기 결제</label>
            <div
              onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
              style={{
                width: 44, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                background: form.recurring ? 'var(--blue)' : 'var(--border)',
                position: 'relative',
              }}>
              <div style={{
                position: 'absolute', top: 3, left: form.recurring ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: '100%', marginTop: 24, padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
          }}>
          추가하기
        </button>
      </div>
    </div>
  )
}