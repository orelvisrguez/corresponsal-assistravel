'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex flex-col">
                <span className="text-xl font-bold text-blue-600 leading-tight">ASSISTRAVEL</span>
                <span className="text-xs text-gray-500 leading-tight">Corresponsalia</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent transition-colors"
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
              <span className="text-sm text-gray-700">
                Hola, {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                Salir
              </button>
            </div>
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div>
                <div className="text-base font-medium text-gray-800">
                  {session?.user?.name || session?.user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}