/**
 * Utilidades para cálculos financieros de los casos
 */

import { Caso } from '@prisma/client'

/**
 * Calcula la suma total de un caso: FEE + costo_usd + monto_agregado
 * @param caso - Objeto caso con los valores financieros
 * @returns La suma total calculada
 */
export function calcularSumaTotal(caso: Partial<Caso>): number {
  const fee = Number(caso.fee) || 0
  const costoUsd = Number(caso.costoUsd) || 0
  const montoAgregado = Number(caso.montoAgregado) || 0
  
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
  const feeNum = Number(fee) || 0
  const costoUsdNum = Number(costoUsd) || 0
  const montoAgregadoNum = Number(montoAgregado) || 0
  
  return feeNum + costoUsdNum + montoAgregadoNum
}

/**
 * Formatea un valor monetario para mostrar con código internacional
 * @param value - Valor a formatear
 * @param currency - Código de moneda ISO 4217 (opcional)
 * @returns Valor formateado con código de moneda
 */
export function formatearMoneda(value: number | string | null | undefined, currency = 'USD'): string {
  const num = Number(value) || 0
  const formattedValue = num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  return `${formattedValue} ${currency}`
}

/**
 * Verifica si un caso tiene datos financieros válidos
 * @param caso - Objeto caso
 * @returns true si tiene al menos un valor financiero
 */
export function tieneValoresFinancieros(caso: Partial<Caso>): boolean {
  const fee = Number(caso.fee) || 0
  const costoUsd = Number(caso.costoUsd) || 0
  const montoAgregado = Number(caso.montoAgregado) || 0
  
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
    const fee = Number(caso.fee) || 0
    const costoUsd = Number(caso.costoUsd) || 0
    const montoAgregado = Number(caso.montoAgregado) || 0
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
    totales.totalFee += Number(caso.fee) || 0
    totales.totalCostoUsd += Number(caso.costoUsd) || 0
    totales.totalMontoAgregado += Number(caso.montoAgregado) || 0
    totales.totalSumaTotal += sumaTotal
    totales.cantidadCasos += 1
  })
  
  return Array.from(totalesPorCorresponsal.values())
}
