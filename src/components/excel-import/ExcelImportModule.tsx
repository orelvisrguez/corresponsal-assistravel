'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import FileUpload from './FileUpload'
import ImportProgress, { ImportStats, ImportLog } from './ImportProgress'

export default function ExcelImportModule() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    exitosos: 0,
    errores: 0,
    procesados: 0
  })
  
  const [logs, setLogs] = useState<ImportLog[]>([])

  const addLog = (type: ImportLog['type'], message: string) => {
    setLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date()
    }])
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setIsComplete(false)
    setStats({
      total: 0,
      exitosos: 0,
      errores: 0,
      procesados: 0
    })
    setLogs([])
    addLog('info', `Archivo seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
  }

  const uploadFile = async (file: File): Promise<boolean> => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/excel-import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al subir archivo')
      }

      const result = await response.json()
      addLog('success', `Archivo subido exitosamente. ${result.recordCount} registros encontrados.`)
      
      setStats(prev => ({ ...prev, total: result.recordCount }))
      setUploadProgress(100)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      addLog('error', `Error al subir archivo: ${errorMessage}`)
      toast.error('Error al subir archivo')
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const processImport = async (): Promise<void> => {
    setIsImporting(true)
    
    try {
      const response = await fetch('/api/excel-import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en la importación')
      }

      const result = await response.json()
      
      // Actualizar estadísticas finales
      setStats({
        total: result.stats.total,
        exitosos: result.stats.exitosos,
        errores: result.stats.errores,
        procesados: result.stats.procesados
      })

      // Agregar logs del servidor
      if (result.logs && Array.isArray(result.logs)) {
        result.logs.forEach((logMessage: string) => {
          const type = logMessage.includes('Error') ? 'error' : 
                      logMessage.includes('Creado') || logMessage.includes('exitosamente') ? 'success' :
                      logMessage.includes('existe') || logMessage.includes('Saltando') ? 'warning' : 'info'
          addLog(type, logMessage)
        })
      }

      if (result.success) {
        addLog('success', `¡Importación completada! ${result.stats.exitosos} casos importados exitosamente.`)
        toast.success('Importación completada exitosamente')
      } else {
        addLog('warning', 'Importación completada con errores. Revisa los logs para más detalles.')
        toast('⚠️ Importación completada con algunos errores', {
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      addLog('error', `Error durante la importación: ${errorMessage}`)
      toast.error('Error durante la importación')
    } finally {
      setIsImporting(false)
      setIsComplete(true)
    }
  }

  const handleStartImport = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo primero')
      return
    }

    addLog('info', 'Iniciando proceso de importación...')

    // Paso 1: Subir archivo
    const uploadSuccess = await uploadFile(selectedFile)
    if (!uploadSuccess) {
      return
    }

    // Paso 2: Procesar importación
    await processImport()
  }

  const handleCancel = () => {
    setIsImporting(false)
    addLog('warning', 'Importación cancelada por el usuario')
    toast.error('Importación cancelada')
  }

  const handleReset = () => {
    setSelectedFile(null)
    setIsUploading(false)
    setIsImporting(false)
    setIsComplete(false)
    setUploadProgress(0)
    setStats({
      total: 0,
      exitosos: 0,
      errores: 0,
      procesados: 0
    })
    setLogs([])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Importar Datos desde Excel</h1>
        <p className="mt-2 text-lg text-gray-600">
          Sube tu archivo Excel para importar casos de manera masiva
        </p>
      </div>

      {/* Sección de Subida de Archivo */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          1. Seleccionar Archivo
        </h2>
        <FileUpload
          onFileSelect={handleFileSelect}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </div>

      {/* Sección de Importación */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          2. Procesar Importación
        </h2>
        <ImportProgress
          isImporting={isImporting}
          stats={stats}
          logs={logs}
          onStartImport={handleStartImport}
          onCancel={handleCancel}
          isComplete={isComplete}
          hasFile={selectedFile !== null}
        />
      </div>

      {/* Botón de Reset */}
      {(isComplete || logs.length > 0) && (
        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Nueva Importación
          </button>
        </div>
      )}
    </div>
  )
}