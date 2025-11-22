'use client'

import { useState, useEffect } from 'react'
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ReporteFacturacionProps {
  initialData?: any
}

export default function ReporteFacturacion({ initialData }: ReporteFacturacionProps) {
  const [data, setData] = useState(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    corresponsalId: ''
  })
  const [corresponsales, setCorresponsales] = useState([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      if (filters.corresponsalId) params.append('corresponsalId', filters.corresponsalId)

      const response = await fetch(`/api/reports/facturacion?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar datos')

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const fetchCorresponsales = async () => {
    try {
      const response = await fetch('/api/corresponsales')
      if (response.ok) {
        const result = await response.json()
        setCorresponsales(result.data || [])
      }
    } catch (err) {
      console.error('Error cargando corresponsales:', err)
    }
  }

  useEffect(() => {
    fetchCorresponsales()
    if (!initialData) {
      fetchData()
    }
  }, [])

  const handleFilterChange = () => {
    fetchData()
  }

  const formatCurrency = (amount: number | undefined | null, currency: 'USD' | 'PESOS' = 'USD') => {
    const safeAmount = amount || 0
    return currency === 'USD'
      ? `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `$${safeAmount.toLocaleString('es-AR')} ARS`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
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
    <div className="space-y-6 text-gray-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Facturación</h1>
        <p className="text-gray-600">Análisis detallado de facturación y casos pendientes</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corresponsal</label>
            <select
              value={filters.corresponsalId}
              onChange={(e) => setFilters(prev => ({ ...prev, corresponsalId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los corresponsales</option>
              {corresponsales.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
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

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Casos Facturados</p>
              <p className="text-2xl font-bold text-green-600">{data?.estadisticasGenerales?.totalCasosFacturados || 0}</p>
              <p className="text-sm text-gray-500">Total facturado</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{data?.estadisticasGenerales?.totalCasosPendientes || 0}</p>
              <p className="text-sm text-gray-500">Sin facturar</p>
            </div>
            <ClockIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monto Facturado</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(data?.estadisticasGenerales?.totalMontoFacturadoUSD || 0, 'USD')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(data?.estadisticasGenerales?.totalMontoFacturadoPesos || 0, 'PESOS')}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fee Facturado</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(data?.estadisticasGenerales?.totalFeeFacturadoUSD || 0, 'USD')}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(data?.estadisticasGenerales?.totalFeeFacturadoPesos || 0, 'PESOS')}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Estadísticas de Fee */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Casos con Fee</p>
            <p className="text-xl font-bold text-blue-600">{data?.estadisticasFee?.casosConFee || 0}</p>
            <p className="text-xs text-gray-500">{((data?.estadisticasFee?.porcentajeFee || 0)).toFixed(1)}% del total</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Promedio Fee USD</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data?.estadisticasFee?.promedioFeePorCaso || 0, 'USD')}
            </p>
            <p className="text-xs text-gray-500">Por caso</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Fee USD</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(data?.estadisticasFee?.totalFee || 0, 'USD')}
            </p>
            <p className="text-xs text-gray-500">Acumulado</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Fee ARS</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(data?.estadisticasFee?.totalFee || 0, 'PESOS')}
            </p>
            <p className="text-xs text-gray-500">Acumulado</p>
          </div>
        </div>
      </div>

      {/* Facturación por mes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Facturación por Mes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Mes</th>
                <th className="text-right py-2 font-medium text-gray-700">Casos</th>
                <th className="text-right py-2 font-medium text-gray-700">Monto USD</th>
                <th className="text-right py-2 font-medium text-gray-700">Monto ARS</th>
                <th className="text-right py-2 font-medium text-gray-700">Fee USD</th>
                <th className="text-right py-2 font-medium text-gray-700">Fee ARS</th>
              </tr>
            </thead>
            <tbody>
              {(data?.facturaciónPorMes || []).map((mes: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{mes?.mes || 'N/A'}</td>
                  <td className="text-right py-3 text-gray-900">{mes?.totalCasos || 0}</td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(mes?.totalMontoUSD || 0, 'USD')}
                  </td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(mes?.totalMontoPesos || 0, 'PESOS')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(mes?.totalFee || 0, 'USD')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(mes?.totalFee || 0, 'PESOS')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Casos pendientes de facturación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos Pendientes de Facturación</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Referencia</th>
                <th className="text-left py-2 font-medium text-gray-700">Corresponsal</th>
                <th className="text-left py-2 font-medium text-gray-700">Estado Interno</th>
                <th className="text-right py-2 font-medium text-gray-700">Monto USD</th>
                <th className="text-right py-2 font-medium text-gray-700">Fee USD</th>
                <th className="text-right py-2 font-medium text-gray-700">Días pendiente</th>
                <th className="text-center py-2 font-medium text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.casosPendientes || []).map((caso: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{caso?.numeroReferencia || 'N/A'}</span>
                  </td>
                  <td className="py-3 text-gray-900">{caso?.corresponsal || 'No asignado'}</td>
                  <td className="py-3 text-gray-700">{(caso?.estadoInterno || 'N/A').replace('_', ' ')}</td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(caso?.costoUSD || 0, 'USD')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(caso?.fee || 0, 'USD')}
                  </td>
                  <td className="text-right py-3">
                    <span className={`${(caso?.diasSinFacturar || 0) > 30 ? 'text-red-600 font-semibold' :
                        (caso?.diasSinFacturar || 0) > 15 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                      {caso?.diasSinFacturar || 0} días
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(caso?.estadoInterno || '') === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        (caso?.estadoInterno || '') === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {(caso?.estadoInterno || 'N/A').replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.casosPendientes?.length || 0) === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay casos pendientes de facturación</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Reporte generado el: {data?.fechaGeneracion ? new Date(data.fechaGeneracion).toLocaleString('es-ES') : 'Fecha no disponible'}
      </div>
    </div>
  )
}