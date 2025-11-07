'use client'

import { CasoConCorresponsal } from '@/types'
import { formatearMoneda } from '@/lib/calculations'
import { 
  CurrencyDollarIcon,
  CalculatorIcon,
  BanknotesIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface CasoFinancialStatsProps {
  casos: CasoConCorresponsal[]
}

export default function CasoFinancialStats({ casos }: CasoFinancialStatsProps) {
  // Calcular estadísticas financieras
  const calcularEstadisticas = () => {
    const totalFee = casos.reduce((sum, caso) => sum + (Number(caso.fee) || 0), 0)
    const totalCostoUsd = casos.reduce((sum, caso) => sum + (Number(caso.costoUsd) || 0), 0)
    const totalFeeCostoUsd = totalFee + totalCostoUsd
    const totalCompleto = casos.reduce((sum, caso) => {
      return sum + (Number(caso.fee) || 0) + (Number(caso.costoUsd) || 0) + (Number(caso.montoAgregado) || 0)
    }, 0)

    // Agrupar por moneda local
    const monedasPorTipo: { [key: string]: { suma: number, count: number } } = {}
    casos.forEach(caso => {
      const simbolo = caso.simboloMoneda || 'N/A'
      const monto = Number(caso.costoMonedaLocal) || 0
      if (monto > 0) {
        if (!monedasPorTipo[simbolo]) {
          monedasPorTipo[simbolo] = { suma: 0, count: 0 }
        }
        monedasPorTipo[simbolo].suma += monto
        monedasPorTipo[simbolo].count += 1
      }
    })

    return {
      totalFee,
      totalCostoUsd,
      totalFeeCostoUsd,
      totalCompleto,
      monedasPorTipo
    }
  }

  const stats = calcularEstadisticas()

  if (casos.length === 0) return null

  const statCards = [
    {
      label: 'Suma Total de Fee',
      value: formatearMoneda(stats.totalFee),
      icon: BanknotesIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      description: 'Total de todas las tarifas'
    },
    {
      label: 'Suma Total de Costo USD',
      value: formatearMoneda(stats.totalCostoUsd),
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      description: 'Total de todos los costos en USD'
    },
    {
      label: 'Suma Total Fee + Costo USD',
      value: formatearMoneda(stats.totalFeeCostoUsd),
      icon: CalculatorIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      description: 'Combinación de tarifas y costos USD'
    },
    {
      label: 'Suma Total Completa',
      value: formatearMoneda(stats.totalCompleto),
      icon: ChartBarIcon,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      description: 'Fee + Costo USD + Monto Agregado'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-900">Estadísticas Financieras</h3>
          <span className="text-xs text-gray-500">({casos.length} casos)</span>
        </div>
      </div>

      {/* Tarjetas principales de estadísticas */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-lg font-bold ${stat.textColor} mb-1`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desglose de monedas locales */}
        {Object.keys(stats.monedasPorTipo).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-4">
              <GlobeAltIcon className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Desglose por Monedas Locales</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.monedasPorTipo)
                  .sort(([,a], [,b]) => b.suma - a.suma)
                  .map(([moneda, datos]) => (
                    <div key={moneda} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {moneda.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{moneda}</span>
                        </div>
                        <span className="text-xs text-gray-500">{datos.count} casos</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">
                          {datos.suma.toFixed(2)} {moneda}
                        </p>
                        <p className="text-xs text-gray-500">
                          Promedio: {(datos.suma / datos.count).toFixed(2)} {moneda}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="text-center">
              <p className="font-medium text-gray-700">Casos con Fee</p>
              <p className="text-lg font-bold text-emerald-600">
                {casos.filter(c => Number(c.fee) > 0).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Casos con Costo USD</p>
              <p className="text-lg font-bold text-blue-600">
                {casos.filter(c => Number(c.costoUsd) > 0).length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Casos con Monto Agregado</p>
              <p className="text-lg font-bold text-purple-600">
                {casos.filter(c => Number(c.montoAgregado) > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}