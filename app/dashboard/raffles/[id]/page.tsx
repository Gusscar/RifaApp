import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RaffleManageClient } from './RaffleManageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RaffleManagePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raffle } = await supabase
    .from('raffles')
    .select('*, prizes(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!raffle) notFound()

  const { data: numbers } = await supabase
    .from('raffle_numbers')
    .select('*')
    .eq('raffle_id', id)
    .order('number', { ascending: true })

  return <RaffleManageClient raffle={raffle} initialNumbers={numbers ?? []} />
}
