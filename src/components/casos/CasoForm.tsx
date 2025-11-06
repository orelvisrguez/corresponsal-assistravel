'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { casoSchema } from '@/lib/validations'
import { CasoFormData, MONEDAS, PAISES, CorresponsalConCasos } from '@/types'
import { EstadoInterno, EstadoCaso } from '@prisma/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import AutoCompleteInput from '@/components/ui/AutoCompleteInput'
import { z } from 'zod'
import { format } from 'date-fns'
import { calcularSumaTotalDirecto, formatearMoneda } from '@/lib/calculations'
import { formatDateForInput } from '@/lib/dateUtils'
import { useMemo, useEffect } from 'react'
import { 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

type FormData = z.infer<typeof casoSchema>

interface CasoFormProps {
  onSubmit: (data: CasoFormData) => void
  corresponsales: CorresponsalConCasos[]
  initialData?: Partial<CasoFormData> & {
    fechaInicioCaso?: Date | string
    fechaEmisionFactura?: Date | string | null
    fechaVencimientoFactura?: Date | string | null
    fechaPagoFactura?: Date | string | null
  }
  loading?: boolean
  submitText?: string
}

export default function CasoForm({ 
  onSubmit, 
  corresponsales,
  initialData, 
  loading = false, 
  submitText = 'Guardar' 
}: CasoFormProps) {

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(casoSchema),
    defaultValues: {
      corresponsalId: initialData?.corresponsalId || 0,
      nroCasoAssistravel: initialData?.nroCasoAssistravel || '',
      nroCasoCorresponsal: initialData?.nroCasoCorresponsal || '',
      fechaInicioCaso: formatDateForInput(initialData?.fechaInicioCaso),
      pais: initialData?.pais || '',
      informeMedico: initialData?.informeMedico || false,
      fee: initialData?.fee || 0,
      costoUsd: initialData?.costoUsd || 0,
      costoMonedaLocal: initialData?.costoMonedaLocal || 0,
      simboloMoneda: initialData?.simboloMoneda || 'USD',
      montoAgregado: initialData?.montoAgregado || 0,
      tieneFactura: initialData?.tieneFactura || false,
      nroFactura: initialData?.nroFactura || '',
      fechaEmisionFactura: formatDateForInput(initialData?.fechaEmisionFactura),
      fechaVencimientoFactura: formatDateForInput(initialData?.fechaVencimientoFactura),
      fechaPagoFactura: formatDateForInput(initialData?.fechaPagoFactura),
      estadoInterno: initialData?.estadoInterno || 'ABIERTO',
      estadoDelCaso: initialData?.estadoDelCaso || 'NO_FEE',
      observaciones: initialData?.observaciones || ''
    }
  })

  // Efecto para resetear el formulario cuando cambie initialData
  useEffect(() => {
    if (initialData) {
      
      reset({
        corresponsalId: initialData.corresponsalId || 0,
        nroCasoAssistravel: initialData.nroCasoAssistravel || '',
        nroCasoCorresponsal: initialData.nroCasoCorresponsal || '',
        fechaInicioCaso: formatDateForInput(initialData.fechaInicioCaso),
        pais: initialData.pais || '',
        informeMedico: initialData.informeMedico || false,
        fee: initialData.fee || 0,
        costoUsd: initialData.costoUsd || 0,
        costoMonedaLocal: initialData.costoMonedaLocal || 0,
        simboloMoneda: initialData.simboloMoneda || 'USD',
        montoAgregado: initialData.montoAgregado || 0,
        tieneFactura: initialData.tieneFactura || false,
        nroFactura: initialData.nroFactura || '',
        fechaEmisionFactura: formatDateForInput(initialData.fechaEmisionFactura),
        fechaVencimientoFactura: formatDateForInput(initialData.fechaVencimientoFactura),
        fechaPagoFactura: formatDateForInput(initialData.fechaPagoFactura),
        estadoInterno: initialData.estadoInterno || 'ABIERTO',
        estadoDelCaso: initialData.estadoDelCaso || 'NO_FEE',
        observaciones: initialData.observaciones || ''
      })
    }
  }, [initialData, reset])

  const tieneFactura = watch('tieneFactura')
  const fee = watch('fee')
  const costoUsd = watch('costoUsd')
  const montoAgregado = watch('montoAgregado')
  const estadoDelCaso = watch('estadoDelCaso')
  const fechaEmisionFactura = watch('fechaEmisionFactura')
  const fechaInicioCaso = watch('fechaInicioCaso')
  
  // Calcular suma total en tiempo real
  const sumaTotal = useMemo(() => {
    return calcularSumaTotalDirecto(fee, costoUsd, montoAgregado)
  }, [fee, costoUsd, montoAgregado])

  // Automatización 1: Cambiar estado interno a CERRADO cuando el estado del caso es NO_FEE o COBRADO
  useEffect(() => {
    if (estadoDelCaso === 'NO_FEE' || estadoDelCaso === 'COBRADO') {
      setValue('estadoInterno', 'CERRADO')
    }
  }, [estadoDelCaso, setValue])

  // Automatización 2: Calcular fecha de vencimiento (+30 días) cuando se ingresa fecha de emisión
  useEffect(() => {
    if (fechaEmisionFactura && fechaEmisionFactura !== '') {
      try {
        const fechaEmision = new Date(fechaEmisionFactura)
        const fechaVencimiento = new Date(fechaEmision)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)
        
        const fechaVencimientoFormatted = format(fechaVencimiento, 'yyyy-MM-dd')
        setValue('fechaVencimientoFactura', fechaVencimientoFormatted)
      } catch (error) {
        console.error('Error calculando fecha de vencimiento:', error)
      }
    }
  }, [fechaEmisionFactura, setValue])
  
  const corresponsalOptions = corresponsales.map(c => ({
    value: c.id.toString(), 
    label: c.nombreCorresponsal
  }))
  
  // País options - now handled by AutoCompleteInput directly
  
  const estadoInternoOptions = [
    { value: 'ABIERTO', label: 'Abierto' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'PAUSADO', label: 'Pausado' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ]
  
  const estadoCasoOptions = [
    { value: 'NO_FEE', label: 'No Fee' },
    { value: 'REFACTURADO', label: 'Refacturado' },
    { value: 'PARA_REFACTURAR', label: 'Para Refacturar' },
    { value: 'ON_GOING', label: 'On Going' },
    { value: 'COBRADO', label: 'Cobrado' }
  ]

  const handleFormSubmit = (data: FormData) => {
    console.log('📅 Datos del formulario antes de enviar:', data)
    console.log('📅 Fecha de inicio específica:', data.fechaInicioCaso)
    
    onSubmit({
      ...data,
      corresponsalId: parseInt(data.corresponsalId.toString())
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Información Básica */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Información Básica</h3>
            <p className="text-sm text-gray-600">Datos principales del caso</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Corresponsal *"
              options={corresponsalOptions}
              placeholder="Selecciona un corresponsal"
              {...register('corresponsalId', { valueAsNumber: true })}
              error={errors.corresponsalId?.message}
              className="text-gray-900"
            />
          </div>
          
          <div>
            <Input
              label="Nro. Caso Assistravel *"
              placeholder="Número único del caso"
              {...register('nroCasoAssistravel')}
              error={errors.nroCasoAssistravel?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nro. Caso Corresponsal"
              placeholder="Número de referencia del corresponsal"
              {...register('nroCasoCorresponsal')}
              error={errors.nroCasoCorresponsal?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div>
            <Input
              label="Fecha Inicio Caso *"
              type="date"
              {...register('fechaInicioCaso')}
              error={errors.fechaInicioCaso?.message}
              className="text-gray-900"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <AutoCompleteInput
              label="País *"
              value={watch('pais') || ''}
              onChange={(value) => setValue('pais', value)}
              options={PAISES}
              placeholder="Selecciona o escribe un país"
              error={errors.pais?.message}
              required
              className="text-gray-900"
            />
          </div>
          
          <div className="flex items-center space-x-4 pt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('informeMedico')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Informe Médico</span>
            </label>
          </div>
        </div>
      </div>

      {/* Información Financiera */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Información Financiera</h3>
              <p className="text-sm text-gray-600">Montos y costos del caso</p>
            </div>
          </div>
          
          {/* Indicador de suma total en tiempo real */}
          <div className="bg-white rounded-lg px-4 py-3 border border-emerald-300 shadow-sm">
            <div className="text-center">
              <p className="text-xs text-gray-600 font-medium">Total Calculado</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatearMoneda(sumaTotal)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="Fee"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('fee', { valueAsNumber: true })}
              error={errors.fee?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div>
            <Input
              label="Costo USD"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('costoUsd', { valueAsNumber: true })}
              error={errors.costoUsd?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div>
            <Input
              label="Monto Agregado"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('montoAgregado', { valueAsNumber: true })}
              error={errors.montoAgregado?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Moneda Local del País</h4>
            <p className="text-xs text-blue-700 mb-3">
              Especifica la moneda local y el monto correspondiente para un mejor seguimiento financiero
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Símbolo Moneda *"
                  options={MONEDAS}
                  placeholder="Seleccionar moneda"
                  {...register('simboloMoneda')}
                  error={errors.simboloMoneda?.message}
                  className="text-gray-900"
                />
              </div>
              
              <div>
                <Input
                  label="Costo Moneda Local"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('costoMonedaLocal', { valueAsNumber: true })}
                  error={errors.costoMonedaLocal?.message}
                  className="text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de Facturación */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Información de Facturación</h3>
            <p className="text-sm text-gray-600">Gestión de facturas y pagos</p>
          </div>
        </div>

        {/* Checkbox independiente para marcar si tiene factura */}
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('tieneFactura')}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Tiene Factura</span>
          </label>
        </div>
        
        {/* Campos de facturación siempre disponibles */}
        <div className="space-y-4 bg-white rounded-lg p-4 border border-orange-200">
          <div>
            <Input
              label="Número de Factura"
              placeholder="Ej: FAC-2024-001"
              {...register('nroFactura')}
              error={errors.nroFactura?.message}
              className="text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Fecha Emisión"
                type="date"
                {...register('fechaEmisionFactura')}
                error={errors.fechaEmisionFactura?.message}
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Input
                label="Fecha Vencimiento"
                type="date"
                {...register('fechaVencimientoFactura')}
                error={errors.fechaVencimientoFactura?.message}
                className="text-gray-900"
              />
            </div>
            
            <div>
              <Input
                label="Fecha Pago"
                type="date"
                {...register('fechaPagoFactura')}
                error={errors.fechaPagoFactura?.message}
                className="text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estados y Observaciones */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Estados y Observaciones</h3>
            <p className="text-sm text-gray-600">Estado actual y notas adicionales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Estado Interno *"
              options={estadoInternoOptions}
              placeholder="Selecciona el estado interno"
              {...register('estadoInterno')}
              error={errors.estadoInterno?.message}
              className="text-gray-900"
            />
          </div>
          
          <div>
            <Select
              label="Estado del Caso *"
              options={estadoCasoOptions}
              placeholder="Selecciona el estado del caso"
              {...register('estadoDelCaso')}
              error={errors.estadoDelCaso?.message}
              className="text-gray-900"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Observaciones
          </label>
          <textarea
            {...register('observaciones')}
            rows={4}
            placeholder="Notas adicionales sobre el caso..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
          {errors.observaciones && (
            <p className="mt-1 text-sm text-red-600">{errors.observaciones.message}</p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="submit"
          loading={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          {submitText}
        </Button>
      </div>
    </form>
  )
}