'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Raffle, RaffleNumber, NumberStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRaffleStore } from '@/store/raffle-store'
import { useRealtimeNumbers } from '@/hooks/useRealtimeNumbers'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { toast } from 'sonner'
import { ExternalLink, Trash2, Search, ArrowLeft, UserPlus, Pencil, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RaffleManageClientProps {
  raffle: Raffle
  initialNumbers: RaffleNumber[]
}

// ─── Modal de asignación manual ───────────────────────────────────────────────
function AssignModal({
  number,
  open,
  onClose,
  onSaved,
}: {
  number: RaffleNumber | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'reserved' | 'paid'>('reserved')
  const [loading, setLoading] = useState(false)

  // Pre-rellenar si ya tiene datos (edición)
  useEffect(() => {
    if (number) {
      setName(number.participant_name ?? '')
      setPhone(number.participant_phone ?? '')
      setStatus(number.status === 'paid' ? 'paid' : 'reserved')
    }
  }, [number])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!number) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('raffle_numbers')
      .update({
        participant_name: name.trim(),
        participant_phone: phone.trim(),
        status,
        reserved_at: new Date().toISOString(),
      })
      .eq('id', number.id)

    setLoading(false)

    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success(`Número ${number.number} asignado a ${name.trim()}`)
      onSaved()
      onClose()
    }
  }

  const isEdit = number?.status !== 'available'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <div
          className="p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #1e3a8a)' }}
        >
          <DialogTitle className="text-sm font-medium opacity-70">
            {isEdit ? 'Editar asignación' : 'Asignar número'}
          </DialogTitle>
          <div className="text-5xl font-black mt-1 tracking-tight">{number?.number}</div>
          <p className="text-sm opacity-60 mt-1">{isEdit ? 'Modifica los datos del comprador' : 'Registra quién compró este número'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assign-name">Nombre del comprador</Label>
            <Input
              id="assign-name"
              placeholder="Carlos García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-phone">Teléfono</Label>
            <Input
              id="assign-phone"
              type="tel"
              inputMode="tel"
              placeholder="3001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estado del pago</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'reserved' | 'paid')}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reserved">🟡 Reservado (pendiente de pago)</SelectItem>
                <SelectItem value="paid">🟢 Pagado (confirmado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="flex-1 h-11 font-semibold bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Asignar número'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-11 px-4">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function RaffleManageClient({ raffle, initialNumbers }: RaffleManageClientProps) {
  const router = useRouter()
  const { setNumbers, numbers } = useRaffleStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<NumberStatus | 'all'>('all')
  const [deletingRaffle, setDeletingRaffle] = useState(false)
  const [assignTarget, setAssignTarget] = useState<RaffleNumber | null>(null)

  useEffect(() => {
    setNumbers(initialNumbers)
  }, [initialNumbers, setNumbers])

  useRealtimeNumbers(raffle.id)

  const filtered = numbers.filter((n) => {
    const matchSearch =
      n.number.includes(search) ||
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
    const updates: Partial<RaffleNumber> = { status: newStatus }
    // Al liberar, limpiamos también el participante
    if (newStatus === 'available') {
      updates.participant_name = null
      updates.participant_phone = null
      updates.reserved_at = null
    }
    const { error } = await supabase
      .from('raffle_numbers')
      .update(updates)
      .eq('id', number.id)

    if (error) {
      toast.error('Error al actualizar')
    } else {
      toast.success(`Número ${number.number} liberado`)
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
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver pública
          </Link>
          <Link
            href={`/dashboard/raffles/${raffle.id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Settings2 className="w-4 h-4 mr-1" />
            Editar
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
          { label: 'Disponibles', value: stats.available, color: 'bg-emerald-100 text-emerald-800' },
          { label: 'Reservados', value: stats.reserved, color: 'bg-yellow-100 text-yellow-800' },
          { label: 'Pagados', value: stats.paid, color: 'bg-red-100 text-red-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs mt-1 opacity-70">{label}</div>
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

              {n.participant_name ? (
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Nombre: </span>
                    <span className="font-medium">{n.participant_name}</span>
                  </div>
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin asignar</p>
              )}

              <div className="flex gap-2 pt-1 flex-wrap">
                {/* Asignar / Editar */}
                <Button
                  size="sm"
                  variant={n.status === 'available' ? 'default' : 'outline'}
                  className={cn('flex-1 h-8 text-xs gap-1', n.status === 'available' && 'bg-primary')}
                  onClick={() => setAssignTarget(n)}
                >
                  {n.status === 'available'
                    ? <><UserPlus className="w-3 h-3" /> Asignar</>
                    : <><Pencil className="w-3 h-3" /> Editar</>}
                </Button>

                {/* Marcar pagado (solo si está reservado) */}
                {n.status === 'reserved' && (
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => updateStatus(n, 'paid')}
                  >
                    ✓ Pagado
                  </Button>
                )}

                {/* Liberar */}
                {n.status !== 'available' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={() => updateStatus(n, 'available')}
                  >
                    Liberar
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
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay resultados
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold">{n.number}</td>
                    <td className="px-4 py-3">
                      {n.participant_name ?? <span className="text-muted-foreground italic text-xs">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3">
                      {n.participant_phone ? (
                        <a
                          href={`https://wa.me/${n.participant_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          {n.participant_phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {/* Asignar o Editar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAssignTarget(n)}
                        >
                          {n.status === 'available'
                            ? <><UserPlus className="w-3 h-3" />Asignar</>
                            : <><Pencil className="w-3 h-3" />Editar</>}
                        </Button>

                        {n.status === 'reserved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-emerald-700 hover:text-emerald-700"
                            onClick={() => updateStatus(n, 'paid')}
                          >
                            Marcar pagado
                          </Button>
                        )}

                        {n.status !== 'available' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => updateStatus(n, 'available')}
                          >
                            Liberar
                          </Button>
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

      {/* Modal de asignación */}
      <AssignModal
        number={assignTarget}
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onSaved={() => setAssignTarget(null)}
      />
    </div>
  )
}
