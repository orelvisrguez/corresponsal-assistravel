import { Caso, Corresponsal, EstadoInterno, EstadoCaso, User, UserRole, UserStatus } from '@prisma/client'
import { SVGProps, ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react'

export type CasoConCorresponsal = Caso & {
  corresponsal: Corresponsal
}

export type CorresponsalConCasos = Corresponsal & {
  casos: Caso[]
}

export interface CasoFormData {
  corresponsalId: number
  nroCasoAssistravel: string
  nroCasoCorresponsal?: string
  fechaInicioCaso: string
  pais: string
  informeMedico: boolean
  fee?: number
  costoUsd?: number
  costoMonedaLocal?: number  // Valor de referencia, no se calcula
  simboloMoneda?: string
  montoAgregado?: number
  tieneFactura: boolean
  nroFactura?: string
  fechaEmisionFactura?: string
  fechaVencimientoFactura?: string
  fechaPagoFactura?: string
  estadoInterno: EstadoInterno
  estadoDelCaso: EstadoCaso
  observaciones?: string
}

export interface CorresponsalFormData {
  nombreCorresponsal: string
  nombreContacto?: string
  nroTelefono?: string
  email?: string
  web?: string
  direccion?: string
  pais: string
}

export interface InformeFormData {
  titulo: string
  descripcion?: string
  comentarios?: string
  tipoInforme: 'FINANCIERO' | 'CORRESPONSALES' | 'FACTURACION' | 'RESUMEN' | 'PERSONALIZADO' | 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  periodoInicio?: string
  periodoFin?: string
  corresponsalId?: number
  incluirGraficos: boolean
  incluirDetalles: boolean
  formatoSalida: 'PDF' | 'EXCEL' | 'HTML'
  filtros?: {
    pais?: string
    estadoInterno?: EstadoInterno
    estadoDelCaso?: EstadoCaso
    tieneFactura?: boolean
    informeMedico?: boolean
  }
}

export interface InformeGenerado {
  id: string
  titulo: string
  descripcion?: string
  tipo: string
  fechaGeneracion: Date
  fechaInicio?: Date
  fechaFin?: Date
  formatoSalida: string
  tamanoArchivo?: number
  rutaArchivo?: string
  estadisticas: {
    totalRegistros: number
    registrosProcesados: number
    filtrosAplicados: Record<string, any>
  }
  metadata?: Record<string, any>
}

export interface InformeInteligente {
  id: string
  titulo: string
  descripcion?: string
  tipoInforme: 'FINANCIERO' | 'CORRESPONSALES' | 'FACTURACION' | 'RESUMEN' | 'PERSONALIZADO' | 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  estado: 'GENERANDO' | 'COMPLETADO' | 'ERROR' | 'PENDIENTE'
  version: string
  fechaCreacion: Date
  fechaUltimaActualizacion?: Date
  fechaInicio?: Date
  fechaFin?: Date
  periodoInicio: string
  periodoFin: string
  usuario?: {
    id: string
    name: string
    email?: string
  }
  sugerencias?: SugerenciaInteligente[]
  graficos?: GraficoData[]
  configuracion: {
    incluirGraficos: boolean
    incluirDetalles: boolean
    formatoSalida: 'PDF' | 'EXCEL' | 'HTML'
    filtros?: Record<string, any>
  }
  contenido?: {
    resumenEjecutivo?: string
    insights?: string[]
    recomendaciones?: string[]
    graficos?: Array<{
      id: string
      tipo: string
      titulo: string
      datos: any
    }>
    tablas?: Array<{
      id: string
      titulo: string
      columnas: string[]
      filas: any[]
    }>
  }
  estadisticas: {
    totalRegistros: number
    registrosProcesados: number
    totalCasos?: number
    tiempoGeneracion?: number
    nivelConfianza?: number
    ingresosTotales?: number
    casosCompletados?: number
    eficienciaCorresponsales?: Array<{
      nombre: string
      casos: number
      totalCasos: number
      casosCompletados: number
      eficiencia: number
      tiempoPromedio: number
      ingresoGenerado: number
    }>
    distribucionMonedas?: Array<{
      moneda: string
      cantidad: number
      monto: number
      porcentaje: number
    }>
  }
  comentarios?: string
  rutaArchivo?: string
  tamanoArchivo?: number
  metadata?: Record<string, any>
}

export interface SugerenciaInteligente {
  id: string
  titulo: string
  descripcion: string
  tipo: 'OPTIMIZACION' | 'ALERTA' | 'RECOMENDACION' | 'INSIGHT'
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  impacto?: string
  accionRecomendada?: string
  impactoEstimado?: string
  fechaCreacion: Date
  aplicada?: boolean
  fechaAplicacion?: Date
  metadata?: Record<string, any>
}

export interface GraficoData {
  id: string
  titulo: string
  tipo: 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'SCATTER'
  datos: Array<Record<string, any>>
  configuracion: {
    xAxis: {
      dataKey: string
    }
    yAxis?: {
      dataKey?: string
    }
    lines?: Array<{
      dataKey: string
      stroke?: string
      name?: string
    }>
    bars?: Array<{
      dataKey: string
      fill?: string
      name?: string
    }>
    dataKey: string
    nameKey: string
    label?: boolean
    colorScheme?: string[]
    showLegend?: boolean
    showGrid?: boolean
  }
  descripcion?: string
  metadata?: Record<string, any>
}

export const MONEDAS = [
  { value: 'USD', label: 'USD - Dólar Estadounidense' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - Libra Esterlina' },
  { value: 'JPY', label: 'JPY - Yen Japonés' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'UYU', label: 'UYU - Peso Uruguayo' },
  { value: 'CAD', label: 'CAD - Dólar Canadiense' },
  { value: 'CHF', label: 'CHF - Franco Suizo' },
  { value: 'CNY', label: 'CNY - Yuan Chino' },
]

export const PAISES = [
  'Argentina', 'Brasil', 'Chile', 'Colombia', 'México', 'Perú', 'Uruguay',
  'Estados Unidos', 'Canadá', 'España', 'Francia', 'Alemania', 'Italia',
  'Reino Unido', 'Japón', 'China', 'Australia', 'Nueva Zelanda',
  'Cuba', 'República Dominicana', 'Puerto Rico', 'Costa Rica', 'Panamá',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Venezuela', 'Ecuador',
  'Bolivia', 'Paraguay', 'Holanda', 'Bélgica', 'Suiza', 'Austria', 'Portugal',
  'Rusia', 'India', 'Corea del Sur', 'Singapur', 'Tailandia', 'Filipinas',
  'Indonesia', 'Malasia', 'Vietnam', 'Sudáfrica', 'Egipto', 'Marruecos',
  'Israel', 'Turquía', 'Grecia', 'Polonia', 'República Checa', 'Hungría'
].sort()

// User management types
export interface UserFormData {
  name: string
  email: string
  password?: string
  role: UserRole
  status: UserStatus
}

export interface UserWithStats extends User {
  _count?: {
    sessions: number
  }
}

export const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'USER', label: 'Usuario' },
  { value: 'VIEWER', label: 'Solo Lectura' }
] as const

export const USER_STATUS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'SUSPENDED', label: 'Suspendido' }
] as const

// Types for Reports
export interface ReportFilter {
  fechaInicio?: string
  fechaFin?: string
  pais?: string
  corresponsalId?: string
  estadoFactura?: string
  informeMedico?: boolean
  estadoInterno?: string
  estadoDelCaso?: string
}

export interface EstadisticasReporte {
  totalRegistros: number
  fechaGeneracion: string
  filtrosAplicados: ReportFilter
}

export interface CorresponsalReporte {
  id: number
  nombreCorresponsal: string
  nombreContacto?: string
  email?: string
  nroTelefono?: string
  pais: string
  web?: string
  direccion?: string
  estadisticas: {
    totalCasos: number
    casosAbiertos: number
    casosCerrados: number
    casosPausados: number
    casosCancelados: number
    casosConFactura: number
    casosConInformeMedico: number
    totalFee: number
    totalCostoUsd: number
    totalCostoLocal: number
    totalMontoAgregado: number
    costoTotal: number
    promedioPorCaso: number
    estadosCaso: {
      noFee: number
      refacturado: number
      paraRefacturar: number
      onGoing: number
      cobrado: number
    }
  }
}

export interface CasoFinancieroReporte extends CasoConCorresponsal {
  costoTotalCalculado: number
  estadoFacturacion: string
  diasDesdeInicio: number
  financiero: {
    fee: number
    costoUsd: number
    costoMonedaLocal: number
    montoAgregado: number
    costoTotal: number
    simboloMoneda: string
  }
  alerta?: {
    tipo: string
    mensaje: string
    gravedad: 'baja' | 'media' | 'alta'
  }
}

export interface FacturaReporte {
  id: number
  nroCasoAssistravel: string
  nroCasoCorresponsal?: string
  nroFactura?: string
  corresponsal: {
    id: number
    nombreCorresponsal: string
    pais: string
  }
  fechaEmisionFactura?: Date
  fechaVencimientoFactura?: Date
  fechaPagoFactura?: Date
  estadoFactura: string
  montoFactura: number
  diasVencimiento?: number
  tiempoCobro?: number
  alerta?: {
    tipo: string
    mensaje: string
    gravedad: 'baja' | 'media' | 'alta'
  }
}

export interface ResumenFinancieroCorresponsal {
  corresponsal: {
    id: number
    nombreCorresponsal: string
    nombreContacto?: string
    email?: string
    nroTelefono?: string
    pais: string
    web?: string
    direccion?: string
  }
  resumen: {
    totalCasosGestionados: number
    totalFee: number
    totalCostoUsd: number
    totalCostoLocal: number
    totalMontoAgregado: number
    totalCostoTotal: number
    promedioPorCaso: number
    promedioMensual: number
    casosAbiertos: number
    casosCerrados: number
    casosPausados: number
    casosCancelados: number
    casosConFactura: number
    facturasPagadas: number
    facturasVencidas: number
    porcentajeFacturacion: number
    porcentajePago: number
    casosConInformeMedico: number
    porcentajeInformeMedico: number
    casosRentables: number
    porcentajeRentabilidad: number
    tiempoPromedioCobroDias: number
    estadosCaso: {
      noFee: number
      refacturado: number
      paraRefacturar: number
      onGoing: number
      cobrado: number
    }
  }
  analisisMensual: Array<{
    periodo: string
    cantidad: number
    costoTotal: number
  }>
  indicadores: {
    eficiencia: {
      tasaCompletacion: number
      tasaFacturacion: number
      tasaCobro: number
      tasaVencimiento: number
    }
    calidad: {
      porcentajeInformeMedico: number
      porcentajeRentabilidad: number
      casosSinCosto: number
    }
  }
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export const ESTADOS_FACTURA = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'con_factura', label: 'Con factura' },
  { value: 'sin_factura', label: 'Sin factura' },
  { value: 'emitida', label: 'Emitida' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'pagada', label: 'Pagada' }
] as const

export const PERIODOS_REPORTE = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 3 meses' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último año' },
  { value: 'custom', label: 'Período personalizado' },
  { value: 'current_month', label: 'Mes actual' },
  { value: 'previous_month', label: 'Mes anterior' },
  { value: 'current_year', label: 'Año actual' },
  { value: 'previous_year', label: 'Año anterior' }
] as const

export const TIPOS_INFORME = [
  { value: 'DIARIO', label: 'Informe Diario' },
  { value: 'SEMANAL', label: 'Informe Semanal' },
  { value: 'QUINCENAL', label: 'Informe Quincenal' },
  { value: 'MENSUAL', label: 'Informe Mensual' },
  { value: 'TRIMESTRAL', label: 'Informe Trimestral' },
  { value: 'SEMESTRAL', label: 'Informe Semestral' },
  { value: 'ANUAL', label: 'Informe Anual' },
  { value: 'FINANCIERO', label: 'Informe Financiero' },
  { value: 'CORRESPONSALES', label: 'Reporte de Corresponsales' },
  { value: 'FACTURACION', label: 'Reporte de Facturación' },
  { value: 'RESUMEN', label: 'Resumen Ejecutivo' },
  { value: 'PERSONALIZADO', label: 'Informe Personalizado' }
] as const

export const FORMATOS_SALIDA = [
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel (.xlsx)' },
  { value: 'HTML', label: 'HTML' }
] as const

// Icon type for compatibility with Heroicons
export type IconType = 
  | ComponentType<SVGProps<SVGSVGElement>>
  | ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { title?: string; titleId?: string } & RefAttributes<SVGSVGElement>>

// StatCard interface for reports
export interface StatCard {
  title: string
  value: string | number
  icon: IconType
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'gray' | 'orange'
}