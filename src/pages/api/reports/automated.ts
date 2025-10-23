import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('=== API REPORTES AUTOMATIZADOS ===');
    console.log('Método:', req.method);

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API de informes automáticos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id, page = '1', limit = '10', tipo } = req.query;

  console.log('GET - Parámetros:', { id, page, limit, tipo });

  // Si hay ID específico, obtener un informe individual
  if (id) {
    try {
      const informe = await prisma.informeAutomatico.findFirst({
        where: {
          id: id as string
        }
      });

      if (!informe) {
        return res.status(404).json({ message: 'Informe no encontrado' });
      }

      return res.status(200).json({
        success: true,
        data: informe
      });
    } catch (error) {
      console.error('Error obteniendo informe individual:', error);
      return res.status(500).json({ message: 'Error al obtener el informe' });
    }
  }

  // Obtener lista de informes con paginación
  try {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (tipo) {
      whereClause.tipo = tipo;
    }

    const [informes, total] = await Promise.all([
      prisma.informeAutomatico.findMany({
        where: whereClause,
        orderBy: {
          fechaGeneracion: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.informeAutomatico.count({
        where: whereClause
      })
    ]);

    console.log('Informes encontrados:', informes.length);

    res.status(200).json({
      success: true,
      data: {
        informes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo lista de informes:', error);
    return res.status(500).json({ message: 'Error al obtener los informes' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  console.log('POST - Datos recibidos:', req.body);

  const {
    titulo,
    tipo,
    fechaInicio,
    fechaFin,
    filtroPersonalizado,
    contenidoMarkdown,
    contenidoTextoPlano,
    datosUtilizados,
    prompt,
    metadatos
  } = req.body;

  // Validaciones
  if (!titulo || !tipo || !fechaInicio || !fechaFin || !contenidoMarkdown) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  const tiposValidos = ['ESTADISTICO_GENERAL', 'FINANCIERO', 'CASOS', 'CORRESPONSAL', 'FACTURACION'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de informe inválido' });
  }

  try {
    console.log('Creando nuevo informe en BD...');

    const nuevoInforme = await prisma.informeAutomatico.create({
      data: {
        titulo,
        tipo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        filtroPersonalizado: filtroPersonalizado || null,
        contenidoMarkdown,
        contenidoTextoPlano: contenidoTextoPlano || contenidoMarkdown,
        datosUtilizados,
        prompt: prompt || '',
        metadatos: metadatos || null,
        creadoPor: null  // Sin relación de usuario para evitar FK constraints
      }
    });

    console.log('Informe creado exitosamente:', nuevoInforme.id);

    res.status(201).json({
      success: true,
      data: nuevoInforme
    });
  } catch (error) {
    console.error('Error creando informe:', error);
    return res.status(500).json({ 
      message: 'Error al guardar el informe',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  console.log('DELETE - ID:', id);

  if (!id) {
    return res.status(400).json({ message: 'ID del informe requerido' });
  }

  try {
    // Verificar que el informe existe
    const informe = await prisma.informeAutomatico.findFirst({
      where: {
        id: id as string
      }
    });

    if (!informe) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    await prisma.informeAutomatico.delete({
      where: {
        id: id as string
      }
    });

    console.log('Informe eliminado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Informe eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando informe:', error);
    return res.status(500).json({ 
      message: 'Error al eliminar el informe',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}