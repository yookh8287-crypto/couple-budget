import { supabase } from './supabase'
export { supabase }

// 거래 내역 불러오기 (couple_id 기반)
export async function getTransactions(coupleId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date', { ascending: false })
  if (error) console.error(error)
  return data || []
}

// 거래 내역 추가
export async function addTransaction(tx, coupleId) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...tx, couple_id: coupleId }])
    .select()
  if (error) console.error(error)
  return data?.[0]
}

// 불필요 소비 토글
export async function toggleUnnecessary(id, value) {
  const { error } = await supabase
    .from('transactions')
    .update({ unnecessary: value })
    .eq('id', id)
  if (error) console.error(error)
}

// 저축 목표 불러오기
export async function getSavings(coupleId) {
  const { data, error } = await supabase
    .from('savings')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true })
  if (error) console.error(error)
  return data || []
}

// 예산 불러오기
export async function getBudgets(coupleId) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true })
  if (error) console.error(error)
  return data || []
}

// 숫자 포맷
export function formatKRW(amount) {
  const abs = Math.abs(amount)
  return (amount < 0 ? '-' : '') + abs.toLocaleString() + '원'
}

// 날짜 포맷
export function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - d) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// 멤버 필터
export function filterByMember(transactions, member) {
  if (member === 'all') return transactions
  return transactions.filter(t => t.who === member || t.who === 'both')
}

// 카테고리별 집계
export function getCategoryTotals(transactions) {
  const map = {}
  transactions.forEach(t => {
    if (t.amount < 0) {
      if (!map[t.category]) map[t.category] = 0
      map[t.category] += Math.abs(t.amount)
    }
  })
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}