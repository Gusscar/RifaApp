import { Badge } from '@/components/ui/badge'
import { NumberStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<NumberStatus, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-green-100 text-green-800 border-green-200' },
  reserved: { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Pagado', className: 'bg-red-100 text-red-800 border-red-200' },
}

export function StatusBadge({ status }: { status: NumberStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
