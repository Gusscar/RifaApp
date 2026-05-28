'use client'

import { useState, useRef, useEffect } from 'react'
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
import { ImagePlus, X, Palette, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getTextColor, contrastRatio } from '@/lib/utils/generate-poster'

export function CreateRaffleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lotteryName, setLotteryName] = useState('')
  const [drawDate, setDrawDate] = useState('')
  const [drawTime, setDrawTime] = useState('')
  const [digits, setDigits] = useState<'2' | '3'>('2')
  const [price, setPrice] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  // Image
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')

  // Colors
  const [bgColor, setBgColor] = useState('#0f0520')
  const [accentColor, setAccentColor] = useState('#7c3aed')

  // Prizes
  const [prize1, setPrize1] = useState('')
  const [prize2, setPrize2] = useState('')
  const [prize3, setPrize3] = useState('')

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5 MB')
      return
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadCoverImage(userId: string): Promise<string | null> {
    if (!coverFile) return null
    const supabase = createClient()
    const ext = coverFile.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('raffle-covers')
      .upload(path, coverFile, { upsert: true })
    if (error) {
      toast.error('Error al subir la imagen')
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from('raffle-covers').getPublicUrl(data.path)
    return publicUrl
  }

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

    // Upload image if selected
    const coverUrl = await uploadCoverImage(user.id)
    if (coverFile && !coverUrl) {
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
        cover_image: coverUrl,
        lottery_name: lotteryName.trim() || null,
        draw_date: drawDate || null,
        draw_time: drawTime || null,
        digits: digitsNum,
        number_price: price ? parseFloat(price) : null,
        whatsapp: whatsapp.trim() || null,
        bg_color: bgColor,
        accent_color: accentColor,
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

    // Generate numbers in batches of 200
    const total = digitsNum === 2 ? 100 : 1000
    const numbersToInsert = Array.from({ length: total }, (_, i) => ({
      raffle_id: raffle.id,
      number: formatNumber(i, digitsNum),
      status: 'available' as const,
    }))

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

          {/* Cover image upload */}
          <div className="space-y-2">
            <Label>Imagen de portada</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {coverPreview ? (
              <div className="relative rounded-xl overflow-hidden h-44 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Quitar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">Subir imagen desde el dispositivo</span>
                <span className="text-xs">JPG, PNG, WEBP · Máx 5 MB</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Colores de la rifa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bgColor">Color de fondo</Label>
              <div className="flex items-center gap-3">
                <input
                  id="bgColor"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-14 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                />
                <span className="text-sm font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Color de acento</Label>
              <div className="flex items-center gap-3">
                <input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                />
                <span className="text-sm font-mono text-muted-foreground">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Live preview card */}
          <div
            className="rounded-2xl overflow-hidden border border-white/10 shadow-lg"
            style={{ background: bgColor }}
          >
            {/* Accent top bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${accentColor}, #ec4899, ${accentColor})` }}
            />
            <div className="px-4 py-5 space-y-2">
              {/* Branding */}
              <p className="text-xs font-bold" style={{ color: accentColor }}>🎟 RifaApp</p>
              {/* Title */}
              <p
                className="font-extrabold text-lg leading-tight"
                style={{ color: getTextColor(bgColor), textShadow: getTextColor(bgColor) === '#ffffff' ? '0 2px 8px rgba(0,0,0,0.7)' : '0 1px 4px rgba(255,255,255,0.5)' }}
              >
                {title || 'Nombre de tu rifa'}
              </p>
              {/* Info row */}
              <p className="text-xs" style={{ color: getTextColor(bgColor) === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                📅 Fecha sorteo · 💵 Precio
              </p>
              {/* Number chips sample */}
              <div className="flex gap-1 flex-wrap pt-1">
                {[
                  { n: '05', c: '#10b981' },
                  { n: '12', c: '#f59e0b' },
                  { n: '28', c: '#f43f5e' },
                  { n: '41', c: '#10b981' },
                  { n: '67', c: '#10b981' },
                ].map(({ n, c }) => (
                  <span
                    key={n}
                    className="text-xs font-bold rounded px-1.5 py-0.5"
                    style={{ background: c + '25', color: c, border: `1px solid ${c}60` }}
                  >
                    {n}
                  </span>
                ))}
                <span className="text-xs" style={{ color: getTextColor(bgColor) === '#ffffff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }}>...</span>
              </div>
              {/* CTA mini */}
              <div
                className="rounded-lg px-3 py-2 text-center text-xs font-bold text-white mt-1"
                style={{ background: `linear-gradient(90deg, ${accentColor}, #ec4899)` }}
              >
                ¡Reserva tu número aquí!
              </div>
            </div>
          </div>

          {/* Contrast warning */}
          {(() => {
            const tc = getTextColor(bgColor)
            const ratio = contrastRatio(bgColor, tc)
            const ok = ratio >= 4.5
            return (
              <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {ok
                  ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Buen contraste — el texto se verá legible ({ratio.toFixed(1)}:1)</>
                  : <><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Contraste bajo ({ratio.toFixed(1)}:1) — prueba un color de fondo más oscuro o más claro</>
                }
              </div>
            )
          })()}
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
