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
    console.log('=== API RESUMEN DASHBOARD (DATOS REALES) ===');
    
    const { fechaInicio, fechaFin } = req.query;
    
    const startDate = fechaInicio ? new Date(fechaInicio as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = fechaFin ? new Date(fechaFin as string) : new Date();
    
    console.log('Consultando datos reales para dashboard periodo:', { fechaInicio, fechaFin });

    // Consultar casos del período
    const casos = await prisma.caso.findMany({
      where: {
        fechaInicioCaso: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        corresponsal: true
      }
    });

    // Consultar todos los corresponsales activos
    const corresponsales = await prisma.corresponsal.findMany({
      include: {
        _count: {
          select: {
            casos: {
              where: {
                fechaInicioCaso: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    });

    // Calcular métricas generales
    const totalCasos = casos.length;
    const casosAbiertos = casos.filter(c => c.estadoInterno === 'ABIERTO').length;
    const casosCerrados = casos.filter(c => c.estadoInterno === 'CERRADO').length;
    const casosPausados = casos.filter(c => c.estadoInterno === 'PAUSADO').length;
    const casosCancelados = casos.filter(c => c.estadoInterno === 'CANCELADO').length;
    
    const totalCorresponsales = corresponsales.length;
    const corresponsalesActivos = corresponsales.filter(c => c._count.casos > 0).length;
    
    const feeTotalUSD = casos.reduce((sum, caso) => sum + Number(caso.fee || 0), 0);
    const casosConInformeMedico = casos.filter(c => c.informeMedico).length;
    const casosSinInformeMedico = casos.filter(c => !c.informeMedico).length;
    
    const casosFacturados = casos.filter(c => c.tieneFactura);
    const totalFacturadoUSD = casosFacturados.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0);
    const pendienteFacturacion = casos.filter(c => !c.tieneFactura).reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0);

    // Distribución por estado
    const distribucionPorEstado = [
      { estado: 'ABIERTO', cantidad: casosAbiertos },
      { estado: 'CERRADO', cantidad: casosCerrados },
      { estado: 'PAUSADO', cantidad: casosPausados },
      { estado: 'CANCELADO', cantidad: casosCancelados }
    ];

    // Distribución por país
    const distribucionPorPais = Object.entries(
      casos.reduce((acc, caso) => {
        const pais = caso.pais;
        acc[pais] = (acc[pais] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([pais, cantidad]) => ({ pais, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

    // Métricas de corresponsales
    const metrics = {
      totalCasos,
      casosAbiertos,
      casosCerrados,
      casosPausados,
      totalCorresponsales: corresponsalesActivos, // Solo los que tienen casos en el período
      feeTotalGenerado: feeTotalUSD
    };

    // Top corresponsales del período
    const corresponsalesConCasos = corresponsales
      .filter(c => c._count.casos > 0)
      .map(corresponsal => {
        const casosDelCorresponsal = casos.filter(c => c.corresponsalId === corresponsal.id);
        const casosActivos = casosDelCorresponsal.filter(c => c.estadoInterno === 'ABIERTO').length;
        const feeGenerado = casosDelCorresponsal.reduce((sum, caso) => sum + Number(caso.fee || 0), 0);
        
        return {
          id: corresponsal.id,
          nombreCorresponsal: corresponsal.nombreCorresponsal,
          totalCasos: casosDelCorresponsal.length,
          casosActivos,
          feeGenerado,
          pais: corresponsal.pais
        };
      })
      .sort((a, b) => b.totalCasos - a.totalCasos)
      .slice(0, 10); // Top 10

    const data = {
      metrics,
      distribucionPorEstado,
      distribucionPorPais,
      corresponsales: corresponsalesConCasos,
      resumenGeneral: {
        totalCasos,
        casosAbiertos,
        casosCerrados,
        casosPausados,
        casosCancelados,
        totalCorresponsales,
        corresponsalesActivos,
        feeTotalUSD,
        feeTotalPesos: 0, // Los fees generalmente son en USD
        casosConInformeMedico,
        casosSinInformeMedico,
        totalFacturado: totalFacturadoUSD,
        pendienteFacturacion
      },
      fechaGeneracion: new Date().toISOString()
    };

    console.log('Datos de dashboard REALES generados exitosamente');
    console.log('Total casos período:', totalCasos);
    console.log('Corresponsales activos:', corresponsalesActivos);

    res.status(200).json({
      success: true,
      data,
      message: 'Datos de dashboard REALES'
    });

  } catch (error) {
    console.error('Error en API de resumen dashboard:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}