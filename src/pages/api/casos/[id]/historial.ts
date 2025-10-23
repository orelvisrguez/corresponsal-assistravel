import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const { id } = req.query;
    const { fechaInicio, fechaFin, usuario } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'ID de caso requerido' });
    }

    const casoId = parseInt(id as string);

    // Construir filtros
    const where: any = {
      casoId
    };

    if (fechaInicio || fechaFin) {
      where.fechaHora = {};
      if (fechaInicio) {
        where.fechaHora.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        where.fechaHora.lte = new Date(fechaFin as string);
      }
    }

    if (usuario) {
      where.usuarioEmail = {
        contains: usuario as string,
        mode: 'insensitive'
      };
    }

    // Obtener historial
    const historial = await prisma.casoHistorial.findMany({
      where,
      orderBy: {
        fechaHora: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: historial
    });

  } catch (error) {
    console.error('Error al obtener historial del caso:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
