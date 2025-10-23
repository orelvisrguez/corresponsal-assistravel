'use client'

import { CasoConCorresponsal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface QuickStatsProps {
  casos: CasoConCorresponsal[]
}

export default function QuickStats({ casos }: QuickStatsProps) {
  const stats = {
    total: casos.length,
    abiertos: casos.filter(c => c.estadoInterno === 'ABIERTO').length,
    cerrados: casos.filter(c => c.estadoInterno === 'CERRADO').length,
    totalUSD: casos.reduce((sum, c) => sum + (Number(c.costoUsd) || 0), 0),
    conFactura: casos.filter(c => c.tieneFactura).length
  }

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      label: 'Abiertos',
      value: stats.abiertos,
      icon: ClockIcon,
      color: 'text-yellow-600'
    },
    {
      label: 'Cerrados',
      value: stats.cerrados,
      icon: CheckCircleIcon,
      color: 'text-green-600'
    },
    {
      label: 'Total USD',
      value: formatCurrency(stats.totalUSD),
      icon: CurrencyDollarIcon,
      color: 'text-purple-600'
    }
  ]

  if (casos.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumen Rápido</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mb-2`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-lg font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          )
        })}
      </div>
      
      {/* Estadísticas adicionales */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Con factura: {stats.conFactura} ({stats.total > 0 ? Math.round((stats.conFactura / stats.total) * 100) : 0}%)</span>
          <span>Promedio USD: {stats.total > 0 ? formatCurrency(stats.totalUSD / stats.total) : '$0'}</span>
        </div>
      </div>
    </div>
  )
}
