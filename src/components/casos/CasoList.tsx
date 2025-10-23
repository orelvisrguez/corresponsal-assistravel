'use client'

import { useState, useEffect } from 'react'
import { CasoConCorresponsal, CorresponsalConCasos } from '@/types'
import { formatDate, formatCurrency, getEstadoInternoLabel, getEstadoCasoLabel, getEstadoInternoColor, getEstadoCasoColor, getRowColorByEstado, getCardColorByEstado, filterCasos } from '@/lib/utils'
import { calcularSumaTotal, formatearMoneda } from '@/lib/calculations'
import { format } from 'date-fns'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SearchAndFilters, { FilterOptions } from '@/components/ui/SearchAndFilters'
import QuickStats from '@/components/ui/QuickStats'
import HelpCard from '@/components/ui/HelpCard'
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal'
import CasoForm from './CasoForm'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// Helper function to format dates for input fields
function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'yyyy-MM-dd')
  } catch (error) {
    return ''
  }
}

interface CasoListProps {
  casos: CasoConCorresponsal[]
  corresponsales: CorresponsalConCasos[]
  onRefresh: () => void
  initialEditCaseId?: number
}

export default function CasoList({ casos, corresponsales, onRefresh, initialEditCaseId }: CasoListProps) {
  const [selectedCaso, setSelectedCaso] = useState<CasoConCorresponsal | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Estado para filtros
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    corresponsalId: '',
    estadoInterno: '',
    estadoDelCaso: '',
    informeMedico: '',
    tieneFactura: '',
    pais: '',
    tipoFecha: 'fechaInicioCaso',
    fechaDesde: '',
    fechaHasta: '',
    costoDesde: '',
    costoHasta: ''
  })

  // Aplicar filtros
  const filteredCasos = filterCasos(casos, filters)

  // Efecto para abrir automáticamente el modal de edición si se especifica un caso inicial
  useEffect(() => {
    if (initialEditCaseId && casos.length > 0) {
      const casoToEdit = casos.find(caso => caso.id === initialEditCaseId)
      if (casoToEdit) {
        setSelectedCaso(casoToEdit)
        setIsEditModalOpen(true)
      }
    }
  }, [initialEditCaseId, casos])

  const handleCreate = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Caso creado exitosamente')
        setIsCreateModalOpen(false)
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al crear caso')
      }
    } catch (error) {
      toast.error('Error al crear caso')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedCaso) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/casos/${selectedCaso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const updatedCaso = await response.json()
        toast.success('Caso actualizado exitosamente')
        setIsEditModalOpen(false)
        setSelectedCaso(null)
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al actualizar caso')
      }
    } catch (error) {
      console.error('Error al actualizar caso:', error)
      toast.error('Error al actualizar caso')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (caso: CasoConCorresponsal) => {
    setSelectedCaso(caso)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCaso) return
    
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/casos/${selectedCaso.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Caso eliminado exitosamente')
        setIsDeleteModalOpen(false)
        setSelectedCaso(null)
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar caso')
      }
    } catch (error) {
      toast.error('Error al eliminar caso')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openEditModal = (caso: CasoConCorresponsal) => {
    setSelectedCaso(caso)
    setIsEditModalOpen(true)
  }

  const openViewModal = (caso: CasoConCorresponsal) => {
    setSelectedCaso(caso)
    setIsViewModalOpen(true)
  }

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      corresponsalId: '',
      estadoInterno: '',
      estadoDelCaso: '',
      informeMedico: '',
      tieneFactura: '',
      pais: '',
      tipoFecha: 'fechaInicioCaso',
      fechaDesde: '',
      fechaHasta: '',
      costoDesde: '',
      costoHasta: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Casos</h1>
          <p className="mt-2 text-gray-600">Gestiona la información de los casos</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nuevo Caso
        </Button>
      </div>

      {/* Componente de búsqueda y filtros */}
      <SearchAndFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        corresponsales={corresponsales}
        onClearFilters={handleClearFilters}
        resultCount={filteredCasos.length}
      />

      {/* Estadísticas rápidas */}
      <QuickStats casos={filteredCasos} />

      {filteredCasos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          {casos.length === 0 ? (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay casos</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer caso.</p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nuevo Caso
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron casos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay casos que coincidan con los filtros aplicados.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={handleClearFilters}
                  variant="secondary"
                >
                  Limpiar filtros
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Vista moderna de tabla con grid */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {/* Header de la tabla */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-3 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">Caso</div>
                <div className="col-span-2">Corresponsal</div>
                <div className="col-span-1">Estados</div>
                <div className="col-span-2">Fechas</div>
                <div className="col-span-2">Financiero</div>
                <div className="col-span-2">Observaciones</div>
                <div className="col-span-1 text-right">Acciones</div>
              </div>
            </div>

            {/* Filas de datos */}
            <div className="divide-y divide-gray-200">
              {filteredCasos.map((caso) => (
                <div 
                  key={caso.id} 
                  className={`relative hover:bg-gray-50 transition-colors duration-200 border-l-4 ${getCardColorByEstado(caso.estadoDelCaso)}`}
                >
                  <div className="px-4 py-3">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Columna 1: Caso (2 cols) */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900 text-sm">
                            {caso.nroCasoAssistravel}
                          </div>
                          {caso.nroCasoCorresponsal && (
                            <div className="text-xs text-gray-500">
                              Ref: {caso.nroCasoCorresponsal}
                            </div>
                          )}
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{caso.pais}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {caso.informeMedico && (
                              <CheckCircleIcon className="w-3 h-3 text-purple-500" title="Informe Médico" />
                            )}
                            {caso.tieneFactura && (
                              <DocumentTextIcon className="w-3 h-3 text-orange-500" title="Con Factura" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Corresponsal (2 cols) */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {caso.corresponsal.nombreCorresponsal}
                          </div>
                          <div className="text-xs text-gray-500">
                            {caso.corresponsal.pais}
                          </div>
                        </div>
                      </div>

                      {/* Columna 3: Estados (1 col) */}
                      <div className="col-span-1">
                        <div className="space-y-1">
                          <div className={`flex items-center px-1.5 py-0.5 text-xs font-medium rounded w-full ${getEstadoInternoColor(caso.estadoInterno)}`}>
                            {caso.estadoInterno === 'ABIERTO' && <ClockIcon className="w-2.5 h-2.5 mr-0.5" />}
                            {caso.estadoInterno === 'CERRADO' && <CheckCircleIcon className="w-2.5 h-2.5 mr-0.5" />}
                            {caso.estadoInterno === 'PAUSADO' && <ClockIcon className="w-2.5 h-2.5 mr-0.5" />}
                            {caso.estadoInterno === 'CANCELADO' && <XCircleIcon className="w-2.5 h-2.5 mr-0.5" />}
                            <span className="text-xs">{getEstadoInternoLabel(caso.estadoInterno)}</span>
                          </div>
                          <div className={`flex items-center px-1.5 py-0.5 text-xs font-medium rounded w-full ${getEstadoCasoColor(caso.estadoDelCaso)}`}>
                            <span className="text-xs">{getEstadoCasoLabel(caso.estadoDelCaso)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Columna 4: Fechas (2 cols) */}
                      <div className="col-span-2">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium w-6">Ini:</span>
                            <span className="ml-1">{formatDate(caso.fechaInicioCaso)}</span>
                          </div>
                          {caso.fechaEmisionFactura && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-6">Emi:</span>
                              <span className="ml-1">{formatDate(caso.fechaEmisionFactura)}</span>
                            </div>
                          )}
                          {caso.fechaVencimientoFactura && (
                            <div className="flex items-center text-gray-600">
                              <span className="font-medium w-6">Ven:</span>
                              <span className="ml-1">{formatDate(caso.fechaVencimientoFactura)}</span>
                            </div>
                          )}
                          {caso.fechaPagoFactura && (
                            <div className="flex items-center text-green-600">
                              <span className="font-medium w-6">Pag:</span>
                              <span className="ml-1">{formatDate(caso.fechaPagoFactura)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Columna 5: Financiero (2 cols) */}
                      <div className="col-span-2">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fee:</span>
                            <span className="font-semibold text-gray-900">
                              {caso.fee ? formatearMoneda(Number(caso.fee)) : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">USD:</span>
                            <span className="font-semibold text-gray-900">
                              {caso.costoUsd ? formatearMoneda(Number(caso.costoUsd)) : '-'}
                            </span>
                          </div>
                          {caso.montoAgregado && Number(caso.montoAgregado) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Agr:</span>
                              <span className="font-semibold text-gray-900">
                                {formatearMoneda(Number(caso.montoAgregado))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="text-emerald-600 font-medium">Total:</span>
                            <span className="font-bold text-emerald-600">
                              {formatearMoneda(calcularSumaTotal(caso))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna 6: Observaciones (2 cols) */}
                      <div className="col-span-2">
                        {caso.observaciones ? (
                          <div className="text-xs text-gray-600 line-clamp-3">
                            {caso.observaciones}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>

                      {/* Columna 7: Acciones (1 col) */}
                      <div className="col-span-1">
                        <div className="flex justify-end space-x-0.5">
                          <button
                            onClick={() => openViewModal(caso)}
                            className="p-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(caso)}
                            className="p-1 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                            title="Editar caso"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(caso)}
                            className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                            title="Eliminar caso"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Centro de Ayuda */}
      <HelpCard
        title="Guía de Gestión de Casos"
        sections={[
          {
            type: 'info',
            title: 'Estados de Casos',
            content: 'Estados Internos:\n• Abierto: Caso activo en progreso\n• Cerrado: Caso finalizado\n• Pausado: Caso temporalmente suspendido\n• Cancelado: Caso anulado\n\nEstados del Caso:\n• No Fee: Sin tarifa aplicada\n• Refacturado: Ya fue refacturado\n• Para Refacturar: Pendiente de refacturación\n• On Going: En progreso\n• Cobrado: Pago recibido'
          },
          {
            type: 'tip',
            title: 'Consejos de Búsqueda',
            content: '• Usa palabras clave para buscar en números de caso, países y observaciones\n• Combina filtros para resultados más específicos\n• Los rangos de fecha y costo te ayudan a encontrar casos en períodos específicos\n• Usa los filtros avanzados para búsquedas detalladas'
          },
          {
            type: 'warning',
            title: 'Importante',
            content: '• Siempre verifica los datos antes de guardar\n• Los campos marcados con * son obligatorios\n• El costo USD es importante para reportes financieros\n• Las fechas de factura son cruciales para el seguimiento'
          }
        ]}
        className="mt-6"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Caso"
        size="xl"
      >
        <CasoForm
          onSubmit={handleCreate}
          corresponsales={corresponsales}
          loading={loading}
          submitText="Crear Caso"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCaso(null)
        }}
        title="Editar Caso"
        size="xl"
      >
        {selectedCaso && (
          <CasoForm
            onSubmit={handleEdit}
            corresponsales={corresponsales}
            initialData={{
              corresponsalId: selectedCaso.corresponsalId,
              nroCasoAssistravel: selectedCaso.nroCasoAssistravel,
              nroCasoCorresponsal: selectedCaso.nroCasoCorresponsal || undefined,
              fechaInicioCaso: formatDateForInput(selectedCaso.fechaInicioCaso),
              pais: selectedCaso.pais,
              informeMedico: selectedCaso.informeMedico,
              fee: selectedCaso.fee ? Number(selectedCaso.fee) : undefined,
              costoUsd: selectedCaso.costoUsd ? Number(selectedCaso.costoUsd) : undefined,
              costoMonedaLocal: selectedCaso.costoMonedaLocal ? Number(selectedCaso.costoMonedaLocal) : undefined,
              simboloMoneda: selectedCaso.simboloMoneda || undefined,
              montoAgregado: selectedCaso.montoAgregado ? Number(selectedCaso.montoAgregado) : undefined,
              tieneFactura: selectedCaso.tieneFactura,
              nroFactura: selectedCaso.nroFactura || undefined,
              fechaEmisionFactura: formatDateForInput(selectedCaso.fechaEmisionFactura),
              fechaVencimientoFactura: formatDateForInput(selectedCaso.fechaVencimientoFactura),
              fechaPagoFactura: formatDateForInput(selectedCaso.fechaPagoFactura),
              estadoInterno: selectedCaso.estadoInterno,
              estadoDelCaso: selectedCaso.estadoDelCaso,
              observaciones: selectedCaso.observaciones || undefined
            }}
            loading={loading}
            submitText="Actualizar Caso"
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCaso(null)
        }}
        title={selectedCaso ? `Caso ${selectedCaso.nroCasoAssistravel} - Detalles Completos` : "Detalles del Caso"}
        size="2xl"
      >
        {selectedCaso && (
          <div className="bg-gray-50">
            {/* Header destacado con información principal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <DocumentTextIcon className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCaso.nroCasoAssistravel}</h2>
                      <p className="text-blue-100 text-sm">Caso de Assistravel</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-200" />
                      <span className="text-sm">{selectedCaso.corresponsal.nombreCorresponsal}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-5 h-5 text-blue-200" />
                      <span className="text-sm">{selectedCaso.pais}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-blue-200" />
                      <span className="text-sm">{formatDate(selectedCaso.fechaInicioCaso)}</span>
                    </div>
                    {selectedCaso.nroCasoCorresponsal && (
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="w-5 h-5 text-blue-200" />
                        <span className="text-sm">Ref: {selectedCaso.nroCasoCorresponsal}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Estados principales */}
                <div className="flex flex-col space-y-2 items-end">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getEstadoInternoColor(selectedCaso.estadoInterno)}`}>
                    {selectedCaso.estadoInterno === 'ABIERTO' && <ClockIcon className="w-4 h-4 mr-1" />}
                    {selectedCaso.estadoInterno === 'CERRADO' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                    {selectedCaso.estadoInterno === 'CANCELADO' && <XCircleIcon className="w-4 h-4 mr-1" />}
                    {getEstadoInternoLabel(selectedCaso.estadoInterno)}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getEstadoCasoColor(selectedCaso.estadoDelCaso)}`}>
                    {getEstadoCasoLabel(selectedCaso.estadoDelCaso)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Resumen financiero destacado */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-bold text-gray-900">Resumen Financiero</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Calculado</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatearMoneda(calcularSumaTotal(selectedCaso))}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Fee</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCaso.fee ? formatearMoneda(Number(selectedCaso.fee)) : '-'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Costo USD</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCaso.costoUsd ? formatearMoneda(Number(selectedCaso.costoUsd)) : '-'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Monto Agregado</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCaso.montoAgregado ? formatearMoneda(Number(selectedCaso.montoAgregado)) : '-'}
                    </p>
                  </div>
                </div>
                
                {selectedCaso.costoMonedaLocal && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Referencia moneda local:</span> {Number(selectedCaso.costoMonedaLocal).toFixed(2)} {selectedCaso.simboloMoneda || ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Grid de secciones */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información del caso */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Información del Caso</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Nro. Assistravel</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedCaso.nroCasoAssistravel}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Nro. Corresponsal</span>
                      <span className="text-sm text-gray-900">{selectedCaso.nroCasoCorresponsal || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Corresponsal</span>
                      <span className="text-sm text-gray-900 text-right max-w-xs">{selectedCaso.corresponsal.nombreCorresponsal}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">País</span>
                      <span className="text-sm text-gray-900">{selectedCaso.pais}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Fecha Inicio</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedCaso.fechaInicioCaso)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-gray-600">Informe Médico</span>
                      <div className="flex items-center space-x-1">
                        {selectedCaso.informeMedico ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Sí</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de facturación */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Información de Facturación</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                      <span className="text-sm font-medium text-gray-600">Tiene Factura</span>
                      <div className="flex items-center space-x-1">
                        {selectedCaso.tieneFactura ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 font-medium">Sí</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Información de facturación siempre visible */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Nro. Factura</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedCaso.nroFactura || '-'}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Fecha Emisión</span>
                          <span className="text-sm text-gray-900">
                            {selectedCaso.fechaEmisionFactura ? formatDate(selectedCaso.fechaEmisionFactura) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-600">Fecha Vencimiento</span>
                          <span className="text-sm text-gray-900">
                            {selectedCaso.fechaVencimientoFactura ? formatDate(selectedCaso.fechaVencimientoFactura) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-gray-600">Fecha Pago</span>
                          <span className="text-sm text-gray-900">
                            {selectedCaso.fechaPagoFactura ? formatDate(selectedCaso.fechaPagoFactura) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {selectedCaso.observaciones && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Observaciones</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {selectedCaso.observaciones}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(selectedCaso)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Editar Caso
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false)
                    setSelectedCaso(null)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedCaso(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Caso Definitivamente"
        itemName={selectedCaso ? `${selectedCaso.nroCasoAssistravel} - ${selectedCaso.corresponsal.nombreCorresponsal}` : ''}
        itemType="caso"
        consequences={[
          'Se eliminará permanentemente de la base de datos',
          'Se perderán todos los datos financieros asociados',
          'Se eliminará la información de facturación si existe',
          'Los reportes y estadísticas históricas se verán afectados',
          'Esta acción no se puede deshacer',
          'El corresponsal perderá la referencia a este caso'
        ]}
        loading={deleteLoading}
      />
    </div>
  )
}