'use client'

import { useState } from 'react'
import { CorresponsalConCasos } from '@/types'
import { formatDate, formatCurrency, getEstadoInternoLabel, getEstadoCasoLabel, getEstadoInternoColor, getEstadoCasoColor, formatCorresponsalNombre, formatPais, formatNombreContacto, formatDireccion } from '@/lib/utils'
import { calcularSumaTotal, formatearMoneda } from '@/lib/calculations'
import Button from '@/components/ui/Button'
import { 
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  DocumentTextIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface CorresponsalViewProps {
  corresponsal: CorresponsalConCasos
  onBack: () => void
  onEditCase?: (casoId: number) => void
}

export default function CorresponsalView({ corresponsal, onBack, onEditCase }: CorresponsalViewProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Calcular estadísticas
  const totalCasos = corresponsal.casos.length
  const casosAbiertos = corresponsal.casos.filter(caso => caso.estadoInterno === 'ABIERTO').length
  const casosCerrados = corresponsal.casos.filter(caso => caso.estadoInterno === 'CERRADO').length
  const casosConFee = corresponsal.casos.filter(caso => caso.estadoDelCaso === 'COBRADO').length
  const casosSinFee = corresponsal.casos.filter(caso => caso.estadoDelCaso === 'NO_FEE').length

  // Calcular totales monetarios
  const totalUsd = corresponsal.casos.reduce((sum, caso) => sum + (Number(caso.costoUsd) || 0), 0)
  const totalFee = corresponsal.casos.reduce((sum, caso) => sum + (Number(caso.fee) || 0), 0)

  // Filtrar casos
  const filteredCasos = corresponsal.casos.filter(caso =>
    caso.nroCasoAssistravel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (caso.nroCasoCorresponsal && caso.nroCasoCorresponsal.toLowerCase().includes(searchTerm.toLowerCase())) ||
    caso.pais.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Vista del Corresponsal
          </h1>
        </div>
      </div>

      {/* Información del Corresponsal */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
            Información del Corresponsal
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Nombre del Corresponsal</h3>
              <p className="text-base font-semibold text-gray-900">{formatCorresponsalNombre(corresponsal.nombreCorresponsal)}</p>
            </div>
            
            {corresponsal.nombreContacto && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contacto</h3>
                <p className="text-base text-gray-900">{formatNombreContacto(corresponsal.nombreContacto)}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">País</h3>
              <p className="text-base text-gray-900 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                {formatPais(corresponsal.pais)}
              </p>
            </div>
            
            {corresponsal.email && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-base text-gray-900 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <a href={`mailto:${corresponsal.email}`} className="text-blue-600 hover:text-blue-800">
                    {corresponsal.email}
                  </a>
                </p>
              </div>
            )}
            
            {corresponsal.nroTelefono && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h3>
                <p className="text-base text-gray-900 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <a href={`tel:${corresponsal.nroTelefono}`} className="text-blue-600 hover:text-blue-800">
                    {corresponsal.nroTelefono}
                  </a>
                </p>
              </div>
            )}
            
            {corresponsal.web && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sitio Web</h3>
                <p className="text-base text-gray-900 flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1 text-gray-400" />
                  <a 
                    href={corresponsal.web.startsWith('http') ? corresponsal.web : `https://${corresponsal.web}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {corresponsal.web}
                  </a>
                </p>
              </div>
            )}
            
            {corresponsal.direccion && (
              <div className="md:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Dirección</h3>
                <p className="text-base text-gray-900">{formatDireccion(corresponsal.direccion)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Casos</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCasos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Casos Abiertos</p>
              <p className="text-2xl font-semibold text-orange-600">{casosAbiertos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Casos Cerrados</p>
              <p className="text-2xl font-semibold text-green-600">{casosCerrados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total USD</p>
              <p className="text-2xl font-semibold text-indigo-600">{formatCurrency(totalUsd)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Casos con Fee</h3>
          <p className="text-3xl font-bold text-green-600">{casosConFee}</p>
          <p className="text-sm text-gray-500">Total Fee: {formatCurrency(totalFee)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Casos Sin Fee</h3>
          <p className="text-3xl font-bold text-gray-600">{casosSinFee}</p>
          <p className="text-sm text-gray-500">Casos NO_FEE</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Promedio por Caso</h3>
          <p className="text-3xl font-bold text-blue-600">
            {totalCasos > 0 ? formatCurrency(totalUsd / totalCasos) : '$0'}
          </p>
          <p className="text-sm text-gray-500">Costo promedio USD</p>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
              Casos Asociados ({totalCasos})
            </h2>
            <div className="w-64">
              <input
                type="text"
                placeholder="Buscar casos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {filteredCasos.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay casos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron casos que coincidan con la búsqueda.' : 'Este corresponsal no tiene casos asociados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    País
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Interno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo USD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCasos.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {caso.nroCasoAssistravel}
                        </div>
                        {caso.nroCasoCorresponsal && (
                          <div className="text-sm text-gray-500">
                            Corr: {caso.nroCasoCorresponsal}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(caso.fechaInicioCaso)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {caso.pais}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoInternoColor(caso.estadoInterno)}`}>
                        {getEstadoInternoLabel(caso.estadoInterno)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoCasoColor(caso.estadoDelCaso)}`}>
                        {getEstadoCasoLabel(caso.estadoDelCaso)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.costoUsd ? (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatCurrency(Number(caso.costoUsd))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caso.fee ? (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-600" />
                          <span className="text-green-600 font-medium">{formatCurrency(Number(caso.fee))}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {onEditCase && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditCase(caso.id)}
                          className="flex items-center space-x-1"
                          title="Ir a la página de casos y editar este caso"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Editar</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
