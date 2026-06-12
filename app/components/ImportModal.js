'use client'

import { useState, useRef } from 'react'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/data'

function formatDateTimeKR(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function ImportModal({ onClose, onImport, coupleId }) {
  const [step, setStep] = useState('upload') // upload | preview | done
  const [parsed, setParsed] = useState([])
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [lastImportAt, setLastImportAt] = useState(null)
  const fileRef = useRef()

  // 날짜 범위 기본값: 이번달 1일 ~ 오늘
  useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    setEndDate(`${y}-${m}-${d}`)
    setStartDate(`${y}-${m}-01`)

    // 마지막 가져오기 날짜 조회
    if (coupleId) {
      supabase.from('couple_settings')
        .select('last_import_at, last_import_date')
        .eq('couple_id', coupleId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.last_import_at) {
            setLastImportAt(data.last_import_at)
            if (data.last_import_date) setStartDate(data.last_import_date)
          }
        })
    }
  }, [coupleId])

  function parseAmount(raw) {
    if (!raw) return 0
    return parseInt(String(raw).replace(/[^0-9-]/g, '')) || 0
  }

  function parseDate(raw) {
    if (!raw) return null
    const s = String(raw).trim()
    // YYYY.MM.DD or YYYY-MM-DD or YYYY/MM/DD
    const m = s.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/)
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
    return null
  }

  async function handleFile(file) {
    setError('')
    setLoading(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // 헤더 행 찾기 (날짜 컬럼 있는 행)
      let headerIdx = -1
      let headers = []
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i].map(c => String(c).trim())
        if (row.some(c => c.includes('날짜') || c.includes('일자') || c === '거래일')) {
          headerIdx = i
          headers = row
          break
        }
      }
      if (headerIdx === -1) {
        setError('날짜 컬럼을 찾을 수 없어요. 뱅크샐러드 엑셀 파일인지 확인해주세요.')
        setLoading(false)
        return
      }

      // 컬럼 인덱스
      const colIdx = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)))
      const dateCol = colIdx(['날짜', '일자', '거래일'])
      const nameCol = colIdx(['내용', '적요', '거래처', '상호'])
      const amountCol = colIdx(['금액', '출금', '지출'])
      const incomeCol = colIdx(['입금', '수입'])
      const categoryCol = colIdx(['분류', '카테고리'])

      const txList = []
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.every(c => c === '')) continue
        const date = parseDate(row[dateCol])
        if (!date) continue

        // 날짜 범위 필터
        if (startDate && date < startDate) continue
        if (endDate && date > endDate) continue

        const rawAmount = parseAmount(row[amountCol])
        const rawIncome = incomeCol >= 0 ? parseAmount(row[incomeCol]) : 0
        const isIncome = rawIncome > 0 && rawAmount === 0
        const amount = isIncome ? rawIncome : rawAmount
        if (amount === 0) continue

        txList.push({
          date,
          name: String(row[nameCol] || '').trim() || '내역없음',
          amount,
          category: categoryCol >= 0 ? String(row[categoryCol] || '').trim() : (isIncome ? '기타수입' : '기타'),
          icon: isIncome ? '💰' : '💳',
          who: 'h',
          recurring: false,
          unnecessary: false,
          excluded: false,
          hidden: false,
          couple_id: coupleId,
          memo: '',
          payment_method: '',
        })
      }

      if (txList.length === 0) {
        setError('가져올 내역이 없어요. 날짜 범위를 확인해주세요.')
        setLoading(false)
        return
      }

      // 중복 체크
      const { data: existing } = await supabase
        .from('transactions')
        .select('name, amount, date')
        .eq('couple_id', coupleId)
        .gte('date', startDate || '2000-01-01')
        .lte('date', endDate || '2099-12-31')

      const existingSet = new Set((existing || []).map(t => `${t.date}|${t.name}|${t.amount}`))
      const newTxs = []
      const dupTxs = []
      for (const tx of txList) {
        const key = `${tx.date}|${tx.name}|${tx.amount}`
        if (existingSet.has(key)) dupTxs.push(tx)
        else newTxs.push(tx)
      }

      setParsed(newTxs)
      setDuplicates(dupTxs)
      setStep('preview')
    } catch (e) {
      setError('파일을 읽는 중 오류가 발생했어요: ' + e.message)
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (parsed.length === 0) return
    setLoading(true)
    try {
      await onImport(parsed)

      // last_import_at 저장
      const now = new Date().toISOString()
      const { data: existing } = await supabase
        .from('couple_settings')
        .select('id')
        .eq('couple_id', coupleId)
        .maybeSingle()

      if (existing?.id) {
        await supabase.from('couple_settings').update({
          last_import_at: now,
          last_import_date: endDate,
          updated_at: now,
        }).eq('couple_id', coupleId)
      } else {
        await supabase.from('couple_settings').insert({
          couple_id: coupleId,
          last_import_at: now,
          last_import_date: endDate,
          updated_at: now,
        })
      }

      setStep('done')
    } catch (e) {
      setError('저장 중 오류가 발생했어요.')
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🏦</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>뱅크샐러드 가져오기</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 32px' }}>

          {/* 마지막 가져오기 */}
          {lastImportAt && step === 'upload' && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              마지막 가져오기: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTimeKR(lastImportAt)}</strong>
            </div>
          )}

          {step === 'upload' && (
            <>
              {/* 날짜 범위 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>가져올 날짜 범위</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>~</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>

              {/* 파일 업로드 */}
              <div onClick={() => fileRef.current?.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>엑셀 파일 선택</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>뱅크샐러드 → 내보내기 → 엑셀(.xlsx)</div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }} />

              {error && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: '#fff0f0', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertCircle size={16} color="#e03" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#c00' }}>{error}</span>
                </div>
              )}
              {loading && <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>파일 분석 중...</div>}
            </>
          )}

          {step === 'preview' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>가져오기 미리보기</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, padding: '12px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{parsed.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>새 내역</div>
                  </div>
                  <div style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)' }}>{duplicates.length}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>중복 (건너뜀)</div>
                  </div>
                </div>
              </div>

              {parsed.length > 0 && (
                <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                  {parsed.slice(0, 30).map((tx, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{tx.date} · {tx.category}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        -{tx.amount.toLocaleString()}원
                      </div>
                    </div>
                  ))}
                  {parsed.length > 30 && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', padding: '8px 0' }}>
                      외 {parsed.length - 30}건 더...
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{ marginBottom: 14, padding: '12px 14px', background: '#fff0f0', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#c00' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setStep('upload'); setParsed([]); setDuplicates([]); setError('') }}
                  style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  다시 선택
                </button>
                <button onClick={handleConfirm} disabled={loading || parsed.length === 0}
                  style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', border: 'none', background: parsed.length > 0 ? 'var(--blue)' : 'var(--border)', color: 'white', fontSize: 14, fontWeight: 700, cursor: parsed.length > 0 ? 'pointer' : 'default' }}>
                  {loading ? '저장 중...' : `${parsed.length}건 가져오기`}
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <CheckCircle size={52} color="var(--green)" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>가져오기 완료!</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>{parsed.length}건이 추가됐어요.</div>
              <button onClick={onClose} style={{ padding: '14px 40px', borderRadius: 'var(--radius-md)', background: 'var(--blue)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}