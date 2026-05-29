'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RaffleNumber, Raffle } from '@/types'
import { buildWhatsAppUrl } from '@/lib/utils/slug'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/PhoneInput'

interface ReserveModalProps {
  number: RaffleNumber | null
  raffle: Raffle
  open: boolean
  onClose: () => void
}

export function ReserveModal({ number, raffle, open, onClose }: ReserveModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+57')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!number) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('raffle_numbers')
      .update({
        participant_name: name,
        participant_phone: phone,
        status: 'reserved',
        reserved_at: new Date().toISOString(),
      })
      .eq('id', number.id)
      .eq('status', 'available')

    setLoading(false)

    if (error) {
      toast.error('Este número ya fue tomado. Elige otro.')
      onClose()
      return
    }

    toast.success(`¡Número ${number.number} reservado!`)

    if (raffle.whatsapp) {
      const msg = `Hola, aparté el número *${number.number}* para la rifa "${raffle.title}".\nMi nombre es ${name}.\nMi teléfono es ${phone}.`
      window.open(buildWhatsAppUrl(raffle.whatsapp, msg), '_blank')
    }

    setName('')
    setPhone('+57')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-0 overflow-hidden gap-0">
        {/* Header con número destacado */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <DialogTitle className="text-base font-medium opacity-80">Reservar número</DialogTitle>
          <div className="text-5xl font-black mt-1 tracking-tight">{number?.number}</div>
          <p className="text-sm opacity-70 mt-1">Rifa: {raffle.title}</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reserve-name" className="text-sm font-medium">Tu nombre</Label>
            <Input
              id="reserve-name"
              placeholder="Carlos García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reserve-phone" className="text-sm font-medium">Tu teléfono</Label>
            <PhoneInput
              id="reserve-phone"
              value={phone}
              onChange={setPhone}
              required
            />
          </div>

          {raffle.whatsapp && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Al reservar se abrirá WhatsApp para confirmar tu pago con el organizador.
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            disabled={loading}
          >
            {loading ? 'Reservando...' : '✓ Reservar y contactar por WhatsApp'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
