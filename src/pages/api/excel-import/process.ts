import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

interface ExcelRow {
  id?: number
  corresponsal_id: string
  nro_caso_assistravel: string
  nro_caso_corresponsal?: string | null
  fecha_de_inicio: string
  pais: string
  informe_medico?: string
  fee?: string | number | null
  costo_usd?: string | number
  costo_moneda_local?: string | number
  simbolo_moneda?: string | null
  monto_agregado?: number | null
  tiene_factura?: string
  nro_factura?: string | number | null
  fecha_emision_factura?: string | null
  fecha_vencimiento_factura?: string | null
  fecha_pago_factura?: string | null
  estado_interno?: string | null
  estado_del_caso?: string | null
  observaciones?: string | null
}

interface ImportStats {
  total: number
  exitosos: number
  errores: number
  procesados: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  try {
    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    // Verificar permisos de administrador
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Permisos insuficientes' })
    }

    // Leer datos del archivo Excel procesado
    const excelData = await readExcelData()
    
    if (!excelData || excelData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se encontraron datos para importar. Sube un archivo primero.',
        stats: { total: 0, exitosos: 0, errores: 0, procesados: 0 },
        logs: ['Error: No se encontraron datos en el archivo']
      })
    }

    const stats: ImportStats = {
      total: excelData.length,
      exitosos: 0,
      errores: 0,
      procesados: 0
    }

    const logs: string[] = []
    logs.push(`Iniciando importación de ${stats.total} registros...`)

    // Obtener todos los corresponsales existentes para mapear nombres a IDs
    const corresponsales = await prisma.corresponsal.findMany()
    const corresponsalMap = new Map(
      corresponsales.map(c => [c.nombreCorresponsal.toUpperCase(), c.id])
    )

    logs.push(`Encontrados ${corresponsales.length} corresponsales en la base de datos`)

    // Procesar cada fila del Excel
    for (const row of excelData) {
      stats.procesados++
      
      try {
        // Validar campos obligatorios
        if (!row.corresponsal_id || !row.nro_caso_assistravel || !row.fecha_de_inicio || !row.pais) {
          const missingFields = []
          if (!row.corresponsal_id) missingFields.push('corresponsal_id')
          if (!row.nro_caso_assistravel) missingFields.push('nro_caso_assistravel')
          if (!row.fecha_de_inicio) missingFields.push('fecha_de_inicio')
          if (!row.pais) missingFields.push('pais')
          
          throw new Error(`Campos obligatorios faltantes: ${missingFields.join(', ')}`)
        }

        // Buscar el corresponsal por nombre
        let corresponsalId = corresponsalMap.get(row.corresponsal_id.toUpperCase())
        
        if (!corresponsalId) {
          // Crear corresponsal si no existe
          const nuevoCorresponsal = await prisma.corresponsal.create({
            data: {
              nombreCorresponsal: row.corresponsal_id,
              pais: row.pais,
              nombreContacto: null,
              nroTelefono: null,
              email: null,
              web: null,
              direccion: null
            }
          })
          
          corresponsalId = nuevoCorresponsal.id
          corresponsalMap.set(row.corresponsal_id.toUpperCase(), nuevoCorresponsal.id)
          logs.push(`Creado nuevo corresponsal: ${row.corresponsal_id}`)
        }

        // Convertir y validar datos
        const casoData = {
          corresponsalId: corresponsalId,
          nroCasoAssistravel: row.nro_caso_assistravel,
          nroCasoCorresponsal: convertirString(row.nro_caso_corresponsal),
          fechaInicioCaso: new Date(row.fecha_de_inicio),
          pais: row.pais,
          informeMedico: convertirBoolean(row.informe_medico),
          fee: convertirDecimal(row.fee),
          costoUsd: convertirDecimal(row.costo_usd),
          costoMonedaLocal: convertirDecimal(row.costo_moneda_local),
          simboloMoneda: row.simbolo_moneda || null,
          montoAgregado: convertirDecimal(row.monto_agregado),
          tieneFactura: convertirBoolean(row.tiene_factura),
          nroFactura: convertirString(row.nro_factura),
          fechaEmisionFactura: convertirFecha(row.fecha_emision_factura),
          fechaVencimientoFactura: convertirFecha(row.fecha_vencimiento_factura),
          fechaPagoFactura: convertirFecha(row.fecha_pago_factura),
          estadoInterno: convertirEstadoInterno(row.estado_interno),
          estadoDelCaso: convertirEstadoCaso(row.estado_del_caso),
          observaciones: row.observaciones || null
        }

        // Verificar si el caso ya existe
        const casoExistente = await prisma.caso.findFirst({
          where: {
            nroCasoAssistravel: casoData.nroCasoAssistravel
          }
        })

        if (casoExistente) {
          logs.push(`Caso ya existe: ${casoData.nroCasoAssistravel} - Saltando`)
          continue
        }

        // Crear el caso
        await prisma.caso.create({
          data: casoData
        })

        stats.exitosos++
        
        if (stats.exitosos % 10 === 0) {
          logs.push(`Procesados ${stats.exitosos} casos exitosamente...`)
        }

      } catch (error) {
        stats.errores++
        const errorMsg = `Error en fila ${stats.procesados}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        logs.push(errorMsg)
        console.error(errorMsg, error)
      }
    }

    logs.push(`\n=== IMPORTACIÓN COMPLETADA ===`)
    logs.push(`Total registros: ${stats.total}`)
    logs.push(`Exitosos: ${stats.exitosos}`)
    logs.push(`Errores: ${stats.errores}`)
    logs.push(`Procesados: ${stats.procesados}`)

    // Limpiar archivo procesado después de importar
    try {
      const jsonPath = path.join(process.cwd(), 'data', 'excel_data.json')
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath)
      }
    } catch (error) {
      console.warn('No se pudo limpiar archivo temporal:', error)
    }

    return res.status(200).json({
      success: stats.errores === 0,
      message: `Importación completada. ${stats.exitosos} registros importados exitosamente.`,
      stats,
      logs
    })

  } catch (error) {
    console.error('Error general en importación:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la importación',
      stats: { total: 0, exitosos: 0, errores: 0, procesados: 0 },
      logs: [`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    })
  }
}

// Función para leer los datos del Excel convertidos a JSON
async function readExcelData(): Promise<ExcelRow[]> {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'excel_data.json')
    
    // Verificar si el archivo existe
    if (!fs.existsSync(jsonPath)) {
      throw new Error('Archivo de datos Excel no encontrado. Sube un archivo primero.')
    }
    
    // Leer el archivo JSON
    const jsonData = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(jsonData) as ExcelRow[]
    
    return data
  } catch (error) {
    console.error('Error al leer datos del Excel:', error)
    throw new Error(`No se pudieron leer los datos del Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

// Funciones de utilidad para convertir datos
function convertirBoolean(valor: string | boolean | null | undefined): boolean {
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'string') {
    const upper = valor.toUpperCase().trim()
    return upper === 'SI' || upper === 'SÍ' || upper === 'TRUE' || upper === '1' || upper === 'YES' || upper === 'Y'
  }
  if (typeof valor === 'number') {
    return valor === 1
  }
  return false
}

function convertirDecimal(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === '' || valor === 'NaN') return null
  
  if (typeof valor === 'string') {
    // Limpiar string: remover espacios, comas como separadores de miles
    const cleaned = valor.trim().replace(/,/g, '')
    const num = Number(cleaned)
    return isNaN(num) ? null : num
  }
  
  const num = Number(valor)
  return isNaN(num) ? null : num
}

function convertirString(valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined || valor === '' || valor === 'NaN' || valor === 'NaT') return null
  
  // Convertir a string y limpiar
  const str = String(valor).trim()
  
  // Si está vacío después de limpiar, retornar null
  if (str === '' || str === 'undefined' || str === 'null') return null
  
  return str
}

function convertirFecha(valor: string | number | null | undefined): Date | null {
  if (!valor || valor === 'NaT' || valor === 'NaN' || valor === '' || valor === 'undefined') return null
  
  try {
    // Si es un número (fecha de Excel)
    if (typeof valor === 'number') {
      // Excel almacena fechas como números seriales desde 1900-01-01
      const excelEpoch = new Date(1900, 0, 1)
      const fecha = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000)
      return isNaN(fecha.getTime()) ? null : fecha
    }
    
    // Si es string, intentar convertir
    const fecha = new Date(valor)
    return isNaN(fecha.getTime()) ? null : fecha
  } catch {
    return null
  }
}

function convertirEstadoInterno(valor: string | null | undefined): 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO' {
  if (!valor) return 'ABIERTO'
  
  const upper = valor.toUpperCase().trim()
  const estadosValidos: ('ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO')[] = ['ABIERTO', 'CERRADO', 'PAUSADO', 'CANCELADO']
  
  // Buscar coincidencia exacta
  if (estadosValidos.includes(upper as any)) {
    return upper as 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO'
  }
  
  // Mapeo de variaciones comunes
  const mapeo: Record<string, 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO'> = {
    'OPEN': 'ABIERTO',
    'CLOSE': 'CERRADO',
    'CLOSED': 'CERRADO',
    'PAUSE': 'PAUSADO',
    'PAUSED': 'PAUSADO',
    'CANCEL': 'CANCELADO',
    'CANCELLED': 'CANCELADO',
    'CANCELED': 'CANCELADO'
  }
  
  return mapeo[upper] || 'ABIERTO'
}

function convertirEstadoCaso(valor: string | null | undefined): 'NO_FEE' | 'REFACTURADO' | 'PARA_REFACTURAR' | 'ON_GOING' | 'COBRADO' {
  if (!valor) return 'NO_FEE'
  
  const upper = valor.toUpperCase().trim().replace(/\s+/g, '_')
  
  // Mapear variaciones comunes
  const mapeo: Record<string, 'NO_FEE' | 'REFACTURADO' | 'PARA_REFACTURAR' | 'ON_GOING' | 'COBRADO'> = {
    'NO_FEE': 'NO_FEE',
    'REFACTURADO': 'REFACTURADO', 
    'PARA_REFACTURAR': 'PARA_REFACTURAR',
    'ON_GOING': 'ON_GOING',
    'COBRADO': 'COBRADO',
    'NO': 'NO_FEE',
    'NOFEE': 'NO_FEE',
    'SIN_FEE': 'NO_FEE',
    'ONGOING': 'ON_GOING',
    'EN_PROGRESO': 'ON_GOING',
    'FACTURADO': 'REFACTURADO',
    'PAGADO': 'COBRADO',
    'PAID': 'COBRADO'
  }
  
  return mapeo[upper] || 'NO_FEE'
}