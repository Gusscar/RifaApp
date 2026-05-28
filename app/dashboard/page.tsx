import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Ticket, Users, DollarSign, Plus, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raffles } = await supabase
    .from('raffles')
    .select('id')
    .eq('user_id', user.id)

  const raffleIds = raffles?.map((r) => r.id) ?? []

  let totalParticipants = 0
  let totalPaid = 0

  if (raffleIds.length > 0) {
    const { count: participants } = await supabase
      .from('raffle_numbers')
      .select('id', { count: 'exact', head: true })
      .in('raffle_id', raffleIds)
      .in('status', ['reserved', 'paid'])

    const { count: paid } = await supabase
      .from('raffle_numbers')
      .select('id', { count: 'exact', head: true })
      .in('raffle_id', raffleIds)
      .eq('status', 'paid')

    totalParticipants = participants ?? 0
    totalPaid = paid ?? 0
  }

  const name = user.user_metadata?.full_name?.split(' ')[0] ?? 'allí'

  const stats = [
    {
      label: 'Rifas activas',
      value: raffleIds.length,
      icon: Ticket,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
      border: 'border-violet-200',
      href: '/dashboard/raffles',
      hint: 'Ver mis rifas →',
    },
    {
      label: 'Participantes',
      value: totalParticipants,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      border: 'border-blue-200',
      href: '/dashboard/raffles',
      hint: 'Ver participantes →',
    },
    {
      label: 'Pagos confirmados',
      value: totalPaid,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-200',
      href: '/dashboard/raffles',
      hint: 'Gestionar pagos →',
    },
    {
      label: 'Tasa de pago',
      value: totalParticipants > 0 ? `${Math.round((totalPaid / totalParticipants) * 100)}%` : '—',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      border: 'border-amber-200',
      href: '/dashboard/raffles',
      hint: 'Ver detalle →',
    },
  ]

  return (
    <div className="p-6 space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hola, {name} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Aquí tienes el resumen de tus rifas.</p>
        </div>
        <Link href="/dashboard/raffles/new" className={cn(buttonVariants(), 'gap-2 shadow-sm shadow-primary/20')}>
          <Plus className="w-4 h-4" />
          Nueva rifa
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border, href, hint }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'rounded-2xl border bg-card p-5 block',
              'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
              border
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
            </div>
            <p className={cn('text-3xl font-extrabold', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-2">{hint}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">Acciones rápidas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/raffles/new"
            className="rounded-2xl border bg-card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold">Crear nueva rifa</h3>
            <p className="text-sm text-muted-foreground mt-1">Configura premios y genera tu enlace de WhatsApp.</p>
          </Link>

          <Link
            href="/dashboard/raffles"
            className="rounded-2xl border bg-card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold">Ver mis rifas</h3>
            <p className="text-sm text-muted-foreground mt-1">Gestiona participantes y confirma pagos.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
