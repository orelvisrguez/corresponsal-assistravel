import fs from 'fs'
import path from 'path'

/**
 * Crea los directorios necesarios para el funcionamiento del módulo de importación
 */
export function ensureDirectories() {
  const directories = [
    path.join(process.cwd(), 'tmp'),
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'uploads')
  ]

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`Directorio creado: ${dir}`)
    }
  })
}

/**
 * Limpia archivos temporales antiguos
 */
export function cleanupTempFiles() {
  const tmpDir = path.join(process.cwd(), 'tmp')
  const dataDir = path.join(process.cwd(), 'data')
  
  if (fs.existsSync(tmpDir)) {
    const files = fs.readdirSync(tmpDir)
    const oneHourAgo = Date.now() - (60 * 60 * 1000) // 1 hora
    
    files.forEach(file => {
      const filePath = path.join(tmpDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime.getTime() < oneHourAgo) {
        fs.unlinkSync(filePath)
        console.log(`Archivo temporal eliminado: ${file}`)
      }
    })
  }
  
  // Limpiar archivos JSON de datos antiguos
  const jsonPath = path.join(dataDir, 'excel_data.json')
  if (fs.existsSync(jsonPath)) {
    const stats = fs.statSync(jsonPath)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000) // 24 horas
    
    if (stats.mtime.getTime() < oneDayAgo) {
      fs.unlinkSync(jsonPath)
      console.log('Archivo de datos antiguo eliminado')
    }
  }
}

/**
 * Valida que el archivo Excel tenga el formato correcto
 */
export function validateExcelStructure(data: any[]): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  if (!data || data.length === 0) {
    errors.push('El archivo está vacío')
    return { isValid: false, errors }
  }
  
  const requiredColumns = [
    'corresponsal_id',
    'nro_caso_assistravel',
    'fecha_de_inicio',
    'pais'
  ]
  
  const firstRow = data[0]
  const missingColumns = requiredColumns.filter(col => !(col in firstRow))
  
  if (missingColumns.length > 0) {
    errors.push(`Faltan columnas obligatorias: ${missingColumns.join(', ')}`)
  }
  
  // Validar que hay al menos una fila con datos válidos
  const validRows = data.filter(row => 
    row.corresponsal_id && 
    row.nro_caso_assistravel && 
    row.fecha_de_inicio && 
    row.pais
  )
  
  if (validRows.length === 0) {
    errors.push('No se encontraron filas con datos válidos')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}