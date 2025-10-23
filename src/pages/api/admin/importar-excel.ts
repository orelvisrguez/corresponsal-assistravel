import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

interface ExcelRow {
  id: number
  corresponsal_id: string
  nro_caso_assistravel: string
  nro_caso_corresponsal: string | null
  fecha_de_inicio: string
  pais: string
  informe_medico: string
  fee: string | number | null
  costo_usd: string | number
  costo_moneda_local: string | number
  simbolo_moneda: string | null
  monto_agregado: number | null
  tiene_factura: string
  nro_factura: string | null
  fecha_vencimiento_factura: string | null
  fecha_pago_factura: string | null
  estado_interno: string | null
  estado_del_caso: string | null
  observaciones: string | null
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

  const stats: ImportStats = {
    total: 0,
    exitosos: 0,
    errores: 0,
    procesados: 0
  }

  const logs: string[] = []

  try {
    // Leer el archivo Excel convertido a JSON
    const excelData = await readExcelData()
    
    if (!excelData || excelData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se encontraron datos en el archivo Excel',
        stats,
        logs: ['Error: No se encontraron datos en el archivo']
      })
    }

    stats.total = excelData.length
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
        // Buscar el corresponsal por nombre
        const corresponsalId = corresponsalMap.get(row.corresponsal_id.toUpperCase())
        
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
          
          corresponsalMap.set(row.corresponsal_id.toUpperCase(), nuevoCorresponsal.id)
          logs.push(`Creado nuevo corresponsal: ${row.corresponsal_id}`)
        }

        // Convertir y validar datos
        const casoData = {
          corresponsalId: corresponsalMap.get(row.corresponsal_id.toUpperCase())!,
          nroCasoAssistravel: row.nro_caso_assistravel,
          nroCasoCorresponsal: row.nro_caso_corresponsal || null,
          fechaInicioCaso: new Date(row.fecha_de_inicio),
          pais: row.pais,
          informeMedico: convertirBoolean(row.informe_medico),
          fee: convertirDecimal(row.fee), // Ahora el Excel tiene este campo
          costoUsd: convertirDecimal(row.costo_usd),
          costoMonedaLocal: convertirDecimal(row.costo_moneda_local),
          simboloMoneda: row.simbolo_moneda || null,
          montoAgregado: convertirDecimal(row.monto_agregado),
          tieneFactura: convertirBoolean(row.tiene_factura),
          nroFactura: row.nro_factura || null,
          fechaEmisionFactura: null, // No está en el Excel
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
        
        if (stats.exitosos % 50 === 0) {
          logs.push(`Procesados ${stats.exitosos} casos exitosamente...`)
        }

      } catch (error) {
        stats.errores++
        const errorMsg = `Error en fila ${stats.procesados}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        logs.push(errorMsg)
        console.error(errorMsg, error)
      }
    }

    logs.push(`\\n=== IMPORTACIÓN COMPLETADA ===`)
    logs.push(`Total registros: ${stats.total}`)
    logs.push(`Exitosos: ${stats.exitosos}`)
    logs.push(`Errores: ${stats.errores}`)
    logs.push(`Procesados: ${stats.procesados}`)

    return res.status(200).json({
      success: stats.errores === 0,
      message: `Importación completada. ${stats.exitosos} registros importados exitosamente.`,
      stats,
      logs
    })

  } catch (error) {
    console.error('Error general en importación:', error)
    logs.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la importación',
      stats,
      logs
    })
  }
}

// Función para leer los datos del Excel convertidos a JSON
async function readExcelData(): Promise<ExcelRow[]> {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'excel_data.json')
    
    // Verificar si el archivo existe
    if (!fs.existsSync(jsonPath)) {
      throw new Error('Archivo de datos Excel no encontrado. Ejecuta el script de conversión primero.')
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
function convertirBoolean(valor: string | boolean): boolean {
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'string') {
    return valor.toUpperCase() === 'SI' || valor.toUpperCase() === 'TRUE' || valor === '1'
  }
  return false
}

function convertirDecimal(valor: string | number | null): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const num = Number(valor)
  return isNaN(num) ? null : num
}

function convertirFecha(valor: string | null): Date | null {
  if (!valor) return null
  try {
    const fecha = new Date(valor)
    return isNaN(fecha.getTime()) ? null : fecha
  } catch {
    return null
  }
}

function convertirEstadoInterno(valor: string | null): 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO' {
  if (!valor) return 'ABIERTO'
  const upper = valor.toUpperCase()
  if (['CERRADO', 'PAUSADO', 'CANCELADO'].includes(upper)) {
    return upper as 'ABIERTO' | 'CERRADO' | 'PAUSADO' | 'CANCELADO'
  }
  return 'ABIERTO'
}

function convertirEstadoCaso(valor: string | null): 'NO_FEE' | 'REFACTURADO' | 'PARA_REFACTURAR' | 'ON_GOING' | 'COBRADO' {
  if (!valor) return 'NO_FEE'
  const upper = valor.toUpperCase()
  if (['REFACTURADO', 'PARA_REFACTURAR', 'ON_GOING', 'COBRADO'].includes(upper)) {
    return upper as 'NO_FEE' | 'REFACTURADO' | 'PARA_REFACTURAR' | 'ON_GOING' | 'COBRADO'
  }
  return 'NO_FEE'
}
