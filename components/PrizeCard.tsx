import { Prize } from '@/types'
import { Card, CardContent } from '@/components/ui/card'

const positionLabel: Record<number, string> = {
  1: '1er Premio',
  2: '2do Premio',
  3: '3er Premio',
}

const positionColors: Record<number, string> = {
  1: 'text-yellow-600',
  2: 'text-gray-500',
  3: 'text-amber-700',
}

export function PrizeCard({ prize }: { prize: Prize }) {
  return (
    <Card className="overflow-hidden">
      {prize.image && (
        <div className="aspect-video relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={prize.image}
            alt={prize.title ?? 'Premio'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-3">
        <p className={`text-xs font-semibold uppercase tracking-wide ${positionColors[prize.position]}`}>
          {positionLabel[prize.position]}
        </p>
        {prize.title && <p className="font-medium text-sm mt-0.5">{prize.title}</p>}
      </CardContent>
    </Card>
  )
}
