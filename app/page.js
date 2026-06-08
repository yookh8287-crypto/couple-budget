'use client'

import { useState, useEffect } from 'react'
import { Home, List, PieChart, Settings, Plus } from 'lucide-react'
import HomeScreen from './screens/HomeScreen'
import TransactionScreen from './screens/TransactionScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import SettingsScreen from './screens/SettingsScreen'
import AddTransactionModal from './components/AddTransactionModal'
import ImportModal from './components/ImportModal'
import AuthScreen from './components/AuthScreen'
import CoupleSetup from './components/CoupleSetup'
import { getTransactions, addTransaction, toggleUnnecessary, supabase } from '../lib/data'
import { getUser, getProfile, signOut } from '../lib/auth'
import './globals.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    const user = await getUser()
    if (user) {
      setUser(user)
      await loadProfile(user.id)
    }
    setLoading(false)
  }

  async function loadProfile(userId) {
    const prof = await getProfile(userId)
    setProfile(prof)
    if (prof?.couple_id) loadTransactions(prof.couple_id)
  }

  async function loadTransactions(coupleId) {
    const data = await getTransactions(coupleId)
    setTransactions(data)
  }

  async function handleToggleUnnecessary(id) {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    await toggleUnnecessary(id, !tx.unnecessary)
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, unnecessary: !t.unnecessary } : t))
  }

  async function handleToggleHidden(id) {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    const { error } = await supabase.from('transactions').update({ hidden: !tx.hidden }).eq('id', tx.id)
    if (!error) setTransactions(prev => prev.map(t => t.id === id ? { ...t, hidden: !t.hidden } : t))
  }

  async function handleToggleExcluded(id) {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    const { error } = await supabase.from('transactions').update({ excluded: !tx.excluded }).eq('id', tx.id)
    if (!error) setTransactions(prev => prev.map(t => t.id === id ? { ...t, excluded: !t.excluded } : t))
  }

  async function handleAddTransaction(tx) {
    const newTx = await addTransaction(tx, profile.couple_id)
    if (newTx) setTransactions(prev => [newTx, ...prev])
    setShowAdd(false)
  }

  function handleUpdateTransaction(updated) {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  async function handleImport(txList) {
    const txWithCouple = txList.map(tx => ({ ...tx, couple_id: profile.couple_id }))
    const { error } = await supabase.from('transactions').insert(txWithCouple)
    if (error) { alert('가져오기 중 오류가 발생했어요.'); return }
    await loadTransactions(profile.couple_id)
  }

  async function handleSignOut() {
    await signOut()
    setUser(null)
    setProfile(null)
    setTransactions([])
    window.location.reload()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12, background: 'var(--bg-tertiary)' }}>
        <div style={{ fontSize: 32 }}>🐷</div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>불러오는 중...</div>
      </div>
    )
  }

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); loadProfile(u.id) }} />
  if (!profile?.couple_id) return <CoupleSetup user={user} profile={profile} onComplete={() => loadProfile(user.id)} />

  const screens = {
    home: <HomeScreen transactions={transactions} onToggleUnnecessary={handleToggleUnnecessary} onUpdate={handleUpdateTransaction} coupleId={profile.couple_id} onToggleExcluded={handleToggleExcluded} onToggleHidden={handleToggleHidden} />,

    transactions: <TransactionScreen transactions={transactions} onToggleUnnecessary={handleToggleUnnecessary} onUpdate={handleUpdateTransaction} onToggleExcluded={handleToggleExcluded} onToggleHidden={handleToggleHidden} coupleId={profile.couple_id} />,
    analysis: <AnalysisScreen transactions={transactions} />,
    settings: <SettingsScreen onImport={() => setShowImport(true)} onSignOut={handleSignOut} user={user} profile={profile} coupleId={profile.couple_id} />,
  }

  return (
    <div className="app-shell">
      {screens[activeTab]}
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdd={handleAddTransaction} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} coupleId={profile.couple_id} />}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} /><span>홈</span>
        </div>
        <div className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          <List size={22} /><span>내역</span>
        </div>
        <button className="nav-add-btn" onClick={() => setShowAdd(true)}>
          <Plus size={24} />
        </button>
        <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
          <PieChart size={22} /><span>분석</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} /><span>설정</span>
        </div>
      </div>
    </div>
  )
}