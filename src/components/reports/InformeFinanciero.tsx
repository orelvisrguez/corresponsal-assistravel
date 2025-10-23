'use client'

import { useState, useEffect } from 'react'
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  BanknotesIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface InformeFinancieroProps {
  initialData?: any
}

export default function InformeFinanciero({ initialData }: InformeFinancieroProps) {
  const [data, setData] = useState(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: ''
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      
      const response = await fetch(`/api/reports/financiero?${params.toString()}`)
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

  const formatCurrency = (amount: number | undefined | null, currency: 'USD' | 'PESOS' = 'USD') => {
    const safeAmount = amount || 0
    return currency === 'USD' 
      ? `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
      : `$${safeAmount.toLocaleString('es-AR')} ARS`
  }

  const formatPercentage = (value: number | undefined | null) => `${(value || 0).toFixed(2)}%`

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
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
        <ChartBarIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar informe</h2>
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
        <h1 className="text-2xl font-bold text-gray-900">Informe Financiero</h1>
        <p className="text-gray-600">Análisis detallado de ingresos, rentabilidad y tendencias financieras</p>
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

      {/* Resumen general */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total de Casos</p>
            <p className="text-2xl font-bold text-blue-600">{data?.resumenGeneral?.totalCasos || 0}</p>
            <p className="text-xs text-gray-500">
              {formatPercentage(data?.resumenGeneral?.porcentajeFacturado)} facturados
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Ingresos USD</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data?.resumenGeneral?.montoTotalUSD || 0, 'USD')}
            </p>
            <p className="text-xs text-gray-500">Total del período</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BanknotesIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Ingresos ARS</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(data?.resumenGeneral?.montoTotalPesos || 0, 'PESOS')}
            </p>
            <p className="text-xs text-gray-500">Total del período</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Fee Total USD</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(data?.resumenGeneral?.feeTotalUSD || 0, 'USD')}
            </p>
            <p className="text-xs text-gray-500">Comisiones generadas</p>
          </div>
        </div>
      </div>

      {/* Análisis por moneda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis USD</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Casos con montos USD</span>
              <span className="text-lg font-bold text-gray-900">{data?.analisisMonedas?.USD?.totalCasos || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Monto total</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(data?.analisisMonedas?.USD?.montoTotal || 0, 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Promedio por caso</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(data?.analisisMonedas?.USD?.montoPromedio || 0, 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fee total</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(data?.analisisMonedas?.USD?.feeTotal || 0, 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fee promedio</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(data?.analisisMonedas?.USD?.feePromedio || 0, 'USD')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Casos facturados</span>
              <span className="text-lg font-bold text-yellow-600">{data?.analisisMonedas?.USD?.casosFacturados || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Monto facturado</span>
              <span className="text-lg font-bold text-indigo-600">
                {formatCurrency(data?.analisisMonedas?.USD?.montoFacturado || 0, 'USD')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis ARS</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Casos con montos ARS</span>
              <span className="text-lg font-bold text-gray-900">{data?.analisisMonedas?.PESOS?.totalCasos || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Monto total</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(data?.analisisMonedas?.PESOS?.montoTotal || 0, 'PESOS')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Promedio por caso</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(data?.analisisMonedas?.PESOS?.montoPromedio || 0, 'PESOS')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fee total</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(data?.analisisMonedas?.PESOS?.feeTotal || 0, 'PESOS')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fee promedio</span>
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(data?.analisisMonedas?.PESOS?.feePromedio || 0, 'PESOS')}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Casos facturados</span>
              <span className="text-lg font-bold text-yellow-600">{data?.analisisMonedas?.PESOS?.casosFacturados || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Monto facturado</span>
              <span className="text-lg font-bold text-indigo-600">
                {formatCurrency(data?.analisisMonedas?.PESOS?.montoFacturado || 0, 'PESOS')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis por tipo de servicio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis por Tipo de Servicio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Tipo de Servicio</th>
                <th className="text-right py-3 font-medium text-gray-700">Casos</th>
                <th className="text-right py-3 font-medium text-gray-700">% Facturado</th>
                <th className="text-right py-3 font-medium text-gray-700">Monto USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Monto ARS</th>
                <th className="text-right py-3 font-medium text-gray-700">Fee USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Promedio USD</th>
              </tr>
            </thead>
            <tbody>
              {(data?.analisisPorTipoServicio || []).map((servicio: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">
                    {servicio.estadoInterno.replace('_', ' ')}
                  </td>
                  <td className="text-right py-3 text-gray-900">{servicio.totalCasos}</td>
                  <td className="text-right py-3">
                    <span className={`${
                      servicio.porcentajeFacturado > 80 ? 'text-green-600' :
                      servicio.porcentajeFacturado > 60 ? 'text-yellow-600' : 'text-red-600'
                    } font-medium`}>
                      {formatPercentage(servicio.porcentajeFacturado)}
                    </span>
                  </td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(servicio.montoTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(servicio.montoTotalPesos, 'PESOS')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(servicio.feeTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-blue-600">
                    {formatCurrency(servicio.montoPromedioUSD, 'USD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tendencias temporales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias Temporales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Mes</th>
                <th className="text-right py-3 font-medium text-gray-700">Casos</th>
                <th className="text-right py-3 font-medium text-gray-700">Facturados</th>
                <th className="text-right py-3 font-medium text-gray-700">Monto USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Fee USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Facturado USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Fee Facturado USD</th>
              </tr>
            </thead>
            <tbody>
              {(data?.analisisTemporal || []).map((mes: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{mes.mes}</td>
                  <td className="text-right py-3 text-gray-900">{mes.totalCasos}</td>
                  <td className="text-right py-3 text-green-600">{mes.casosFacturados}</td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(mes.montoTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-purple-600">
                    {formatCurrency(mes.feeTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-blue-600">
                    {formatCurrency(mes.montoFacturadoUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-orange-600">
                    {formatCurrency(mes.feeFacturadoUSD, 'USD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas de rentabilidad */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Rentabilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Margen Fee USD</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPercentage(data?.estadisticasRentabilidad?.margenFee?.USD)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Margen Fee ARS</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPercentage(data?.estadisticasRentabilidad?.margenFee?.PESOS)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Casos Rentables</p>
            <p className="text-2xl font-bold text-purple-600">{data?.estadisticasRentabilidad?.casosRentables || 0}</p>
            <p className="text-xs text-gray-500">
              {formatPercentage(data?.estadisticasRentabilidad?.porcentajeRentabilidad)} del total
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Total Fees USD</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(data?.estadisticasRentabilidad?.totalFees?.USD || 0, 'USD')}
            </p>
          </div>
        </div>
      </div>

      {/* Top corresponsales por ingresos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Corresponsales por Ingresos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-700">Corresponsal</th>
                <th className="text-right py-3 font-medium text-gray-700">Casos</th>
                <th className="text-right py-3 font-medium text-gray-700">Monto USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Monto ARS</th>
                <th className="text-right py-3 font-medium text-gray-700">Fee USD</th>
                <th className="text-right py-3 font-medium text-gray-700">Fee ARS</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topCorresponsales || []).map((corresponsal: any, index: number) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{corresponsal.corresponsal.nombre}</p>
                      <p className="text-xs text-gray-500">{corresponsal.corresponsal.ubicacion}</p>
                    </div>
                  </td>
                  <td className="text-right py-3 text-gray-900">{corresponsal.totalCasos}</td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(corresponsal.montoTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-gray-900">
                    {formatCurrency(corresponsal.montoTotalPesos, 'PESOS')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(corresponsal.feeTotalUSD, 'USD')}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrency(corresponsal.feeTotalPesos, 'PESOS')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(data?.topCorresponsales || []).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos de corresponsales para mostrar</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Informe generado el: {data?.fechaGeneracion ? new Date(data.fechaGeneracion).toLocaleString('es-ES') : 'No disponible'}
      </div>
    </div>
  )
}