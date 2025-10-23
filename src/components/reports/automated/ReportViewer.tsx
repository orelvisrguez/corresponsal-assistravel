'use client'

import { useState } from 'react'
import { 
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  PrinterIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface ReportViewerProps {
  report: any
  onNewReport: () => void
}

export default function ReportViewer({ report, onNewReport }: ReportViewerProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeView, setActiveView] = useState<'markdown' | 'plain'>('markdown')

  if (!report) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay informe seleccionado
        </h3>
        <p className="text-gray-600 mb-4">
          Selecciona un informe del historial o genera uno nuevo
        </p>
        <button
          onClick={onNewReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Generar Nuevo Informe
        </button>
      </div>
    )
  }

  const handleCopyToClipboard = async () => {
    try {
      const textToCopy = activeView === 'markdown' 
        ? report.contenidoMarkdown 
        : report.contenidoTextoPlano
      
      await navigator.clipboard.writeText(textToCopy)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Usar la API nativa del navegador para generar PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const htmlContent = `
          <html>
            <head>
              <title>${report.titulo}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  margin: 40px; 
                  color: #333;
                }
                .header {
                  border-bottom: 3px solid #4F46E5;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .title { 
                  font-size: 28px; 
                  font-weight: bold; 
                  color: #4F46E5; 
                  margin: 0 0 10px 0; 
                }
                .metadata { 
                  background: #f5f5f5; 
                  padding: 20px; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                }
                .content { 
                  white-space: pre-wrap; 
                  line-height: 1.8;
                }
                h1, h2, h3 { 
                  color: #333; 
                  margin-top: 25px;
                  margin-bottom: 15px;
                }
                p { 
                  margin: 10px 0; 
                }
                @media print {
                  body { margin: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 class="title">${report.titulo}</h1>
                <p>Informe generado automáticamente con inteligencia artificial</p>
              </div>
              <div class="metadata">
                <p><strong>Tipo:</strong> ${getTipoLabel(report.tipo)}</p>
                <p><strong>Período:</strong> ${new Date(report.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(report.fechaFin).toLocaleDateString('es-ES')}</p>
                <p><strong>Generado:</strong> ${new Date(report.fechaGeneracion).toLocaleDateString('es-ES')}</p>
                <p><strong>Autor:</strong> ${report.usuario?.name || 'Usuario'}</p>
              </div>
              <div class="content">${formatMarkdownToHTML(report.contenidoMarkdown)}</div>
              <br><br>
              <p style="text-align: center; color: #666; font-size: 12px;">
                Documento generado el ${new Date().toLocaleDateString('es-ES')} | Plataforma de Gestión - Informes Automáticos
              </p>
            </body>
          </html>
        `
        
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        
        // Esperar a que se cargue el contenido y luego mostrar el diálogo de impresión
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Error al generar el PDF. Por favor, intenta de nuevo.')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${report.titulo}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1, h2, h3 { color: #333; }
              .metadata { background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="metadata">
              <h1>${report.titulo}</h1>
              <p><strong>Tipo:</strong> ${report.tipo}</p>
              <p><strong>Período:</strong> ${new Date(report.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(report.fechaFin).toLocaleDateString('es-ES')}</p>
              <p><strong>Generado:</strong> ${new Date(report.fechaGeneracion).toLocaleDateString('es-ES')}</p>
            </div>
            <div class="content">${report.contenidoTextoPlano}</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
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

  const formatMarkdownToHTML = (markdown: string) => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraphs
      .replace(/^(?!<[h|l])(.+)$/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>')
  }

  return (
    <div className="space-y-6">
      {/* Header del informe */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {report.titulo}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <TagIcon className="h-4 w-4" />
                <span>{getTipoLabel(report.tipo)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {new Date(report.fechaInicio).toLocaleDateString('es-ES')} - {new Date(report.fechaFin).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <UserIcon className="h-4 w-4" />
                <span>{report.usuario?.name || 'Usuario'}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <DocumentTextIcon className="h-4 w-4" />
                <span>Generado el {new Date(report.fechaGeneracion).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {copySuccess ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveView('markdown')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'markdown'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Vista Formateada
              </button>
              <button
                onClick={() => setActiveView('plain')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'plain'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Texto Plano
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del informe */}
        <div className="p-6">
          {activeView === 'markdown' ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMarkdownToHTML(report.contenidoMarkdown)
              }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {report.contenidoTextoPlano}
            </pre>
          )}
        </div>
      </div>

      {/* Información adicional */}
      {report.metadatos && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Información Técnica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Modelo:</span>
              <span className="ml-2 text-gray-600">{report.metadatos.modelo || 'gemini-pro'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tokens:</span>
              <span className="ml-2 text-gray-600">{report.metadatos.tokenCount || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Generado:</span>
              <span className="ml-2 text-gray-600">
                {new Date(report.metadatos.fechaGeneracion).toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}