'use client'

import { useState, useEffect } from 'react'
import { Home, PieChart, Wallet, Settings, Plus, Download } from 'lucide-react'
import HomeScreen from './screens/HomeScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import BudgetScreen from './screens/BudgetScreen'
import SettingsScreen from './screens/SettingsScreen'
import AddTransactionModal from './components/AddTransactionModal'
import ImportModal from './components/ImportModal'
import { getTransactions, addTransaction, toggleUnnecessary, supabase } from '../lib/data'
import './globals.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  function handleUpdateTransaction(updated) {
    setTransactions(prev =>
      prev.map(t => t.id === updated.id ? updated : t)
    )
  }
  async function loadTransactions() {
    setLoading(true)
    const data = await getTransactions()
    setTransactions(data)
    setLoading(false)
  }

  async function handleToggleUnnecessary(id) {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    await toggleUnnecessary(id, !tx.unnecessary)
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, unnecessary: !t.unnecessary } : t)
    )
  }

  async function handleAddTransaction(tx) {
    const newTx = await addTransaction(tx)
    if (newTx) {
      setTransactions(prev => [newTx, ...prev])
    }
    setShowAdd(false)
  }

  async function handleImport(txList) {
    const { error } = await supabase.from('transactions').insert(txList)
    if (error) {
      console.error(error)
      alert('가져오기 중 오류가 발생했어요.')
      return
    }
    await loadTransactions()
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 12,
        background: 'var(--bg-tertiary)'
      }}>
        <div style={{ fontSize: 32 }}>🐷</div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>불러오는 중...</div>
      </div>
    )
  }

  const screens = {
home: <HomeScreen transactions={transactions} onToggleUnnecessary={handleToggleUnnecessary} onUpdate={handleUpdateTransaction} />,
    analysis: <AnalysisScreen transactions={transactions} />,
    budget: <BudgetScreen transactions={transactions} />,
    settings: <SettingsScreen onImport={() => setShowImport(true)} />,
  }

  return (
    <div className="app-shell">
      {screens[activeTab]}

      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAddTransaction}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span>홈</span>
        </div>
        <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
          <PieChart size={22} />
          <span>분석</span>
        </div>
        <button className="nav-add-btn" onClick={() => setShowAdd(true)}>
          <Plus size={24} />
        </button>
        <div className={`nav-item ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
          <Wallet size={22} />
          <span>예산</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} />
          <span>설정</span>
        </div>
      </div>
    </div>
  )
}