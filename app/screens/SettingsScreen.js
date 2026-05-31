'use client'

import { useState } from 'react'
import { Bell, Link, ChevronRight, Users, Download, Pencil, Check, X, Tag, LogOut } from 'lucide-react'

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

export default function SettingsScreen({ onImport, onSignOut, user, profile }) {
  const [alerts, setAlerts] = useState({ budgetOver: true, recurring: true, monthlyReport: true })
  const [expenseCats, setExpenseCats] = useState(DEFAULT_EXPENSE_CATS)
  const [incomeCats, setIncomeCats] = useState(DEFAULT_INCOME_CATS)
  const [showCatList, setShowCatList] = useState(false)
  const [catType, setCatType] = useState('expense')
  const [editingCat, setEditingCat] = useState(null)
  const [showCatEdit, setShowCatEdit] = useState(false)

  function startEdit(type, index) {
    const cat = type === 'expense' ? expenseCats[index] : incomeCats[index]
    setEditingCat({ type, index, name: cat.name, icon: cat.icon })
    setShowCatEdit(true)
  }

  function saveEdit() {
    if (!editingCat.name.trim()) return
    if (editingCat.type === 'expense') {
      setExpenseCats(prev => prev.map((c, i) => i === editingCat.index ? { name: editingCat.name, icon: editingCat.icon } : c))
    } else {
      setIncomeCats(prev => prev.map((c, i) => i === editingCat.index ? { name: editingCat.name, icon: editingCat.icon } : c))
    }
    setShowCatEdit(false)
    setEditingCat(null)
  }

  function Toggle({ value, onChange }) {
    return (
      <div onClick={onChange} style={{
        width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
        background: value ? 'var(--blue)' : 'var(--border)', position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
    )
  }

  const currentCats = catType === 'expense' ? expenseCats : incomeCats

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <span style={{ fontSize: 18, fontWeight: 700 }}>설정</span>
      </div>

      {/* 내 프로필 */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: profile?.role === 'h' ? '#ebf3fe' : '#fce8f3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {profile?.role === 'h' ? '👨' : '👩'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.nickname || '사용자'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={onSignOut} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            background: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer',
          }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </div>

      {/* 데이터 가져오기 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Download size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>데이터 가져오기</span>
        </div>
        <button onClick={onImport} style={{
          width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏦</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>뱅크샐러드 가져오기</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>엑셀 파일로 내역 한번에 가져오기</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-tertiary)" />
        </button>
      </div>

      {/* 카테고리 관리 */}
      <div className="card" style={{ marginTop: 10 }}>
        <button onClick={() => setShowCatList(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} color="var(--blue)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>카테고리 관리</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>지출 {expenseCats.length}개 · 수입 {incomeCats.length}개</span>
            <ChevronRight size={16} color="var(--text-tertiary)" />
          </div>
        </button>
      </div>

      {/* 알림 설정 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Bell size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>알림 설정</span>
        </div>
        {[
          { key: 'budgetOver', label: '예산 초과 알림' },
          { key: 'recurring', label: '정기 결제 알림' },
          { key: 'monthlyReport', label: '월간 리포트' },
        ].map(({ key, label }, i, arr) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 14 }}>{label}</span>
            <Toggle value={alerts[key]} onChange={() => setAlerts(a => ({ ...a, [key]: !a[key] }))} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>
        우리 가계부 v0.1.0
      </div>

      {/* 카테고리 목록 모달 */}
      {showCatList && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCatList(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>카테고리 관리</span>
                <button onClick={() => setShowCatList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['expense', 'income'].map(type => (
                  <button key={type} onClick={() => setCatType(type)} style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: catType === type ? 'var(--blue)' : 'var(--bg-primary)',
                    color: catType === type ? 'white' : 'var(--text-secondary)',
                  }}>
                    {type === 'expense' ? '지출' : '수입'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 20px' }}>
              {currentCats.map((cat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                  <span style={{ fontSize: 15 }}>{cat.icon} {cat.name}</span>
                  <button onClick={() => startEdit(catType, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Pencil size={13} /> 수정
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 수정 모달 */}
      {showCatEdit && editingCat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCatEdit(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>카테고리 수정</span>
              <button onClick={() => setShowCatEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>아이콘 (이모지 입력)</div>
                <input value={editingCat.icon} onChange={e => setEditingCat(prev => ({ ...prev, icon: e.target.value }))} placeholder="예: 🛒"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 24, outline: 'none', background: 'var(--bg-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>카테고리 이름</div>
                <input value={editingCat.name} onChange={e => setEditingCat(prev => ({ ...prev, name: e.target.value }))} placeholder="카테고리 이름"
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>미리보기: </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{editingCat.icon} {editingCat.name}</span>
              </div>
            </div>
            <button onClick={saveEdit} style={{
              width: '100%', marginTop: 20, padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Check size={18} /> 저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}