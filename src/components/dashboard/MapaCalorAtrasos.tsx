'use client'

import { useMemo } from 'react'
import { CasoConCorresponsal } from '@/types'
import { formatCurrency, formatCorresponsalNombre } from '@/lib/utils'
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ArrowRightIcon,
  UserIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface CasoAtraso extends CasoConCorresponsal {
  diasAtraso: number
  gravedadAtraso: 'bajo' | 'medio' | 'alto' | 'critico'
  montoUSD: number
}

interface MapaCalorAtrasosProps {
  casos: CasoConCorresponsal[]
  maxItems?: number
}

export default function MapaCalorAtrasos({ casos, maxItems = 12 }: MapaCalorAtrasosProps) {
  const casosConAtraso = useMemo(() => {
    const ahora = new Date()
    const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    
    const casosAtrasados: CasoAtraso[] = []
    
    casos.forEach(caso => {
      // Solo casos con fecha de vencimiento de factura
      if (caso.fechaVencimientoFactura && caso.estadoDelCaso !== 'COBRADO') {
        const fechaVencimiento = new Date(caso.fechaVencimientoFactura)
        const fechaVencimientoLimpia = new Date(fechaVencimiento.getFullYear(), fechaVencimiento.getMonth(), fechaVencimiento.getDate())
        
        // Calcular diferencia en días
        const diasAtraso = Math.floor((fechaActual.getTime() - fechaVencimientoLimpia.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diasAtraso > 0) {
          let gravedadAtraso: 'bajo' | 'medio' | 'alto' | 'critico'
          
          if (diasAtraso <= 7) {
            gravedadAtraso = 'bajo'
          } else if (diasAtraso <= 30) {
            gravedadAtraso = 'medio'
          } else if (diasAtraso <= 90) {
            gravedadAtraso = 'alto'
          } else {
            gravedadAtraso = 'critico'
          }
          
          casosAtrasados.push({
            ...caso,
            diasAtraso,
            gravedadAtraso,
            montoUSD: Number(caso.costoUsd) || 0
          })
        }
      }
    })
    
    // Ordenar por días de atraso (mayor primero)
    return casosAtrasados.sort((a, b) => b.diasAtraso - a.diasAtraso).slice(0, maxItems)
  }, [casos, maxItems])

  const getColorClasses = (gravedad: string) => {
    switch (gravedad) {
      case 'bajo':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-600'
        }
      case 'medio':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          badge: 'bg-orange-100 text-orange-800',
          icon: 'text-orange-600'
        }
      case 'alto':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-800',
          icon: 'text-red-600'
        }
      case 'critico':
        return {
          bg: 'bg-red-100',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-200 text-red-900',
          icon: 'text-red-700'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-600'
        }
    }
  }

  const getGravedadLabel = (gravedad: string) => {
    switch (gravedad) {
      case 'bajo': return 'Atraso Menor'
      case 'medio': return 'Atraso Medio'
      case 'alto': return 'Atraso Alto'
      case 'critico': return 'Atraso Crítico'
      default: return 'Sin Clasificar'
    }
  }

  const handleVerCaso = (casoId: number) => {
    window.location.href = `/casos?id=${casoId}`
  }

  if (casosConAtraso.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Casos con Atrasos</h3>
          <ClockIcon className="h-6 w-6 text-gray-400" />
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">¡Excelente!</h4>
          <p className="text-gray-500">No hay casos con atrasos en cobro</p>
        </div>
      </div>
    )
  }

  // Agrupar casos por gravedad para mostrar estadísticas
  const statsAtrasos = casosConAtraso.reduce((acc, caso) => {
    const gravedad = caso.gravedadAtraso
    if (!acc[gravedad]) {
      acc[gravedad] = { count: 0, totalUSD: 0 }
    }
    acc[gravedad].count++
    acc[gravedad].totalUSD += caso.montoUSD
    return acc
  }, {} as Record<string, { count: number; totalUSD: number }>)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Casos con Atrasos</h3>
          <p className="text-sm text-gray-600 mt-1">
            {casosConAtraso.length} casos con atrasos - Total USD: {formatCurrency(casosConAtraso.reduce((sum, caso) => sum + caso.montoUSD, 0))}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        </div>
      </div>

      {/* Resumen por gravedad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statsAtrasos).map(([gravedad, stats]) => {
          const colors = getColorClasses(gravedad)
          return (
            <div key={gravedad} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
              <div className={`text-sm font-medium ${colors.text}`}>
                {getGravedadLabel(gravedad)}
              </div>
              <div className={`text-lg font-bold ${colors.text}`}>
                {stats.count} casos
              </div>
              <div className={`text-xs ${colors.text} opacity-75`}>
                {formatCurrency(stats.totalUSD)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lista de casos con barras de progreso */}
      <div className="space-y-3">
        {casosConAtraso.map((caso) => {
          const colors = getColorClasses(caso.gravedadAtraso)
          // Calcular ancho de barra basado en días de atraso (máximo 365 días para 100%)
          const anchoBarra = Math.min((caso.diasAtraso / 365) * 100, 100)
          
          return (
            <div
              key={caso.id}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${colors.bg} ${colors.border}`}
              onClick={() => handleVerCaso(caso.id)}
            >
              {/* Header con número de caso y días de atraso */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className={`font-semibold text-sm ${colors.text}`}>
                    {caso.nroCasoAssistravel}
                  </h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                    {getGravedadLabel(caso.gravedadAtraso)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${colors.text}`}>
                    {caso.diasAtraso} días
                  </span>
                  <ArrowRightIcon className={`w-4 h-4 ${colors.icon}`} />
                </div>
              </div>

              {/* Barra de progreso del atraso */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${colors.text}`}>Progreso de Atraso</span>
                  <span className={`text-xs ${colors.text} opacity-75`}>{anchoBarra.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${colors.icon.replace('text-', 'bg-').replace('-600', '-500')}`}
                    style={{ width: `${anchoBarra}%` }}
                  />
                </div>
              </div>

              {/* Información detallada en grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Corresponsal */}
                <div className="flex items-center space-x-2">
                  <UserIcon className={`w-4 h-4 ${colors.icon}`} />
                  <div className="min-w-0">
                    <div className={`text-xs ${colors.text} opacity-75`}>Corresponsal</div>
                    <div className={`text-sm font-medium ${colors.text} truncate`}>
                      {formatCorresponsalNombre(caso.corresponsal.nombreCorresponsal)}
                    </div>
                  </div>
                </div>

                {/* País */}
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className={`w-4 h-4 ${colors.icon}`} />
                  <div className="min-w-0">
                    <div className={`text-xs ${colors.text} opacity-75`}>País</div>
                    <div className={`text-sm font-medium ${colors.text}`}>
                      {caso.pais}
                    </div>
                  </div>
                </div>

                {/* Monto y Estado */}
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className={`w-4 h-4 ${colors.icon}`} />
                  <div className="min-w-0">
                    <div className={`text-xs ${colors.text} opacity-75`}>Monto</div>
                    <div className={`text-sm font-bold ${colors.text}`}>
                      {formatCurrency(caso.montoUSD)}
                    </div>
                    <div className={`text-xs ${colors.text} opacity-75`}>
                      {caso.estadoDelCaso.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enlace específico para casos críticos */}
              {caso.gravedadAtraso === 'critico' && (
                <div className="flex items-center justify-between p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Atraso Crítico</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `/casos?id=${caso.id}`
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1"
                  >
                    <span>Ver Caso</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer con llamada a la acción */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-blue-900">Acciones Recomendadas</h5>
            <p className="text-xs text-blue-700 mt-1">
              Revisar casos con atraso crítico y contactar corresponsales para acelerar cobros
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/casos'}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Ver Todos los Casos
          </button>
        </div>
      </div>
    </div>
  )
}