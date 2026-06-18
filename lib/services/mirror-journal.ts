import { insforge } from '../insforge'

export interface MirrorEntry {
  id: string
  user_id: string
  week_start: string
  title: string
  content: string
  data: Record<string, unknown> | null
  viewed_at: string | null
  created_at: string
}

async function getUserId(): Promise<string | null> {
  const { data } = await insforge.auth.getCurrentUser()
  return data?.user?.id ?? null
}

export async function getJournalEntries(): Promise<{ data: MirrorEntry[] | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('mirrors')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: error.message }
  return { data: data as MirrorEntry[] | null, error: null }
}

export async function getJournalEntry(date: string): Promise<{ data: MirrorEntry | null; error: string | null }> {
  const { data, error } = await insforge.database
    .from('mirrors')
    .select('*')
    .eq('week_start', date)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as MirrorEntry) ?? null, error: null }
}

export async function upsertJournalEntry(
  date: string,
  title: string,
  content: string
): Promise<{ data: MirrorEntry | null; error: string | null }> {
  const userId = await getUserId()
  if (!userId) return { data: null, error: 'Not authenticated' }

  const { data: existing } = await insforge.database
    .from('mirrors')
    .select('id')
    .eq('week_start', date)
    .maybeSingle()

  if (existing) {
    const { data, error } = await insforge.database
      .from('mirrors')
      .update({ title, content })
      .eq('week_start', date)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as MirrorEntry, error: null }
  }

  const { data, error } = await insforge.database
    .from('mirrors')
    .insert([{ user_id: userId, week_start: date, title, content }])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as MirrorEntry, error: null }
}
