'use client'

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import Tooltip from './Tooltip'
import { CorresponsalConCasos } from '@/types'

export interface FilterOptions {
  searchTerm: string
  corresponsalId: string
  estadoInterno: string
  estadoDelCaso: string
  informeMedico: string
  tieneFactura: string
  pais: string
  tipoFecha: string
  fechaDesde: string
  fechaHasta: string
  costoDesde: string
  costoHasta: string
}

interface SearchAndFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  corresponsales: CorresponsalConCasos[]
  onClearFilters: () => void
  resultCount?: number
}

export default function SearchAndFilters({
  filters,
  onFiltersChange,
  corresponsales,
  onClearFilters,
  resultCount
}: SearchAndFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return false // Excluir búsqueda del conteo
      return value && value !== ''
    })
  }

  const estadosInternos = [
    { value: '', label: 'Todos los estados' },
    { value: 'ABIERTO', label: 'Abierto' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'PAUSADO', label: 'Pausado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ]

  const estadosCaso = [
    { value: '', label: 'Todos los estados' },
    { value: 'NO_FEE', label: 'No Fee' },
    { value: 'REFACTURADO', label: 'Refacturado' },
    { value: 'PARA_REFACTURAR', label: 'Para Refacturar' },
    { value: 'ON_GOING', label: 'On Going' },
    { value: 'COBRADO', label: 'Cobrado' }
  ]

  const opcionesSiNo = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">

      {/* Búsqueda Principal */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar casos... (número, país, observaciones)"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters() && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {Object.values(filters).filter(v => v && v !== filters.searchTerm).length}
              </span>
            )}
          </button>

          {hasActiveFilters() && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Información de Resultados */}
      {resultCount !== undefined && (
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {resultCount === 1
              ? `Se encontró ${resultCount} caso`
              : `Se encontraron ${resultCount} casos`
            }
            {filters.searchTerm && (
              <span className="ml-1 font-medium">
                para &quot;{filters.searchTerm}&quot;
              </span>
            )}
          </p>
          {hasActiveFilters() && (
            <p className="text-xs text-blue-600">
              <AdjustmentsHorizontalIcon className="h-4 w-4 inline mr-1" />
              Filtros aplicados
            </p>
          )}
        </div>
      )}

      {/* Filtros Avanzados */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </h4>

          {/* Primera fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Corresponsal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corresponsal
              </label>
              <select
                value={filters.corresponsalId}
                onChange={(e) => handleFilterChange('corresponsalId', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              >
                <option value="">Todos los corresponsales</option>
                {corresponsales.map((corresponsal) => (
                  <option key={corresponsal.id} value={corresponsal.id.toString()}>
                    {corresponsal.nombreCorresponsal}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Estado Interno
                <Tooltip content="Abierto: Caso activo en progreso&#10;Cerrado: Caso finalizado&#10;Pausado: Caso temporalmente suspendido&#10;Cancelado: Caso anulado" />
              </label>
              <select
                value={filters.estadoInterno}
                onChange={(e) => handleFilterChange('estadoInterno', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              >
                {estadosInternos.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado del Caso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Estado del Caso
                <Tooltip content="No Fee: Sin tarifa aplicada&#10;Refacturado: Ya fue refacturado&#10;Para Refacturar: Pendiente de refacturación&#10;On Going: En progreso&#10;Cobrado: Pago recibido" />
              </label>
              <select
                value={filters.estadoDelCaso}
                onChange={(e) => handleFilterChange('estadoDelCaso', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              >
                {estadosCaso.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segunda fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <input
                type="text"
                placeholder="Filtrar por país"
                value={filters.pais}
                onChange={(e) => handleFilterChange('pais', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              />
            </div>

            {/* Informe Médico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Informe Médico
              </label>
              <select
                value={filters.informeMedico}
                onChange={(e) => handleFilterChange('informeMedico', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              >
                {opcionesSiNo.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tiene Factura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiene Factura
              </label>
              <select
                value={filters.tieneFactura}
                onChange={(e) => handleFilterChange('tieneFactura', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              >
                {opcionesSiNo.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tercera fila - Filtros de fecha y costo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Rango de fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Filtro por Fechas
              </label>

              {/* Selector de tipo de fecha */}
              <div className="mb-3">
                <select
                  value={filters.tipoFecha}
                  onChange={(e) => handleFilterChange('tipoFecha', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                >
                  <option value="fechaInicioCaso">Fecha de Inicio del Caso</option>
                  <option value="fechaEmisionFactura">Fecha de Emisión de Factura</option>
                  <option value="fechaVencimientoFactura">Fecha de Vencimiento de Factura</option>
                  <option value="fechaPagoFactura">Fecha de Pago de Factura</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecciona el tipo de fecha a filtrar</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    placeholder="Desde"
                    value={filters.fechaDesde}
                    onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Desde</p>
                </div>
                <div>
                  <input
                    type="date"
                    placeholder="Hasta"
                    value={filters.fechaHasta}
                    onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hasta</p>
                </div>
              </div>
            </div>

            {/* Rango de costos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Rango de Costos USD
                <Tooltip content="Filtra casos por el monto en dólares estadounidenses.&#10;Deja vacío para incluir todos los montos." />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="Desde"
                    value={filters.costoDesde}
                    onChange={(e) => handleFilterChange('costoDesde', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo</p>
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Hasta"
                    value={filters.costoHasta}
                    onChange={(e) => handleFilterChange('costoHasta', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Máximo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ayuda rápida */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h5 className="text-sm font-medium text-blue-900 mb-1">💡 Consejos de búsqueda:</h5>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Usa palabras clave para buscar en números de caso, países y observaciones</li>
              <li>• Combina filtros para resultados más específicos</li>
              <li>• Selecciona el tipo de fecha para filtrar por diferentes fechas del caso (inicio, emisión, vencimiento, pago)</li>
              <li>• Los rangos de fecha y costo te ayudan a encontrar casos en períodos específicos</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
