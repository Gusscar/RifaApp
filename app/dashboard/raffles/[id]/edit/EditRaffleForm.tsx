'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ImagePlus, X, Palette, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Raffle, Prize } from '@/types'
import { getTextColor, contrastRatio } from '@/lib/utils/color-utils'

interface EditRaffleFormProps {
  raffle: Raffle & { prizes: Prize[] }
}

export function EditRaffleForm({ raffle }: EditRaffleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(raffle.title)
  const [description, setDescription] = useState(raffle.description ?? '')
  const [lotteryName, setLotteryName] = useState(raffle.lottery_name ?? '')
  const [drawDate, setDrawDate] = useState(raffle.draw_date ?? '')
  const [drawTime, setDrawTime] = useState(raffle.draw_time ?? '')
  const [price, setPrice] = useState(raffle.number_price?.toString() ?? '')
  const [whatsapp, setWhatsapp] = useState(raffle.whatsapp ?? '')

  // Image
  const [existingCover, setExistingCover] = useState(raffle.cover_image ?? '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [removeCover, setRemoveCover] = useState(false)

  // Colors
  const [bgColor, setBgColor] = useState(raffle.bg_color ?? '#0f0520')
  const [accentColor, setAccentColor] = useState(raffle.accent_color ?? '#7c3aed')

  // Prizes — sorted by position
  const sorted = [...(raffle.prizes ?? [])].sort((a, b) => a.position - b.position)
  const [prize1, setPrize1] = useState(sorted.find(p => p.position === 1)?.title ?? '')
  const [prize2, setPrize2] = useState(sorted.find(p => p.position === 2)?.title ?? '')
  const [prize3, setPrize3] = useState(sorted.find(p => p.position === 3)?.title ?? '')

  useEffect(() => {
    return () => { if (coverPreview) URL.revokeObjectURL(coverPreview) }
  }, [coverPreview])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen debe pesar menos de 5 MB'); return }
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setRemoveCover(false)
  }

  function clearNewImage() {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadImage(userId: string): Promise<string | null> {
    if (!coverFile) return null
    const supabase = createClient()
    const ext = coverFile.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('raffle-covers')
      .upload(path, coverFile, { upsert: true })
    if (error) { toast.error('Error al subir la imagen'); return null }
    const { data: { publicUrl } } = supabase.storage.from('raffle-covers').getPublicUrl(data.path)
    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sesión expirada'); setLoading(false); return }

    // Determine final cover URL
    let coverUrl: string | null = existingCover || null
    if (removeCover) {
      coverUrl = null
    } else if (coverFile) {
      const uploaded = await uploadImage(user.id)
      if (!uploaded) { setLoading(false); return }
      coverUrl = uploaded
    }

    // Update raffle
    const { error: raffleError } = await supabase
      .from('raffles')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        lottery_name: lotteryName.trim() || null,
        draw_date: drawDate || null,
        draw_time: drawTime || null,
        number_price: price ? parseFloat(price) : null,
        whatsapp: whatsapp.trim() || null,
        cover_image: coverUrl,
        bg_color: bgColor,
        accent_color: accentColor,
      })
      .eq('id', raffle.id)

    if (raffleError) {
      toast.error('Error al guardar los cambios')
      setLoading(false)
      return
    }

    // Replace prizes: delete existing then reinsert
    await supabase.from('prizes').delete().eq('raffle_id', raffle.id)

    const prizeData = [
      { position: 1, title: prize1.trim() || null },
      { position: 2, title: prize2.trim() || null },
      { position: 3, title: prize3.trim() || null },
    ].filter(p => p.title)

    if (prizeData.length > 0) {
      await supabase.from('prizes').insert(
        prizeData.map(p => ({ ...p, raffle_id: raffle.id, image: null }))
      )
    }

    toast.success('Rifa actualizada')
    router.push(`/dashboard/raffles/${raffle.id}`)
    router.refresh()
  }

  const textColor = getTextColor(bgColor)
  const ratio = contrastRatio(bgColor, textColor)
  const contrastOk = ratio >= 4.5

  // Which image preview to show
  const previewSrc = coverPreview || (!removeCover ? existingCover : '')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <Link
        href={`/dashboard/raffles/${raffle.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la rifa
      </Link>

      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Información básica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lottery">Lotería o chance</Label>
            <Input id="lottery" value={lotteryName} onChange={e => setLotteryName(e.target.value)} placeholder="Ej: Lotería del Cauca" />
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <Label>Imagen de portada</Label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {previewSrc ? (
              <div className="relative rounded-xl overflow-hidden h-44 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewSrc} alt="Portada" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => { clearNewImage(); setExistingCover(''); setRemoveCover(true) }}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600/80 transition-colors"
                    aria-label="Quitar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {coverPreview && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-xs bg-black/60 text-white">
                    Nueva imagen
                  </div>
                )}
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

      {/* Colors */}
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
                  onChange={e => setBgColor(e.target.value)}
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
                  onChange={e => setAccentColor(e.target.value)}
                  className="h-10 w-14 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                />
                <span className="text-sm font-mono text-muted-foreground">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: bgColor }}>
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, #ec4899, ${accentColor})` }} />
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs font-bold" style={{ color: accentColor }}>🎟 RifaApp</p>
              <p
                className="font-extrabold text-lg leading-tight"
                style={{
                  color: textColor,
                  textShadow: textColor === '#ffffff' ? '0 2px 8px rgba(0,0,0,0.7)' : '0 1px 4px rgba(255,255,255,0.5)',
                }}
              >
                {title || 'Nombre de tu rifa'}
              </p>
              <div className="flex gap-1 flex-wrap">
                {[{ n: '05', c: '#10b981' }, { n: '12', c: '#f59e0b' }, { n: '28', c: '#f43f5e' }, { n: '41', c: '#10b981' }].map(({ n, c }) => (
                  <span key={n} className="text-xs font-bold rounded px-1.5 py-0.5"
                    style={{ background: c + '25', color: c, border: `1px solid ${c}60` }}>{n}</span>
                ))}
              </div>
              <div className="rounded-lg px-3 py-2 text-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(90deg, ${accentColor}, #ec4899)` }}>
                ¡Reserva tu número aquí!
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${contrastOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {contrastOk
              ? <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Buen contraste ({ratio.toFixed(1)}:1)</>
              : <><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Contraste bajo ({ratio.toFixed(1)}:1) — prueba un fondo más oscuro o más claro</>
            }
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
              <Input id="date" type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={drawTime} onChange={e => setDrawTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="price">Precio por número (COP)</Label>
            <Input id="price" type="number" placeholder="5000" value={price} onChange={e => setPrice(e.target.value)} min="0" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="whatsapp">WhatsApp del organizador</Label>
            <Input id="whatsapp" type="tel" placeholder="573001234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
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
            <Input id="prize1" placeholder="Ej: Toyota Corolla 2024" value={prize1} onChange={e => setPrize1(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prize2">2do Premio</Label>
            <Input id="prize2" placeholder="Ej: Moto Honda" value={prize2} onChange={e => setPrize2(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prize3">3er Premio</Label>
            <Input id="prize3" placeholder="Ej: Televisor 55 pulgadas" value={prize3} onChange={e => setPrize3(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-8">
        <Button type="submit" className="flex-1" size="lg" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        <Link
          href={`/dashboard/raffles/${raffle.id}`}
          className="px-5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
