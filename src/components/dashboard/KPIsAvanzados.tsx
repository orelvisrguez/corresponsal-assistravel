'use client'

import { useState, useEffect } from 'react'
import { CasoConCorresponsal } from '@/types'
import { 
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'

interface KPIData {
  totalCases: number
  averageCaseDurationDays: number
  monthlyCreationTrend: {
    month: string
    count: number
    percentage: number
  }[]
  paymentEfficiency: {
    paidCases: number
    totalWithInvoice: number
    averagePaymentDelayDays: number
    percentage: number
  }
  revenueMetrics: {
    totalRevenue: number
    averageRevenuePerCase: number
    currencyDistribution: {
      currency: string
      count: number
      totalAmount: number
      percentage: number
    }[]
  }
  operationalMetrics: {
    casesWithMedicalReport: number
    casesWithoutFee: number
    pendingRefacturingCases: number
    averageFeeDays: number
  }
  monthlyFinancialTrend: {
    month: string
    revenue: number
    caseCount: number
    averagePerCase: number
  }[]
  statusDistribution: {
    status: string
    count: number
    percentage: number
    color: string
  }[]
}

interface Props {
  casos: CasoConCorresponsal[]
}

export default function KPIsAvanzados({ casos }: Props) {
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m')

  useEffect(() => {
    if (casos) {
      setLoading(true)
      calculateKPIs()
      setLoading(false)
    }
  }, [casos, selectedTimeRange])

  const getFilteredCasos = (): CasoConCorresponsal[] => {
    if (selectedTimeRange === 'all') return casos;

    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeRange) {
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return casos.filter(caso => new Date(caso.fechaInicioCaso) >= cutoffDate);
  };

  const calculateAverageDuration = (cases: CasoConCorresponsal[]): number => {
    const casesWithPayment = cases.filter(caso => 
      caso.fechaPagoFactura && caso.fechaInicioCaso
    )

    if (casesWithPayment.length === 0) return 0

    const totalDays = casesWithPayment.reduce((sum, caso) => {
      const startDate = new Date(caso.fechaInicioCaso)
      const endDate = new Date(caso.fechaPagoFactura!)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return sum + diffDays
    }, 0)

    return Math.round(totalDays / casesWithPayment.length)
  }

  const calculatePaymentEfficiency = (cases: CasoConCorresponsal[]) => {
    const casesWithInvoice = cases.filter(caso => caso.tieneFactura)
    const paidCases = cases.filter(caso => caso.fechaPagoFactura)
    
    const avgDelayDays = casesWithInvoice.length > 0 ? casesWithInvoice.reduce((sum, caso) => {
      if (!caso.fechaVencimientoFactura || !caso.fechaPagoFactura) return sum
      
      const dueDate = new Date(caso.fechaVencimientoFactura)
      const paidDate = new Date(caso.fechaPagoFactura)
      const delayDays = Math.max(0, Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      return sum + delayDays
    }, 0) / casesWithInvoice.length : 0

    return {
      paidCases: paidCases.length,
      totalWithInvoice: casesWithInvoice.length,
      averagePaymentDelayDays: Math.round(avgDelayDays),
      percentage: casesWithInvoice.length > 0 ? Math.round((paidCases.length / casesWithInvoice.length) * 100) : 0
    }
  }

  const calculateRevenueMetrics = (cases: CasoConCorresponsal[]) => {
    const totalRevenue = cases.reduce((sum, caso) => sum + (Number(caso.costoUsd) || 0), 0)
    const averageRevenuePerCase = cases.length > 0 ? totalRevenue / cases.length : 0

    // Distribución por moneda - incluir todos los casos
    const currencyMap = new Map<string, { count: number; totalAmount: number }>()
    
    cases.forEach(caso => {
      let currency: string
      let amount: number = 0
      
      // Priorizar el símbolo de moneda definido
      if (caso.simboloMoneda && caso.simboloMoneda.trim() !== '') {
        currency = caso.simboloMoneda.trim()
        amount = Number(caso.costoMonedaLocal) || 0
      } else if (caso.costoUsd && Number(caso.costoUsd) > 0) {
        // Si hay costo en USD pero no moneda local, contar como USD
        currency = 'USD'
        amount = Number(caso.costoUsd) || 0
      } else {
        // Casos sin información de moneda
        currency = 'Sin especificar'
        amount = 0
      }
      
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, { count: 0, totalAmount: 0 })
      }
      
      const existing = currencyMap.get(currency)!
      existing.count += 1
      existing.totalAmount += amount
    })

    const currencyDistribution = Array.from(currencyMap.entries()).map(([currency, data]) => ({
      currency,
      count: data.count,
      totalAmount: data.totalAmount,
      percentage: cases.length > 0 ? Math.round((data.count / cases.length) * 100) : 0
    })).sort((a, b) => {
      // Mantener "Sin especificar" al final
      if (a.currency === 'Sin especificar') return 1
      if (b.currency === 'Sin especificar') return -1
      return b.count - a.count
    })

    return {
      totalRevenue,
      averageRevenuePerCase,
      currencyDistribution
    }
  }

  const calculateMonthlyTrends = (cases: CasoConCorresponsal[]) => {
    const monthlyData = new Map<string, { count: number; revenue: number }>()
    
    cases.forEach(caso => {
      const date = new Date(caso.fechaInicioCaso)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { count: 0, revenue: 0 })
      }
      
      const existing = monthlyData.get(monthKey)!
      existing.count += 1
      existing.revenue += Number(caso.costoUsd) || 0
    })

    const sortedMonths = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6) // Últimos 6 meses

    const creationTrend = sortedMonths.map(([month, data]) => {
      const percentage = sortedMonths.length > 1 ? 
        Math.round(((data.count - (sortedMonths[0][1].count || 1)) / (sortedMonths[0][1].count || 1)) * 100) : 0
      
      return {
        month,
        count: data.count,
        percentage
      }
    })

    const financialTrend = sortedMonths.map(([month, data]) => ({
      month,
      revenue: data.revenue,
      caseCount: data.count,
      averagePerCase: data.count > 0 ? data.revenue / data.count : 0
    }))

    return { creationTrend, financialTrend }
  }

  const calculateKPIs = () => {
    const filteredCasos = getFilteredCasos()
    
    if (filteredCasos.length === 0) {
      setKpiData(null)
      return
    }

    const { creationTrend, financialTrend } = calculateMonthlyTrends(filteredCasos)
    const paymentEfficiency = calculatePaymentEfficiency(filteredCasos)
    const revenueMetrics = calculateRevenueMetrics(filteredCasos)

    const operationalMetrics = {
      casesWithMedicalReport: filteredCasos.filter(caso => caso.informeMedico).length,
      casesWithoutFee: filteredCasos.filter(caso => caso.estadoDelCaso === 'NO_FEE').length,
      pendingRefacturingCases: filteredCasos.filter(caso => caso.estadoDelCaso === 'PARA_REFACTURAR').length,
      averageFeeDays: filteredCasos.filter(caso => caso.fee).length > 0 ? 
        Math.round(filteredCasos.filter(caso => caso.fee).reduce((sum, caso) => {
          const startDate = new Date(caso.fechaInicioCaso)
          const today = new Date()
          return sum + Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }, 0) / filteredCasos.filter(caso => caso.fee).length) : 0
    }

    const statusDistribution = [
      { status: 'ABIERTO', count: filteredCasos.filter(c => c.estadoInterno === 'ABIERTO').length, color: 'bg-green-500' },
      { status: 'CERRADO', count: filteredCasos.filter(c => c.estadoInterno === 'CERRADO').length, color: 'bg-gray-500' },
      { status: 'PAUSADO', count: filteredCasos.filter(c => c.estadoInterno === 'PAUSADO').length, color: 'bg-yellow-500' },
      { status: 'CANCELADO', count: filteredCasos.filter(c => c.estadoInterno === 'CANCELADO').length, color: 'bg-red-500' }
    ].map(item => ({
      ...item,
      percentage: Math.round((item.count / filteredCasos.length) * 100)
    }))

    setKpiData({
      totalCases: filteredCasos.length,
      averageCaseDurationDays: calculateAverageDuration(filteredCasos),
      monthlyCreationTrend: creationTrend,
      paymentEfficiency,
      revenueMetrics,
      operationalMetrics,
      monthlyFinancialTrend: financialTrend,
      statusDistribution
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!kpiData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos suficientes</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron casos en el período seleccionado para generar KPIs.
        </p>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Duración Promedio',
      value: `${kpiData.averageCaseDurationDays} días`,
      icon: ClockIcon,
      color: 'bg-blue-500',
      description: 'Tiempo promedio desde inicio hasta pago'
    },
    {
      title: 'Eficiencia de Pago',
      value: `${kpiData.paymentEfficiency.percentage}%`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      description: `${kpiData.paymentEfficiency.paidCases} de ${kpiData.paymentEfficiency.totalWithInvoice} casos pagados`
    },
    {
      title: 'Ingresos Promedio',
      value: formatCurrency(kpiData.revenueMetrics.averageRevenuePerCase),
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      description: 'Ingreso promedio por caso'
    },
    {
      title: 'Casos con Informe',
      value: `${Math.round((kpiData.operationalMetrics.casesWithMedicalReport / kpiData.totalCases) * 100)}%`,
      icon: DocumentCheckIcon,
      color: 'bg-indigo-500',
      description: `${kpiData.operationalMetrics.casesWithMedicalReport} casos con informe médico`
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPIs Avanzados</h2>
          <p className="text-gray-600 mt-1">Métricas y análisis detallado de casos</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          >
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último año</option>
            <option value="all">Todos los períodos</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
                </div>
                <div className={`flex-shrink-0 p-3 rounded-lg ${kpi.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Distribución de Estados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Distribución de Estados</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiData.statusDistribution.map((status) => (
            <div key={status.status} className="text-center">
              <div className={`w-full h-2 rounded-full ${status.color} mb-2`}></div>
              <div className="text-lg font-bold text-gray-900">{status.count}</div>
              <div className="text-sm text-gray-600">{status.status}</div>
              <div className="text-xs text-gray-500">{status.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas Operacionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métricas de Facturación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Métricas de Facturación</h3>
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Casos Sin Fee</span>
              <span className="text-lg font-bold text-green-900">{kpiData.operationalMetrics.casesWithoutFee}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-orange-700">Para Refacturar</span>
              <span className="text-lg font-bold text-orange-900">{kpiData.operationalMetrics.pendingRefacturingCases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Demora Promedio (días)</span>
              <span className="text-lg font-bold text-blue-900">{kpiData.paymentEfficiency.averagePaymentDelayDays}</span>
            </div>
          </div>
        </div>

        {/* Distribución de Monedas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribución por Moneda</h3>
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {kpiData.revenueMetrics.currencyDistribution.slice(0, 5).map((currency, index) => (
              <div key={currency.currency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][index]
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{currency.currency}</div>
                    <div className="text-xs text-gray-500">{currency.count} casos • {currency.percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  {currency.totalAmount > 0 ? (
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {currency.totalAmount.toLocaleString('es-ES', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                      <div className="text-xs text-gray-500">{currency.currency}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Sin datos</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendencia Financiera Mensual */}
      {kpiData.monthlyFinancialTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tendencia Financiera (Últimos 6 Meses)</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Mes</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Casos</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Ingresos</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Promedio/Caso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kpiData.monthlyFinancialTrend.map((trend) => (
                  <tr key={trend.month}>
                    <td className="py-3 text-sm text-gray-900">{trend.month}</td>
                    <td className="py-3 text-right text-sm font-medium text-gray-900">{trend.caseCount}</td>
                    <td className="py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(trend.revenue)}</td>
                    <td className="py-3 text-right text-sm text-gray-600">{formatCurrency(trend.averagePerCase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
