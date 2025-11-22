import { useState, useCallback, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import ImportDataForm from '@/components/ui/ImportDataForm'
import { ImportResult } from '@/lib/excel-importer'
import Link from 'next/link'
import {
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ImportPageProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export default function ImportPage({ user }: ImportPageProps) {
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result)
  }, [])

  // Estadísticas de ejemplo (puedes obtenerlas de la API)
  const [stats, setStats] = useState({
    totalCases: 0,
    lastImport: null as string | null
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Módulo de Importación de Datos</h1>
              <p className="text-gray-600">Importa y actualiza datos desde archivos Excel</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/casos"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Ver Casos
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel principal de importación */}
          <div className="lg:col-span-2">
            <ImportDataForm 
              onImportComplete={handleImportComplete}
              className="h-fit"
            />
          </div>

          {/* Panel lateral con información */}
          <div className="space-y-6">
            {/* Estado del sistema */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de casos</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalCases}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última importación</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.lastImport || 'Nunca'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Operativo
                  </span>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            {showInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">Instrucciones de Uso</h3>
                  </div>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>1. Preparar el archivo Excel</strong></p>
                  <p>• Asegúrate de que el archivo tenga las columnas requeridas</p>
                  <p>• Los campos obligatorios están marcados en rojo</p>
                  <p>• Las fechas deben estar en formato DD/MM/AAAA</p>
                  
                  <p className="mt-3"><strong>2. Importar datos</strong></p>
                  <p>• Arrastra el archivo al área de carga o selecciónalo</p>
                  <p>• El sistema validará la estructura automáticamente</p>
                  <p>• Revisa las advertencias antes de proceder</p>
                  
                  <p className="mt-3"><strong>3. Confirmar importación</strong></p>
                  <p>• Los casos existentes se actualizarán por número de caso</p>
                  <p>• Los nuevos casos se crearán automáticamente</p>
                  <p>• Los datos se sobrescribirán completamente</p>
                </div>
              </div>
            )}

            {/* Mapeo de campos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapeo de Campos</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium">Excel → Sistema</p>
                    <p>nro_caso_assistravel → Número ASSISTRAVEL</p>
                    <p>corresponsal_id → Corresponsal</p>
                    <p>fecha_de_inicio → Fecha de inicio</p>
                    <p>estado_interno → Estado interno</p>
                    <p>estado_del_caso → Estado del caso</p>
                  </div>
                  <div>
                    <p className="font-medium">Conversiones</p>
                    <p>Si → true, No → false</p>
                    <p>Abierto → ABIERTO</p>
                    <p>Cerrado → CERRADO</p>
                    <p>On Going → ON_GOING</p>
                    <p>Refacturado → REFACTURADO</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultado de importación */}
            {importResult && (
              <div className={`rounded-xl border p-6 ${
                importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  {importResult.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className={`text-lg font-semibold ${
                    importResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResult.success ? 'Importación Completada' : 'Importación con Errores'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      importResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {importResult.processed}
                    </p>
                    <p className={`text-sm ${
                      importResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Procesadas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{importResult.created}</p>
                    <p className="text-sm text-blue-700">Creadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{importResult.updated}</p>
                    <p className="text-sm text-orange-700">Actualizadas</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-xs text-red-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: {
        name: session.user?.name || null,
        email: session.user?.email || null,
        image: session.user?.image || null,
      },
    },
  }
}