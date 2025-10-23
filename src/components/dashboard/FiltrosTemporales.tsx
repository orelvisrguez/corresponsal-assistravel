'use client'

import { useMemo } from 'react'
import { 
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

export type FiltroPeriodo = 'actual' | 'tres_meses' | 'semestral' | 'anual' | 'todo'

interface FiltrosTemporalesProps {
  periodoSeleccionado: FiltroPeriodo
  onCambiarPeriodo: (periodo: FiltroPeriodo) => void
  ultimaActualizacion?: Date
}

const opcionesPeriodo = [
  {
    value: 'actual' as FiltroPeriodo,
    label: 'Mes Actual',
    description: 'Datos del mes en curso',
    icon: ClockIcon,
    color: 'bg-blue-500'
  },
  {
    value: 'tres_meses' as FiltroPeriodo,
    label: 'Últimos 3 Meses',
    description: 'Trimestre actual',
    icon: ChartBarIcon,
    color: 'bg-green-500'
  },
  {
    value: 'semestral' as FiltroPeriodo,
    label: 'Semestral',
    description: 'Últimos 6 meses',
    icon: CalendarIcon,
    color: 'bg-purple-500'
  },
  {
    value: 'anual' as FiltroPeriodo,
    label: 'Anual',
    description: 'Último año completo',
    icon: DocumentTextIcon,
    color: 'bg-orange-500'
  },
  {
    value: 'todo' as FiltroPeriodo,
    label: 'Todo el Período',
    description: 'Histórico completo',
    icon: CurrencyDollarIcon,
    color: 'bg-gray-500'
  }
]

export default function FiltrosTemporales({ 
  periodoSeleccionado, 
  onCambiarPeriodo,
  ultimaActualizacion 
}: FiltrosTemporalesProps) {

  const fechaActualizacionTexto = useMemo(() => {
    if (!ultimaActualizacion) return ''
    return ultimaActualizacion.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [ultimaActualizacion])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filtros Temporales</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona el período para visualizar los datos del dashboard
          </p>
        </div>
        {ultimaActualizacion && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Última actualización</p>
            <p className="text-sm font-medium text-gray-700">{fechaActualizacionTexto}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {opcionesPeriodo.map((opcion) => {
          const Icon = opcion.icon
          const isSelected = periodoSeleccionado === opcion.value
          
          return (
            <button
              key={opcion.value}
              onClick={() => onCambiarPeriodo(opcion.value)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-blue-500 text-white' : `${opcion.color} text-white`}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className={`
                    font-semibold text-sm
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                  `}>
                    {opcion.label}
                  </h4>
                  <p className={`
                    text-xs mt-1
                    ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                  `}>
                    {opcion.description}
                  </p>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-700">
                      Período seleccionado
                    </span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Indicador de filtros activos */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              Período activo: {opcionesPeriodo.find(p => p.value === periodoSeleccionado)?.label}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Los datos se actualizan automáticamente
          </span>
        </div>
      </div>
    </div>
  )
}