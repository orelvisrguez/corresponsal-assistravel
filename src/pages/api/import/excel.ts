import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import ServerExcelImporter, { ImportResult } from '@/lib/server-excel-importer'
import formidable from 'formidable'
import fs from 'fs'

// Configurar el parser para manejar archivos multipart
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  if (req.method === 'POST') {
    try {
      // Configurar formidable para recibir archivos
      const form = formidable({
        maxFileSize: 50 * 1024 * 1024, // 50MB
        keepExtensions: true,
        uploadDir: '/tmp'
      })

      // Parsear el request
      const [fields, files] = await form.parse(req)
      
      const uploadedFiles = files.file
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'No se encontró archivo en la request' })
      }

      const file = uploadedFiles[0]
      
      // Verificar que sea un archivo Excel
      if (!file.mimetype?.includes('excel') && !file.originalFilename?.endsWith('.xlsx')) {
        return res.status(400).json({ message: 'El archivo debe ser un Excel (.xlsx)' })
      }

      // Crear un File object a partir del archivo subido
      const fileBuffer = fs.readFileSync(file.filepath)
      const fileBlob = new File([fileBuffer], file.originalFilename || 'import.xlsx', {
        type: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Validar estructura del archivo
      const validation = await ServerExcelImporter.validateFileStructure(fileBlob)
      
      if (!validation.valid) {
        return res.status(400).json({
          message: 'Archivo inválido',
          errors: validation.errors,
          warnings: validation.warnings
        })
      }

      // Realizar la importación
      const importer = new ServerExcelImporter()
      const result = await importer.importData(fileBlob)

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(file.filepath)
      } catch (error) {
        console.warn('No se pudo eliminar archivo temporal:', error)
      }

      return res.status(200).json(result)

    } catch (error) {
      console.error('Error en importación:', error)
      return res.status(500).json({
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  if (req.method === 'GET') {
    try {
      // Obtener estadísticas de importación
      const importer = new ServerExcelImporter()
      const stats = await importer.getImportStats()
      
      return res.status(200).json(stats)
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return res.status(500).json({
        message: 'Error obteniendo estadísticas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  return res.status(405).json({ message: 'Método no permitido' })
}

// Endpoint para validar archivo sin importar
export async function validateFile(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
      uploadDir: '/tmp'
    })

    const [fields, files] = await form.parse(req)
    
    const uploadedFiles = files.file
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'No se encontró archivo en la request' })
    }

    const file = uploadedFiles[0]
    
    if (!file.mimetype?.includes('excel') && !file.originalFilename?.endsWith('.xlsx')) {
      return res.status(400).json({ message: 'El archivo debe ser un Excel (.xlsx)' })
    }

    const fileBuffer = fs.readFileSync(file.filepath)
    const fileBlob = new File([fileBuffer], file.originalFilename || 'validate.xlsx', {
      type: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const validation = await ServerExcelImporter.validateFileStructure(fileBlob)

    // Limpiar archivo temporal
    try {
      fs.unlinkSync(file.filepath)
    } catch (error) {
      console.warn('No se pudo eliminar archivo temporal:', error)
    }

    return res.status(200).json(validation)

  } catch (error) {
    console.error('Error validando archivo:', error)
    return res.status(500).json({
      message: 'Error validando archivo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}