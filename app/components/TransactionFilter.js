'use client'

export const FILTER_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'amount_high', label: '금액높은순' },
  { key: 'amount_low', label: '금액낮은순' },
  { key: 'expense', label: '지출만' },
  { key: 'income', label: '수입만' },
]

export function applyFilter(list, filter) {
  let result = [...list]
  if (filter === 'expense') result = result.filter(t => t.amount < 0)
  else if (filter === 'income') result = result.filter(t => t.amount > 0)

  if (filter === 'latest') result.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (filter === 'oldest') result.sort((a, b) => new Date(a.date) - new Date(b.date))
  else if (filter === 'amount_high') result.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  else if (filter === 'amount_low') result.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount))
  else if (filter === 'expense') result.sort((a, b) => new Date(b.date) - new Date(a.date))
  else if (filter === 'income') result.sort((a, b) => new Date(b.date) - new Date(a.date))

  return result
}

export default function TransactionFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 16px 4px', scrollbarWidth: 'none' }}>
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          style={{
            flexShrink: 0,
            padding: '5px 12px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            fontSize: 12,
            fontWeight: value === opt.key ? 600 : 400,
            cursor: 'pointer',
            background: value === opt.key ? 'var(--blue)' : 'var(--bg-primary)',
            color: value === opt.key ? 'white' : 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}