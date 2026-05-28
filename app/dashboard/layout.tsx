import { DashboardSidebar } from '@/components/DashboardSidebar'
import { MobileNav } from '@/components/MobileNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar: solo desktop */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar: solo móvil */}
        <MobileNav />

        <main className="flex-1 overflow-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  )
}
