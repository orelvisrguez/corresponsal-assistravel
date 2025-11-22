'use client'

import { useState } from 'react'
import { CasoConCorresponsal } from '@/types'
import { exportToExcel, exportFilteredData, generateHTMLReport, downloadFile } from '@/lib/exportUtils'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'

interface ExportOptionsProps {
  casos: CasoConCorresponsal[]
  filteredCasos?: CasoConCorresponsal[]
  className?: string
}

export default function ExportOptions({ casos, filteredCasos, className = '' }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null)

  const handleExportExcel = async (isFiltered: boolean = false) => {
    setIsExporting(true)
    setExportType('excel')
    
    try {
      // Usar el endpoint API para mayor robustez
      const response = await fetch('/api/export/casos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'casos',
          format: 'csv',
          filters: isFiltered ? { filtered: true } : {},
          dateRange: null // Se puede expandir para incluir filtros de fecha
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 10)
      a.style.display = 'none'
      a.href = url
      a.download = `${isFiltered ? 'casos_filtrados' : 'casos_completo'}_${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error al exportar:', error)
      // Fallback: usar exportación local
      const dataToExport = isFiltered && filteredCasos ? filteredCasos : casos
      const filename = isFiltered ? 'casos_filtrados' : 'casos_completo'
      exportToExcel(dataToExport, filename)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportType(null)
      }, 1000)
    }
  }

  const handleExportPDF = async (isFiltered: boolean = false) => {
    setIsExporting(true)
    setExportType('pdf')
    
    try {
      // Usar el endpoint API para generar reporte HTML
      const response = await fetch('/api/export/casos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'casos',
          format: 'html',
          filters: isFiltered ? { filtered: true } : {},
          dateRange: null
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const htmlContent = await response.text()
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      downloadFile(htmlContent, `reporte_casos_${timestamp}.html`, 'text/html')
      
    } catch (error) {
      console.error('Error al generar reporte PDF:', error)
      // Fallback: usar generación local
      const dataToExport = isFiltered && filteredCasos ? filteredCasos : casos
      const title = isFiltered ? 'Reporte de Casos Filtrados' : 'Reporte Completo de Casos'
      const htmlContent = generateHTMLReport(dataToExport, title)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      downloadFile(htmlContent, `reporte_casos_${timestamp}.html`, 'text/html')
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportType(null)
      }, 1000)
    }
  }

  const totalCasos = casos.length
  const totalFiltrados = filteredCasos ? filteredCasos.length : totalCasos
  const hasFilters = filteredCasos && filteredCasos.length !== casos.length

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Exportar Datos</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          {hasFilters 
            ? `Exportando ${totalFiltrados} de ${totalCasos} casos (filtrados)` 
            : `Exportar todos los ${totalCasos} casos`
          }
        </p>

        <div className="space-y-4">
          {/* Exportar todos los datos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Exportar {hasFilters ? 'Datos Filtrados' : 'Todos los Casos'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleExportExcel(hasFilters)}
                disabled={isExporting}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting && exportType === 'excel' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <TableCellsIcon className="w-4 h-4 mr-2" />
                    Excel/CSV
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleExportPDF(hasFilters)}
                disabled={isExporting}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting && exportType === 'pdf' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Reporte PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• <strong>Excel/CSV:</strong> Datos tabulares para análisis en Excel</p>
            <p>• <strong>Reporte PDF:</strong> Documento formateado con estadísticas</p>
            <p>• <strong>Fechas:</strong> Todas las fechas se exportan en formato DD/MM/YYYY</p>
            <p>• <strong>Datos:</strong> Incluye todas las columnas de casos, corresponsales y financiera</p>
          </div>
        </div>
      </div>
    </div>
  )
}