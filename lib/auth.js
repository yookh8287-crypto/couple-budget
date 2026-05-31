import { supabase } from './supabase'

// 회원가입
export async function signUp(email, password, nickname, role) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error }

  // 프로필 생성
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: data.user.id, nickname, role }])

  if (profileError) return { error: profileError }
  return { data }
}

// 로그인
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error }
  return { data }
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 현재 유저 가져오기
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 프로필 가져오기
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, couples(*)')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

// 커플 코드 생성 (남편이 생성)
export async function createCouple(userId) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data: couple, error } = await supabase
    .from('couples')
    .insert([{ code }])
    .select()
    .single()
  if (error) return { error }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .eq('id', userId)

  if (updateError) return { error: updateError }
  return { couple }
}

// 커플 코드로 연결 (아내가 입력)
export async function joinCouple(userId, code) {
  const { data: couple, error } = await supabase
    .from('couples')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !couple) return { error: { message: '유효하지 않은 코드예요.' } }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .eq('id', userId)

  if (updateError) return { error: updateError }
  return { couple }
}