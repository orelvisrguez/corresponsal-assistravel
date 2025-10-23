'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { corresponsalSchema } from '@/lib/validations'
import { CorresponsalFormData, PAISES } from '@/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import AutoCompleteInput from '@/components/ui/AutoCompleteInput'
import { z } from 'zod'

type FormData = z.infer<typeof corresponsalSchema>

interface CorresponsalFormProps {
  onSubmit: (data: CorresponsalFormData) => void
  initialData?: Partial<CorresponsalFormData>
  loading?: boolean
  submitText?: string
}

export default function CorresponsalForm({ 
  onSubmit, 
  initialData, 
  loading = false, 
  submitText = 'Guardar' 
}: CorresponsalFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(corresponsalSchema),
    defaultValues: initialData
  })

  // País options - now handled by AutoCompleteInput directly

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header del formulario */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Información del Corresponsal</h3>
        <p className="text-blue-100">Completa todos los campos requeridos para registrar un nuevo corresponsal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Input
            label="Nombre del Corresponsal *"
            {...register('nombreCorresponsal')}
            error={errors.nombreCorresponsal?.message}
            className="border-2 focus:border-blue-500 transition-colors duration-300"
          />
        </div>
        
        <div className="space-y-2">
          <Input
            label="Nombre del Contacto"
            {...register('nombreContacto')}
            error={errors.nombreContacto?.message}
            className="border-2 focus:border-blue-500 transition-colors duration-300"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Input
            label="Número de Teléfono"
            type="tel"
            {...register('nroTelefono')}
            error={errors.nroTelefono?.message}
            className="border-2 focus:border-blue-500 transition-colors duration-300"
          />
        </div>
        
        <div className="space-y-2">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            className="border-2 focus:border-blue-500 transition-colors duration-300"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Input
          label="Sitio Web"
          type="url"
          placeholder="https://ejemplo.com"
          {...register('web')}
          error={errors.web?.message}
          className="border-2 focus:border-blue-500 transition-colors duration-300"
        />
      </div>
      
      <div className="space-y-2">
        <Input
          label="Dirección"
          {...register('direccion')}
          error={errors.direccion?.message}
          className="border-2 focus:border-blue-500 transition-colors duration-300"
        />
      </div>
      
      <div className="space-y-2">
        <AutoCompleteInput
          label="País *"
          value={watch('pais') || ''}
          onChange={(value) => setValue('pais', value)}
          options={PAISES}
          placeholder="Selecciona o escribe un país"
          error={errors.pais?.message}
          required
        />
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-end space-x-4">
          <Button 
            type="submit" 
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
          >
            {submitText}
          </Button>
        </div>
      </div>
    </form>
  )
}