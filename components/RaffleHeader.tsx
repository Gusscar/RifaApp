import { Raffle } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

export function RaffleHeader({ raffle }: { raffle: Raffle }) {
  const drawDate = raffle.draw_date
    ? new Date(raffle.draw_date + 'T00:00:00').toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="space-y-3">
      {raffle.cover_image && (
        <div className="aspect-video overflow-hidden rounded-xl shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={raffle.cover_image}
            alt={raffle.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-2xl font-bold leading-tight">{raffle.title}</h1>
        {raffle.description && (
          <p className="text-muted-foreground text-sm">{raffle.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {raffle.lottery_name && (
          <Badge variant="secondary">{raffle.lottery_name}</Badge>
        )}
        {raffle.number_price && (
          <Badge variant="outline">
            ${Number(raffle.number_price).toLocaleString('es-CO')} por número
          </Badge>
        )}
      </div>

      {(drawDate || raffle.draw_time) && (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {drawDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {drawDate}
            </span>
          )}
          {raffle.draw_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {raffle.draw_time}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
