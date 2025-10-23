'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface AutoCompleteInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  label?: string
  error?: string
  required?: boolean
  name?: string
}

export default function AutoCompleteInput({
  value,
  onChange,
  options,
  placeholder = '',
  label,
  error,
  required = false,
  name
}: AutoCompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    // Filtrar opciones basado en el input
    if (inputValue.trim() === '') {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [inputValue, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    onChange(newValue)
  }

  const handleOptionSelect = (option: string) => {
    setInputValue(option)
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      }
    }
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300' 
              : 'border-gray-300 text-gray-900 placeholder-gray-400'
            }
          `}
        />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon 
            className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600
                    ${inputValue === option 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-900'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
              
              {/* Opción para agregar el valor actual si no existe */}
              {inputValue.trim() && !options.some(option => 
                option.toLowerCase() === inputValue.toLowerCase()
              ) && (
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleOptionSelect(inputValue.trim())}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    ➕ Agregar "{inputValue.trim()}"
                  </button>
                </div>
              )}
            </>
          ) : inputValue.trim() ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => handleOptionSelect(inputValue.trim())}
                className="w-full text-left text-blue-600 hover:bg-blue-50 p-2 rounded font-medium"
              >
                ➕ Agregar "{inputValue.trim()}"
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              Escribe para buscar o agregar un país...
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
