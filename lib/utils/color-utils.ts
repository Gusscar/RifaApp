/** WCAG relative luminance for a hex color */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Returns '#ffffff' or '#1a1a1a' — whichever contrasts better with the bg */
export function getTextColor(hex: string): '#ffffff' | '#1a1a1a' {
  return luminance(hex) > 0.35 ? '#1a1a1a' : '#ffffff'
}

/** WCAG contrast ratio (1–21) between two hex colors */
export function contrastRatio(bg: string, fg: string = '#ffffff'): number {
  const l1 = luminance(bg)
  const l2 = luminance(fg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
