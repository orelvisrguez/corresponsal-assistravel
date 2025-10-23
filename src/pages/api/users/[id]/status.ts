import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserStatus } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de usuario requerido' })
    }

    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    // Verificar que el usuario tenga permisos de administrador
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permisos insuficientes' })
    }

    // No permitir cambiar el estado de uno mismo
    if (currentUser.id === id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio estado' })
    }

    if (req.method !== 'PUT') {
      res.setHeader('Allow', ['PUT'])
      return res.status(405).json({ error: `Método ${req.method} no permitido` })
    }

    const { status }: { status: UserStatus } = req.body

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Estado válido requerido (ACTIVE, INACTIVE, SUSPENDED)' })
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Actualizar estado
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    })

    // Si se suspende o desactiva, eliminar todas las sesiones activas
    if (status === 'SUSPENDED' || status === 'INACTIVE') {
      await prisma.session.deleteMany({
        where: { userId: id }
      })
    }

    return res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error)
    return res.status(500).json({ error: 'Error al cambiar estado del usuario' })
  }
}
