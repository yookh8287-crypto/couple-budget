'use client'

import { useState } from 'react'
import { Bell, Link, ChevronRight, Users, Download } from 'lucide-react'

export default function SettingsScreen({ onImport }) {
  const [alerts, setAlerts] = useState({
    budgetOver: true,
    recurring: true,
    monthlyReport: true,
  })

  function Toggle({ value, onChange }) {
    return (
      <div onClick={onChange} style={{
        width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
        background: value ? 'var(--blue)' : 'var(--border)', position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        }} />
      </div>
    )
  }

  function SettingRow({ label, children, border = true }) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '13px 0', borderBottom: border ? '1px solid var(--border)' : 'none',
      }}>
        <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>
        {children}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <div className="topbar">
        <span style={{ fontSize: 18, fontWeight: 700 }}>설정</span>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Download size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>데이터 가져오기</span>
        </div>
        <button
          onClick={onImport}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
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

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Users size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>가족 계정</span>
        </div>
        {[
          { initial: '남', label: '남편 계정', bg: '#ebf3fe', color: '#1469cc', status: '연결됨' },
          { initial: '여', label: '아내 계정', bg: '#fce8f3', color: '#9c2d6e', status: '연결됨' },
        ].map(({ initial, label, bg, color, status }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>● {status}</div>
            </div>
            <ChevronRight size={16} color="var(--text-tertiary)" />
          </div>
        ))}
        <div style={{ paddingTop: 12 }}>
          <button style={{
            width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)',
            background: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Link size={14} /> 초대 링크 공유
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Bell size={18} color="var(--blue)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>알림 설정</span>
        </div>
        <SettingRow label="예산 초과 알림">
          <Toggle value={alerts.budgetOver} onChange={() => setAlerts(a => ({ ...a, budgetOver: !a.budgetOver }))} />
        </SettingRow>
        <SettingRow label="정기 결제 알림">
          <Toggle value={alerts.recurring} onChange={() => setAlerts(a => ({ ...a, recurring: !a.recurring }))} />
        </SettingRow>
        <SettingRow label="월간 리포트" border={false}>
          <Toggle value={alerts.monthlyReport} onChange={() => setAlerts(a => ({ ...a, monthlyReport: !a.monthlyReport }))} />
        </SettingRow>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>
        우리 가계부 v0.1.0
      </div>
    </div>
  )
}