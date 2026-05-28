'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Raffle, RaffleNumber } from '@/types'
import { RaffleHeader } from '@/components/RaffleHeader'
import { PrizeCard } from '@/components/PrizeCard'
import { NumberGrid } from '@/components/NumberGrid'
import { ReserveModal } from '@/components/ReserveModal'
import { ShareWhatsAppButton } from '@/components/ShareWhatsAppButton'
import { useRaffleStore } from '@/store/raffle-store'
import { useRealtimeNumbers } from '@/hooks/useRealtimeNumbers'

interface RafflePageClientProps {
  raffle: Raffle
  numbers: RaffleNumber[]
  raffleUrl: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function RafflePageClient({ raffle, numbers, raffleUrl }: RafflePageClientProps) {
  const [selectedNumber, setSelectedNumber] = useState<RaffleNumber | null>(null)
  const { setNumbers } = useRaffleStore()

  useEffect(() => {
    setNumbers(numbers)
  }, [numbers, setNumbers])

  useRealtimeNumbers(raffle.id)

  return (
    <div className="min-h-screen bg-background">

      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }}>
          <RaffleHeader raffle={raffle} />
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <ShareWhatsAppButton
            raffleTitle={raffle.title}
            raffleUrl={raffleUrl}
            whatsapp={raffle.whatsapp}
          />
        </motion.div>

        {/* Prizes */}
        {raffle.prizes && raffle.prizes.length > 0 && (
          <motion.section
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-primary inline-block" />
              Premios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {raffle.prizes
                .sort((a, b) => a.position - b.position)
                .map((prize) => (
                  <PrizeCard key={prize.id} prize={prize} />
                ))}
            </div>
          </motion.section>
        )}

        {/* Numbers */}
        <motion.section
          className="space-y-4"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary inline-block" />
            Elige tu número
          </h2>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <NumberGrid onSelectNumber={setSelectedNumber} />
          </div>
        </motion.section>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Al reservar serás contactado por WhatsApp para confirmar tu pago.
        </p>
      </div>

      <ReserveModal
        number={selectedNumber}
        raffle={raffle}
        open={!!selectedNumber}
        onClose={() => setSelectedNumber(null)}
      />
    </div>
  )
}
