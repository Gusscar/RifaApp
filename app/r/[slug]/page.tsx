import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RafflePageClient } from './RafflePageClient'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: raffle } = await supabase
    .from('raffles')
    .select('title, description')
    .eq('slug', slug)
    .single()

  if (!raffle) return { title: 'Rifa no encontrada' }

  return {
    title: raffle.title,
    description: raffle.description ?? undefined,
  }
}

export default async function RafflePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: raffle } = await supabase
    .from('raffles')
    .select('*, prizes(*)')
    .eq('slug', slug)
    .single()

  if (!raffle) notFound()

  const { data: numbers } = await supabase
    .from('raffle_numbers')
    .select('*')
    .eq('raffle_id', raffle.id)
    .order('number', { ascending: true })

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const raffleUrl = `${protocol}://${host}/r/${slug}`

  return (
    <RafflePageClient
      raffle={raffle}
      numbers={numbers ?? []}
      raffleUrl={raffleUrl}
    />
  )
}
