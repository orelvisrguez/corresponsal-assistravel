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
    console.log('=== API CORRESPONSALES (DATOS REALES) ===');
    
    const { fechaInicio, fechaFin } = req.query;
    
    const startDate = fechaInicio ? new Date(fechaInicio as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = fechaFin ? new Date(fechaFin as string) : new Date();
    
    console.log('Consultando datos reales para periodo:', { fechaInicio, fechaFin });

    // Consultar corresponsales con sus casos
    const corresponsales = await prisma.corresponsal.findMany({
      include: {
        casos: {
          where: {
            fechaInicioCaso: {
              gte: startDate,
              lte: endDate
            }
          }
        },
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
      },
      orderBy: {
        nombreCorresponsal: 'asc'
      }
    });

    // Calcular estadísticas generales
    const totalCorresponsales = corresponsales.length;
    const corresponsalesActivos = corresponsales.filter(c => c._count.casos > 0).length;
    const totalCasos = corresponsales.reduce((sum, c) => sum + c._count.casos, 0);
    const totalFee = corresponsales.reduce((sum, c) => 
      sum + c.casos.reduce((feeSum, caso) => feeSum + Number(caso.fee || 0), 0), 0
    );

    // Generar reporte por corresponsal
    const reporte = corresponsales
      .filter(c => c._count.casos > 0)
      .map(corresponsal => {
        const casosDelCorresponsal = corresponsal.casos;
        const totalCasos = casosDelCorresponsal.length;
        const casosAbiertos = casosDelCorresponsal.filter(c => c.estadoInterno === 'ABIERTO').length;
        const casosCerrados = casosDelCorresponsal.filter(c => c.estadoInterno === 'CERRADO').length;
        const casosPausados = casosDelCorresponsal.filter(c => c.estadoInterno === 'PAUSADO').length;
        const casosCancelados = casosDelCorresponsal.filter(c => c.estadoInterno === 'CANCELADO').length;
        const casosFacturados = casosDelCorresponsal.filter(c => c.tieneFactura).length;
        const porcentajeFacturado = totalCasos > 0 ? (casosFacturados / totalCasos) * 100 : 0;
        
        const totalMontoUSD = casosDelCorresponsal.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0);
        const totalFeeUSD = casosDelCorresponsal.reduce((sum, caso) => sum + Number(caso.fee || 0), 0);
        const casosConFee = casosDelCorresponsal.filter(c => c.fee && Number(c.fee) > 0).length;
        const promedioFee = casosConFee > 0 ? totalFeeUSD / casosConFee : 0;

        return {
          corresponsal: {
            id: corresponsal.id,
            nombre: corresponsal.nombreCorresponsal,
            ubicacion: corresponsal.pais,
            telefono: corresponsal.nroTelefono,
            email: corresponsal.email
          },
          estadisticas: {
            totalCasos,
            casosFacturados,
            porcentajeFacturado: Number(porcentajeFacturado.toFixed(2)),
            totalMontoUSD,
            abiertos: casosAbiertos,
            cerrados: casosCerrados,
            pausados: casosPausados,
            cancelados: casosCancelados,
            fee: {
              casosConFee,
              totalFee: totalFeeUSD,
              promedioFee
            }
          },
          casosRecientes: casosDelCorresponsal
            .slice(0, 5)
            .map(caso => ({
              numeroReferencia: caso.nroCasoAssistravel,
              estadoInterno: caso.estadoInterno,
              estadoDelCaso: caso.estadoDelCaso,
              costoUSD: Number(caso.costoUsd || 0),
              fee: Number(caso.fee || 0),
              fechaCreacion: caso.fechaInicioCaso
            }))
        };
      })
      .sort((a, b) => b.estadisticas.totalCasos - a.estadisticas.totalCasos);

    // Distribución geográfica
    const distribucionPorPais = corresponsales.reduce((acc, corresponsal) => {
      const pais = corresponsal.pais;
      if (!acc[pais]) {
        acc[pais] = { corresponsales: 0, casos: 0 };
      }
      acc[pais].corresponsales++;
      acc[pais].casos += corresponsal._count.casos;
      return acc;
    }, {} as Record<string, { corresponsales: number; casos: number }>);

    const totalCasosParaPorcentaje = Object.values(distribucionPorPais).reduce((sum, item) => sum + item.casos, 0);

    const data = {
      estadisticasGenerales: {
        totalCorresponsales,
        totalCasos,
        totalMontoUSD: corresponsales.reduce((sum, c) => 
          sum + c.casos.reduce((casoSum, caso) => casoSum + Number(caso.costoUsd || 0), 0), 0
        ),
        totalMontoPesos: corresponsales.reduce((sum, c) => 
          sum + c.casos.reduce((casoSum, caso) => casoSum + Number(caso.costoMonedaLocal || 0), 0), 0
        )
      },
      reporte,
      distribucionGeografica: Object.entries(distribucionPorPais).map(([pais, datos]) => ({
        pais,
        corresponsales: datos.corresponsales,
        casos: datos.casos,
        porcentaje: totalCasosParaPorcentaje > 0 ? Number(((datos.casos / totalCasosParaPorcentaje) * 100).toFixed(1)) : 0
      })),
      fechaGeneracion: new Date().toISOString()
    };

    console.log('Datos de corresponsales REALES generados exitosamente');
    console.log('Total corresponsales activos:', corresponsalesActivos);
    console.log('Total casos en periodo:', totalCasos);

    res.status(200).json({
      success: true,
      data,
      message: 'Datos de corresponsales REALES'
    });

  } catch (error) {
    console.error('Error en API de corresponsales:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}