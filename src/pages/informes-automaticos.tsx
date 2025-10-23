'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// Componentes del módulo
import ReportGenerator from '@/components/reports/automated/ReportGenerator'
import ReportViewer from '@/components/reports/automated/ReportViewer'
import ReportHistory from '@/components/reports/automated/ReportHistory'

export default function InformesAutomaticos() {
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'viewer'>('generate')
  const [selectedReport, setSelectedReport] = useState<any>(null)

  const tabs = [
    {
      id: 'generate',
      name: 'Generar Informe',
      icon: SparklesIcon,
      description: 'Crear nuevo informe con IA'
    },
    {
      id: 'history',
      name: 'Historial',
      icon: DocumentTextIcon,
      description: 'Ver informes generados'
    },
    {
      id: 'viewer',
      name: 'Visor',
      icon: EyeIcon,
      description: 'Ver informe seleccionado'
    }
  ]

  const handleViewReport = (report: any) => {
    setSelectedReport(report)
    setActiveTab('viewer')
  }

  const handleNewReport = () => {
    setSelectedReport(null)
    setActiveTab('generate')
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Informes Automáticos</h1>
              <p className="text-blue-100 mt-2">
                Genera informes profesionales usando inteligencia artificial
              </p>
            </div>
            <SparklesIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {activeTab === 'generate' && (
              <ReportGenerator 
                onReportGenerated={handleViewReport}
              />
            )}
            
            {activeTab === 'history' && (
              <ReportHistory 
                onViewReport={handleViewReport}
                onNewReport={handleNewReport}
              />
            )}
            
            {activeTab === 'viewer' && (
              <ReportViewer 
                report={selectedReport}
                onNewReport={handleNewReport}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}