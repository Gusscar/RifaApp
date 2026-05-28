import type { Raffle, RaffleNumber } from '@/types'

export type PosterFormat = 'poster' | 'status'

export async function generateRafflePoster(
  raffle: Raffle,
  numbers: RaffleNumber[],
  raffleUrl: string,
  format: PosterFormat = 'poster'
): Promise<Blob> {
  return format === 'status'
    ? generateStatus(raffle, raffleUrl)
    : generatePoster(raffle, numbers, raffleUrl)
}

// ─────────────────────────────────────────────
// POSTER (flyer vertical para compartir)
// ─────────────────────────────────────────────

async function generatePoster(raffle: Raffle, numbers: RaffleNumber[], raffleUrl: string): Promise<Blob> {
  const W = 600
  const sorted = [...numbers].sort((a, b) => a.number.localeCompare(b.number))
  const total = sorted.length
  const bg = raffle.bg_color ?? '#0f0520'
  const accent = raffle.accent_color ?? '#7c3aed'

  const textColor = getTextColor(bg)
  const subColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)'
  const shadowColor = textColor === '#ffffff' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.7)'

  const cols = total <= 100 ? 10 : 25
  const cellW = Math.floor((W - 48) / cols)
  const cellH = total <= 100 ? 28 : 14
  const rows = Math.ceil(total / cols)

  const hasCover = !!raffle.cover_image
  const prizes = (raffle.prizes ?? []).filter(p => p.title)
  const imgH = hasCover ? 210 : 0
  const prizeH = prizes.length * 28 + (prizes.length > 0 ? 20 : 0)
  const H = 8 + 60 + imgH + 110 + 44 + prizeH + 50 + rows * cellH + 36 + 90 + 8
  const totalH = Math.max(H, 700)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  // ── Background ──
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, totalH)

  // Radial glow overlay using accent
  const glow = ctx.createRadialGradient(W / 2, totalH * 0.3, 0, W / 2, totalH * 0.3, 360)
  glow.addColorStop(0, hexAlpha(accent, 0.22))
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, totalH)

  // ── Top bar ──
  const barGrad = linearGrad(ctx, 0, 0, W, 0, [[0, accent], [0.5, '#ec4899'], [1, accent]])
  ctx.fillStyle = barGrad
  ctx.fillRect(0, 0, W, 8)

  let y = 34

  // ── Branding ──
  setShadow(ctx, shadowColor, 6)
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = accent
  ctx.fillText('🎟 RifaApp', 24, y)
  clearShadow(ctx)

  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = subColor
  ctx.fillText(raffleUrl, W - 24, y)
  y = 58

  // ── Cover image ──
  if (hasCover && raffle.cover_image) {
    try {
      const img = await loadImage(raffle.cover_image)
      const iX = 24, iY = y, iW = W - 48
      roundRect(ctx, iX, iY, iW, imgH, 16)
      ctx.save()
      ctx.clip()
      const scale = Math.max(iW / img.width, imgH / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, iX + (iW - dw) / 2, iY + (imgH - dh) / 2, dw, dh)
      ctx.restore()
      // Gradient overlay bottom of image
      roundRect(ctx, iX, iY, iW, imgH, 16)
      const ov = ctx.createLinearGradient(0, iY, 0, iY + imgH)
      ov.addColorStop(0.4, 'transparent')
      ov.addColorStop(1, hexAlpha(bg, 0.75))
      ctx.fillStyle = ov
      ctx.fill()
    } catch { /* skip */ }
    y += imgH + 16
  }

  // ── Title pill background for readability ──
  const titleBgH = 100
  const titleBg = ctx.createLinearGradient(0, y, 0, y + titleBgH)
  titleBg.addColorStop(0, hexAlpha(bg, hasCover ? 0 : 0.0))
  titleBg.addColorStop(1, hexAlpha(bg, 0.0))
  ctx.fillStyle = titleBg
  ctx.fillRect(0, y, W, titleBgH)

  // ── Title ──
  ctx.textAlign = 'center'
  ctx.fillStyle = textColor
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  setShadow(ctx, shadowColor, 10)
  y = wrapText(ctx, raffle.title, W / 2, y + 38, W - 64, 44) + 22
  clearShadow(ctx)

  // ── Info row (date, price, lottery) ──
  const infoParts: string[] = []
  if (raffle.draw_date) {
    const d = new Date(raffle.draw_date + 'T12:00:00')
    infoParts.push(`📅 ${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`)
  }
  if (raffle.number_price) {
    infoParts.push(`💵 $${raffle.number_price.toLocaleString('es-CO')} c/u`)
  }
  if (raffle.lottery_name) infoParts.push(`🎲 ${raffle.lottery_name}`)

  if (infoParts.length > 0) {
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = subColor
    setShadow(ctx, shadowColor, 6)
    ctx.fillText(infoParts.join('   ·   '), W / 2, y)
    clearShadow(ctx)
    y += 36
  }

  // ── Prizes ──
  if (prizes.length > 0) {
    const medals = ['🥇', '🥈', '🥉']
    // Pill background
    const pBg = hexAlpha(accent, 0.12)
    roundRect(ctx, 24, y - 6, W - 48, prizes.length * 28 + 16, 12)
    ctx.fillStyle = pBg
    ctx.fill()
    ctx.strokeStyle = hexAlpha(accent, 0.25)
    ctx.lineWidth = 1
    ctx.stroke()

    y += 10
    ctx.font = '15px system-ui, -apple-system, sans-serif'
    for (const prize of [...prizes].sort((a, b) => a.position - b.position)) {
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      setShadow(ctx, shadowColor, 5)
      ctx.fillText(`${medals[prize.position - 1]}  ${prize.title}`, W / 2, y)
      clearShadow(ctx)
      y += 28
    }
    y += 10
  }

  // ── Divider ──
  ctx.strokeStyle = hexAlpha(accent, 0.35)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(24, y)
  ctx.lineTo(W - 24, y)
  ctx.stroke()
  y += 18

  // ── Numbers header + legend ──
  ctx.textAlign = 'left'
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha(accent, 0.95)
  ctx.fillText('NÚMEROS', 24, y + 8)

  const legend: [number, string, string][] = [
    [W - 24 - 215, '#10b981', 'Disponible'],
    [W - 24 - 130, '#f59e0b', 'Reservado'],
    [W - 24 - 42, '#f43f5e', 'Pagado'],
  ]
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  for (const [lx, color, label] of legend) {
    ctx.fillStyle = color
    ctx.fillRect(lx, y + 1, 8, 8)
    ctx.fillStyle = subColor
    ctx.textAlign = 'left'
    ctx.fillText(label, lx + 11, y + 9)
  }
  y += 20

  // ── Numbers grid ──
  const gridLeft = 24
  ctx.font = `bold ${total <= 100 ? 10 : 7}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'

  for (let i = 0; i < sorted.length; i++) {
    const num = sorted[i]
    const col = i % cols
    const row = Math.floor(i / cols)
    const nx = gridLeft + col * cellW
    const ny = y + row * cellH
    const color = num.status === 'available' ? '#10b981'
      : num.status === 'reserved' ? '#f59e0b' : '#f43f5e'

    if (cellH >= 20) {
      ctx.fillStyle = hexAlpha(color, 0.2)
      ctx.fillRect(nx + 1, ny + 1, cellW - 2, cellH - 2)
      ctx.strokeStyle = hexAlpha(color, 0.6)
      ctx.lineWidth = 0.5
      ctx.strokeRect(nx + 1, ny + 1, cellW - 2, cellH - 2)
      ctx.fillStyle = color
      ctx.fillText(num.number, nx + cellW / 2, ny + cellH - 8)
    } else {
      ctx.fillStyle = color
      ctx.fillRect(nx + 1, ny + 1, cellW - 3, cellH - 3)
    }
  }
  y += rows * cellH + 14

  // ── Stats ──
  const available = sorted.filter(n => n.status === 'available').length
  const sold = sorted.length - available
  ctx.textAlign = 'center'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = subColor
  ctx.fillText(`${available} disponibles · ${sold} vendidos de ${total}`, W / 2, y)
  y += 22

  // ── CTA box ──
  const ctaY = y + 8
  const ctaH = 66
  roundRect(ctx, 24, ctaY, W - 48, ctaH, 14)
  const ctaGrad = linearGrad(ctx, 24, ctaY, W - 24, ctaY, [[0, accent], [1, '#ec4899']])
  ctx.fillStyle = ctaGrad
  ctx.fill()

  setShadow(ctx, 'rgba(0,0,0,0.5)', 8)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('¡Reserva tu número aquí!', W / 2, ctaY + 26)
  clearShadow(ctx)

  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.fillText(raffleUrl, W / 2, ctaY + 48)

  // ── Bottom bar ──
  ctx.fillStyle = barGrad
  ctx.fillRect(0, totalH - 8, W, 8)

  return toBlob(canvas)
}

// ─────────────────────────────────────────────
// STATUS (9:16 para estado de WhatsApp)
// ─────────────────────────────────────────────

async function generateStatus(raffle: Raffle, raffleUrl: string): Promise<Blob> {
  const W = 600
  const H = 1067 // 9:16
  const bg = raffle.bg_color ?? '#0f0520'
  const accent = raffle.accent_color ?? '#7c3aed'
  const textColor = getTextColor(bg)
  const subColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.55)'
  const shadowColor = textColor === '#ffffff' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.8)'
  const prizes = (raffle.prizes ?? []).filter(p => p.title)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // ── Background ──
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Glow top
  const glow1 = ctx.createRadialGradient(W / 2, H * 0.25, 0, W / 2, H * 0.25, 380)
  glow1.addColorStop(0, hexAlpha(accent, 0.35))
  glow1.addColorStop(1, 'transparent')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, W, H)

  // Glow bottom
  const glow2 = ctx.createRadialGradient(W / 2, H * 0.85, 0, W / 2, H * 0.85, 280)
  glow2.addColorStop(0, hexAlpha('#ec4899', 0.2))
  glow2.addColorStop(1, 'transparent')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, W, H)

  // ── Top + bottom bars ──
  const barGrad = linearGrad(ctx, 0, 0, W, 0, [[0, accent], [0.5, '#ec4899'], [1, accent]])
  ctx.fillStyle = barGrad
  ctx.fillRect(0, 0, W, 10)
  ctx.fillRect(0, H - 10, W, 10)

  // ── Cover image (tall, centered) ──
  let contentTop = 90
  if (raffle.cover_image) {
    try {
      const img = await loadImage(raffle.cover_image)
      const iX = 0, iY = 0, iW = W, iH = H * 0.55
      ctx.save()
      ctx.rect(iX, iY, iW, iH)
      ctx.clip()
      const scale = Math.max(iW / img.width, iH / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, (iW - dw) / 2, (iH - dh) / 2, dw, dh)
      ctx.restore()
      // Dark gradient over image bottom → transition to bg
      const fadeH = iH * 0.7
      const fade = ctx.createLinearGradient(0, iH - fadeH, 0, iH + 40)
      fade.addColorStop(0, 'transparent')
      fade.addColorStop(1, bg)
      ctx.fillStyle = fade
      ctx.fillRect(0, iH - fadeH, W, fadeH + 40)
      contentTop = iH - 30
    } catch { /* skip */ }
  }

  // ── RifaApp branding ──
  setShadow(ctx, shadowColor, 8)
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = accent
  ctx.fillText('🎟 RifaApp', W / 2, contentTop + 36)
  clearShadow(ctx)

  // ── Title ──
  ctx.fillStyle = textColor
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
  setShadow(ctx, shadowColor, 14)
  const titleY = wrapText(ctx, raffle.title, W / 2, contentTop + 88, W - 64, 62)
  clearShadow(ctx)

  let y = titleY + 36

  // ── Info ──
  const infoParts: string[] = []
  if (raffle.draw_date) {
    const d = new Date(raffle.draw_date + 'T12:00:00')
    infoParts.push(`📅 ${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`)
  }
  if (raffle.number_price) infoParts.push(`💵 $${raffle.number_price.toLocaleString('es-CO')} c/u`)
  if (raffle.lottery_name) infoParts.push(`🎲 ${raffle.lottery_name}`)

  if (infoParts.length > 0) {
    ctx.font = '20px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = subColor
    setShadow(ctx, shadowColor, 6)
    ctx.fillText(infoParts.join('  ·  '), W / 2, y)
    clearShadow(ctx)
    y += 42
  }

  // ── Prizes ──
  if (prizes.length > 0) {
    const medals = ['🥇', '🥈', '🥉']
    roundRect(ctx, 40, y - 10, W - 80, prizes.length * 40 + 24, 18)
    const pillBg = ctx.createLinearGradient(40, y, W - 40, y)
    pillBg.addColorStop(0, hexAlpha(accent, 0.18))
    pillBg.addColorStop(1, hexAlpha('#ec4899', 0.18))
    ctx.fillStyle = pillBg
    ctx.fill()
    ctx.strokeStyle = hexAlpha(accent, 0.4)
    ctx.lineWidth = 1.5
    ctx.stroke()

    y += 20
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
    for (const p of [...prizes].sort((a, b) => a.position - b.position)) {
      ctx.fillStyle = textColor
      setShadow(ctx, shadowColor, 5)
      ctx.fillText(`${medals[p.position - 1]}  ${p.title}`, W / 2, y)
      clearShadow(ctx)
      y += 40
    }
    y += 14
  }

  // ── Big CTA ──
  const ctaH = 80
  const ctaY = H - 10 - ctaH - 50
  roundRect(ctx, 40, ctaY, W - 80, ctaH, 20)
  const ctaGrad = linearGrad(ctx, 40, ctaY, W - 40, ctaY, [[0, accent], [1, '#ec4899']])
  ctx.fillStyle = ctaGrad
  ctx.fill()

  setShadow(ctx, 'rgba(0,0,0,0.6)', 10)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
  ctx.fillText('¡Reserva tu número!', W / 2, ctaY + 32)
  clearShadow(ctx)
  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(raffleUrl, W / 2, ctaY + 58)

  // ── Safe-zone hint for status (subtle corner text) ──
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha(textColor, 0.25)
  ctx.textAlign = 'center'
  ctx.fillText('Estado de WhatsApp', W / 2, H - 18)

  return toBlob(canvas)
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** WCAG relative luminance → pick white or dark text */
export function getTextColor(hex: string): '#ffffff' | '#1a1a1a' {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return L > 0.35 ? '#1a1a1a' : '#ffffff'
}

/** WCAG contrast ratio (1-21) */
export function contrastRatio(bg: string, fg: string = '#ffffff'): number {
  const lum = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }
  const L1 = lum(bg), L2 = lum(fg)
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
}

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function setShadow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 1
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

function linearGrad(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  stops: [number, string][]
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([pos, color]) => g.addColorStop(pos, color))
  return g
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(' ')
  let line = '', curY = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, curY)
      line = word + ' '
      curY += lh
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, curY)
  return curY
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}
