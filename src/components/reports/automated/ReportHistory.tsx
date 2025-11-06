'use client'

import { useState, useEffect } from 'react'
import { 
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ReportHistoryProps {
  onViewReport: (report: any) => void
  onNewReport: () => void
}

export default function ReportHistory({ onViewReport, onNewReport }: ReportHistoryProps) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const tiposInforme = [
    { id: '', name: 'Todos los tipos' },
    { id: 'ESTADISTICO_GENERAL', name: 'Estadístico General' },
    { id: 'FINANCIERO', name: 'Financiero' },
    { id: 'CASOS', name: 'Casos' },
    { id: 'CORRESPONSAL', name: 'Corresponsal' },
    { id: 'FACTURACION', name: 'Facturación' }
  ]

  const fetchReports = async (page = 1, limit = 10) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })

      if (filterType) {
        params.append('tipo', filterType)
      }

      const response = await fetch(`/api/reports/automated?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el historial de informes')
      }

      const result = await response.json()
      setReports(result.data.informes)
      setCurrentPage(result.data.pagination.page)
      setTotalPages(result.data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(currentPage)
  }, [currentPage, filterType])

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este informe?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/automated?id=${reportId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el informe')
      }

      // Refrescar la lista
      fetchReports(currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels = {
      ESTADISTICO_GENERAL: 'Estadístico General',
      FINANCIERO: 'Financiero',
      CASOS: 'Casos',
      CORRESPONSAL: 'Corresponsal',
      FACTURACION: 'Facturación'
    }
    return labels[tipo as keyof typeof labels] || tipo
  }

  const getTipoColor = (tipo: string) => {
    const colors = {
      ESTADISTICO_GENERAL: 'bg-blue-100 text-blue-800',
      FINANCIERO: 'bg-green-100 text-green-800',
      CASOS: 'bg-purple-100 text-purple-800',
      CORRESPONSAL: 'bg-orange-100 text-orange-800',
      FACTURACION: 'bg-indigo-100 text-indigo-800'
    }
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Filtrar reportes por término de búsqueda
  const filteredReports = reports.filter(report =>
    report.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTipoLabel(report.tipo).toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="h-8 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Informes</h2>
          <p className="text-gray-600 mt-1">
            Administra y revisa todos los informes generados
          </p>
        </div>
        <button
          onClick={onNewReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuevo Informe</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busqueda */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar informes por título o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <div className="sm:w-64">
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-900 bg-white"
              >
                {tiposInforme.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de informes */}
      {filteredReports.length === 0 && !loading ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay informes que mostrar</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm || filterType ? 'Intenta modificar los filtros' : 'Crea tu primer informe automático'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{report.titulo}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTipoColor(report.tipo)}`}>
                      {getTipoLabel(report.tipo)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Generado: {new Date(report.fechaGeneracion).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-4 w-4" />
                      <span>Periodo: {report.periodoInicio} - {report.periodoFin}</span>
                    </div>
                  </div>

                  {report.resumen && (
                    <p className="text-gray-600 mt-2 line-clamp-2">{report.resumen}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onViewReport(report)}
                    className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>Ver</span>
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="flex items-center space-x-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}