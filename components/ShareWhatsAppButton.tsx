'use client'

import { Button } from '@/components/ui/button'

interface ShareWhatsAppButtonProps {
  raffleTitle: string
  raffleUrl: string
  whatsapp?: string | null
}

export function ShareWhatsAppButton({ raffleTitle, raffleUrl, whatsapp }: ShareWhatsAppButtonProps) {
  function handleShare() {
    const text = `Te invito a participar en la rifa "${raffleTitle}". Elige tu número aquí: ${raffleUrl}`
    const url = whatsapp
      ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <Button
      onClick={handleShare}
      className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.527 5.845L0 24l6.318-1.508A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.003-1.365l-.359-.214-3.75.895.93-3.657-.234-.376A9.818 9.818 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z" />
      </svg>
      Compartir por WhatsApp
    </Button>
  )
}
