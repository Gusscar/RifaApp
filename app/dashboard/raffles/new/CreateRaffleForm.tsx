'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, formatNumber } from '@/lib/utils/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function CreateRaffleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lotteryName, setLotteryName] = useState('')
  const [drawDate, setDrawDate] = useState('')
  const [drawTime, setDrawTime] = useState('')
  const [digits, setDigits] = useState<'2' | '3'>('2')
  const [price, setPrice] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [coverImage, setCoverImage] = useState('')

  // Prizes
  const [prize1, setPrize1] = useState('')
  const [prize2, setPrize2] = useState('')
  const [prize3, setPrize3] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Debes iniciar sesión')
      setLoading(false)
      return
    }

    const slug = generateSlug(title)
    const digitsNum = parseInt(digits) as 2 | 3

    // Create raffle
    const { data: raffle, error: raffleError } = await supabase
      .from('raffles')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        slug,
        cover_image: coverImage.trim() || null,
        lottery_name: lotteryName.trim() || null,
        draw_date: drawDate || null,
        draw_time: drawTime || null,
        digits: digitsNum,
        number_price: price ? parseFloat(price) : null,
        whatsapp: whatsapp.trim() || null,
      })
      .select()
      .single()

    if (raffleError || !raffle) {
      toast.error('Error al crear la rifa')
      setLoading(false)
      return
    }

    // Insert prizes
    const prizeData = [
      { position: 1, title: prize1.trim() || null },
      { position: 2, title: prize2.trim() || null },
      { position: 3, title: prize3.trim() || null },
    ].filter((p) => p.title)

    if (prizeData.length > 0) {
      await supabase.from('prizes').insert(
        prizeData.map((p) => ({ ...p, raffle_id: raffle.id, image: null }))
      )
    }

    // Generate numbers
    const total = digitsNum === 2 ? 100 : 1000
    const numbersToInsert = Array.from({ length: total }, (_, i) => ({
      raffle_id: raffle.id,
      number: formatNumber(i, digitsNum),
      status: 'available' as const,
    }))

    // Insert in batches of 200
    for (let i = 0; i < numbersToInsert.length; i += 200) {
      const batch = numbersToInsert.slice(i, i + 200)
      const { error } = await supabase.from('raffle_numbers').insert(batch)
      if (error) {
        toast.error('Error generando números')
        setLoading(false)
        return
      }
    }

    toast.success('Rifa creada exitosamente')
    router.push(`/dashboard/raffles/${raffle.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Información básica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ej: Rifa del carro 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu rifa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lottery">Lotería o chance</Label>
            <Input
              id="lottery"
              placeholder="Ej: Lotería del Cauca"
              value={lotteryName}
              onChange={(e) => setLotteryName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cover">URL imagen de portada</Label>
            <Input
              id="cover"
              type="url"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Draw settings */}
      <Card>
        <CardHeader><CardTitle>Sorteo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={drawTime}
                onChange={(e) => setDrawTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tipo de números</Label>
              <Select value={digits} onValueChange={(v) => setDigits(v as '2' | '3')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">00 - 99 (100 números)</SelectItem>
                  <SelectItem value="3">000 - 999 (1000 números)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Precio por número (COP)</Label>
              <Input
                id="price"
                type="number"
                placeholder="5000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="whatsapp">WhatsApp del organizador</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="573001234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Incluye el código de país. Ej: 573001234567</p>
          </div>
        </CardContent>
      </Card>

      {/* Prizes */}
      <Card>
        <CardHeader><CardTitle>Premios</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="prize1">1er Premio</Label>
            <Input
              id="prize1"
              placeholder="Ej: Toyota Corolla 2024"
              value={prize1}
              onChange={(e) => setPrize1(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prize2">2do Premio</Label>
            <Input
              id="prize2"
              placeholder="Ej: Moto Honda"
              value={prize2}
              onChange={(e) => setPrize2(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prize3">3er Premio</Label>
            <Input
              id="prize3"
              placeholder="Ej: Televisor 55 pulgadas"
              value={prize3}
              onChange={(e) => setPrize3(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Creando rifa...' : 'Crear rifa'}
      </Button>
    </form>
  )
}
