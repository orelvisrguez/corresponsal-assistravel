import { CasoConCorresponsal } from '@/types'

export type FiltroPeriodo = 'actual' | 'tres_meses' | 'semestral' | 'anual' | 'todo'

export interface FiltroFechas {
  fechaInicio: Date
  fechaFin: Date
  label: string
}

export function calcularFiltroFechas(periodo: FiltroPeriodo): FiltroFechas {
  const ahora = new Date()
  const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  
  let fechaInicio: Date
  let fechaFin: Date
  let label: string
  
  switch (periodo) {
    case 'actual':
      fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
      fechaFin = fechaActual
      label = 'Mes Actual'
      break
      
    case 'tres_meses':
      fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 2, 1)
      fechaFin = fechaActual
      label = 'Últimos 3 Meses'
      break
      
    case 'semestral':
      fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 5, 1)
      fechaFin = fechaActual
      label = 'Semestral'
      break
      
    case 'anual':
      fechaInicio = new Date(fechaActual.getFullYear() - 1, 0, 1)
      fechaFin = fechaActual
      label = 'Anual'
      break
      
    case 'todo':
      fechaInicio = new Date(2020, 0, 1) // Fecha muy antigua para capturar todos
      fechaFin = fechaActual
      label = 'Todo el Período'
      break
      
    default:
      fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
      fechaFin = fechaActual
      label = 'Mes Actual'
  }
  
  return { fechaInicio, fechaFin, label }
}

export function filtrarCasosPorPeriodo(casos: CasoConCorresponsal[], periodo: FiltroPeriodo): CasoConCorresponsal[] {
  const filtro = calcularFiltroFechas(periodo)
  
  return casos.filter(caso => {
    // Usar fecha de inicio del caso como referencia principal
    if (!caso.fechaInicioCaso) return false
    
    const fechaInicioCaso = new Date(caso.fechaInicioCaso)
    const fechaCasoLimpia = new Date(fechaInicioCaso.getFullYear(), fechaInicioCaso.getMonth(), fechaInicioCaso.getDate())
    
    return fechaCasoLimpia >= filtro.fechaInicio && fechaCasoLimpia <= filtro.fechaFin
  })
}

export interface KPIFinanciero {
  ingresoTotalUSD: number
  ingresoTotalLocal: { [moneda: string]: number }
  promedioPorCaso: number
  casosFacturados: number
  tasaFacturacion: number
  casosCobrados: number
  tasaCobro: number
  ingresosPendientes: number
  casosPendientesPago: number
}

// Función auxiliar para convertir strings formateados a números
function parseFormattedNumber(value: any): number {
  // Si es null, undefined o string vacío, retornar 0
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  if (typeof value === 'number') {
    return isFinite(value) ? value : 0
  }
  
  if (typeof value === 'string') {
    // Limpiar el string: eliminar espacios y caracteres no numéricos (excepto punto y coma)
    let cleaned = value.trim().replace(/[^\d.,\-]/g, '')
    
    // Si el string está vacío después de limpiar, retornar 0
    if (!cleaned) {
      return 0
    }
    
    // Detectar y manejar diferentes formatos de número
    const lastComma = cleaned.lastIndexOf(',')
    const lastPeriod = cleaned.lastIndexOf('.')
    
    // Si tiene tanto punto como coma, determinar cuál es el separador decimal
    if (lastComma > -1 && lastPeriod > -1) {
      if (lastComma > lastPeriod) {
        // Español: 1.234.567,89 (coma decimal, punto miles)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // Inglés: 1,234,567.89 (punto decimal, coma miles)
        cleaned = cleaned.replace(/,/g, '')
      }
    } else if (cleaned.includes(',')) {
      // Solo coma - asumir que es separador decimal
      cleaned = cleaned.replace(',', '.')
    }
    // Si solo tiene punto, asumir que es separador decimal (sin cambios)
    
    const num = parseFloat(cleaned)
    
    // Validar que el número es válido y razonable
    if (!isFinite(num) || isNaN(num)) {
      return 0
    }
    
    // Si el número es demasiado grande (probablemente mal formateado), retornarlo tal como está
    // pero con un límite razonable
    if (Math.abs(num) > 1e15) { // Más de 1 cuatrillón probablemente es un error
      console.warn(`Número potencialmente mal formateado detectado: ${value} -> ${num}`)
      return 0 // Retornar 0 para evitar cálculos erróneos
    }
    
    return num
  }
  
  return 0
}
export function calcularKPIsFinancieros(casos: CasoConCorresponsal[]): KPIFinanciero {
  const casosValidos = casos.filter(caso => caso.fechaInicioCaso)
  
  // Cálculos básicos
  const ingresoTotalUSD = casosValidos.reduce((sum, caso) => {
    return sum + parseFormattedNumber(caso.costoUsd)
  }, 0)
  
  // Agrupar por moneda local
  const ingresosPorMoneda: { [moneda: string]: number } = {}
  casosValidos.forEach(caso => {
    if (caso.costoMonedaLocal && caso.simboloMoneda) {
      const moneda = caso.simboloMoneda.trim()
      if (!ingresosPorMoneda[moneda]) {
        ingresosPorMoneda[moneda] = 0
      }
      ingresosPorMoneda[moneda] += parseFormattedNumber(caso.costoMonedaLocal)
    }
  })
  
  // Casos con factura
  const casosFacturados = casosValidos.filter(caso => caso.tieneFactura)
  const casosCobrados = casosValidos.filter(caso => caso.estadoDelCaso === 'COBRADO')
  const casosPendientesPago = casosValidos.filter(caso => 
    caso.tieneFactura && 
    caso.fechaVencimientoFactura && 
    caso.estadoDelCaso !== 'COBRADO'
  )
  
  // Ingresos pendientes (facturas vencidas sin cobrar)
  const ingresosPendientes = casosPendientesPago.reduce((sum, caso) => {
    const fechaVencimiento = caso.fechaVencimientoFactura ? new Date(caso.fechaVencimientoFactura) : null
    const hoy = new Date()
    if (fechaVencimiento && fechaVencimiento < hoy) {
      return sum + parseFormattedNumber(caso.costoUsd)
    }
    return sum
  }, 0)
  
  return {
    ingresoTotalUSD,
    ingresoTotalLocal: ingresosPorMoneda,
    promedioPorCaso: casosValidos.length > 0 ? ingresoTotalUSD / casosValidos.length : 0,
    casosFacturados: casosFacturados.length,
    tasaFacturacion: casosValidos.length > 0 ? (casosFacturados.length / casosValidos.length) * 100 : 0,
    casosCobrados: casosCobrados.length,
    tasaCobro: casosValidos.length > 0 ? (casosCobrados.length / casosValidos.length) * 100 : 0,
    ingresosPendientes,
    casosPendientesPago: casosPendientesPago.length
  }
}

export interface TopCorresponsal {
  id: number
  nombre: string
  pais: string
  totalCasos: number
  ingresosUSD: number
  casosCerrados: number
  eficiencia: number
}

export function obtenerTopCorresponsales(casos: CasoConCorresponsal[], limite: number = 5): TopCorresponsal[] {
  const corresponsalMap = new Map<number, TopCorresponsal>()
  
  casos.forEach(caso => {
    const corresponsalId = caso.corresponsal.id
    
    if (!corresponsalMap.has(corresponsalId)) {
      corresponsalMap.set(corresponsalId, {
        id: corresponsalId,
        nombre: caso.corresponsal.nombreCorresponsal,
        pais: caso.corresponsal.pais,
        totalCasos: 0,
        ingresosUSD: 0,
        casosCerrados: 0,
        eficiencia: 0
      })
    }
    
    const corresponsal = corresponsalMap.get(corresponsalId)!
    corresponsal.totalCasos++
    corresponsal.ingresosUSD += parseFormattedNumber(caso.costoUsd)
    
    if (caso.estadoDelCaso === 'COBRADO' || caso.estadoInterno === 'CERRADO') {
      corresponsal.casosCerrados++
    }
  })
  
  // Calcular eficiencia (casos cerrados / total casos * 100)
  Array.from(corresponsalMap.values()).forEach(corresponsal => {
    corresponsal.eficiencia = corresponsal.totalCasos > 0 
      ? (corresponsal.casosCerrados / corresponsal.totalCasos) * 100 
      : 0
  })
  
  // Ordenar por ingresos descendente y tomar el top
  return Array.from(corresponsalMap.values())
    .sort((a, b) => b.ingresosUSD - a.ingresosUSD)
    .slice(0, limite)
}

export interface TendenciaData {
  periodo: string
  casos: number
  ingresos: number
  eficiencia: number
}

export function calcularTendencias(casos: CasoConCorresponsal[], periodo: FiltroPeriodo): TendenciaData[] {
  const filtro = calcularFiltroFechas(periodo)
  const casosFiltrados = filtrarCasosPorPeriodo(casos, periodo)
  
  // Agrupar por mes
  const casosPorMes = new Map<string, { casos: number; ingresos: number; cerrados: number }>()
  
  casosFiltrados.forEach(caso => {
    if (!caso.fechaInicioCaso) return
    
    const fecha = new Date(caso.fechaInicioCaso)
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    
    if (!casosPorMes.has(mesKey)) {
      casosPorMes.set(mesKey, { casos: 0, ingresos: 0, cerrados: 0 })
    }
    
    const mesData = casosPorMes.get(mesKey)!
    mesData.casos++
    mesData.ingresos += parseFormattedNumber(caso.costoUsd)
    
    if (caso.estadoDelCaso === 'COBRADO' || caso.estadoInterno === 'CERRADO') {
      mesData.cerrados++
    }
  })
  
  // Convertir a array y calcular eficiencia
  const tendencias = Array.from(casosPorMes.entries()).map(([periodoKey, data]) => ({
    periodo: periodoKey,
    casos: data.casos,
    ingresos: data.ingresos,
    eficiencia: data.casos > 0 ? (data.cerrados / data.casos) * 100 : 0
  }))
  
  // Ordenar por período
  return tendencias.sort((a, b) => a.periodo.localeCompare(b.periodo))
}

export function formatearNumero(numero: number): string {
  if (numero >= 1000000) {
    return (numero / 1000000).toFixed(1) + 'M'
  } else if (numero >= 1000) {
    return (numero / 1000).toFixed(1) + 'K'
  }
  return numero.toFixed(0)
}

export function calcularPorcentajeCambio(valorActual: number, valorAnterior: number): number {
  if (valorAnterior === 0) return valorActual > 0 ? 100 : 0
  return ((valorActual - valorAnterior) / valorAnterior) * 100
}