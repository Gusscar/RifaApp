'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Platform = 'android' | 'ios' | null

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<Platform>(null)
  const [visible, setVisible] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // No mostrar si el usuario ya la descartó antes
    if (sessionStorage.getItem('pwa-dismissed')) return

    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream
    const isAndroidOrDesktop = !isIOS

    if (isIOS) {
      // En iOS no hay beforeinstallprompt — mostramos las instrucciones manuales
      const timer = setTimeout(() => {
        setPlatform('ios')
        setVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    if (isAndroidOrDesktop) {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setPlatform('android')
        // Pequeño delay para no interrumpir la carga
        setTimeout(() => setVisible(true), 2500)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setVisible(false)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop difuminado en móvil */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden"
        onClick={handleDismiss}
      />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a0a3d 0%, #0f1a3d 100%)',
            border: '1px solid rgba(139,92,246,0.35)',
            boxShadow: '0 8px 40px rgba(109,40,217,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Barra superior de color */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Ícono de la app */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl blur-md scale-110"
                    style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)' }}/>
                  <img
                    src="/icons/icon.svg"
                    alt="RifaApp"
                    width={52}
                    height={52}
                    className="relative rounded-2xl"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    Instala RifaApp
                  </h3>
                  <p className="text-violet-300 text-xs mt-0.5">
                    Acceso rápido desde tu pantalla de inicio
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white shrink-0 ml-2"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Beneficios */}
            <ul className="space-y-1.5 mb-4">
              {[
                'Sin ocupar espacio como app normal',
                'Funciona sin abrir el navegador',
                'Recibe actualizaciones automáticas',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Acción según plataforma */}
            {platform === 'android' && (
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2 h-10"
                >
                  <Download className="w-4 h-4" />
                  Instalar gratis
                </Button>
                <button
                  onClick={handleDismiss}
                  className="px-3 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Ahora no
                </button>
              </div>
            )}

            {platform === 'ios' && (
              <div className="space-y-3">
                {!showIOSSteps ? (
                  <Button
                    onClick={() => setShowIOSSteps(true)}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2 h-10"
                  >
                    <Share className="w-4 h-4" />
                    Cómo instalarla
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-300 font-medium">Sigue estos pasos en Safari:</p>
                    {[
                      { num: '1', text: 'Toca el botón Compartir', icon: '⬆️' },
                      { num: '2', text: 'Selecciona "Agregar a pantalla de inicio"', icon: '➕' },
                      { num: '3', text: 'Toca "Agregar" y listo', icon: '✅' },
                    ].map(({ num, text, icon }) => (
                      <div key={num} className="flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-base">{icon}</span>
                        <p className="text-xs text-slate-200">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
