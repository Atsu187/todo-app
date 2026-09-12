/* ========================================

Supabase カテゴリ通信

======================================== */

import { supabase } from './supabase'
import type { TaskCategory } from '../types/category'

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('ログインしていません')
  }

  return data.user.id
}

export const fetchCategories = async (): Promise<TaskCategory[]> => {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as TaskCategory[]
}

export const createCategory = async (
  name: string
): Promise<TaskCategory> => {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: name.trim(),
    })
    .select('id, name')
    .single()

  if (error) {
    throw error
  }

  return data as TaskCategory
}

export const deleteCategory = async (
  categoryId: string
) => {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}
