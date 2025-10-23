'use client'

import { useState } from 'react'
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BanknotesIcon,
  CalendarIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ReportGeneratorProps {
  onReportGenerated: (report: any) => void
}

export default function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    filtroFecha: 'mensual',
    fechaInicio: '',
    fechaFin: '',
    filtrosAdicionales: {
      corresponsalId: '',
      estadoInterno: '',
      pais: ''
    }
  })

  const tiposInforme = [
    {
      id: 'ESTADISTICO_GENERAL',
      name: 'Informe Estadístico General',
      description: 'Análisis completo de todas las métricas del sistema',
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      id: 'FINANCIERO',
      name: 'Informe Financiero',
      description: 'Análisis detallado de ingresos, egresos y rentabilidad',
      icon: CurrencyDollarIcon,
      color: 'green'
    },
    {
      id: 'CASOS',
      name: 'Informe de Casos',
      description: 'Gestión y análisis del estado de casos',
      icon: DocumentTextIcon,
      color: 'purple'
    },
    {
      id: 'CORRESPONSAL',
      name: 'Informe de Corresponsales',
      description: 'Rendimiento y análisis de la red de corresponsales',
      icon: UserGroupIcon,
      color: 'orange'
    },
    {
      id: 'FACTURACION',
      name: 'Informe de Facturación',
      description: 'Estado de facturación y cobranzas',
      icon: BanknotesIcon,
      color: 'indigo'
    }
  ]

  const filtrosFecha = [
    { id: 'semanal', name: 'Última Semana', days: 7 },
    { id: 'quincenal', name: 'Últimas 2 Semanas', days: 14 },
    { id: 'mensual', name: 'Último Mes', days: 30 },
    { id: 'trimestral', name: 'Último Trimestre', days: 90 },
    { id: 'semestral', name: 'Último Semestre', days: 180 },
    { id: 'anual', name: 'Último Año', days: 365 },
    { id: 'personalizado', name: 'Personalizado', days: null }
  ]

  const handleFiltroFechaChange = (filtro: string) => {
    if (filtro !== 'personalizado') {
      const filtroObj = filtrosFecha.find(f => f.id === filtro)
      if (filtroObj?.days) {
        const fechaFin = new Date()
        const fechaInicio = new Date()
        fechaInicio.setDate(fechaFin.getDate() - filtroObj.days)
        
        // Actualizar todo en una sola llamada
        setFormData(prev => ({
          ...prev,
          filtroFecha: filtro,
          fechaInicio: fechaInicio.toISOString().split('T')[0],
          fechaFin: fechaFin.toISOString().split('T')[0]
        }))
      } else {
        // Solo actualizar el filtro si no hay días definidos
        setFormData(prev => ({ ...prev, filtroFecha: filtro }))
      }
    } else {
      // Para personalizado, limpiar las fechas
      setFormData(prev => ({ 
        ...prev, 
        filtroFecha: filtro,
        fechaInicio: '',
        fechaFin: ''
      }))
    }
  }

  const fetchReportData = async (tipo: string, fechaInicio: string, fechaFin: string) => {
    // Obtener datos según el tipo de informe
    const endpoints = {
      ESTADISTICO_GENERAL: '/api/reports/resumen',
      FINANCIERO: '/api/reports/financiero',
      CASOS: '/api/reports/resumen',
      CORRESPONSAL: '/api/reports/corresponsales',
      FACTURACION: '/api/reports/facturacion'
    }

    const endpoint = endpoints[tipo as keyof typeof endpoints]
    const params = new URLSearchParams({ fechaInicio, fechaFin })
    
    // Agregar filtros adicionales si existen
    if (formData.filtrosAdicionales.corresponsalId) {
      params.append('corresponsalId', formData.filtrosAdicionales.corresponsalId)
    }
    if (formData.filtrosAdicionales.estadoInterno) {
      params.append('estadoInterno', formData.filtrosAdicionales.estadoInterno)
    }

    const response = await fetch(`${endpoint}?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Error al obtener datos para el informe')
    }
    
    const result = await response.json()
    return result.data
  }

  const handleGenerateReport = async () => {
    if (!formData.titulo || !formData.tipo || !formData.fechaInicio || !formData.fechaFin) {
      setError('Por favor, completa todos los campos requeridos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Obtener datos del período seleccionado
      const datos = await fetchReportData(formData.tipo, formData.fechaInicio, formData.fechaFin)

      // 2. Generar informe con Gemini
      const reportResponse = await fetch('/api/gemini/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: formData.tipo,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          datos,
          filtros: formData.filtrosAdicionales
        })
      })

      if (!reportResponse.ok) {
        throw new Error('Error al generar el informe')
      }

      const reportData = await reportResponse.json()

      // 3. Guardar informe en la base de datos
      const saveResponse = await fetch('/api/reports/automated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: formData.titulo,
          tipo: formData.tipo,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          filtroPersonalizado: formData.filtrosAdicionales,
          contenidoMarkdown: reportData.data.contenidoMarkdown,
          contenidoTextoPlano: reportData.data.contenidoTextoPlano,
          datosUtilizados: reportData.data.datosUtilizados,
          prompt: reportData.data.prompt,
          metadatos: reportData.data.metadatos
        })
      })

      if (!saveResponse.ok) {
        throw new Error('Error al guardar el informe')
      }

      const savedReport = await saveResponse.json()
      
      // Notificar al componente padre
      onReportGenerated(savedReport.data)
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        tipo: '',
        filtroFecha: 'mensual',
        fechaInicio: '',
        fechaFin: '',
        filtrosAdicionales: {
          corresponsalId: '',
          estadoInterno: '',
          pais: ''
        }
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const selectedTipo = tiposInforme.find(t => t.id === formData.tipo)

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generar Nuevo Informe</h2>
        <p className="text-gray-600">
          Utiliza inteligencia artificial para generar informes profesionales basados en tus datos
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración básica */}
        <div className="space-y-6">
          {/* Título del informe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Informe *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ej: Informe Financiero - Octubre 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo de informe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Informe *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {tiposInforme.map((tipo) => {
                const Icon = tipo.icon
                const isSelected = formData.tipo === tipo.id
                return (
                  <button
                    key={tipo.id}
                    onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.id }))}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? `border-${tipo.color}-500 bg-${tipo.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-6 w-6 mt-0.5 ${isSelected ? `text-${tipo.color}-600` : 'text-gray-400'}`} />
                      <div>
                        <h3 className={`font-medium ${isSelected ? `text-${tipo.color}-900` : 'text-gray-900'}`}>
                          {tipo.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {tipo.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Configuración de fechas y filtros */}
        <div className="space-y-6">
          {/* Filtro de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Período de Análisis *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {filtrosFecha.map((filtro) => (
                <button
                  key={filtro.id}
                  onClick={() => handleFiltroFechaChange(filtro.id)}
                  className={`
                    px-3 py-2 text-sm rounded-md border transition-colors
                    ${formData.filtroFecha === filtro.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {filtro.name}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas personalizadas */}
          {formData.filtroFecha === 'personalizado' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Mostrar fechas seleccionadas */}
          {formData.fechaInicio && formData.fechaFin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Período seleccionado:
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Del {new Date(formData.fechaInicio).toLocaleDateString('es-ES')} al {new Date(formData.fechaFin).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}

          {/* Filtros adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filtros Adicionales (Opcional)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ID de Corresponsal específico"
                value={formData.filtrosAdicionales.corresponsalId}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  filtrosAdicionales: { ...prev.filtrosAdicionales, corresponsalId: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.filtrosAdicionales.estadoInterno}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  filtrosAdicionales: { ...prev.filtrosAdicionales, estadoInterno: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="ABIERTO">Abierto</option>
                <option value="CERRADO">Cerrado</option>
                <option value="PAUSADO">Pausado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de generar */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        {/* Debug info - mostrar campos faltantes */}
        {(!formData.titulo || !formData.tipo || !formData.fechaInicio || !formData.fechaFin) && (
          <div className="mr-4 text-sm text-gray-500">
            <p>Campos requeridos:</p>
            <ul className="list-disc list-inside">
              {!formData.titulo && <li>Título del informe</li>}
              {!formData.tipo && <li>Tipo de informe</li>}
              {!formData.fechaInicio && <li>Fecha de inicio</li>}
              {!formData.fechaFin && <li>Fecha de fin</li>}
            </ul>
          </div>
        )}
        
        <button
          onClick={handleGenerateReport}
          disabled={loading || !formData.titulo || !formData.tipo || !formData.fechaInicio || !formData.fechaFin}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generando informe...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              <span>Generar Informe con IA</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}