'use client'

import { useState, useEffect } from 'react'
import { UserWithStats, UserFormData, USER_ROLES, USER_STATUS, StatCard } from '@/types'
import { UserRole, UserStatus } from '@prisma/client'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import UserForm from './UserForm'
import SimpleSearch from '@/components/ui/SimpleSearch'
import StatCards from '@/components/ui/StatCards'
import HelpCard from '@/components/ui/HelpCard'
import { formatDate } from '@/lib/utils'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  EyeIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function UserList() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Aplicar filtros y búsqueda
    let filtered = users

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        throw new Error('Error al cargar usuarios')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (data: UserFormData) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Usuario creado exitosamente')
        setShowCreateModal(false)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditUser = async (data: UserFormData) => {
    if (!selectedUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Usuario actualizado exitosamente')
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar usuario')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (user: UserWithStats) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.name || user.email}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Usuario eliminado exitosamente')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const handleStatusChange = async (user: UserWithStats, newStatus: UserStatus) => {
    if (!confirm(`¿Estás seguro de que quieres cambiar el estado del usuario "${user.name || user.email}" a ${USER_STATUS.find(s => s.value === newStatus)?.label}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Estado del usuario actualizado')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar estado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const getRoleLabel = (role: UserRole) => {
    return USER_ROLES.find(r => r.value === role)?.label || role
  }

  const getStatusLabel = (status: UserStatus) => {
    return USER_STATUS.find(s => s.value === status)?.label || status
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100'
      case 'INACTIVE': return 'text-gray-600 bg-gray-100'
      case 'SUSPENDED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-600 bg-purple-100'
      case 'USER': return 'text-blue-600 bg-blue-100'
      case 'VIEWER': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Calcular estadísticas
  const stats: StatCard[] = [
    {
      title: 'Total Usuarios',
      value: filteredUsers.length.toString(),
      icon: UserIcon,
      color: 'blue'
    },
    {
      title: 'Usuarios Activos',
      value: filteredUsers.filter(u => u.status === 'ACTIVE').length.toString(),
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      title: 'Administradores',
      value: filteredUsers.filter(u => u.role === 'ADMIN').length.toString(),
      icon: ExclamationTriangleIcon,
      color: 'purple'
    },
    {
      title: 'Usuarios Suspendidos',
      value: filteredUsers.filter(u => u.status === 'SUSPENDED').length.toString(),
      icon: NoSymbolIcon,
      color: 'red'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título y botón de crear */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button onClick={() => setShowCreateModal(true)} variant="primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <StatCards stats={stats} />

      {/* Búsqueda y filtros */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <SimpleSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o email..."
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">Todos los roles</option>
                {USER_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">Todos los estados</option>
                {USER_STATUS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            <Button onClick={clearFilters} variant="secondary">
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuario"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(user, 'INACTIVE')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Desactivar usuario"
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user, 'ACTIVE')}
                          className="text-green-600 hover:text-green-900"
                          title="Activar usuario"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar usuario"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'No se encontraron usuarios con los filtros aplicados.'
                        : 'Comienza creando un nuevo usuario.'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información de ayuda */}
      <HelpCard
        title="Gestión de Usuarios"
        description="Aquí puedes administrar todos los usuarios que tienen acceso a la aplicación."
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900">Roles disponibles:</h4>
            <ul className="mt-1 text-sm text-gray-600 space-y-1">
              <li><strong>Administrador:</strong> Acceso completo incluyendo gestión de usuarios</li>
              <li><strong>Usuario:</strong> Puede gestionar casos y corresponsales</li>
              <li><strong>Solo Lectura:</strong> Solo puede visualizar información</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Estados de usuario:</h4>
            <ul className="mt-1 text-sm text-gray-600 space-y-1">
              <li><strong>Activo:</strong> Usuario puede iniciar sesión normalmente</li>
              <li><strong>Inactivo:</strong> Usuario temporalmente deshabilitado</li>
              <li><strong>Suspendido:</strong> Usuario bloqueado por problemas de seguridad</li>
            </ul>
          </div>
        </div>
      </HelpCard>

      {/* Modal de crear usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="lg"
      >
        <UserForm
          onSubmit={handleCreateUser}
          loading={formLoading}
          submitText="Crear Usuario"
        />
      </Modal>

      {/* Modal de editar usuario */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        title="Editar Usuario"
        size="lg"
      >
        {selectedUser && (
          <UserForm
            onSubmit={handleEditUser}
            initialData={{
              name: selectedUser.name || '',
              email: selectedUser.email,
              role: selectedUser.role,
              status: selectedUser.status
            }}
            loading={formLoading}
            submitText="Actualizar Usuario"
            isEdit={true}
          />
        )}
      </Modal>
    </div>
  )
}
