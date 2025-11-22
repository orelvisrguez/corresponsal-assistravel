'use client'

import * as XLSX from 'xlsx'
import { createLocalDate } from './dateUtils'

// Mapeo de estados del Excel a los estados del modelo de DB
const ESTADO_INTERNO_MAP: Record<string, string> = {
  'Abierto': 'ABIERTO',
  'Cerrado': 'CERRADO',
  'Pausado': 'PAUSADO',
  'Cancelado': 'CANCELADO'
}

const ESTADO_CASO_MAP: Record<string, string> = {
  'On Going': 'ON_GOING',
  'Refacturado': 'REFACTURADO',
  'Cobrado': 'COBRADO',
  'Para Refacturar': 'PARA_REFACTURAR',
  'No Fee': 'NO_FEE'
}

// Mapeo de corresponsales por nombre a ID
const CORRESPONSAL_MAP: Record<string, number> = {
  'EMERGENCY': 1, // Cambiar por el ID real del corresponsal EMERGENCY
  'MEDICAL': 2,   // Cambiar por el ID real del corresponsal MEDICAL
  'TRAVEL': 3,    // Cambiar por el ID real del corresponsal TRAVEL
  // Agregar más según sea necesario
}

export interface ImportResult {
  success: boolean
  processed: number
  updated: number
  created: number
  errors: string[]
  warnings: string[]
}

export interface ExcelRow {
  [key: string]: any
}

export interface ExcelPreview {
  headers: string[]
  rows: ExcelRow[]
  totalRows: number
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class ExcelImporter {
  private file: File | null = null

  constructor(file: File) {
    this.file = file
  }

  /**
   * Lee y previsualiza el archivo Excel (solo para el lado del cliente)
   */
  async previewData(): Promise<ExcelPreview> {
    const result: ExcelPreview = {
      headers: [],
      rows: [],
      totalRows: 0,
      valid: false,
      errors: [],
      warnings: []
    }

    if (!this.file) {
      result.errors.push('No se ha proporcionado un archivo')
      return result
    }

    try {
      // Leer el archivo Excel
      const arrayBuffer = await this.file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      }) as any[][]

      // Validar que tenga datos
      if (data.length < 2) {
        result.errors.push('El archivo debe tener al menos una fila de encabezados y una de datos')
        return result
      }

      // Obtener headers y datos
      const headers = data[0] as string[]
      const rows = data.slice(1)

      result.headers = headers
      result.totalRows = rows.length

      // Procesar filas para preview (solo los primeros 10 registros)
      const previewRows = rows.slice(0, 10).map(row => {
        const rowData: ExcelRow = {}
        headers.forEach((header, index) => {
          const normalizedKey = header.toLowerCase().replace(/\s+/g, '_')
          const value = row[index]
          rowData[normalizedKey] = this.formatPreviewValue(value)
        })
        return rowData
      })

      result.rows = previewRows

      // Validar estructura
      const requiredFields = [
        'nro_caso_assistravel',
        'corresponsal_id',
        'fecha_de_inicio',
        'pais',
        'estado_interno',
        'estado_del_caso'
      ]

      const missingFields = requiredFields.filter(field => 
        !headers.some(h => h.toLowerCase().replace(/\s+/g, '_') === field)
      )

      if (missingFields.length > 0) {
        result.errors.push(`Campos requeridos faltantes: ${missingFields.join(', ')}`)
      }

      // Advertencias
      if (data.length === 1) {
        result.warnings.push('El archivo solo contiene encabezados, no hay datos para importar')
      }

      result.valid = result.errors.length === 0
      console.log(`Preview generado: ${result.totalRows} filas de datos`)

    } catch (error) {
      result.errors.push(`Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    return result
  }

  /**
   * Normaliza datos para preview (sin operaciones de DB)
   */
  private normalizeDataForPreview(data: any): any {
    const normalized: any = {}

    // Mapear campos básicos
    normalized.nroCasoAssistravel = data.nro_caso_assistravel?.toString().trim()
    normalized.nroCasoCorresponsal = data.nro_caso_corresponsal?.toString().trim() || null
    normalized.fechaInicioCaso = this.parseDate(data.fecha_de_inicio) || new Date()
    normalized.pais = data.pais?.toString().trim() || ''
    normalized.informeMedico = this.parseBoolean(data.informe_medico)
    normalized.fee = this.parseNumber(data.fee) || null
    normalized.costoUsd = this.parseNumber(data.costo_usd) || null
    normalized.costoMonedaLocal = this.parseNumber(data.costo_moneda_local) || null
    normalized.simboloMoneda = data.simbolo_moneda?.toString().trim() || null
    normalized.montoAgregado = this.parseNumber(data.monto_agregado) || null
    normalized.tieneFactura = this.parseBoolean(data.tiene_factura)
    normalized.nroFactura = data.nro_factura?.toString().trim() || null
    normalized.observaciones = data.observaciones?.toString().trim() || null

    // Mapear fechas de facturación
    const fechaEmision = this.parseDate(data.fecha_emision_factura)
    if (fechaEmision) {
      normalized.fechaEmisionFactura = fechaEmision
    }
    const fechaVencimiento = this.parseDate(data.fecha_vencimiento_factura)
    if (fechaVencimiento) {
      normalized.fechaVencimientoFactura = fechaVencimiento
    }
    const fechaPago = this.parseDate(data.fecha_pago_factura)
    if (fechaPago) {
      normalized.fechaPagoFactura = fechaPago
    }

    // Mapear estados
    normalized.estadoInterno = ESTADO_INTERNO_MAP[data.estado_interno?.toString().trim()] || 'ABIERTO'
    normalized.estadoDelCaso = ESTADO_CASO_MAP[data.estado_del_caso?.toString().trim()] || 'ON_GOING'

    // Mapear corresponsal
    const corresponsalNombre = data.corresponsal_id?.toString().trim()
    if (CORRESPONSAL_MAP[corresponsalNombre]) {
      normalized.corresponsalId = CORRESPONSAL_MAP[corresponsalNombre]
    } else {
      // Si no encuentra el corresponsal, usar el primero disponible como fallback
      normalized.corresponsalId = 1
    }

    return normalized
  }

  /**
   * Formatea valores para preview
   */
  private formatPreviewValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return ''
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No'
    }
    
    if (typeof value === 'number') {
      return value.toString()
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    
    return value.toString()
  }

  /**
   * Convierte valores booleanos en español a booleanos
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim()
      return ['si', 'sí', 's', 'yes', 'y', 'true', '1', 'verd'].includes(lowerValue)
    }
    return false
  }

  /**
   * Convierte valores numéricos
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') return value
    
    const numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''))
    return isNaN(numValue) ? null : numValue
  }

  /**
   * Convierte fechas desde Excel de manera segura
   */
  private parseDate(value: any): Date | null {
    if (value === null || value === undefined || value === '') return null
    
    try {
      // Si ya es una fecha válida
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value
      }
      
      // Si es un número, puede ser un serial de Excel
      if (typeof value === 'number') {
        // Convertir serial de Excel a Date
        const excelEpoch = new Date(1900, 0, 1) // 1900-01-01
        const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
        
        if (!isNaN(date.getTime())) {
          return date
        }
      }
      
      // Si es string, usar createLocalDate
      if (typeof value === 'string') {
        return createLocalDate(value)
      }
      
      // Intentar conversión general como último recurso
      const date = new Date(value)
      return !isNaN(date.getTime()) ? date : null
      
    } catch (error) {
      console.warn(`Error al parsear fecha: ${value}`, error)
      return null
    }
  }

  /**
   * Valida la estructura del archivo antes de importar
   */
  static async validateFileStructure(file: File): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const result = { valid: false, errors: [] as string[], warnings: [] as string[] }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      if (workbook.SheetNames.length === 0) {
        result.errors.push('El archivo debe tener al menos una hoja')
        return result
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      
      if (data.length < 2) {
        result.errors.push('El archivo debe tener al menos una fila de encabezados y una de datos')
        return result
      }

      const headers = data[0] as string[]
      const requiredFields = [
        'nro_caso_assistravel',
        'corresponsal_id',
        'fecha_de_inicio',
        'pais',
        'estado_interno',
        'estado_del_caso'
      ]

      const missingFields = requiredFields.filter(field => 
        !headers.some(h => h.toLowerCase().replace(/\s+/g, '_') === field)
      )

      if (missingFields.length > 0) {
        result.errors.push(`Campos requeridos faltantes: ${missingFields.join(', ')}`)
      }

      // Verificar que no esté vacío
      if (data.length === 1) {
        result.warnings.push('El archivo solo contiene encabezados, no hay datos para importar')
      }

      result.valid = result.errors.length === 0

    } catch (error) {
      result.errors.push(`Error al validar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    return result
  }
}

export default ExcelImporter