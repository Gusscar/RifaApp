'use client'

import { motion } from 'framer-motion'
import { RaffleNumber } from '@/types'
import { cn } from '@/lib/utils'

const statusStyles = {
  available: {
    base: 'bg-emerald-500 text-white cursor-pointer shadow-sm shadow-emerald-700/30',
    hover: 'hover:bg-emerald-400 hover:shadow-md hover:shadow-emerald-500/40',
  },
  reserved: {
    base: 'bg-amber-400 text-amber-900 cursor-not-allowed shadow-sm shadow-amber-600/20',
    hover: '',
  },
  paid: {
    base: 'bg-rose-500 text-white cursor-not-allowed shadow-sm shadow-rose-700/30',
    hover: '',
  },
}

interface NumberCardProps {
  number: RaffleNumber
  onClick?: (number: RaffleNumber) => void
}

export function NumberCard({ number, onClick }: NumberCardProps) {
  const isAvailable = number.status === 'available'
  const styles = statusStyles[number.status]

  const tooltip =
    number.status === 'reserved'
      ? `Reservado por ${number.participant_name}`
      : number.status === 'paid'
      ? `Pagado por ${number.participant_name}`
      : 'Disponible — haz clic para reservar'

  return (
    <motion.button
      disabled={!isAvailable}
      onClick={() => isAvailable && onClick?.(number)}
      title={tooltip}
      whileHover={isAvailable ? { scale: 1.12, y: -2 } : {}}
      whileTap={isAvailable ? { scale: 0.95 } : {}}
      layout
      className={cn(
        'flex items-center justify-center rounded-xl font-bold text-sm select-none',
        'h-10 w-full transition-colors duration-150',
        styles.base,
        styles.hover
      )}
    >
      {number.number}
    </motion.button>
  )
}
