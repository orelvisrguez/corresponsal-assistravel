import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { corresponsalSchema } from '@/lib/validations'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  const { id } = req.query
  const corresponsalId = parseInt(id as string)

  if (isNaN(corresponsalId)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {
    switch (req.method) {
      case 'GET':
        const corresponsal = await prisma.corresponsal.findUnique({
          where: { id: corresponsalId },
          include: {
            casos: true
          }
        })
        
        if (!corresponsal) {
          return res.status(404).json({ message: 'Corresponsal no encontrado' })
        }
        
        return res.status(200).json(corresponsal)

      case 'PUT':
        const data = corresponsalSchema.parse(req.body)
        const corresponsalActualizado = await prisma.corresponsal.update({
          where: { id: corresponsalId },
          data: {
            nombreCorresponsal: data.nombreCorresponsal,
            nombreContacto: data.nombreContacto || null,
            nroTelefono: data.nroTelefono || null,
            email: data.email || null,
            web: data.web || null,
            direccion: data.direccion || null,
            pais: data.pais
          }
        })
        return res.status(200).json(corresponsalActualizado)

      case 'DELETE':
        // Verificar si tiene casos asociados
        const casosAsociados = await prisma.caso.count({
          where: { corresponsalId }
        })
        
        if (casosAsociados > 0) {
          return res.status(400).json({ 
            message: `No se puede eliminar el corresponsal porque tiene ${casosAsociados} casos asociados` 
          })
        }
        
        await prisma.corresponsal.delete({
          where: { id: corresponsalId }
        })
        
        return res.status(200).json({ message: 'Corresponsal eliminado' })

      default:
        return res.status(405).json({ message: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error en /api/corresponsales/[id]:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}