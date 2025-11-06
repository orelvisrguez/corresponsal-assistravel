'use client'

import { useState } from 'react'
import { 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import Button from './Button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  itemType?: string
  consequences?: string[]
  loading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = "registro",
  consequences = [],
  loading = false
}: DeleteConfirmModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [hasReadWarning, setHasReadWarning] = useState(false)
  
  const isConfirmValid = confirmText.toLowerCase() === 'tengo' && hasReadWarning
  
  const defaultConsequences = [
    'Se eliminará permanentemente de la base de datos',
    'No se puede deshacer esta acción',
    'Se perderán todos los datos asociados',
    'Los reportes históricos se verán afectados'
  ]
  
  const allConsequences = consequences.length > 0 ? consequences : defaultConsequences

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    setHasReadWarning(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <button
              onClick={handleClose}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              {title}
            </h3>
            
            {/* Item info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Eliminando {itemType}:</span>
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {itemName}
              </p>
            </div>

            {/* Warning section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <ShieldExclamationIcon className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="text-sm font-semibold text-red-800">
                  ⚠️ Consecuencias de esta acción:
                </h4>
              </div>
              
              <ul className="space-y-2">
                {allConsequences.map((consequence, index) => (
                  <li key={index} className="flex items-start text-sm text-red-700">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {consequence}
                  </li>
                ))}
              </ul>
              
              {/* Confirmation checkbox */}
              <div className="mt-4 pt-3 border-t border-red-200">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReadWarning}
                    onChange={(e) => setHasReadWarning(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-red-300 rounded"
                  />
                  <span className="text-sm text-red-800 font-medium">
                    He leído y entiendo las consecuencias de esta acción
                  </span>
                </label>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar la eliminación, escribe{' '}
                <span className="font-bold text-red-600">tengo</span> en el campo:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe 'tengo' para confirmar"
                disabled={!hasReadWarning || loading}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors text-gray-900 placeholder-gray-500 ${
                  !hasReadWarning 
                    ? 'bg-gray-100 border-gray-300 text-gray-500' 
                    : confirmText.toLowerCase() === 'tengo'
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {confirmText && confirmText.toLowerCase() !== 'tengo' && (
                <p className="mt-1 text-xs text-red-600">
                  Debe escribir exactamente "tengo" para continuar
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirm}
                disabled={!isConfirmValid || loading}
                loading={loading}
                className="w-full sm:w-auto"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Eliminar Definitivamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}