import React, { useState, useCallback } from 'react'
import ImportDataForm from '@/components/ui/ImportDataForm'
import { ImportResult } from '@/lib/excel-importer'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface TestImportProps {
  onTestComplete?: () => void
}

export default function TestImport({ onTestComplete }: TestImportProps) {
  const [testResult, setTestResult] = useState<ImportResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleTestImport = useCallback(async () => {
    setIsRunning(true)
    setTestResult(null)

    try {
      // Simular importación con datos de prueba
      const mockResult: ImportResult = {
        success: true,
        processed: 10,
        created: 8,
        updated: 2,
        errors: [],
        warnings: [
          '2 casos tenían fechas de facturación faltantes',
          '1 caso tenía país vacío, se completó con "Desconocido"'
        ]
      }

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResult(mockResult)
      onTestComplete?.()
    } catch (error) {
      console.error('Error en test:', error)
      setTestResult({
        success: false,
        processed: 0,
        created: 0,
        updated: 0,
        errors: ['Error en la simulación de test'],
        warnings: []
      })
    } finally {
      setIsRunning(false)
    }
  }, [onTestComplete])

  const resetTest = useCallback(() => {
    setTestResult(null)
    setIsRunning(false)
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Prueba del Módulo de Importación</h2>
          </div>

          <div className="text-gray-600 mb-6">
            <p className="mb-2">
              Esta es una demostración del módulo de importación de datos. 
              La importación real estará disponible una vez que se complete la configuración del sistema.
            </p>
            <p className="text-sm">
              El módulo permite importar datos desde archivos Excel (.xlsx) y sobrescribir/actualizar 
              los datos existentes en la base de datos.
            </p>
          </div>

          {/* Simulación de datos */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Características del Módulo:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Validación automática de estructura de archivos</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Conversión automática de formatos de datos</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Actualización de casos existentes por número ASSISTRAVEL</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Creación automática de nuevos casos</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Manejo de errores y reportes detallados</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>Sobrescritura completa de datos con nuevos valores</span>
              </li>
            </ul>
          </div>

          {/* Test de demostración */}
          {!testResult && !isRunning && (
            <div className="text-center">
              <button
                onClick={handleTestImport}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Simular Importación
              </button>
            </div>
          )}

          {/* Estado de carga */}
          {isRunning && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Procesando simulación...</span>
              </div>
            </div>
          )}

          {/* Resultado del test */}
          {testResult && (
            <div className={`rounded-lg border p-4 ${
              testResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-4">
                {testResult.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
                <h4 className={`font-semibold ${
                  testResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResult.success ? 'Simulación Exitosa' : 'Simulación con Errores'}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.processed}
                  </p>
                  <p className="text-sm text-gray-600">Procesadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{testResult.created}</p>
                  <p className="text-sm text-gray-600">Creadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{testResult.updated}</p>
                  <p className="text-sm text-gray-600">Actualizadas</p>
                </div>
              </div>

              {/* Advertencias */}
              {testResult.warnings.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                    <h5 className="text-sm font-medium text-yellow-800">Advertencias:</h5>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {testResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errores */}
              {testResult.errors.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircleIcon className="w-4 h-4 text-red-600" />
                    <h5 className="text-sm font-medium text-red-800">Errores:</h5>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {testResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={resetTest}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Nueva Simulación
                </button>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Para usar el módulo real:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Ve a la página <code className="bg-gray-200 px-1 rounded">/import</code></li>
                <li>Selecciona tu archivo Excel con los datos a importar</li>
                <li>El sistema validará automáticamente la estructura</li>
                <li>Confirma la importación para sobrescribir los datos existentes</li>
                <li>Revisa el reporte de resultados</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}