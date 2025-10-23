import React, { ReactNode } from 'react'
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'info' | 'warning' | 'danger' | 'success'
  icon?: ReactNode
  isLoading?: boolean
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  icon,
  isLoading = false
}) => {
  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error en confirmación:', error)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-400',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: icon || <ExclamationTriangleIcon className="h-6 w-6" />
        }
      case 'danger':
        return {
          bgColor: 'bg-red-50',
          iconColor: 'text-red-400',
          buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: icon || <XCircleIcon className="h-6 w-6" />
        }
      case 'success':
        return {
          bgColor: 'bg-green-50',
          iconColor: 'text-green-400',
          buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          icon: icon || <CheckCircleIcon className="h-6 w-6" />
        }
      default:
        return {
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-400',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: icon || <InformationCircleIcon className="h-6 w-6" />
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
                <div className={styles.iconColor}>
                  {styles.icon}
                </div>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${styles.buttonColor} sm:ml-3 sm:w-auto`}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para manejar confirmaciones
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Partial<ConfirmationDialogProps>>({})

  const showConfirmation = (options: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
    setConfig(options)
    setIsOpen(true)
  }

  const hideConfirmation = () => {
    setIsOpen(false)
    setConfig({})
  }

  const ConfirmationComponent = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={hideConfirmation}
      title=""
      message=""
      onConfirm={() => {}}
      {...config}
    />
  )

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationComponent,
    isOpen
  }
}



export default ConfirmationDialog
