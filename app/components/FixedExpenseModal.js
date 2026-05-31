'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Check } from 'lucide-react'
import { supabase } from '@/lib/data'

const CATEGORIES = ['식비', '외식', '카페', '교통', '주거', '구독', '건강', '의료', '여가', '쇼핑', '교육', '금융', '기타']
const ICONS = { '식비': '🛒', '외식': '🍽️', '카페': '☕', '교통': '⛽', '주거': '🏠', '구독': '📺', '건강': '🏋️', '의료': '🏥', '여가': '🎮', '쇼핑': '🛍️', '교육': '📚', '금융': '💳', '기타': '💳' }

export default function FixedExpenseModal({ onClose, coupleId, onApply }) {
  const [fixedList, setFixedList] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', category: '주거', who: 'both', day_of_month: 1 })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadFixed() }, [])

  async function loadFixed() {
    const { data } = await supabase.from('fixed_expenses').select('*').eq('couple_id', coupleId)
    setFixedList(data || [])
  }

  async function addFixed() {
    if (!form.name || !form.amount) return
    setLoading(true)
    const { error } = await supabase.from('fixed_expenses').insert([{
      name: form.name,
      amount: -Math.abs(parseInt(form.amount)),
      category: form.category,
      icon: ICONS[form.category] || '💳',
      who: form.who,
      day_of_month: parseInt(form.day_of_month),
      couple_id: coupleId,
    }])
    if (!error) { await loadFixed(); setShowAdd(false); setForm({ name: '', amount: '', category: '주거', who: 'both', day_of_month: 1 }) }
    setLoading(false)
  }

  async function deleteFixed(id) {
    await supabase.from('fixed_expenses').delete().eq('id', id)
    await loadFixed()
  }

  async function applyThisMonth() {
    setLoading(true)
    const now = new Date()
    const txList = fixedList.map(f => ({
      name: f.name,
      amount: f.amount,
      category: f.category,
      icon: f.icon,
      who: f.who,
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(f.day_of_month).padStart(2, '0')}`,
      recurring: true,
      unnecessary: false,
      couple_id: coupleId,
    }))
    const { error } = await supabase.from('transactions').insert(txList)
    if (!error) { onApply(); onClose() }
    else alert('적용 중 오류가 발생했어요.')
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text-primary)', background: 'var(--bg-primary)', outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>고정 지출 관리</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px' }}>
          {fixedList.length === 0 && !showAdd && (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              등록된 고정 지출이 없어요<br />
              <span style={{ fontSize: 12 }}>아래 + 버튼으로 추가해보세요</span>
            </div>
          )}

          {fixedList.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.category} · 매월 {f.day_of_month}일 · {f.who === 'h' ? '남편' : f.who === 'w' ? '아내' : '공동'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{Math.abs(f.amount).toLocaleString()}원</span>
                <button onClick={() => deleteFixed(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}

          {showAdd && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input style={inputStyle} placeholder="항목명 (예: 대출 이자)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input style={inputStyle} placeholder="금액" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{ICONS[c]} {c}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['both', '공동'], ['h', '남편'], ['w', '아내']].map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, who: val }))} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', background: form.who === val ? 'var(--blue)' : 'var(--bg-primary)', color: form.who === val ? 'white' : 'var(--text-secondary)' }}>{label}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>매월</span>
                  <input style={{ ...inputStyle, width: 70 }} type="number" min="1" max="31" value={form.day_of_month} onChange={e => setForm(f => ({ ...f, day_of_month: e.target.value }))} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>일</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>취소</button>
                  <button onClick={addFixed} disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--blue)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Check size={14} /> 추가
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showAdd && (
            <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'none', fontSize: 13, color: 'var(--blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}>
              <Plus size={15} /> 고정 지출 추가
            </button>
          )}
        </div>

        {fixedList.length > 0 && (
          <div style={{ padding: '12px 16px 32px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, textAlign: 'center' }}>
              이번 달 내역에 고정 지출 {fixedList.length}건을 추가해요
            </div>
            <button onClick={applyThisMonth} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={18} /> 이번 달에 적용하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}