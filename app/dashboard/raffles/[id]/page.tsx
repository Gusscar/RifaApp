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

  const normalized = {
    ...raffle,
    description: raffle.description ?? null,
    cover_image: raffle.cover_image ?? null,
    lottery_name: raffle.lottery_name ?? null,
    draw_date: raffle.draw_date ?? null,
    draw_time: raffle.draw_time ?? null,
    number_price: raffle.number_price ?? null,
    whatsapp: raffle.whatsapp ?? null,
    bg_color: raffle.bg_color ?? null,
    accent_color: raffle.accent_color ?? null,
    prizes: Array.isArray(raffle.prizes) ? raffle.prizes : [],
  }

  return <RaffleManageClient raffle={normalized} initialNumbers={numbers ?? []} />
}
