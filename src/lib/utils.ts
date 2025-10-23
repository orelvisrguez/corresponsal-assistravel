import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES')
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const formattedValue = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
  
  return `${formattedValue} ${currency}`
}

export function getEstadoInternoLabel(estado: string): string {
  const labels = {
    ABIERTO: 'Abierto',
    CERRADO: 'Cerrado',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado'
  }
  return labels[estado as keyof typeof labels] || estado
}

export function getEstadoCasoLabel(estado: string): string {
  const labels = {
    NO_FEE: 'No Fee',
    REFACTURADO: 'Refacturado',
    PARA_REFACTURAR: 'Para Refacturar',
    ON_GOING: 'On Going',
    COBRADO: 'Cobrado'
  }
  return labels[estado as keyof typeof labels] || estado
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
    // Ajustar para el offset de zona horaria
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
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