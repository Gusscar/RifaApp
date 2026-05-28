'use client'

import { motion } from 'framer-motion'
import { useRaffleStore } from '@/store/raffle-store'
import { NumberCard } from './NumberCard'
import { RaffleNumber } from '@/types'

interface NumberGridProps {
  onSelectNumber?: (number: RaffleNumber) => void
}

export function NumberGrid({ onSelectNumber }: NumberGridProps) {
  const numbers = useRaffleStore((s) => s.numbers)

  const available = numbers.filter((n) => n.status === 'available').length
  const reserved = numbers.filter((n) => n.status === 'reserved').length
  const paid = numbers.filter((n) => n.status === 'paid').length
  const total = numbers.length

  const pctAvailable = total ? Math.round((available / total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Disponibles</span>
          <span className="font-semibold">{available} / {total}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pctAvailable}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block" />
          <span className="text-muted-foreground">Disponible <strong className="text-foreground">({available})</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-400 inline-block" />
          <span className="text-muted-foreground">Reservado <strong className="text-foreground">({reserved})</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-rose-500 inline-block" />
          <span className="text-muted-foreground">Pagado <strong className="text-foreground">({paid})</strong></span>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.004 } },
        }}
      >
        {numbers.map((number) => (
          <motion.div
            key={number.id}
            variants={{
              hidden: { opacity: 0, scale: 0.7 },
              show: { opacity: 1, scale: 1 },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <NumberCard number={number} onClick={onSelectNumber} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
