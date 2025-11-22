'use client'

import { useState, useCallback, useEffect } from 'react'
import ExcelImporter, { ImportResult, ExcelPreview } from '@/lib/excel-importer'
import { 
  ArrowUpTrayIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'

interface ImportDataFormProps {
  onImportComplete?: (result: ImportResult) => void
  className?: string
}

export default function ImportDataForm({ onImportComplete, className = '' }: ImportDataFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [preview, setPreview] = useState<ExcelPreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Validar archivo cuando se selecciona
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setImportResult(null)
    setPreview(null)
    setShowPreview(false)
    
    try {
      // Validar estructura del archivo
      const validationResult = await ExcelImporter.validateFileStructure(selectedFile)
      setValidation(validationResult)
      
      // Generar previsualización si el archivo es válido
      if (validationResult.valid) {
        const importer = new ExcelImporter(selectedFile)
        const previewData = await importer.previewData()
        setPreview(previewData)
      }
    } catch (error) {
      console.error('Error validando archivo:', error)
      setValidation({
        valid: false,
        errors: [`Error al validar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        warnings: []
      })
    }
  }, [])

  // Manejar drop de archivo
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // Ejecutar importación
  const handleImport = useCallback(async () => {
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      // Crear FormData para enviar el archivo al API
      const formData = new FormData()
      formData.append('file', file)

      // Enviar al API endpoint
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en la importación')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)
      onImportComplete?.(result)
    } catch (error) {
      console.error('Error en importación:', error)
      setImportResult({
        success: false,
        processed: 0,
        updated: 0,
        created: 0,
        errors: [`Error en importación: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        warnings: []
      })
    } finally {
      setIsImporting(false)
    }
  }, [file, onImportComplete])

  // Resetear estado
  const handleReset = useCallback(() => {
    setFile(null)
    setImportResult(null)
    setValidation(null)
    setPreview(null)
    setShowPreview(false)
    setIsImporting(false)
  }, [])

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <ArrowUpTrayIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Importar Datos desde Excel</h2>
        </div>

        {/* Área de carga de archivo */}
        <div className="mb-6">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            >
              <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-2">Arrastra tu archivo Excel aquí</p>
              <p className="text-sm text-gray-500 mb-4">o</p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Seleccionar archivo
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Formatos soportados: .xlsx | Máximo: 10MB
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TableCellsIcon className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validación del archivo */}
        {validation && (
          <div className="mb-6">
            {validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                  <h4 className="text-sm font-medium text-red-800">Errores de validación</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <h4 className="text-sm font-medium text-yellow-800">Advertencias</h4>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.valid && file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">Archivo válido listo para importar</p>
                </div>
                
                {/* Botón para ver previsualización */}
                {preview && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showPreview ? 'Ocultar' : 'Ver'} previsualización de datos ({preview.totalRows} filas)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Previsualización de datos */}
        {showPreview && preview && (
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Previsualización de datos (primeros {preview.rows.length} registros de {preview.totalRows})
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {preview.headers.map((header, index) => (
                        <th key={index} className="text-left py-2 px-2 font-medium text-gray-600">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {preview.headers.map((header, colIndex) => {
                          const normalizedKey = header.toLowerCase().replace(/\s+/g, '_')
                          const value = row[normalizedKey] || ''
                          return (
                            <td key={colIndex} className="py-1 px-2 text-gray-700">
                              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value.toString()}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.rows.length < preview.totalRows && (
                <p className="text-xs text-gray-500 mt-2">
                  ... y {preview.totalRows - preview.rows.length} registros más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botón de importación */}
        {file && validation?.valid && !isImporting && !importResult && (
          <div className="mb-6">
            <button
              onClick={handleImport}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>Importar Datos</span>
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Esta operación sobrescribirá los datos existentes con los nuevos datos del Excel
            </p>
          </div>
        )}

        {/* Progreso de importación */}
        {isImporting && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">Procesando importación...</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultado de importación */}
        {importResult && (
          <div className="space-y-4">
            {importResult.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <h4 className="text-sm font-medium text-green-800">Importación exitosa</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.processed}</p>
                    <p className="text-green-700">Procesadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{importResult.created}</p>
                    <p className="text-blue-700">Creadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{importResult.updated}</p>
                    <p className="text-orange-700">Actualizadas</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                  <h4 className="text-sm font-medium text-red-800">Error en importación</h4>
                </div>
                <div className="text-sm text-red-700">
                  <p>Se procesaron {importResult.processed} registros con errores.</p>
                  {importResult.created > 0 && <p>{importResult.created} registros fueron creados exitosamente.</p>}
                  {importResult.updated > 0 && <p>{importResult.updated} registros fueron actualizados.</p>}
                </div>
              </div>
            )}

            {/* Errores detallados */}
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h4>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="text-xs text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Advertencias */}
            {importResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Advertencias:</h4>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Botón para nueva importación */}
            <button
              onClick={handleReset}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Nueva Importación
            </button>
          </div>
        )}

        {/* Opciones avanzadas */}
        {file && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
            </button>
            
            {showAdvanced && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Configuración de importación:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Los datos existentes con el mismo número de caso ASSISTRAVEL serán actualizados</p>
                  <p>• Los casos nuevos serán creados automáticamente</p>
                  <p>• Los estados se mapearán automáticamente (Abierto → ABIERTO, etc.)</p>
                  <p>• Las fechas se convertirán al formato local automáticamente</p>
                  <p>• Los valores booleanos se interpretarán correctamente (Si/No, True/False)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}