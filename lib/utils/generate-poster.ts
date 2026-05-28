import type { Raffle, RaffleNumber } from '@/types'

export async function generateRafflePoster(
  raffle: Raffle,
  numbers: RaffleNumber[],
  raffleUrl: string
): Promise<Blob> {
  const W = 600
  const sorted = [...numbers].sort((a, b) => a.number.localeCompare(b.number))
  const total = sorted.length
  const bg = raffle.bg_color ?? '#0f0520'
  const accent = raffle.accent_color ?? '#7c3aed'

  // Calculate grid dimensions
  const cols = total <= 100 ? 10 : 25
  const cellW = Math.floor((W - 48) / cols)
  const cellH = total <= 100 ? 28 : 14
  const rows = Math.ceil(total / cols)

  // Calculate total height dynamically
  const hasCover = !!raffle.cover_image
  const prizes = raffle.prizes ?? []
  const imgH = hasCover ? 200 : 0
  const prizeH = prizes.length > 0 ? prizes.length * 26 + 16 : 0
  const H = 8 + 50 + imgH + 20 + 100 + 40 + prizeH + 50 + rows * cellH + 30 + 100 + 8
  const clampedH = Math.max(H, 600)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = clampedH
  const ctx = canvas.getContext('2d')!

  // ── Background ──
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, clampedH)

  // Subtle radial glow
  const glow = ctx.createRadialGradient(W / 2, clampedH * 0.35, 0, W / 2, clampedH * 0.35, 350)
  glow.addColorStop(0, hexAlpha(accent, 0.18))
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, clampedH)

  // ── Top gradient bar ──
  const barGrad = ctx.createLinearGradient(0, 0, W, 0)
  barGrad.addColorStop(0, accent)
  barGrad.addColorStop(0.5, '#ec4899')
  barGrad.addColorStop(1, accent)
  ctx.fillStyle = barGrad
  ctx.fillRect(0, 0, W, 8)

  let y = 30

  // ── Branding ──
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillStyle = hexAlpha(accent, 0.9)
  ctx.fillText('🎟 RifaApp', W - 24, y)

  ctx.font = '11px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha('#ffffff', 0.35)
  ctx.fillText(raffleUrl, W - 24, y + 18)

  y = 58

  // ── Cover image ──
  if (hasCover && raffle.cover_image) {
    try {
      const img = await loadImage(raffle.cover_image)
      const iX = 24, iY = y, iW = W - 48, iH = imgH
      roundRect(ctx, iX, iY, iW, iH, 14)
      ctx.save()
      ctx.clip()
      const scale = Math.max(iW / img.width, iH / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, iX + (iW - dw) / 2, iY + (iH - dh) / 2, dw, dh)
      ctx.restore()
      // Subtle overlay gradient on image
      roundRect(ctx, iX, iY, iW, iH, 14)
      const overlay = ctx.createLinearGradient(0, iY, 0, iY + iH)
      overlay.addColorStop(0, 'transparent')
      overlay.addColorStop(1, hexAlpha(bg, 0.6))
      ctx.fillStyle = overlay
      ctx.fill()
    } catch {
      // Skip image on error
    }
    y += imgH + 16
  }

  // ── Title ──
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif'
  y = wrapText(ctx, raffle.title, W / 2, y + 36, W - 48, 42) + 20

  // ── Date + price ──
  const infoParts: string[] = []
  if (raffle.draw_date) {
    const d = new Date(raffle.draw_date + 'T12:00:00')
    infoParts.push(`📅 ${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`)
  }
  if (raffle.number_price) {
    infoParts.push(`💵 $${raffle.number_price.toLocaleString('es-CO')} c/u`)
  }
  if (raffle.lottery_name) {
    infoParts.push(`🎲 ${raffle.lottery_name}`)
  }
  if (infoParts.length > 0) {
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = hexAlpha('#c4b5fd', 0.9)
    ctx.fillText(infoParts.join('   '), W / 2, y)
    y += 36
  }

  // ── Prizes ──
  if (prizes.length > 0) {
    const medals = ['🥇', '🥈', '🥉']
    ctx.font = '15px system-ui, -apple-system, sans-serif'
    for (const prize of [...prizes].sort((a, b) => a.position - b.position)) {
      if (!prize.title) continue
      ctx.fillStyle = '#e2e8f0'
      ctx.textAlign = 'center'
      ctx.fillText(`${medals[prize.position - 1]} ${prize.title}`, W / 2, y)
      y += 26
    }
    y += 10
  }

  // ── Divider ──
  ctx.strokeStyle = hexAlpha(accent, 0.3)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(24, y)
  ctx.lineTo(W - 24, y)
  ctx.stroke()
  y += 18

  // ── Numbers section header + legend ──
  ctx.textAlign = 'left'
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha(accent, 0.9)
  ctx.fillText('NÚMEROS', 24, y + 8)

  // Legend
  const legendItems: [number, string, string][] = [
    [W - 24 - 210, '#10b981', 'Disponible'],
    [W - 24 - 125, '#f59e0b', 'Reservado'],
    [W - 24 - 38, '#f43f5e', 'Pagado'],
  ]
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  for (const [lx, color, label] of legendItems) {
    ctx.fillStyle = color
    ctx.fillRect(lx, y, 8, 8)
    ctx.fillStyle = hexAlpha('#94a3b8', 0.9)
    ctx.textAlign = 'left'
    ctx.fillText(label, lx + 11, y + 8)
  }
  y += 22

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
      : num.status === 'reserved' ? '#f59e0b'
      : '#f43f5e'

    if (cellH >= 20) {
      // Filled bg + number text
      ctx.fillStyle = hexAlpha(color, 0.18)
      ctx.fillRect(nx + 1, ny + 1, cellW - 2, cellH - 2)
      ctx.strokeStyle = hexAlpha(color, 0.55)
      ctx.lineWidth = 0.5
      ctx.strokeRect(nx + 1, ny + 1, cellW - 2, cellH - 2)
      ctx.fillStyle = color
      ctx.fillText(num.number, nx + cellW / 2, ny + cellH / 2 + 4)
    } else {
      // Just solid squares
      ctx.fillStyle = color
      ctx.fillRect(nx + 1, ny + 1, cellW - 3, cellH - 3)
    }
  }

  y += rows * cellH + 16

  // ── Stats line ──
  const available = sorted.filter(n => n.status === 'available').length
  const sold = sorted.length - available
  ctx.textAlign = 'center'
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha('#94a3b8', 0.8)
  ctx.fillText(`${available} disponibles · ${sold} vendidos de ${total}`, W / 2, y)
  y += 24

  // ── CTA box ──
  const ctaY = y + 8
  const ctaH = 66
  roundRect(ctx, 24, ctaY, W - 48, ctaH, 14)
  const ctaGrad = ctx.createLinearGradient(24, ctaY, W - 24, ctaY + ctaH)
  ctaGrad.addColorStop(0, hexAlpha(accent, 0.9))
  ctaGrad.addColorStop(1, hexAlpha('#ec4899', 0.9))
  ctx.fillStyle = ctaGrad
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('¡Reserva tu número aquí!', W / 2, ctaY + 24)
  ctx.font = '12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = hexAlpha('#ffffff', 0.8)
  ctx.fillText(raffleUrl, W / 2, ctaY + 45)

  // ── Bottom bar ──
  ctx.fillStyle = barGrad
  ctx.fillRect(0, clampedH - 8, W, 8)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
}

// ── Helpers ──

function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, currentY)
  return currentY
}
