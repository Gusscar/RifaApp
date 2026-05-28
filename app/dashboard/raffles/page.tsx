import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink, Settings } from 'lucide-react'

export default async function RafflesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: raffles } = await supabase
    .from('raffles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Rifas</h1>
        <Link href="/dashboard/raffles/new" className={cn(buttonVariants())}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva rifa
        </Link>
      </div>

      {!raffles || raffles.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Aún no has creado ninguna rifa.</p>
          <Link href="/dashboard/raffles/new" className={cn(buttonVariants())}>
            Crear mi primera rifa
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {raffles.map((raffle) => (
            <Card key={raffle.id} className="overflow-hidden">
              {raffle.cover_image && (
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={raffle.cover_image}
                    alt={raffle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight">{raffle.title}</h3>
                  {raffle.draw_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sorteo: {new Date(raffle.draw_date + 'T00:00:00').toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{raffle.digits === 2 ? '00-99' : '000-999'}</Badge>
                  {raffle.number_price && (
                    <Badge variant="secondary">
                      ${Number(raffle.number_price).toLocaleString('es-CO')}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/raffles/${raffle.id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1')}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Gestionar
                  </Link>
                  <Link
                    href={`/r/${raffle.slug}`}
                    target="_blank"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
