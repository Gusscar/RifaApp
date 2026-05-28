'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ImageDown, Loader2 } from 'lucide-react'
import { Raffle, RaffleNumber } from '@/types'
import { RaffleHeader } from '@/components/RaffleHeader'
import { PrizeCard } from '@/components/PrizeCard'
import { NumberGrid } from '@/components/NumberGrid'
import { ReserveModal } from '@/components/ReserveModal'
import { ShareWhatsAppButton } from '@/components/ShareWhatsAppButton'
import { useRaffleStore } from '@/store/raffle-store'
import { useRealtimeNumbers } from '@/hooks/useRealtimeNumbers'
import { toast } from 'sonner'

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
  const [sharingImage, setSharingImage] = useState(false)
  const { setNumbers, numbers: liveNumbers } = useRaffleStore()

  useEffect(() => {
    setNumbers(numbers)
  }, [numbers, setNumbers])

  useRealtimeNumbers(raffle.id)

  const handleShareImage = useCallback(async () => {
    setSharingImage(true)
    try {
      const { generateRafflePoster } = await import('@/lib/utils/generate-poster')
      const blob = await generateRafflePoster(raffle, liveNumbers, raffleUrl)
      const file = new File([blob], `rifa-${raffle.slug}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: raffle.title,
          text: `¡Reserva tu número en la rifa "${raffle.title}"! 🎟`,
        })
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Imagen descargada')
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('No se pudo generar la imagen')
      }
    } finally {
      setSharingImage(false)
    }
  }, [raffle, liveNumbers, raffleUrl])

  return (
    <div className="min-h-screen bg-background">

      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.4 }}>
          <RaffleHeader raffle={raffle} />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ShareWhatsAppButton
            raffleTitle={raffle.title}
            raffleUrl={raffleUrl}
            whatsapp={raffle.whatsapp}
          />
          <button
            onClick={handleShareImage}
            disabled={sharingImage}
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-300 transition-colors hover:bg-violet-500/20 disabled:opacity-60 sm:flex-1"
          >
            {sharingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageDown className="w-4 h-4" />
            )}
            {sharingImage ? 'Generando imagen...' : 'Compartir imagen de la rifa'}
          </button>
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
