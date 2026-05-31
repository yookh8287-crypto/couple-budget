'use client'

import { useState } from 'react'
import { signUp, signIn } from '@/lib/auth'

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ email: '', password: '', nickname: '', role: 'h' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setError('')
    setMessage('')
    if (!form.email || !form.password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    if (mode === 'signup' && !form.nickname) { setError('닉네임을 입력해주세요.'); return }

    setLoading(true)
    if (mode === 'signup') {
      const { error } = await signUp(form.email, form.password, form.nickname, form.role)
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('이메일을 확인해주세요! 인증 링크를 클릭하면 로그인할 수 있어요.')
      setLoading(false)
    } else {
      const { data, error } = await signIn(form.email, form.password)
      if (error) { setError('이메일 또는 비밀번호가 올바르지 않아요.'); setLoading(false); return }
      onAuth(data.user)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '14px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontSize: 15, color: 'var(--text-primary)',
    background: 'var(--bg-primary)', outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-tertiary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐷</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>우리 가계부</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>부부 공동 가계부</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }} style={{
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: mode === m ? 'var(--blue)' : 'var(--bg-primary)',
                color: mode === m ? 'white' : 'var(--text-secondary)',
              }}>
                {m === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <>
                <input style={inputStyle} placeholder="닉네임" value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['h', '👨 남편'], ['w', '👩 아내']].map(([val, label]) => (
                    <button key={val} onClick={() => setForm(f => ({ ...f, role: val }))} style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      fontSize: 14, fontWeight: 500, cursor: 'pointer',
                      background: form.role === val ? 'var(--blue)' : 'var(--bg-primary)',
                      color: form.role === val ? 'white' : 'var(--text-secondary)',
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input style={inputStyle} placeholder="이메일" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input style={inputStyle} placeholder="비밀번호 (6자 이상)" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--red-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--green)' }}>
              {message}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', marginTop: 20, padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--blue)', color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  )
}