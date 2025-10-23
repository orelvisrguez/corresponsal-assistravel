'use client'

import { useState } from 'react'
import { CorresponsalConCasos } from '@/types'
import { filterCorresponsales } from '@/lib/utils'
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
  EyeIcon
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Corresponsales</h1>
          <p className="mt-2 text-gray-600">Gestiona la información de los corresponsales</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nuevo Corresponsal
        </Button>
      </div>

      {/* Componente de búsqueda */}
      <SimpleSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar corresponsales... (nombre, contacto, email, país)"
        resultCount={filteredCorresponsales.length}
      />

      {filteredCorresponsales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          {corresponsales.length === 0 ? (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay corresponsales</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer corresponsal.</p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nuevo Corresponsal
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron corresponsales</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay corresponsales que coincidan con la búsqueda.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setSearchTerm('')}
                  variant="secondary"
                >
                  Limpiar búsqueda
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCorresponsales.map((corresponsal) => (
            <div key={corresponsal.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 
                  className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => openViewMode(corresponsal)}
                  title="Ver detalles y casos del corresponsal"
                >
                  {corresponsal.nombreCorresponsal}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewMode(corresponsal)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                    title="Ver detalles y casos"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(corresponsal)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Editar corresponsal"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(corresponsal)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar corresponsal"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                {corresponsal.nombreContacto && (
                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {corresponsal.nombreContacto}
                  </div>
                )}
                
                {corresponsal.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${corresponsal.email}`} className="text-blue-600 hover:underline">
                      {corresponsal.email}
                    </a>
                  </div>
                )}
                
                {corresponsal.nroTelefono && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${corresponsal.nroTelefono}`} className="text-blue-600 hover:underline">
                      {corresponsal.nroTelefono}
                    </a>
                  </div>
                )}
                
                {corresponsal.web && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a 
                      href={corresponsal.web} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline truncate"
                    >
                      {corresponsal.web}
                    </a>
                  </div>
                )}
                
                <div className="pt-2 mt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{corresponsal.pais}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {corresponsal.casos.length} caso{corresponsal.casos.length !== 1 ? 's' : ''}
                    </span>
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