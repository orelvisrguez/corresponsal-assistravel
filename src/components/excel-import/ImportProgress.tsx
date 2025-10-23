'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export interface ImportStats {
  total: number
  exitosos: number
  errores: number
  procesados: number
}

export interface ImportLog {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
}

interface ImportProgressProps {
  isImporting: boolean
  stats: ImportStats
  logs: ImportLog[]
  onStartImport: () => void
  onCancel: () => void
  isComplete: boolean
  hasFile: boolean
}

export default function ImportProgress({ 
  isImporting, 
  stats, 
  logs, 
  onStartImport, 
  onCancel, 
  isComplete,
  hasFile 
}: ImportProgressProps) {
  const [showLogs, setShowLogs] = useState(false)

  // Auto-scroll de logs
  useEffect(() => {
    if (logs.length > 0) {
      const logContainer = document.getElementById('log-container')
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight
      }
    }
  }, [logs])

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0
    return Math.round((stats.procesados / stats.total) * 100)
  }

  const getLogIcon = (type: ImportLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
      default:
        return <InformationCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
    }
  }

  const getLogTextColor = (type: ImportLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      case 'warning':
        return 'text-yellow-700'
      default:
        return 'text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Botones de Control */}
      <div className="flex gap-3">
        <button
          onClick={onStartImport}
          disabled={!hasFile || isImporting || isComplete}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            !hasFile || isImporting || isComplete
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isImporting ? 'Importando...' : isComplete ? 'Importación Completada' : 'Iniciar Importación'}
        </button>

        {isImporting && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Estadísticas */}
      {(isImporting || isComplete) && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.exitosos}</div>
            <div className="text-sm text-green-700">Exitosos</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.errores}</div>
            <div className="text-sm text-red-700">Errores</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.procesados}</div>
            <div className="text-sm text-gray-700">Procesados</div>
          </div>
        </div>
      )}

      {/* Barra de Progreso */}
      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progreso de importación</span>
            <span className="text-gray-600">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            {stats.procesados} de {stats.total} registros procesados
          </div>
        </div>
      )}

      {/* Resultado Final */}
      {isComplete && (
        <div className={`p-4 rounded-lg border ${
          stats.errores === 0 
            ? 'bg-green-50 border-green-200' 
            : stats.exitosos > 0 
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {stats.errores === 0 ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : stats.exitosos > 0 ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <div>
              <h3 className={`font-medium ${
                stats.errores === 0 
                  ? 'text-green-800' 
                  : stats.exitosos > 0 
                  ? 'text-yellow-800'
                  : 'text-red-800'
              }`}>
                {stats.errores === 0 
                  ? '¡Importación completada exitosamente!' 
                  : stats.exitosos > 0 
                  ? 'Importación completada con algunos errores'
                  : 'La importación falló'
                }
              </h3>
              <p className={`text-sm ${
                stats.errores === 0 
                  ? 'text-green-700' 
                  : stats.exitosos > 0 
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {stats.exitosos} casos importados correctamente
                {stats.errores > 0 && `, ${stats.errores} errores encontrados`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Log de Importación</h3>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showLogs ? 'Ocultar' : 'Mostrar'} logs ({logs.length})
            </button>
          </div>

          {showLogs && (
            <div
              id="log-container"
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2"
            >
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <span className={getLogTextColor(log.type)}>{log.message}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ayuda */}
      {!isImporting && !isComplete && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Información Importante</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• La importación procesará todos los registros del archivo Excel</li>
            <li>• Los corresponsales nuevos se crearán automáticamente</li>
            <li>• Los casos duplicados (mismo número de caso) serán omitidos</li>
            <li>• Puedes cancelar la importación en cualquier momento</li>
          </ul>
        </div>
      )}
    </div>
  )
}