'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Corresponsales', href: '/corresponsales', icon: UserGroupIcon },
  { name: 'Casos', href: '/casos', icon: DocumentTextIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon },
  { name: 'Informes IA', href: '/informes-automaticos', icon: SparklesIcon },
  { name: 'Importar Excel', href: '/importar-excel', icon: ArrowUpTrayIcon, adminOnly: true },
  { name: 'Usuarios', href: '/usuarios', icon: UsersIcon, adminOnly: true },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Obtener el rol del usuario actual
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserRole = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`)
          if (response.ok) {
            const userData = await response.json()
            setUserRole(userData.role)
          } else if (response.status === 403) {
            // Si es 403, usar el rol de la sesión o uno por defecto
            console.log('Acceso restringido a API de usuario, usando rol de sesión')
            setUserRole(session.user.role || 'USER')
          } else {
            console.warn('Error al obtener rol del usuario:', response.status)
            setUserRole('USER') // Rol por defecto
          }
        } catch (error) {
          console.error('Error obteniendo rol del usuario:', error)
          setUserRole('USER') // Rol por defecto en caso de error
        }
      }
      fetchUserRole()
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  // Filtrar navegación basada en permisos
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly) {
      return userRole === 'ADMIN'
    }
    return true
  })

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex flex-col">
                <span className="text-xl font-bold text-primary leading-tight">ASSISTRAVEL</span>
                <span className="text-xs text-muted-foreground leading-tight">Corresponsalia</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Hola, {session?.user?.name || session?.user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t">
          <div className="space-y-1 pt-2 pb-3">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-border pt-4 pb-3">
            <div className="flex items-center px-4">
              <div>
                <div className="text-base font-medium text-foreground">
                  {session?.user?.name || session?.user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}