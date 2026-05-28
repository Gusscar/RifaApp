export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0520 0%, #1a0a3d 50%, #0d1a4a 100%)' }}>

      {/* Blobs de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '0.5s' }}/>
      </div>

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Ícono animado */}
        <div className="relative" style={{ animation: 'splashBounce 1.2s ease-in-out infinite' }}>
          {/* Resplandor dorado detrás del ícono */}
          <div className="absolute inset-0 rounded-3xl blur-2xl scale-110"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)' }}/>
          <img
            src="/icons/icon.svg"
            alt="RifaApp"
            width={96}
            height={96}
            className="relative rounded-3xl shadow-2xl"
            style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.5), 0 0 0 1px rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Nombre */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Rifa<span style={{ color: '#a78bfa' }}>App</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Cargando...
          </p>
        </div>

        {/* Barra de progreso animada */}
        <div className="w-40 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; width: 0%; }
          50% { width: 80%; }
          100% { background-position: -200% 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
