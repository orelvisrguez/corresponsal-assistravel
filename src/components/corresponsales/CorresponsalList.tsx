'use client'

import { useState } from 'react'
import { CorresponsalConCasos } from '@/types'
import { filterCorresponsales, formatCorresponsalNombre, formatPais } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SimpleSearch from '@/components/ui/SimpleSearch'
import HelpCard from '@/components/ui/HelpCard'
import CorresponsalForm from './CorresponsalForm'
import CorresponsalView from './CorresponsalView'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  EyeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

interface CorresponsalListProps {
  corresponsales: CorresponsalConCasos[]
  onRefresh: () => void
}

export default function CorresponsalList({ corresponsales, onRefresh }: CorresponsalListProps) {
  const router = useRouter()
  const [selectedCorresponsal, setSelectedCorresponsal] = useState<CorresponsalConCasos | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModeOpen, setIsViewModeOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Aplicar filtro de búsqueda
  const filteredCorresponsales = filterCorresponsales(corresponsales, searchTerm)

  const handleCreate = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/corresponsales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Corresponsal creado exitosamente')
        setIsCreateModalOpen(false)
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al crear corresponsal')
      }
    } catch (error) {
      toast.error('Error al crear corresponsal')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (data: any) => {
    if (!selectedCorresponsal) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/corresponsales/${selectedCorresponsal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Corresponsal actualizado exitosamente')
        setIsEditModalOpen(false)
        setSelectedCorresponsal(null)
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al actualizar corresponsal')
      }
    } catch (error) {
      toast.error('Error al actualizar corresponsal')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (corresponsal: CorresponsalConCasos) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el corresponsal "${corresponsal.nombreCorresponsal}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/corresponsales/${corresponsal.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Corresponsal eliminado exitosamente')
        onRefresh()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar corresponsal')
      }
    } catch (error) {
      toast.error('Error al eliminar corresponsal')
    }
  }

  const openEditModal = (corresponsal: CorresponsalConCasos) => {
    setSelectedCorresponsal(corresponsal)
    setIsEditModalOpen(true)
  }

  const openViewMode = (corresponsal: CorresponsalConCasos) => {
    // Opción 1: Navegar a página dedicada (recomendado)
    router.push(`/corresponsales/${corresponsal.id}`)
    
    // Opción 2: Vista modal (comentado, puedes descomentar si prefieres modal)
    // setSelectedCorresponsal(corresponsal)
    // setIsViewModeOpen(true)
  }

  const closeViewMode = () => {
    setIsViewModeOpen(false)
    setSelectedCorresponsal(null)
  }

  // Si estamos en modo vista, mostrar CorresponsalView
  if (isViewModeOpen && selectedCorresponsal) {
    return (
      <CorresponsalView
        corresponsal={selectedCorresponsal}
        onBack={closeViewMode}
        onEditCase={(casoId) => {
          // Aquí puedes agregar lógica para editar el caso específico
          // Por ejemplo, navegar a la página de edición del caso
          console.log('Editar caso ID:', casoId)
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Modernizado */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">Gestión de Corresponsales</h1>
            <p className="text-blue-100 text-lg">Administra y coordina todos tus corresponsales internacionales</p>
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                <span>{corresponsales.length} Corresponsal{corresponsales.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Corresponsal
            </Button>
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Componente de búsqueda */}
      <SimpleSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar corresponsales... (nombre, contacto, email, país)"
        resultCount={filteredCorresponsales.length}
      />

      {filteredCorresponsales.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <UserGroupIcon className="h-12 w-12 text-blue-500" />
          </div>
          {corresponsales.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay corresponsales</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Comienza creando tu primer corresponsal para gestionar tus relaciones internacionales.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Crear Primer Corresponsal
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron corresponsales</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                No hay corresponsales que coincidan con tu búsqueda actual.
              </p>
              <Button 
                onClick={() => setSearchTerm('')}
                variant="secondary"
                className="hover:shadow-lg transition-all duration-300"
                size="lg"
              >
                Limpiar búsqueda
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCorresponsales.map((corresponsal) => (
            <div 
              key={corresponsal.id} 
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
            >
              {/* Header de la card con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full translate-y-8 -translate-x-8"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <h3 
                    className="text-xl font-bold truncate cursor-pointer hover:text-blue-100 transition-colors duration-300 group-hover:underline"
                    onClick={() => openViewMode(corresponsal)}
                    title="Ver detalles y casos del corresponsal"
                  >
                    {formatCorresponsalNombre(corresponsal.nombreCorresponsal)}
                  </h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openViewMode(corresponsal)}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-300 transform hover:scale-110"
                      title="Ver detalles y casos"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(corresponsal)}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-300 transform hover:scale-110"
                      title="Editar corresponsal"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(corresponsal)}
                      className="p-2 bg-red-500 bg-opacity-20 hover:bg-opacity-40 rounded-lg transition-all duration-300 transform hover:scale-110"
                      title="Eliminar corresponsal"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Badge de casos */}
                <div className="relative z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-25 backdrop-blur-sm">
                    {corresponsal.casos.length} caso{corresponsal.casos.length !== 1 ? 's' : ''} activo{corresponsal.casos.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {/* Contenido de la card */}
              <div className="p-6">
                <div className="space-y-4">
                  {corresponsal.nombreContacto && (
                    <div className="flex items-center text-gray-700">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                        <UserGroupIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Contacto</p>
                        <p className="font-medium">{corresponsal.nombreContacto}</p>
                      </div>
                    </div>
                  )}
                  
                  {corresponsal.email && (
                    <div className="flex items-center text-gray-700">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                        <EnvelopeIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</p>
                        <a 
                          href={`mailto:${corresponsal.email}`} 
                          className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-300 truncate block"
                        >
                          {corresponsal.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {corresponsal.nroTelefono && (
                    <div className="flex items-center text-gray-700">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                        <PhoneIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Teléfono</p>
                        <a 
                          href={`tel:${corresponsal.nroTelefono}`} 
                          className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-300 truncate block"
                        >
                          {corresponsal.nroTelefono}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {corresponsal.web && (
                    <div className="flex items-center text-gray-700">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                        <GlobeAltIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Sitio Web</p>
                        <a 
                          href={corresponsal.web} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-300 truncate block"
                        >
                          {corresponsal.web.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* País con indicador visual */}
                  <div className="flex items-center text-gray-700 pt-4 border-t border-gray-100">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                      <MapPinIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">País</p>
                      <p className="font-semibold text-lg">{formatPais(corresponsal.pais)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Centro de Ayuda */}
      <HelpCard
        title="Guía de Gestión de Corresponsales"
        sections={[
          {
            type: 'info',
            title: 'Información de Corresponsales',
            content: 'Campos principales:\n• Nombre del Corresponsal: Nombre de la empresa o entidad\n• Nombre de Contacto: Persona de contacto principal\n• Email: Dirección de correo electrónico para comunicación\n• Teléfono: Número de contacto directo\n• País: Ubicación del corresponsal'
          },
          {
            type: 'tip',
            title: 'Consejos de Búsqueda',
            content: '• Busca por nombre del corresponsal, contacto, email o país\n• La búsqueda es sensible a mayúsculas y minúsculas\n• Usa palabras clave para encontrar corresponsales específicos\n• El contador muestra cuántos casos tiene cada corresponsal'
          },
          {
            type: 'warning',
            title: 'Importante',
            content: '• El nombre del corresponsal es obligatorio\n• Al menos un método de contacto (email/teléfono) es recomendado\n• Eliminar un corresponsal afectará todos sus casos asociados\n• Mantén la información de contacto actualizada'
          }
        ]}
        className="mt-6"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Corresponsal"
        size="lg"
      >
        <CorresponsalForm
          onSubmit={handleCreate}
          loading={loading}
          submitText="Crear Corresponsal"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedCorresponsal(null)
        }}
        title="Editar Corresponsal"
        size="lg"
      >
        {selectedCorresponsal && (
          <CorresponsalForm
            onSubmit={handleEdit}
            initialData={{
              nombreCorresponsal: selectedCorresponsal.nombreCorresponsal,
              nombreContacto: selectedCorresponsal.nombreContacto || undefined,
              nroTelefono: selectedCorresponsal.nroTelefono || undefined,
              email: selectedCorresponsal.email || undefined,
              web: selectedCorresponsal.web || undefined,
              direccion: selectedCorresponsal.direccion || undefined,
              pais: selectedCorresponsal.pais
            }}
            loading={loading}
            submitText="Actualizar Corresponsal"
          />
        )}
      </Modal>
    </div>
  )
}