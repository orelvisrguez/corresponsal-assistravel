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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del Corresponsal *"
          {...register('nombreCorresponsal')}
          error={errors.nombreCorresponsal?.message}
        />
        
        <Input
          label="Nombre del Contacto"
          {...register('nombreContacto')}
          error={errors.nombreContacto?.message}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Número de Teléfono"
          type="tel"
          {...register('nroTelefono')}
          error={errors.nroTelefono?.message}
        />
        
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>
      
      <Input
        label="Sitio Web"
        type="url"
        placeholder="https://ejemplo.com"
        {...register('web')}
        error={errors.web?.message}
      />
      
      <Input
        label="Dirección"
        {...register('direccion')}
        error={errors.direccion?.message}
      />
      
      <AutoCompleteInput
        label="País *"
        value={watch('pais') || ''}
        onChange={(value) => setValue('pais', value)}
        options={PAISES}
        placeholder="Selecciona o escribe un país"
        error={errors.pais?.message}
        required
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="submit" loading={loading}>
          {submitText}
        </Button>
      </div>
    </form>
  )
}