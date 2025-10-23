'use client'

import { useState, useRef } from 'react'
import { ArrowUpTrayIcon, DocumentIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadProgress?: number
}

export default function FileUpload({ onFileSelect, isUploading, uploadProgress }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)', {
        duration: 4000
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB permitido.', {
        duration: 4000
      })
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
    toast.success(`Archivo seleccionado: ${file.name}`)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* Área de subida */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : isUploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-sm font-medium text-gray-900">Subiendo archivo...</p>
              {uploadProgress !== undefined && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{uploadProgress}% completado</p>
                </div>
              )}
            </div>
          </div>
        ) : selectedFile ? (
          <div className="space-y-3">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Archivo seleccionado</p>
              <p className="text-sm text-gray-500">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Arrastra y suelta tu archivo aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">
                Archivos Excel (.xlsx, .xls) o CSV (.csv) hasta 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex">
          <DocumentIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Formato Requerido
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Tu archivo debe contener las siguientes columnas obligatorias:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">corresponsal_id</code></li>
                <li><code className="bg-blue-100 px-1 rounded">nro_caso_assistravel</code></li>
                <li><code className="bg-blue-100 px-1 rounded">fecha_de_inicio</code></li>
                <li><code className="bg-blue-100 px-1 rounded">pais</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Advertencia */}
      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Asegúrate de que los números de caso sean únicos. 
              Los casos duplicados serán omitidos durante la importación.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}