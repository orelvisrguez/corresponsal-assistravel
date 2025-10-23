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
    <div className="space-y-8">
      {/* Header Modernizado */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              variant="secondary"
              onClick={onBack}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Volver</span>
            </Button>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Vista Detallada del Corresponsal</h1>
              <p className="text-slate-300 text-lg">{formatCorresponsalNombre(corresponsal.nombreCorresponsal)}</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <BuildingOfficeIcon className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full"></div>
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/5 rounded-full"></div>
      </div>

      {/* Información del Corresponsal */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            Información del Corresponsal
          </h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Nombre del Corresponsal */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <BuildingOfficeIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Corresponsal</h3>
              </div>
              <p className="text-xl font-bold text-blue-900">{formatCorresponsalNombre(corresponsal.nombreCorresponsal)}</p>
            </div>
            
            {corresponsal.nombreContacto && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide">Contacto</h3>
                </div>
                <p className="text-xl font-bold text-purple-900">{formatNombreContacto(corresponsal.nombreContacto)}</p>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-xl p-6">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                  <MapPinIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">País</h3>
              </div>
              <p className="text-xl font-bold text-red-900">{formatPais(corresponsal.pais)}</p>
            </div>
            
            {corresponsal.email && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <EnvelopeIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Email</h3>
                </div>
                <a href={`mailto:${corresponsal.email}`} className="text-lg font-semibold text-green-700 hover:text-green-900 transition-colors duration-300">
                  {corresponsal.email}
                </a>
              </div>
            )}
            
            {corresponsal.nroTelefono && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <PhoneIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide">Teléfono</h3>
                </div>
                <a href={`tel:${corresponsal.nroTelefono}`} className="text-lg font-semibold text-orange-700 hover:text-orange-900 transition-colors duration-300">
                  {corresponsal.nroTelefono}
                </a>
              </div>
            )}
            
            {corresponsal.web && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <GlobeAltIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Sitio Web</h3>
                </div>
                <a 
                  href={corresponsal.web.startsWith('http') ? corresponsal.web : `https://${corresponsal.web}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 transition-colors duration-300 block truncate"
                >
                  {corresponsal.web.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            
            {corresponsal.direccion && (
              <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                    <MapPinIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Dirección</h3>
                </div>
                <p className="text-lg text-gray-700 font-medium">{formatDireccion(corresponsal.direccion)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{totalCasos}</p>
                <p className="text-blue-100 text-sm font-medium">Total Casos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{casosAbiertos}</p>
                <p className="text-orange-100 text-sm font-medium">Casos Abiertos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{casosCerrados}</p>
                <p className="text-green-100 text-sm font-medium">Casos Cerrados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(totalUsd)}</p>
                <p className="text-purple-100 text-sm font-medium">Total USD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{casosConFee}</p>
                <p className="text-emerald-100 text-sm font-medium">Casos con Fee</p>
              </div>
            </div>
            <div className="border-t border-emerald-300/30 pt-4">
              <p className="text-emerald-100 text-sm">Total Fee: <span className="font-bold text-white">{formatCurrency(totalFee)}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <XCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{casosSinFee}</p>
                <p className="text-slate-100 text-sm font-medium">Casos Sin Fee</p>
              </div>
            </div>
            <div className="border-t border-slate-300/30 pt-4">
              <p className="text-slate-100 text-sm">Casos <span className="font-bold text-white">NO_FEE</span></p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{totalCasos > 0 ? formatCurrency(totalUsd / totalCasos) : '$0'}</p>
                <p className="text-cyan-100 text-sm font-medium">Promedio por Caso</p>
              </div>
            </div>
            <div className="border-t border-cyan-300/30 pt-4">
              <p className="text-cyan-100 text-sm">Costo promedio <span className="font-bold text-white">USD</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Casos Asociados</h2>
                <p className="text-gray-600">Total: {totalCasos} caso{totalCasos !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="w-80">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar casos por número, país..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {filteredCasos.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay casos</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm ? 'No se encontraron casos que coincidan con la búsqueda.' : 'Este corresponsal no tiene casos asociados.'}
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                variant="secondary"
                className="hover:shadow-lg transition-all duration-300"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Caso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    País
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Estado Interno
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Estado Caso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Costo USD
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCasos.map((caso, index) => (
                  <tr key={caso.id} className="hover:bg-gray-50 transition-colors duration-200 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-sm font-bold text-blue-700">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {caso.nroCasoAssistravel}
                          </div>
                          {caso.nroCasoCorresponsal && (
                            <div className="text-xs text-gray-500">
                              Corr: {caso.nroCasoCorresponsal}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(caso.fechaInicioCaso)}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <MapPinIcon className="h-4 w-4 mr-2 text-red-400" />
                        {caso.pais}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getEstadoInternoColor(caso.estadoInterno)}`}>
                        {getEstadoInternoLabel(caso.estadoInterno)}
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getEstadoCasoColor(caso.estadoDelCaso)}`}>
                        {getEstadoCasoLabel(caso.estadoDelCaso)}
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      {caso.costoUsd ? (
                        <div className="flex items-center text-sm font-bold text-gray-900">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {formatCurrency(Number(caso.costoUsd))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      {caso.fee ? (
                        <div className="flex items-center text-sm font-bold text-green-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-green-500" />
                          {formatCurrency(Number(caso.fee))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      {onEditCase && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditCase(caso.id)}
                          className="group-hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          title="Ir a la página de casos y editar este caso"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
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
