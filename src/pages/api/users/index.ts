import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserFormData } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificar autenticación
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    // Verificar que el usuario tenga permisos de administrador
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permisos insuficientes' })
    }

    switch (req.method) {
      case 'GET':
        return await getUsers(req, res)
      case 'POST':
        return await createUser(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Método ${req.method} no permitido` })
    }
  } catch (error) {
    console.error('Error en API usuarios:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, role, status } = req.query

    const where: any = {}

    // Filtrar por búsqueda de texto
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtrar por rol
    if (role && typeof role === 'string' && role !== 'all') {
      where.role = role
    }

    // Filtrar por estado
    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status
    }

    const users = await prisma.user.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json(users)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

async function createUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, email, password, role, status }: UserFormData = req.body

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' })
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con este email' })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
        status: status || 'ACTIVE'
      },
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

    return res.status(201).json(newUser)
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return res.status(500).json({ error: 'Error al crear usuario' })
  }
}
