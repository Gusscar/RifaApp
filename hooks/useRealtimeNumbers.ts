'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRaffleStore } from '@/store/raffle-store'
import { RaffleNumber } from '@/types'

export function useRealtimeNumbers(raffleId: string) {
  const { updateNumber } = useRaffleStore()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`raffle-numbers-${raffleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'raffle_numbers',
          filter: `raffle_id=eq.${raffleId}`,
        },
        (payload) => {
          const updated = payload.new as RaffleNumber
          updateNumber(updated.id, updated)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [raffleId, updateNumber])
}
