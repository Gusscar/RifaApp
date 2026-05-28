import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditRaffleForm } from './EditRaffleForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditRafflePage({ params }: PageProps) {
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

  // Normalize: replace undefined with null so RSC serialization doesn't fail
  // (happens when migration_v2 columns don't exist yet in the DB)
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar rifa</h1>
        <p className="text-muted-foreground text-sm mt-1">Los cambios se aplican de inmediato</p>
      </div>
      <EditRaffleForm raffle={normalized} />
    </div>
  )
}
