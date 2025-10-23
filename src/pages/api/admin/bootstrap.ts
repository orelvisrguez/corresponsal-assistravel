import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Solo permitir método POST
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: `Método ${req.method} no permitido` })
    }

    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'No autorizado - debe iniciar sesión' })
    }

    // Verificar si ya existe un administrador
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return res.status(403).json({ 
        error: 'Ya existe un administrador en el sistema. Esta función solo está disponible durante la configuración inicial.' 
      })
    }

    // Si no hay administrador, promocionar al usuario actual
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return res.status(200).json({
      message: 'Usuario promocionado a administrador exitosamente',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error en bootstrap admin:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
