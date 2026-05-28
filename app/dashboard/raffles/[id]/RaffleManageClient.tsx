'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Raffle, RaffleNumber, NumberStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRaffleStore } from '@/store/raffle-store'
import { useRealtimeNumbers } from '@/hooks/useRealtimeNumbers'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/StatusBadge'
import { toast } from 'sonner'
import { ExternalLink, Trash2, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RaffleManageClientProps {
  raffle: Raffle
  initialNumbers: RaffleNumber[]
}

export function RaffleManageClient({ raffle, initialNumbers }: RaffleManageClientProps) {
  const router = useRouter()
  const { setNumbers, numbers } = useRaffleStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<NumberStatus | 'all'>('all')
  const [deletingRaffle, setDeletingRaffle] = useState(false)

  useEffect(() => {
    setNumbers(initialNumbers)
  }, [initialNumbers, setNumbers])

  useRealtimeNumbers(raffle.id)

  const filtered = numbers.filter((n) => {
    const matchSearch = n.number.includes(search) ||
      (n.participant_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchFilter = filter === 'all' || n.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: numbers.length,
    available: numbers.filter((n) => n.status === 'available').length,
    reserved: numbers.filter((n) => n.status === 'reserved').length,
    paid: numbers.filter((n) => n.status === 'paid').length,
  }

  async function updateStatus(number: RaffleNumber, newStatus: NumberStatus) {
    const supabase = createClient()
    const { error } = await supabase
      .from('raffle_numbers')
      .update({ status: newStatus })
      .eq('id', number.id)

    if (error) {
      toast.error('Error al actualizar')
    } else {
      toast.success(`Número ${number.number} → ${newStatus}`)
    }
  }

  async function handleDeleteRaffle() {
    if (!confirm('¿Seguro que quieres eliminar esta rifa? Esta acción no se puede deshacer.')) return
    setDeletingRaffle(true)
    const supabase = createClient()
    const { error } = await supabase.from('raffles').delete().eq('id', raffle.id)
    if (error) {
      toast.error('Error al eliminar')
      setDeletingRaffle(false)
    } else {
      toast.success('Rifa eliminada')
      router.push('/dashboard/raffles')
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/raffles"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis rifas
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{raffle.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus participantes</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver pública
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteRaffle}
            disabled={deletingRaffle}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-muted' },
          { label: 'Disponibles', value: stats.available, color: 'bg-green-100' },
          { label: 'Reservados', value: stats.reserved, color: 'bg-yellow-100' },
          { label: 'Pagados', value: stats.paid, color: 'bg-red-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar número o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as NumberStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="reserved">Reservados</SelectItem>
            <SelectItem value="paid">Pagados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* MOBILE: Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No hay resultados</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg">{n.number}</span>
                <StatusBadge status={n.status} />
              </div>
              {n.participant_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Nombre: </span>
                  <span className="font-medium">{n.participant_name}</span>
                </div>
              )}
              {n.participant_phone && (
                <a
                  href={`https://wa.me/${n.participant_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 flex items-center gap-1"
                >
                  📱 {n.participant_phone}
                </a>
              )}
              <div className="flex gap-2 pt-1">
                {n.status !== 'available' && (
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => updateStatus(n, 'available')}>
                    Liberar
                  </Button>
                )}
                {n.status === 'reserved' && (
                  <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus(n, 'paid')}>
                    Marcar pagado
                  </Button>
                )}
                {n.status === 'available' && (
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => updateStatus(n, 'reserved')}>
                    Reservar
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden sm:block rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Número</th>
                <th className="text-left px-4 py-3 font-medium">Participante</th>
                <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-left px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">No hay resultados</td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold">{n.number}</td>
                    <td className="px-4 py-3">{n.participant_name ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">
                      {n.participant_phone ? (
                        <a href={`https://wa.me/${n.participant_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          {n.participant_phone}
                        </a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {n.status !== 'available' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus(n, 'available')}>Liberar</Button>
                        )}
                        {n.status === 'reserved' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-green-700" onClick={() => updateStatus(n, 'paid')}>Marcar pagado</Button>
                        )}
                        {n.status === 'available' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus(n, 'reserved')}>Reservar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Mostrando {filtered.length} de {numbers.length} números
      </p>
    </div>
  )
}
