import { CasoConCorresponsal } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear fecha en español
export const formatDateForExport = (date: Date | string | null): string => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es })
}

// Formatear fecha solo para fecha (sin hora)
export const formatDateOnlyForExport = (date: Date | string | null): string => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return ''
  
  return format(dateObj, 'dd/MM/yyyy', { locale: es })
}

// Preparar datos para exportación
export const prepareDataForExport = (casos: CasoConCorresponsal[]) => {
  return casos.map(caso => ({
    'ID Caso': caso.id,
    'Número ASSISTRAVEL': caso.nroCasoAssistravel || '',
    'Corresponsal': caso.corresponsal?.nombreCorresponsal || '',
    'País': caso.corresponsal?.pais || '',
    'Estado Interno': caso.estadoInterno || '',
    'Estado Proceso': caso.estadoDelCaso || '',
    'Fecha Creación': formatDateForExport(caso.fechaInicioCaso),
    'Fecha Última Actualización': formatDateForExport(caso.updatedAt),
    'Moneda Local': caso.costoMonedaLocal || '',
    'Símbolo Moneda': caso.simboloMoneda || '',
    'Fee': caso.fee || 0,
    'Costo USD': caso.costoUsd || 0,
    'Monto Agregado': caso.montoAgregado || 0,
    'Total Fee + Costo USD': (Number(caso.fee) || 0) + (Number(caso.costoUsd) || 0),
    'Total Completo': (Number(caso.fee) || 0) + (Number(caso.costoUsd) || 0) + (Number(caso.montoAgregado) || 0),
    'Informe Médico': caso.informeMedico ? 'Sí' : 'No',
    'Tiene Factura': caso.tieneFactura ? 'Sí' : 'No',
    'Número Factura': caso.nroFactura || '',
    'Fecha Emisión Factura': formatDateOnlyForExport(caso.fechaEmisionFactura),
    'Fecha Vencimiento Factura': formatDateOnlyForExport(caso.fechaVencimientoFactura),
    'Fecha Pago Factura': formatDateOnlyForExport(caso.fechaPagoFactura),
    'Observaciones': caso.observaciones || ''
  }))
}

// Convertir a CSV
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return ''

  // Crear header CSV
  const csvHeaders = headers.join(',')

  // Crear rows CSV
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || ''
      // Escapar comillas y envolver en comillas si contiene comas, comillas o saltos de línea
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

// Crear y descargar archivo
export const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  window.URL.revokeObjectURL(url)
}

// Exportar a Excel (usando CSV compatible)
export const exportToExcel = (casos: CasoConCorresponsal[], filename: string = 'casos_export') => {
  const data = prepareDataForExport(casos)
  const headers = Object.keys(data[0] || {})
  const csv = convertToCSV(data, headers)
  
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
  downloadFile(csv, `${filename}_${timestamp}.csv`, 'text/csv;charset=utf-8;')
}

// Exportar solo datos filtrados
export const exportFilteredData = (casos: CasoConCorresponsal[], filters: any, filename: string = 'casos_filtrados') => {
  exportToExcel(casos, filename)
}

// Función para generar reporte en HTML para PDF
export const generateHTMLReport = (casos: CasoConCorresponsal[], title: string = 'Reporte de Casos') => {
  const data = prepareDataForExport(casos)
  const totalCasos = casos.length
  const casosCerrados = casos.filter(c => c.estadoInterno === 'CERRADO').length
  const totalFee = casos.reduce((sum, c) => sum + (Number(c.fee) || 0), 0)
  const totalCostoUsd = casos.reduce((sum, c) => sum + (Number(c.costoUsd) || 0), 0)
  const totalCompleto = casos.reduce((sum, c) => sum + (Number(c.fee) || 0) + (Number(c.costoUsd) || 0) + (Number(c.montoAgregado) || 0), 0)

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-number { font-size: 24px; font-weight: bold; color: #1e40af; }
            .summary-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
    </head>
    <body>
        <h1>${title}</h1>
        
        <div class="summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-number">${totalCasos}</div>
                    <div class="summary-label">Total Casos</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">${casosCerrados}</div>
                    <div class="summary-label">Casos Cerrados</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">$${totalFee.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    <div class="summary-label">Total Fee</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">$${totalCostoUsd.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    <div class="summary-label">Total Costo USD</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number">$${totalCompleto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                    <div class="summary-label">Total Completo</div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => 
                    `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
                ).join('')}
            </tbody>
        </table>

        <div class="footer">
            <p>Reporte generado automáticamente el ${formatDateForExport(new Date())}</p>
            <p>Plataforma de Gestión - ASSISTRAVEL Corresponsalia</p>
        </div>
    </body>
    </html>
  `
}