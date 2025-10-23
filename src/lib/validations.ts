import { z } from 'zod'

// Schema de validación para signin
export const signinSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria')
})

// Schema de validación para casos
export const casoSchema = z.object({
  corresponsalId: z.number().min(1, 'Debe seleccionar un corresponsal'),
  nroCasoAssistravel: z.string().min(1, 'El número de caso Assistravel es obligatorio'),
  nroCasoCorresponsal: z.string().optional(),
  fechaInicioCaso: z.string().min(1, 'La fecha de inicio del caso es obligatoria'),
  pais: z.string().min(1, 'El país es obligatorio'),
  informeMedico: z.boolean().default(false),
  fee: z.number().min(0, 'El fee debe ser mayor o igual a 0').optional(),
  costoUsd: z.number().min(0, 'El costo USD debe ser mayor o igual a 0').optional(),
  costoMonedaLocal: z.number().min(0, 'El costo en moneda local debe ser mayor o igual a 0').optional(),
  simboloMoneda: z.string().optional(),
  montoAgregado: z.number().min(0, 'El monto agregado debe ser mayor o igual a 0').optional(),
  tieneFactura: z.boolean().default(false),
  nroFactura: z.string().optional(),
  fechaEmisionFactura: z.string().optional(),
  fechaVencimientoFactura: z.string().optional(),
  fechaPagoFactura: z.string().optional(),
  estadoInterno: z.enum(['ABIERTO', 'CERRADO', 'PAUSADO', 'CANCELADO']),
  estadoDelCaso: z.enum(['NO_FEE', 'REFACTURADO', 'PARA_REFACTURAR', 'ON_GOING', 'COBRADO']),
  observaciones: z.string().optional()
})

// Schema de validación para corresponsales
export const corresponsalSchema = z.object({
  nombreCorresponsal: z.string().min(1, 'El nombre del corresponsal es obligatorio'),
  nombreContacto: z.string().optional(),
  nroTelefono: z.string().optional(),
  email: z.string().email('Formato de email inválido').optional().or(z.literal('')),
  web: z.string().optional(),
  direccion: z.string().optional(),
  pais: z.string().min(1, 'El país es obligatorio')
})

// Schema de validación para usuarios
export const userSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'USER', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
})

// Schema para filtros de reportes
export const reportFilterSchema = z.object({
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  pais: z.string().optional(),
  corresponsalId: z.string().optional(),
  estadoFactura: z.string().optional(),
  informeMedico: z.boolean().optional(),
  estadoInterno: z.string().optional(),
  estadoDelCaso: z.string().optional()
})

export type SigninValidation = z.infer<typeof signinSchema>
export type CasoValidation = z.infer<typeof casoSchema>
export type CorresponsalValidation = z.infer<typeof corresponsalSchema>
export type UserValidation = z.infer<typeof userSchema>
export type ReportFilterValidation = z.infer<typeof reportFilterSchema>