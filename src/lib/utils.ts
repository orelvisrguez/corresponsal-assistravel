import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (!date) return ''
  const d = new Date(date)
  // Usar UTC para evitar problemas de timezone
  return d.toLocaleDateString('es-ES', { timeZone: 'UTC' })
}

/**
 * Convierte texto a formato de oración (cada palabra con inicial mayúscula)
 * Ejemplo: "HOLA MUNDO" -> "Hola Mundo"
 * @param text - Texto a convertir
 * @returns Texto formateado
 */
export function toSentenceCase(text: string): string {
  if (!text || typeof text !== 'string') return text

  // Convertir todo a minúsculas primero
  let result = text.toLowerCase()

  // Dividir en palabras y capitalizar la primera letra de cada palabra
  result = result
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Manejar casos especiales como números de teléfono, emails, URLs
      if (word.includes('@') || word.includes('.com') || /^\d/.test(word)) {
        return word // No modificar números, emails o URLs
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')

  return result
}

/**
 * Formatea campos de nombre de corresponsal aplicándose formato de oración
 * @param nombre - Nombre del corresponsal
 * @returns Nombre formateado
 */
export function formatCorresponsalNombre(nombre: string): string {
  return toSentenceCase(nombre)
}

/**
 * Formatea nombre de país aplicando formato de oración
 * @param pais - Nombre del país
 * @returns País formateado
 */
export function formatPais(pais: string): string {
  return toSentenceCase(pais)
}

/**
 * Formatea nombre de contacto aplicando formato de oración
 * @param nombreContacto - Nombre del contacto
 * @returns Nombre de contacto formateado
 */
export function formatNombreContacto(nombreContacto: string): string {
  return toSentenceCase(nombreContacto)
}

/**
 * Formatea dirección aplicando formato de oración
 * @param direccion - Dirección
 * @returns Dirección formateada
 */
export function formatDireccion(direccion: string): string {
  return toSentenceCase(direccion)
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
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

  const numAmount = parseFormattedNumber(amount)
  const formattedValue = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)

  return `${formattedValue} ${currency}`
}

export function getEstadoInternoLabel(estado: string): string {
  const labels = {
    ABIERTO: toSentenceCase('Abierto'),
    CERRADO: toSentenceCase('Cerrado'),
    PAUSADO: toSentenceCase('Pausado'),
    CANCELADO: toSentenceCase('Cancelado')
  }
  return labels[estado as keyof typeof labels] || toSentenceCase(estado)
}

export function getEstadoCasoLabel(estado: string): string {
  const labels = {
    NO_FEE: toSentenceCase('No Fee'),
    REFACTURADO: toSentenceCase('Refacturado'),
    PARA_REFACTURAR: toSentenceCase('Para Refacturar'),
    ON_GOING: toSentenceCase('On Going'),
    COBRADO: toSentenceCase('Cobrado')
  }
  return labels[estado as keyof typeof labels] || toSentenceCase(estado)
}

export function getEstadoInternoColor(estado: string): string {
  const colors = {
    ABIERTO: 'bg-green-100 text-green-800',
    CERRADO: 'bg-gray-100 text-gray-800',
    PAUSADO: 'bg-yellow-100 text-yellow-800',
    CANCELADO: 'bg-red-100 text-red-800'
  }
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getEstadoCasoColor(estado: string): string {
  const colors = {
    NO_FEE: 'bg-gray-100 text-gray-800',
    REFACTURADO: 'bg-blue-100 text-blue-800',
    PARA_REFACTURAR: 'bg-orange-100 text-orange-800',
    ON_GOING: 'bg-purple-100 text-purple-800',
    COBRADO: 'bg-green-100 text-green-800'
  }
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getRowColorByEstado(estadoDelCaso: string): string {
  const colors = {
    NO_FEE: 'hover:bg-gray-100',
    REFACTURADO: 'bg-blue-50 hover:bg-blue-100',
    PARA_REFACTURAR: 'bg-orange-50 hover:bg-orange-100',
    ON_GOING: 'bg-purple-50 hover:bg-purple-100',
    COBRADO: 'bg-green-50 hover:bg-green-100'
  }
  return colors[estadoDelCaso as keyof typeof colors] || 'hover:bg-gray-50'
}

export function getCardColorByEstado(estadoDelCaso: string): string {
  const colors = {
    NO_FEE: 'bg-white border-gray-200',
    REFACTURADO: 'bg-blue-50 border-blue-200',
    PARA_REFACTURAR: 'bg-orange-50 border-orange-200',
    ON_GOING: 'bg-purple-50 border-purple-200',
    COBRADO: 'bg-green-50 border-green-200'
  }
  return colors[estadoDelCaso as keyof typeof colors] || 'bg-white border-gray-200'
}

export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    const d = new Date(date)
    // Usar métodos UTC para evitar problemas de timezone
    // Esto asegura que 2025-11-22T00:00:00Z se formatee como 2025-11-22
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return ''
  }
}

// Función para filtrar casos
export function filterCasos(casos: any[], filters: any) {
  return casos.filter(caso => {
    // Búsqueda por texto
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch =
        caso.nroCasoAssistravel?.toLowerCase().includes(searchLower) ||
        caso.nroCasoCorresponsal?.toLowerCase().includes(searchLower) ||
        caso.pais?.toLowerCase().includes(searchLower) ||
        caso.observaciones?.toLowerCase().includes(searchLower) ||
        caso.corresponsal?.nombreCorresponsal?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Filtro por corresponsal
    if (filters.corresponsalId && filters.corresponsalId !== '') {
      if (caso.corresponsalId.toString() !== filters.corresponsalId) return false
    }

    // Filtro por estado interno
    if (filters.estadoInterno && filters.estadoInterno !== '') {
      if (caso.estadoInterno !== filters.estadoInterno) return false
    }

    // Filtro por estado del caso
    if (filters.estadoDelCaso && filters.estadoDelCaso !== '') {
      if (caso.estadoDelCaso !== filters.estadoDelCaso) return false
    }

    // Filtro por país
    if (filters.pais && filters.pais !== '') {
      if (!caso.pais?.toLowerCase().includes(filters.pais.toLowerCase())) return false
    }

    // Filtro por informe médico
    if (filters.informeMedico && filters.informeMedico !== '') {
      const tieneInforme = filters.informeMedico === 'true'
      if (caso.informeMedico !== tieneInforme) return false
    }

    // Filtro por tiene factura
    if (filters.tieneFactura && filters.tieneFactura !== '') {
      const tieneFactura = filters.tieneFactura === 'true'
      if (caso.tieneFactura !== tieneFactura) return false
    }

    // Filtro por rango de fechas según el tipo seleccionado
    if (filters.fechaDesde && filters.fechaDesde !== '') {
      let fechaCaso: Date | null = null
      const tipoFecha = filters.tipoFecha || 'fechaInicioCaso' // Default a fecha de inicio del caso

      switch (tipoFecha) {
        case 'fechaInicioCaso':
          fechaCaso = caso.fechaInicioCaso ? new Date(caso.fechaInicioCaso) : null
          break
        case 'fechaEmisionFactura':
          fechaCaso = caso.fechaEmisionFactura ? new Date(caso.fechaEmisionFactura) : null
          break
        case 'fechaVencimientoFactura':
          fechaCaso = caso.fechaVencimientoFactura ? new Date(caso.fechaVencimientoFactura) : null
          break
        case 'fechaPagoFactura':
          fechaCaso = caso.fechaPagoFactura ? new Date(caso.fechaPagoFactura) : null
          break
        default:
          fechaCaso = caso.fechaInicioCaso ? new Date(caso.fechaInicioCaso) : null
      }

      if (fechaCaso) {
        const fechaDesde = new Date(filters.fechaDesde)
        if (fechaCaso < fechaDesde) return false
      } else if (tipoFecha !== 'fechaInicioCaso') {
        // Si no tiene la fecha específica solicitada (y no es fecha de inicio), excluir el caso
        return false
      }
    }

    if (filters.fechaHasta && filters.fechaHasta !== '') {
      let fechaCaso: Date | null = null
      const tipoFecha = filters.tipoFecha || 'fechaInicioCaso' // Default a fecha de inicio del caso

      switch (tipoFecha) {
        case 'fechaInicioCaso':
          fechaCaso = caso.fechaInicioCaso ? new Date(caso.fechaInicioCaso) : null
          break
        case 'fechaEmisionFactura':
          fechaCaso = caso.fechaEmisionFactura ? new Date(caso.fechaEmisionFactura) : null
          break
        case 'fechaVencimientoFactura':
          fechaCaso = caso.fechaVencimientoFactura ? new Date(caso.fechaVencimientoFactura) : null
          break
        case 'fechaPagoFactura':
          fechaCaso = caso.fechaPagoFactura ? new Date(caso.fechaPagoFactura) : null
          break
        default:
          fechaCaso = caso.fechaInicioCaso ? new Date(caso.fechaInicioCaso) : null
      }

      if (fechaCaso) {
        const fechaHasta = new Date(filters.fechaHasta)
        if (fechaCaso > fechaHasta) return false
      } else if (tipoFecha !== 'fechaInicioCaso') {
        // Si no tiene la fecha específica solicitada (y no es fecha de inicio), excluir el caso
        return false
      }
    }

    // Filtro por rango de costos
    if (filters.costoDesde && filters.costoDesde !== '') {
      const costo = Number(caso.costoUsd) || 0
      if (costo < Number(filters.costoDesde)) return false
    }

    if (filters.costoHasta && filters.costoHasta !== '') {
      const costo = Number(caso.costoUsd) || 0
      if (costo > Number(filters.costoHasta)) return false
    }

    return true
  })
}

// Función para filtrar corresponsales
export function filterCorresponsales(corresponsales: any[], searchTerm: string) {
  if (!searchTerm) return corresponsales

  const searchLower = searchTerm.toLowerCase()
  return corresponsales.filter(corresponsal => {
    return (
      corresponsal.nombreCorresponsal?.toLowerCase().includes(searchLower) ||
      corresponsal.nombreContacto?.toLowerCase().includes(searchLower) ||
      corresponsal.email?.toLowerCase().includes(searchLower) ||
      corresponsal.pais?.toLowerCase().includes(searchLower) ||
      corresponsal.direccion?.toLowerCase().includes(searchLower) ||
      corresponsal.nroTelefono?.includes(searchTerm)
    )
  })
}

/**
 * Sanitiza un objeto para que sea compatible con JSON
 * Reemplaza valores problemáticos como undefined, NaN, Infinity
 */
export function sanitizeForJson(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }

  // Manejar números problemáticos
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) {
      return 0
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForJson(item))
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForJson(value)
    }
    return sanitized
  }

  return obj
}