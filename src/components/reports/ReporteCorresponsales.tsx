'use client'

import { useState, useEffect } from 'react'
import { 
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface ReporteCorresponsalesProps {
  initialData?: any
}

export default function ReporteCorresponsales({ initialData }: ReporteCorresponsalesProps) {
  const [data, setData] = useState(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: ''
  })
  const [selectedCorresponsal, setSelectedCorresponsal] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      
      const response = await fetch(`/api/reports/corresponsales?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar datos')
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [])

  const handleFilterChange = () => {
    fetchData()
  }

  const formatCurrency = (amount: number, currency: 'USD' | 'PESOS' = 'USD') => {
    return currency === 'USD' 
      ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
      : `$${amount.toLocaleString('es-AR')} ARS`
  }

  const getEstadoColor = (estado: string) => {
    const colors = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'EN_PROCESO': 'bg-blue-100 text-blue-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <UserGroupIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar reporte</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Corresponsales</h1>
        <p className="text-gray-600">Análisis de rendimiento por corresponsal</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
            <input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => setFilters(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilterChange}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Corresponsales Activos</p>
              <p className="text-3xl font-bold text-blue-600">{data?.estadisticasGenerales?.totalCorresponsales || 0}</p>
              <p className="text-sm text-gray-500">Con casos en el período</p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Casos</p>
              <p className="text-3xl font-bold text-green-600">{data?.estadisticasGenerales?.totalCasos || 0}</p>
              <p className="text-sm text-gray-500">En el período</p>
            </div>
            <DocumentTextIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(data?.estadisticasGenerales?.totalMontoUSD || 0, 'USD')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(data?.estadisticasGenerales?.totalMontoPesos || 0, 'PESOS')}
              </p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Lista de corresponsales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Corresponsal</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {(data?.reporte || []).map((item: any, index: number) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Info del corresponsal */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{item.corresponsal.nombre}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {item.corresponsal.ubicacion}
                        </div>
                        {item.corresponsal.telefono && (
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="h-4 w-4" />
                            {item.corresponsal.telefono}
                          </div>
                        )}
                        {item.corresponsal.email && (
                          <div className="flex items-center gap-1">
                            <EnvelopeIcon className="h-4 w-4" />
                            {item.corresponsal.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCorresponsal(
                        selectedCorresponsal?.corresponsal.id === item.corresponsal.id ? null : item
                      )}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors text-sm"
                    >
                      {selectedCorresponsal?.corresponsal.id === item.corresponsal.id ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                  </div>

                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Casos</p>
                      <p className="text-xl font-bold text-blue-600">{item.estadisticas.totalCasos}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Facturados</p>
                      <p className="text-xl font-bold text-green-600">{item.estadisticas.casosFacturados}</p>
                      <p className="text-xs text-gray-500">{item.estadisticas.porcentajeFacturado.toFixed(1)}%</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Ingresos USD</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(item.estadisticas.totalMontoUSD, 'USD')}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Fee USD</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(item.estadisticas.fee.totalFee, 'USD')}
                      </p>
                    </div>
                  </div>

                  {/* Estados de casos */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-600">Abiertos</p>
                      <p className="font-bold text-yellow-600">{item.estadisticas.abiertos}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Cerrados</p>
                      <p className="font-bold text-blue-600">{item.estadisticas.cerrados}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Pausados</p>
                      <p className="font-bold text-green-600">{item.estadisticas.pausados}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-xs text-gray-600">Cancelados</p>
                      <p className="font-bold text-red-600">{item.estadisticas.cancelados}</p>
                    </div>
                  </div>

                  {/* Estadísticas de Fee */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Estadísticas de Fee</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Casos con Fee</p>
                        <p className="font-semibold">{item.estadisticas.fee.casosConFee} casos</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Fee</p>
                        <p className="font-semibold">{formatCurrency(item.estadisticas.fee.totalFee, 'USD')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Promedio Fee</p>
                        <p className="font-semibold">{formatCurrency(item.estadisticas.fee.promedioFee, 'USD')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {selectedCorresponsal?.corresponsal.id === item.corresponsal.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">Casos Recientes</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">Referencia</th>
                          <th className="text-left py-2 font-medium text-gray-700">Servicio</th>
                          <th className="text-center py-2 font-medium text-gray-700">Estado</th>
                          <th className="text-right py-2 font-medium text-gray-700">Costo USD</th>
                          <th className="text-right py-2 font-medium text-gray-700">Fee USD</th>
                          <th className="text-right py-2 font-medium text-gray-700">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.casosRecientes.map((caso: any, casoIndex: number) => (
                          <tr key={casoIndex} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">{caso.numeroReferencia}</td>
                            <td className="py-3 text-gray-700">{caso.estadoInterno.replace('_', ' ')}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(caso.estadoDelCaso)}`}>
                                {caso.estadoDelCaso.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="text-right py-3 text-gray-900">
                              {formatCurrency(caso.costoUSD, 'USD')}
                            </td>
                            <td className="text-right py-3 text-green-600">
                              {formatCurrency(caso.fee, 'USD')}
                            </td>
                            <td className="text-right py-3 text-gray-600">
                              {new Date(caso.fechaCreacion).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {item.casosRecientes.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay casos recientes para mostrar</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {(data?.reporte || []).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay datos para mostrar</h3>
            <p>No se encontraron corresponsales con casos en el período seleccionado</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Reporte generado el: {data?.fechaGeneracion ? new Date(data.fechaGeneracion).toLocaleString('es-ES') : 'No disponible'}
      </div>
    </div>
  )
}