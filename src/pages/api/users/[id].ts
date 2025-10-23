import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserFormData } from '@/types'

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

    // Verificar que el usuario tenga permisos de administrador o sea el mismo usuario
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true }
    })

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.id !== id)) {
      return res.status(403).json({ error: 'Permisos insuficientes' })
    }

    switch (req.method) {
      case 'GET':
        return await getUser(req, res, id)
      case 'PUT':
        return await updateUser(req, res, id, currentUser.role === 'ADMIN')
      case 'DELETE':
        return await deleteUser(req, res, id, currentUser.id)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Método ${req.method} no permitido` })
    }
  } catch (error) {
    console.error('Error en API usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function getUser(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

async function updateUser(req: NextApiRequest, res: NextApiResponse, id: string, isAdmin: boolean) {
  try {
    const { name, email, password, role, status }: UserFormData = req.body

    // Validaciones básicas
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' })
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con este email' })
    }

    // Preparar datos para actualizar
    const updateData: any = {
      name,
      email
    }

    // Solo administradores pueden cambiar rol y estado
    if (isAdmin) {
      if (role) updateData.role = role
      if (status) updateData.status = status
    }

    // Si se proporciona nueva contraseña, encriptarla
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return res.status(500).json({ error: 'Error al actualizar usuario' })
  }
}

async function deleteUser(req: NextApiRequest, res: NextApiResponse, id: string, currentUserId: string) {
  try {
    // No permitir auto-eliminación
    if (id === currentUserId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Eliminar usuario (esto también eliminará sessions y accounts por cascade)
    await prisma.user.delete({
      where: { id }
    })

    return res.status(200).json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return res.status(500).json({ error: 'Error al eliminar usuario' })
  }
}
