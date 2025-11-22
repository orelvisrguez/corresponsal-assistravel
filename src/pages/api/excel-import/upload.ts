import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import formidable from 'formidable'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

/**
 * Convierte un objeto Date a string YYYY-MM-DD de forma segura
 * CORRECCIÓN: Reemplaza el patrón problemático toISOString().split('T')[0]
 * Evita problemas de timezone al procesar fechas de Excel
 */
function dateToInputStringSafe(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  // Extraer componentes locales de fecha y formatear
  // Esto evita los problemas de timezone de toISOString()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Mes empieza en 0
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Configurar Next.js para no parsear el body automáticamente
export const config = {
  api: {
    bodyParser: false,
  },
}

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
  nro_factura?: string | null
  fecha_vencimiento_factura?: string | null
  fecha_pago_factura?: string | null
  estado_interno?: string | null
  estado_del_caso?: string | null
  observaciones?: string | null
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

    // Configurar formidable para el upload
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'tmp'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ mimetype, originalFilename }) {
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ]
        
        const validExtensions = ['.xlsx', '.xls', '.csv']
        const hasValidExtension = validExtensions.some(ext => 
          originalFilename?.toLowerCase().endsWith(ext)
        )
        
        return validTypes.includes(mimetype || '') || hasValidExtension
      }
    })

    // Crear directorio tmp si no existe
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    // Crear directorio data si no existe
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Parsear el archivo subido
    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({ message: 'No se encontró archivo' })
    }

    console.log('Archivo recibido:', {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      path: file.filepath
    })

    // Leer y procesar el archivo Excel
    let jsonData: ExcelRow[]

    try {
      if (file.originalFilename?.toLowerCase().endsWith('.csv')) {
        // Procesar archivo CSV
        const csvContent = fs.readFileSync(file.filepath, 'utf-8')
        const workbook = XLSX.read(csvContent, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)
      } else {
        // Procesar archivo Excel
        const workbook = XLSX.readFile(file.filepath)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)
      }
    } catch (error) {
      console.error('Error al leer archivo Excel:', error)
      return res.status(400).json({ 
        message: 'Error al procesar el archivo. Verifica que sea un archivo Excel válido.',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }

    // Validar que hay datos
    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ 
        message: 'El archivo está vacío o no contiene datos válidos' 
      })
    }

    // Validar columnas obligatorias
    const requiredColumns = [
      'corresponsal_id',
      'nro_caso_assistravel',
      'fecha_de_inicio',
      'pais'
    ]

    const firstRow = jsonData[0]
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Faltan columnas obligatorias: ${missingColumns.join(', ')}`,
        foundColumns: Object.keys(firstRow),
        requiredColumns
      })
    }

    // Procesar y limpiar datos
    const processedData = jsonData.map((row, index) => {
      const processedRow: any = {}

      for (const [key, value] of Object.entries(row)) {
        // Procesar fechas
        if (key.includes('fecha') && value && typeof value === 'number') {
          // Excel almacena fechas como números seriales
          try {
            const date = new Date((value - 25569) * 86400 * 1000)
            // CORRECCIÓN: Usar dateToInputStringSafe en lugar de toISOString().split('T')[0]
            // Esto evita problemas de timezone al procesar fechas de Excel
            processedRow[key] = dateToInputStringSafe(date)
          } catch {
            processedRow[key] = value
          }
        } else if (key === 'id' && value) {
          processedRow[key] = Number(value)
        } else if (value === undefined || value === null || value === '') {
          processedRow[key] = null
        } else {
          processedRow[key] = value
        }
      }

      // Validar campos obligatorios en cada fila
      const missingInRow = requiredColumns.filter(col => 
        !processedRow[col] || processedRow[col] === null || processedRow[col] === ''
      )
      
      if (missingInRow.length > 0) {
        console.warn(`Fila ${index + 2}: Faltan campos obligatorios: ${missingInRow.join(', ')}`)
      }

      return processedRow
    })

    // Guardar datos procesados
    const outputPath = path.join(dataDir, 'excel_data.json')
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf8')

    // Limpiar archivo temporal
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath)
    }

    console.log(`Archivo procesado exitosamente: ${processedData.length} registros`)

    return res.status(200).json({
      success: true,
      message: 'Archivo procesado exitosamente',
      recordCount: processedData.length,
      fileName: file.originalFilename,
      fileSize: file.size
    })

  } catch (error) {
    console.error('Error en upload de Excel:', error)
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}