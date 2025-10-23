import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function SetupPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const handleBootstrap = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage('¡Perfecto! Tu usuario ahora tiene permisos de administrador. Las opciones de "Usuarios" e "Importar Datos" aparecerán en el menú después de refrescar la página.')
      } else {
        setMessage(data.error || 'Error al promocionar usuario')
      }
    } catch (error) {
      setMessage('Error de conexión. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  if (!session) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              Debes iniciar sesión
            </h1>
            <p className="mt-2 text-gray-600">
              Para acceder a la configuración inicial, necesitas tener una cuenta activa.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <ShieldCheckIcon className="mx-auto h-16 w-16 text-blue-600 mb-6" />
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Configuración Inicial
            </h1>
            
            <p className="text-gray-600 mb-6">
              Para acceder a las funciones de administración (gestión de usuarios e importación de datos), 
              necesitas permisos de administrador.
            </p>

            {!success && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Usuario actual:</strong> {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Esta función solo está disponible si no existe ningún administrador en el sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                success 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {success ? (
              <div className="space-y-3">
                <button
                  onClick={handleRefreshPage}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowRightIcon className="w-4 h-4 mr-2" />
                  Refrescar Página
                </button>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ir al Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={handleBootstrap}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Configurando...
                  </>
                ) : (
                  'Convertirme en Administrador'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
