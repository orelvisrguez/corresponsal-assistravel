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

  try {
    switch (req.method) {
      case 'GET':
        const corresponsales = await prisma.corresponsal.findMany({
          include: {
            casos: true
          },
          orderBy: {
            nombreCorresponsal: 'asc'
          }
        })
        return res.status(200).json(corresponsales)

      case 'POST':
        const data = corresponsalSchema.parse(req.body)
        const nuevoCorresponsal = await prisma.corresponsal.create({
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
        return res.status(201).json(nuevoCorresponsal)

      default:
        return res.status(405).json({ message: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error en /api/corresponsales:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}