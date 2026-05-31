'use client'

import { useState } from 'react'
import { createCouple, joinCouple } from '@/lib/auth'

export default function CoupleSetup({ user, profile, onComplete }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  async function handleCreate() {
    setLoading(true)
    const { couple, error } = await createCouple(user.id)
    if (error) { setError('코드 생성 중 오류가 발생했어요.'); setLoading(false); return }
    setCreatedCode(couple.code)
    setLoading(false)
  }

  async function handleJoin() {
    if (!code.trim()) { setError('코드를 입력해주세요.'); return }
    setLoading(true)
    const { error } = await joinCouple(user.id, code.toUpperCase())
    if (error) { setError(error.message); setLoading(false); return }
    onComplete()
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-tertiary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 390 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👫</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>커플 연결</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            안녕하세요, {profile?.nickname}님! 배우자와 연결해주세요.
          </div>
        </div>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setMode('create')} style={{
              padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              background: 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔑</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>초대 코드 생성</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>코드를 생성해서 배우자에게 공유해주세요</div>
            </button>
            <button onClick={() => setMode('join')} style={{
              padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              background: 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔗</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>코드 입력해서 연결</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>배우자에게 받은 코드를 입력해주세요</div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>초대 코드 생성</div>
            {!createdCode ? (
              <button onClick={handleCreate} disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                background: 'var(--blue)', color: 'white', border: 'none',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}>
                {loading ? '생성 중...' : '코드 생성하기'}
              </button>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>배우자에게 이 코드를 알려주세요</div>
                  <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 6, color: 'var(--blue)' }}>{createdCode}</div>
                </div>
                <button onClick={onComplete} style={{
                  width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                  background: 'var(--blue)', color: 'white', border: 'none',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                }}>
                  시작하기
                </button>
              </>
            )}
            <button onClick={() => setMode(null)} style={{ width: '100%', marginTop: 10, padding: '12px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>
              뒤로가기
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>코드 입력</div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="초대 코드 6자리"
              maxLength={6}
              style={{
                width: '100%', padding: '14px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 24, fontWeight: 700,
                letterSpacing: 6, textAlign: 'center', outline: 'none',
                background: 'var(--bg-primary)', color: 'var(--text-primary)',
                marginBottom: 12,
              }}
            />
            {error && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--red-light)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}
            <button onClick={handleJoin} disabled={loading} style={{
              width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--blue)', color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? '연결 중...' : '연결하기'}
            </button>
            <button onClick={() => { setMode(null); setError('') }} style={{ width: '100%', marginTop: 10, padding: '12px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>
              뒤로가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}