'use client'

import { useState } from 'react'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'

import ReportsDashboard from '@/components/reports/ReportsDashboard'
import ReporteFacturacion from '@/components/reports/ReporteFacturacion'
import ReporteCorresponsales from '@/components/reports/ReporteCorresponsales'
import InformeFinanciero from '@/components/reports/InformeFinanciero'

type ReportType = 'dashboard' | 'facturacion' | 'corresponsales' | 'financiero'

interface TabOption {
  id: ReportType
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
}

const tabs: TabOption[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Vista general y métricas clave',
    icon: ChartBarIcon,
    color: 'blue'
  },
  {
    id: 'facturacion',
    name: 'Facturación',
    description: 'Análisis de facturación y pagos',
    icon: CurrencyDollarIcon,
    color: 'green'
  },
  {
    id: 'corresponsales',
    name: 'Corresponsales',
    description: 'Rendimiento por corresponsal',
    icon: UserGroupIcon,
    color: 'purple'
  },
  {
    id: 'financiero',
    name: 'Financiero',
    description: 'Análisis financiero detallado',
    icon: PresentationChartLineIcon,
    color: 'orange'
  }
]

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('dashboard')

  const renderReportContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ReportsDashboard />
      case 'facturacion':
        return <ReporteFacturacion />
      case 'corresponsales':
        return <ReporteCorresponsales />
      case 'financiero':
        return <InformeFinanciero />
      default:
        return <ReportsDashboard />
    }
  }

  const getTabClasses = (tabId: ReportType, color: string) => {
    const isActive = activeTab === tabId
    
    if (isActive) {
      const colorClasses = {
        blue: 'bg-blue-600 text-white shadow-lg',
        green: 'bg-green-600 text-white shadow-lg',
        purple: 'bg-purple-600 text-white shadow-lg',
        orange: 'bg-orange-600 text-white shadow-lg'
      }
      return {
        button: colorClasses[color as keyof typeof colorClasses] || 'bg-blue-600 text-white shadow-lg',
        icon: 'text-white',
        content: 'text-white'
      }
    }
    
    const hoverClasses = {
      blue: 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200',
      green: 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200',
      purple: 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-gray-200',
      orange: 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-700 border border-gray-200'
    }
    
    const iconClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    }
    
    return {
      button: hoverClasses[color as keyof typeof hoverClasses] || 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-200',
      icon: iconClasses[color as keyof typeof iconClasses] || 'text-blue-600',
      content: 'text-gray-600'
    }
  }

  return (
    <Layout>
      <Head>
        <title>Reportes - ASSISTRAVEL</title>
        <meta name="description" content="Centro de reportes y análisis de datos" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Centro de Reportes</h1>
          <p className="text-lg text-gray-600">
            Análisis integral de datos de negocio, finanzas y operaciones
          </p>
        </div>

        {/* Navegación de tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap justify-center gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const classes = getTabClasses(tab.id, tab.color)
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${classes.button} px-6 py-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${classes.icon}`} />
                    <div className="text-left">
                      <p className={`font-semibold ${classes.content}`}>{tab.name}</p>
                      <p className={`text-sm ${classes.content} opacity-90`}>{tab.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Contenido del reporte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderReportContent()}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Reportes en Tiempo Real</h3>
              <p className="text-sm text-gray-600">
                Todos los datos se actualizan automáticamente desde la base de datos
              </p>
            </div>
            <div className="text-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Análisis Avanzados</h3>
              <p className="text-sm text-gray-600">
                Métricas de rendimiento, tendencias y análisis financiero detallado
              </p>
            </div>
            <div className="text-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Control Financiero</h3>
              <p className="text-sm text-gray-600">
                Seguimiento de facturación, fees y rentabilidad por múltiples dimensiones
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}