'use client'

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SimpleSearchProps {
  // Original props (for backward compatibility)
  searchTerm?: string
  onSearchChange?: (term: string) => void
  
  // Standard React props
  value?: string
  onChange?: (value: string) => void
  
  placeholder?: string
  resultCount?: number
}

export default function SimpleSearch({
  searchTerm,
  onSearchChange,
  value,
  onChange,
  placeholder = "Buscar...",
  resultCount
}: SimpleSearchProps) {
  
  // Use the new pattern (value/onChange) if provided, otherwise fall back to old pattern
  const currentValue = value !== undefined ? value : (searchTerm || '')
  const handleChange = onChange !== undefined ? onChange : (onSearchChange || (() => {}))
  
  const clearSearch = () => {
    handleChange('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {currentValue && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Información de Resultados */}
      {resultCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {resultCount === 1 
              ? `Se encontró ${resultCount} resultado` 
              : `Se encontraron ${resultCount} resultados`
            }
            {currentValue && (
              <span className="ml-1 font-medium">
                para "{currentValue}"
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
