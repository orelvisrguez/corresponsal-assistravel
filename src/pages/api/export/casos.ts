import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CasoConCorresponsal } from '@/types';
import { generateHTMLReport, prepareDataForExport, convertToCSV } from '@/lib/exportUtils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { type, format, filters, dateRange } = req.body;

    // Obtener datos de casos con filtros aplicados
    let query = prisma.caso.findMany({
      include: {
        corresponsal: true
      }
    });

    // Aplicar filtros de fecha si se proporcionan
    if (dateRange?.start && dateRange?.end) {
      query = prisma.caso.findMany({
        where: {
          fechaInicioCaso: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end)
          }
        },
        include: {
          corresponsal: true
        }
      });
    }

    const casos = await query;

    if (!casos || casos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron casos para exportar' });
    }

    // Preparar datos para exportación
    const exportData = prepareDataForExport(casos as CasoConCorresponsal[]);

    if (format === 'csv') {
      // Generar CSV
      const headers = Object.keys(exportData[0] || {});
      const csv = convertToCSV(exportData, headers);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="casos_export_${timestamp}.csv"`);
      
      return res.status(200).send(csv);
    }

    if (format === 'json') {
      // Retornar JSON
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        data: exportData,
        metadata: {
          totalRecords: exportData.length,
          exportDate: new Date().toISOString(),
          filters: filters || {},
          dateRange: dateRange || null
        }
      });
    }

    // Generar reporte HTML (por defecto)
    const title = `Reporte de Casos${dateRange ? ` (${new Date(dateRange.start).toLocaleDateString('es-ES')} - ${new Date(dateRange.end).toLocaleDateString('es-ES')})` : ''}`;
    const htmlContent = generateHTMLReport(casos as CasoConCorresponsal[], title);

    // Convertir HTML a PDF usando Puppeteer (implementación futura)
    // Por ahora retornamos el HTML
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_casos_${timestamp}.html"`);
    
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Error exportando datos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// Endpoint adicional para obtener estadísticas de exportación
export async function getExportStats(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Obtener estadísticas generales
    const casos = await prisma.caso.findMany({
      include: {
        corresponsal: true
      }
    });

    const totalCasos = casos?.length || 0;
    const casosCerrados = casos?.filter(c => c.estadoInterno === 'CERRADO').length || 0;
    const totalFee = casos?.reduce((sum, c) => sum + (Number(c.fee) || 0), 0) || 0;
    const totalCostoUsd = casos?.reduce((sum, c) => sum + (Number(c.costoUsd) || 0), 0) || 0;
    const totalCompleto = casos?.reduce((sum, c) => sum + (Number(c.fee) || 0) + (Number(c.costoUsd) || 0) + (Number(c.montoAgregado) || 0), 0) || 0;

    res.status(200).json({
      totalCasos,
      casosCerrados,
      totalFee,
      totalCostoUsd,
      totalCompleto,
      fechaActualizacion: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}