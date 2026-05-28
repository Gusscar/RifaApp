import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Zap, Share2, Users, Shield } from 'lucide-react'
import { LotterySceneWrapper } from '@/components/LotterySceneWrapper'

const features = [
  {
    icon: Zap,
    title: 'Crea en 2 minutos',
    desc: 'Configura premios, tipo de números y fecha de sorteo de forma intuitiva.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Share2,
    title: 'Comparte por WhatsApp',
    desc: 'Un enlace único que tus participantes pueden abrir desde cualquier celular.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Users,
    title: 'Gestiona en tiempo real',
    desc: 'Ve reservas y pagos al instante. Todos los participantes ven los mismos cambios.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: '100% gratuito',
    desc: 'Sin cobros ocultos. Usa tu propio WhatsApp para los pagos.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
]

const steps = [
  { num: '01', title: 'Crea tu cuenta', desc: 'Regístrate gratis con tu email.' },
  { num: '02', title: 'Configura la rifa', desc: 'Añade premios, precio por número y fecha de sorteo.' },
  { num: '03', title: 'Comparte el enlace', desc: 'Envía el link por WhatsApp a tus contactos.' },
  { num: '04', title: 'Gestiona y cobra', desc: 'Marca pagos y haz seguimiento en tiempo real.' },
]

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">

      {/* NAV */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 w-full">
        <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">Rifa<span className="text-violet-400">App</span></span>
        <div className="flex gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-white hover:text-white hover:bg-white/10 hidden sm:inline-flex')}>
            Iniciar sesión
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'bg-violet-500 hover:bg-violet-600 text-white')}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="gradient-hero relative min-h-screen flex items-center overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center pt-20 sm:pt-24 pb-12 sm:pb-16">

          {/* 3D Scene — arriba en móvil, derecha en desktop */}
          <div className="h-[220px] sm:h-[320px] lg:h-[560px] w-full relative lg:order-2">
            <LotterySceneWrapper />
          </div>

          {/* Texto — debajo en móvil, izquierda en desktop */}
          <div className="space-y-5 sm:space-y-7 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              Actualizaciones en tiempo real
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
              Rifas que se{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                venden solas
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed mx-auto lg:mx-0">
              Crea tu rifa, comparte el enlace por WhatsApp y gestiona participantes y pagos en tiempo real.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'bg-violet-600 hover:bg-violet-700 text-white gap-2 px-6 sm:px-8 shadow-lg shadow-violet-900/40 w-full sm:w-auto')}>
                Crear mi primera rifa
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 sm:gap-8 justify-center lg:justify-start pt-1">
              {[['100%', 'Gratuito'], ['Tiempo real', 'Actualizaciones'], ['WhatsApp', 'Integrado']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-lg sm:text-2xl font-bold text-white">{val}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* FEATURES */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-10 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Todo lo que necesitas</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Sin complicaciones, sin pagos, sin aplicaciones extras.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
                  <Icon className={cn('w-6 h-6', color)} />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">¿Cómo funciona?</h2>
            <p className="text-muted-foreground">En 4 simples pasos.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="space-y-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-primary font-black text-lg">{num}</span>
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">¿Listo para empezar?</h2>
          <p className="text-muted-foreground text-base sm:text-lg">Crea tu primera rifa en menos de 2 minutos. Gratis para siempre.</p>
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 sm:px-10 shadow-lg shadow-primary/20 w-full sm:w-auto')}>
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <p>RifaApp © {new Date().getFullYear()} · Hecho con para organizadores de rifas</p>
      </footer>
    </main>
  )
}
