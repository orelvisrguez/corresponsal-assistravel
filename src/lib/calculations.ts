/**
 * Utilidades para cálculos financieros de los casos
 */

import { Caso } from '@prisma/client'

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

/**
 * Calcula la suma total de un caso: FEE + costo_usd + monto_agregado
 * @param caso - Objeto caso con los valores financieros
 * @returns La suma total calculada
 */
export function calcularSumaTotal(caso: Partial<Caso>): number {
  const fee = parseFormattedNumber(caso.fee)
  const costoUsd = parseFormattedNumber(caso.costoUsd)
  const montoAgregado = parseFormattedNumber(caso.montoAgregado)
  
  return fee + costoUsd + montoAgregado
}

/**
 * Calcula la suma total a partir de valores individuales
 * @param fee - Fee del caso
 * @param costoUsd - Costo en USD
 * @param montoAgregado - Monto agregado
 * @returns La suma total calculada
 */
export function calcularSumaTotalDirecto(
  fee?: number | string | null,
  costoUsd?: number | string | null,
  montoAgregado?: number | string | null
): number {
  const feeNum = parseFormattedNumber(fee)
  const costoUsdNum = parseFormattedNumber(costoUsd)
  const montoAgregadoNum = parseFormattedNumber(montoAgregado)
  
  return feeNum + costoUsdNum + montoAgregadoNum
}

/**
 * Formatea un valor monetario para mostrar con código internacional
 * @param value - Valor a formatear
 * @param currency - Código de moneda ISO 4217 (opcional)
 * @returns Valor formateado con código de moneda
 */
export function formatearMoneda(value: number | string | null | undefined, currency = 'USD'): string {
  const num = parseFormattedNumber(value)
  const formattedValue = num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  return `${formattedValue} ${currency}`
}

/**
 * Verifica si un caso tiene datos financieros válidos
 * @param caso - Objeto caso
 * @returns true si tiene al menos un valor financiero
 */
export function tieneValoresFinancieros(caso: Partial<Caso>): boolean {
  const fee = parseFormattedNumber(caso.fee)
  const costoUsd = parseFormattedNumber(caso.costoUsd)
  const montoAgregado = parseFormattedNumber(caso.montoAgregado)
  
  return fee > 0 || costoUsd > 0 || montoAgregado > 0
}

/**
 * Calcula estadísticas financieras de un conjunto de casos
 * @param casos - Array de casos
 * @returns Objeto con estadísticas calculadas
 */
export function calcularEstadisticasFinancieras(casos: Caso[]) {
  const estadisticas = {
    totalFee: 0,
    totalCostoUsd: 0,
    totalMontoAgregado: 0,
    totalSumaTotal: 0,
    promedioPorCaso: 0,
    casosConValores: 0,
    casosSinValores: 0
  }
  
  casos.forEach(caso => {
    const fee = parseFormattedNumber(caso.fee)
    const costoUsd = parseFormattedNumber(caso.costoUsd)
    const montoAgregado = parseFormattedNumber(caso.montoAgregado)
    const sumaTotal = calcularSumaTotal(caso)
    
    estadisticas.totalFee += fee
    estadisticas.totalCostoUsd += costoUsd
    estadisticas.totalMontoAgregado += montoAgregado
    estadisticas.totalSumaTotal += sumaTotal
    
    if (tieneValoresFinancieros(caso)) {
      estadisticas.casosConValores++
    } else {
      estadisticas.casosSinValores++
    }
  })
  
  estadisticas.promedioPorCaso = casos.length > 0 
    ? estadisticas.totalSumaTotal / casos.length 
    : 0
  
  return estadisticas
}

/**
 * Agrupa casos por corresponsal y calcula totales
 * @param casos - Array de casos con información del corresponsal
 * @returns Map con totales por corresponsal
 */
export function calcularTotalesPorCorresponsal(casos: any[]) {
  const totalesPorCorresponsal = new Map()
  
  casos.forEach(caso => {
    const corresponsalId = caso.corresponsalId
    const sumaTotal = calcularSumaTotal(caso)
    
    if (!totalesPorCorresponsal.has(corresponsalId)) {
      totalesPorCorresponsal.set(corresponsalId, {
        corresponsalId,
        nombreCorresponsal: caso.corresponsal?.nombreCorresponsal,
        totalFee: 0,
        totalCostoUsd: 0,
        totalMontoAgregado: 0,
        totalSumaTotal: 0,
        cantidadCasos: 0
      })
    }
    
    const totales = totalesPorCorresponsal.get(corresponsalId)
    totales.totalFee += parseFormattedNumber(caso.fee)
    totales.totalCostoUsd += parseFormattedNumber(caso.costoUsd)
    totales.totalMontoAgregado += parseFormattedNumber(caso.montoAgregado)
    totales.totalSumaTotal += sumaTotal
    totales.cantidadCasos += 1
  })
  
  return Array.from(totalesPorCorresponsal.values())
}
