'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserFormData, USER_ROLES, USER_STATUS } from '@/types'
import { UserRole, UserStatus } from '@prisma/client'
import Button from '@/components/ui/Button'

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>
  initialData?: Partial<UserFormData>
  loading?: boolean
  submitText?: string
  isEdit?: boolean
}

export default function UserForm({ 
  onSubmit, 
  initialData, 
  loading = false, 
  submitText = 'Crear Usuario',
  isEdit = false 
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<UserFormData>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      password: '',
      role: initialData?.role || 'USER',
      status: initialData?.status || 'ACTIVE'
    }
  })

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data)
      if (!isEdit) {
        reset()
      }
    } catch (error) {
      console.error('Error en el formulario:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Información Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'El nombre es requerido' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Ingresa el nombre completo"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'El email es requerido',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Email inválido'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="usuario@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Contraseña */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña {!isEdit && '*'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            {...register('password', {
              required: !isEdit ? 'La contraseña es requerida' : false,
              minLength: {
                value: 6,
                message: 'La contraseña debe tener al menos 6 caracteres'
              }
            })}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            placeholder={isEdit ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        {isEdit && (
          <p className="mt-1 text-sm text-gray-500">
            Deja este campo vacío si no quieres cambiar la contraseña
          </p>
        )}
      </div>

      {/* Rol y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            id="role"
            {...register('role', { required: 'El rol es requerido' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <select
            id="status"
            {...register('status', { required: 'El estado es requerido' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            {USER_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Información de Roles */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Información sobre los roles:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Administrador:</strong> Acceso completo a todas las funcionalidades, incluida la gestión de usuarios</li>
          <li><strong>Usuario:</strong> Acceso completo a casos y corresponsales, puede crear y modificar datos</li>
          <li><strong>Solo Lectura:</strong> Solo puede visualizar información, sin permisos de modificación</li>
        </ul>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="submit"
          loading={loading}
          variant="primary"
        >
          {submitText}
        </Button>
      </div>
    </form>
  )
}
