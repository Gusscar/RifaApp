'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Ticket } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('pr-10', error && 'border-destructive focus-visible:ring-destructive/30')}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (mode === 'signup' && name.trim().length < 2) e.name = 'Ingresa tu nombre completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido.'
    if (password.length < 6) e.password = 'Mínimo 6 caracteres.'
    if (mode === 'signup' && password !== confirm) e.confirm = 'Las contraseñas no coinciden.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error('Correo o contraseña incorrectos.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Cuenta creada. Revisa tu correo para confirmarla.')
        setMode('login')
      }
    }

    setLoading(false)
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setErrors({})
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="min-h-screen flex gradient-hero relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl" />
      </div>

      {/* Back to home */}
      <Link
        href="/"
        className={cn(buttonVariants({ variant: 'ghost' }), 'absolute top-6 left-6 text-white hover:bg-white/10 hover:text-white z-10')}
      >
        ← Inicio
      </Link>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-sm glass rounded-3xl p-8 space-y-6 glow-violet">

          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-900/50">
              <Ticket className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {mode === 'login' ? 'Bienvenido' : 'Crea tu cuenta'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Inicia sesión para gestionar tus rifas' : 'Es gratis y tarda menos de un minuto'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-300 text-sm">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Carlos García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    'bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:border-violet-400 focus-visible:ring-violet-400/20',
                    errors.name && 'border-red-400'
                  )}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  'bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:border-violet-400 focus-visible:ring-violet-400/20',
                  errors.email && 'border-red-400'
                )}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Contraseña</Label>
              <div className="relative">
                <PasswordInputDark
                  id="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-slate-300 text-sm">Confirmar contraseña</Label>
                <PasswordInputDark
                  id="confirm"
                  placeholder="Repite tu contraseña"
                  value={confirm}
                  onChange={setConfirm}
                  error={errors.confirm}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-900/40 mt-2"
              disabled={loading}
            >
              {loading
                ? 'Cargando...'
                : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              onClick={switchMode}
              className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 transition-colors"
            >
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Dark-themed password input for the login page
function PasswordInputDark({
  id,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus-visible:border-violet-400 focus-visible:ring-violet-400/20',
            error && 'border-red-400'
          )}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
