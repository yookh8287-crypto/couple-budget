'use client'

import { useState, useEffect } from 'react'
import { Bell, Link, ChevronRight, Users, Download, Pencil, Check, X, Tag, LogOut, Moon, Sun, Wallet, Plus, Trash2 } from 'lucide-react'
import FixedExpenseModal from '../components/FixedExpenseModal'
import { supabase } from '@/lib/data'

const DEFAULT_EXPENSE_CATS = [
  { name: '식비', icon: '🛒', type: 'expense' }, { name: '외식', icon: '🍽️', type: 'expense' },
  { name: '카페', icon: '☕', type: 'expense' }, { name: '교통', icon: '⛽', type: 'expense' },
  { name: '주거', icon: '🏠', type: 'expense' }, { name: '구독', icon: '📺', type: 'expense' },
  { name: '건강', icon: '🏋️', type: 'expense' }, { name: '의료', icon: '🏥', type: 'expense' },
  { name: '여가', icon: '🎮', type: 'expense' }, { name: '쇼핑', icon: '🛍️', type: 'expense' },
  { name: '교육', icon: '📚', type: 'expense' }, { name: '금융', icon: '💳', type: 'expense' },
  { name: '기타', icon: '💳', type: 'expense' },
]

const DEFAULT_INCOME_CATS = [
  { name: '급여', icon: '💰', type: 'income' }, { name: '상여금', icon: '🎁', type: 'income' },
  { name: '이자', icon: '🏦', type: 'income' }, { name: '용돈', icon: '💵', type: 'income' },
  { name: '환급', icon: '↩️', type: 'income' }, { name: '기타수입', icon: '💸', type: 'income' },
]

const DEFAULT_BUDGETS = [
  { category: '식비', icon: '🛒', budget: 500000 },
  { category: '외식', icon: '🍽️', budget: 200000 },
  { category: '교통', icon: '⛽', budget: 300000 },
  { category: '구독', icon: '📺', budget: 100000 },
  { category: '건강', icon: '🏋️', budget: 200000 },
]

export default function SettingsScreen({ onImport, onSignOut, user, profile, coupleId }) {
  const [alerts, setAlerts] = useState({ budgetOver: true, recurring: true, monthlyReport: true })
  const [expenseCats, setExpenseCats] = useState(DEFAULT_EXPENSE_CATS)
  const [incomeCats, setIncomeCats] = useState(DEFAULT_INCOME_CATS)
  const [showCatList, setShowCatList] = useState(false)
  const [catType, setCatType] = useState('expense')
  const [editingCat, setEditingCat] = useState(null)
  const [showCatEdit, setShowCatEdit] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showBudget, setShowBudget] = useState(false)
  const [budgets, setBudgets] = useState(DEFAULT_BUDGETS)
  const [editingBudget, setEditingBudget] = useState(null)
  const [showBudgetEdit, setShowBudgetEdit] = useState(false)
  const [showFixed, setShowFixed] = useState(false)
  const [coupleCode, setCoupleCode] = useState('')
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [catLoading, setCatLoading] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    setDarkMode(theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches))
    if (coupleId) {
      loadBudgets()
      loadCoupleInfo()
      loadCategories()
    }
  }, [coupleId])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').eq('couple_id', coupleId).order('created_at')
    if (data && data.length > 0) {
      setExpenseCats(data.filter(c => c.type === 'expense'))
      setIncomeCats(data.filter(c => c.type === 'income'))
    } else {
      // 처음이면 기본값 저장
      await saveDefaultCategories()
    }
  }

  async function saveDefaultCategories() {
    const all = [...DEFAULT_EXPENSE_CATS, ...DEFAULT_INCOME_CATS].map(c => ({ ...c, couple_id: coupleId }))
    await supabase.from('categories').insert(all)
    await loadCategories()
  }

  async function loadBudgets() {
    const { data } = await supabase.from('budgets').select('*').eq('couple_id', coupleId)
    if (data && data.length > 0) setBudgets(data)
  }

  async function loadCoupleInfo() {
    const { data } = await supabase.from('couples').select('code').eq('id', coupleId).single()
    if (data) setCoupleCode(data.code)
    const { data: profiles } = await supabase.from('profiles').select('*').eq('couple_id', coupleId)
    if (profiles) {
      const partner = profiles.find(p => p.id !== user?.id)
      if (partner) setPartnerProfile(partner)
    }
  }

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  async function saveBudget(cat, amount) {
    const existing = budgets.find(b => b.category === cat.category)
    if (existing?.id) {
      await supabase.from('budgets').update({ budget: amount }).eq('id', existing.id)
    } else {
      await supabase.from('budgets').insert([{ category: cat.category, icon: cat.icon, budget: amount, couple_id: coupleId }])
    }
    setBudgets(prev => prev.map(b => b.category === cat.category ? { ...b, budget: amount } : b))
    setShowBudgetEdit(false)
  }

  function startEdit(type, index) {
    const cat = type === 'expense' ? expenseCats[index] : incomeCats[index]
    setEditingCat({ ...cat, index, catType: type })
    setShowCatEdit(true)
  }

  async function saveEdit() {
    if (!editingCat.name.trim()) return
    setCatLoading(true)
    if (editingCat.id) {
      await supabase.from('categories').update({ name: editingCat.name, icon: editingCat.icon }).eq('id', editingCat.id)
    }
    await loadCategories()
    setCatLoading(false)
    setShowCatEdit(false)
  }

  async function addCategory(type) {
    const newCat = { name: '새 카테고리', icon: '📌', type, couple_id: coupleId }
    const { data } = await supabase.from('categories').insert([newCat]).select().single()
    if (data) {
      setEditingCat({ ...data, index: -1, catType: type })
      setShowCatEdit(true)
      await loadCategories()
    }
  }

  async function deleteCategory(cat) {
    if (!cat.id) return
    await supabase.from('categories').delete().eq('id', cat.id)
    await loadCategories()
  }

  function Toggle({ value, onChange }) {
    return (
      <div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, cursor: 'pointer', background: value ? 'var(--blue)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}>
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
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: profile?.role === 'h' ? 'var(--blue-light)' : '#fce8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {profile?.role === 'h' ? '👨' : '👩'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.nickname || '사용자'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </div>

      {/* 배우자 초대 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Users size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>배우자 초대</span>
        </div>

        {partnerProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>{partnerProfile.role === 'h' ? '👨' : '👩'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{partnerProfile.nickname}</div>
              <div style={{ fontSize: 11, color: 'var(--green)' }}>● 연결됨</div>
            </div>
          </div>
        )}

        {coupleCode ? (
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>배우자에게 아래 코드를 알려주세요</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 8, color: 'var(--blue)' }}>{coupleCode}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>배우자가 회원가입 후 이 코드를 입력하면 연결돼요</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text-secondary)' }}>코드를 불러오는 중...</div>
        )}

        <button onClick={() => { if (coupleCode) { navigator.clipboard?.writeText(coupleCode); alert(`코드 ${coupleCode} 가 복사됐어요!`) } }} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Link size={14} /> 코드 복사하기
        </button>
      </div>

      {/* 화면 설정 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {darkMode ? <Moon size={18} color="var(--blue)" /> : <Sun size={18} color="var(--blue)" />}
            <span style={{ fontSize: 14, fontWeight: 700 }}>다크 모드</span>
          </div>
          <Toggle value={darkMode} onChange={toggleDarkMode} />
        </div>
      </div>

      {/* 예산 설정 */}
      <div className="card" style={{ marginTop: 10 }}>
        <button onClick={() => setShowBudget(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} color="var(--blue)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>예산 설정</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{budgets.length}개 카테고리</span>
            <ChevronRight size={16} color="var(--text-tertiary)" />
          </div>
        </button>
      </div>

      {/* 고정 지출 */}
      <div className="card" style={{ marginTop: 10 }}>
        <button onClick={() => setShowFixed(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔁</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>고정 지출 관리</span>
          </div>
          <ChevronRight size={16} color="var(--text-tertiary)" />
        </button>
      </div>

      {/* 데이터 가져오기 */}
      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Download size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>데이터 가져오기</span>
        </div>
        <button onClick={onImport} style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
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
        <button onClick={() => setShowCatList(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 14 }}>{label}</span>
            <Toggle value={alerts[key]} onChange={() => setAlerts(a => ({ ...a, [key]: !a[key] }))} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>우리 가계부 v0.1.0</div>

      {/* 예산 설정 모달 */}
      {showBudget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowBudget(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>예산 설정</span>
              <button onClick={() => setShowBudget(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 20px' }}>
              {budgets.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                  <span style={{ fontSize: 15 }}>{b.icon} {b.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{b.budget?.toLocaleString()}원</span>
                    <button onClick={() => { setEditingBudget({ ...b, newAmount: String(b.budget) }); setShowBudgetEdit(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pencil size={13} /> 수정
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 예산 수정 모달 */}
      {showBudgetEdit && editingBudget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowBudgetEdit(false)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{editingBudget.icon} {editingBudget.category} 예산</span>
              <button onClick={() => setShowBudgetEdit(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>월 예산 금액</div>
            <input type="number" value={editingBudget.newAmount} onChange={e => setEditingBudget(prev => ({ ...prev, newAmount: e.target.value }))} placeholder="0"
              style={{ width: '100%', padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 20, fontWeight: 700, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: 20 }} />
            <button onClick={() => saveBudget(editingBudget, parseInt(editingBudget.newAmount) || 0)} style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={18} /> 저장하기
            </button>
          </div>
        </div>
      )}

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
                  <button key={type} onClick={() => setCatType(type)} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: catType === type ? 'var(--blue)' : 'var(--bg-primary)', color: catType === type ? 'white' : 'var(--text-secondary)' }}>
                    {type === 'expense' ? '지출' : '수입'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 12px' }}>
              {currentCats.map((cat, i) => (
                <div key={cat.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                  <span style={{ fontSize: 15 }}>{cat.icon} {cat.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(catType, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pencil size={13} /> 수정
                    </button>
                    <button onClick={() => deleteCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 16px 24px' }}>
              <button onClick={() => addCategory(catType)} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'none', fontSize: 13, color: 'var(--blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}>
                <Plus size={15} /> 카테고리 추가
              </button>
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
                <input value={editingCat.icon} onChange={e => setEditingCat(prev => ({ ...prev, icon: e.target.value }))} style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 24, outline: 'none', background: 'var(--bg-primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>카테고리 이름</div>
                <input value={editingCat.name} onChange={e => setEditingCat(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>미리보기: </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{editingCat.icon} {editingCat.name}</span>
              </div>
            </div>
            <button onClick={saveEdit} disabled={catLoading} style={{ width: '100%', marginTop: 20, padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={18} /> {catLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      )}

      {showFixed && (
        <FixedExpenseModal
          onClose={() => setShowFixed(false)}
          coupleId={coupleId}
          onApply={() => window.location.reload()}
        />
      )}
    </div>
  )
}