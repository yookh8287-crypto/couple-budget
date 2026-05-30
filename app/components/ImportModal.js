'use client'

import { useState } from 'react'
import { X, Upload, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

const CATEGORY_MAP = {
  '식비': '식비',
  '외식': '외식',
  '카페': '카페',
  '술/유흥': '외식',
  '교통': '교통',
  '자동차': '교통',
  '주거/통신': '주거',
  '통신': '주거',
  '온라인쇼핑': '쇼핑',
  '쇼핑': '쇼핑',
  '의류/미용': '쇼핑',
  '금융': '금융',
  '보험': '금융',
  '의료/건강': '건강',
  '건강': '건강',
  '문화/여가': '여가',
  '여행/숙박': '여가',
  '교육': '교육',
  '기타수입': '수입',
  '용돈': '수입',
  '급여': '수입',
}

const ICON_MAP = {
  '식비': '🛒',
  '외식': '🍽️',
  '카페': '☕',
  '교통': '⛽',
  '주거': '🏠',
  '쇼핑': '🛍️',
  '금융': '💳',
  '건강': '🏥',
  '여가': '🎮',
  '교육': '📚',
  '수입': '💰',
  '기타': '💳',
}

export default function ImportModal({ onClose, onImport }) {
  const [step, setStep] = useState('upload')
  const [preview, setPreview] = useState([])
  const [who, setWho] = useState('h')
  const [loading, setLoading] = useState(false)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: true })
        const sheet = wb.Sheets[wb.SheetNames[1]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        const parsed = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row || row.length < 7) continue

          const dateRaw = row[0]
          const type = row[2]
          const bigCat = row[3]
          const name = row[5]
          const amount = row[6]

          if (!name || !amount || !type) continue
          if (String(type) !== '지출' && String(type) !== '수입') continue

          let dateStr = ''
          if (dateRaw instanceof Date) {
            dateStr = dateRaw.toISOString().split('T')[0]
          } else if (typeof dateRaw === 'string') {
            dateStr = dateRaw.split(' ')[0]
          } else {
            continue
          }

          const cat = CATEGORY_MAP[bigCat] || '기타'
          const icon = ICON_MAP[cat] || '💳'
          const amt = Number(amount)

          parsed.push({
            name: String(name),
            amount: amt,
            category: cat,
            icon,
            who,
            date: dateStr,
            recurring: false,
            unnecessary: false,
          })
        }

        setPreview(parsed.slice(0, 5))
        setStep('preview')
        setLoading(false)
        window._allImportData = parsed
      } catch (err) {
        console.error(err)
        alert('파일을 읽는 중 오류가 발생했어요. 뱅크샐러드 엑셀 파일인지 확인해주세요.')
        setLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  async function handleImport() {
    setLoading(true)
    const all = window._allImportData || []
    await onImport(all)
    setLoading(false)
    setStep('done')
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
          <span style={{ fontSize: 17, fontWeight: 700 }}>뱅크샐러드 가져오기</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={22} />
          </button>
        </div>

        {step === 'upload' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              뱅크샐러드 앱 → 더보기 → 가계부 내역 내보내기 → 엑셀 파일을 업로드해주세요.
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>누구의 내역인가요?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['h', '👨 남편'], ['w', '👩 아내'], ['both', '공동']].map(([val, label]) => (
                  <button key={val}
                    onClick={() => setWho(val)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      background: who === val ? 'var(--blue)' : 'var(--bg-primary)',
                      color: who === val ? 'white' : 'var(--text-secondary)',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '32px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', background: 'var(--bg-secondary)',
            }}>
              <Upload size={28} color="var(--text-tertiary)" />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {loading ? '읽는 중...' : '엑셀 파일 선택'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>.xlsx 파일만 가능해요</span>
              <input type="file" accept=".xlsx" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </>
        )}

        {step === 'preview' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              총 <strong style={{ color: 'var(--text-primary)' }}>{(window._allImportData || []).length}건</strong>의 내역을 가져올 수 있어요. 미리보기:
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20 }}>
              {preview.map((tx, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < preview.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{tx.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{tx.category} · {tx.date}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: tx.amount > 0 ? 'var(--green)' : 'var(--text-primary)' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleImport}
              disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                background: 'var(--blue)', color: 'white', border: 'none',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
              }}>
              {loading ? '가져오는 중...' : `${(window._allImportData || []).length}건 모두 가져오기`}
            </button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>가져오기 완료!</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              내역이 성공적으로 추가됐어요.
            </div>
            <button onClick={onClose} style={{
              width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--blue)', color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}