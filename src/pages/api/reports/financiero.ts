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
    console.log('=== API FINANCIERO (DATOS REALES) ===');
    
    const { fechaInicio, fechaFin } = req.query;
    
    console.log('Parámetros recibidos:', { fechaInicio, fechaFin });

    // Consultar casos del período - Si no hay filtros de fecha, traer TODOS los casos
    const whereClause: any = {};
    
    if (fechaInicio || fechaFin) {
      whereClause.fechaInicioCaso = {};
      if (fechaInicio) whereClause.fechaInicioCaso.gte = new Date(fechaInicio as string);
      if (fechaFin) whereClause.fechaInicioCaso.lte = new Date(fechaFin as string);
      console.log('Filtrando por fechas:', whereClause.fechaInicioCaso);
    } else {
      console.log('Sin filtros de fecha - trayendo TODOS los casos');
    }

    const casos = await prisma.caso.findMany({
      where: whereClause,
      include: {
        corresponsal: true
      }
    });

    // Calcular estadísticas generales
    const totalCasos = casos.length;
    const casosFacturados = casos.filter(c => c.tieneFactura).length;
    const porcentajeFacturado = totalCasos > 0 ? (casosFacturados / totalCasos) * 100 : 0;
    
    const montoTotalUSD = casos.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0);
    const montoTotalPesos = casos.reduce((sum, caso) => sum + Number(caso.costoMonedaLocal || 0), 0);
    const feeTotalUSD = casos.reduce((sum, caso) => sum + Number(caso.fee || 0), 0);

    // Análisis por moneda
    const casosUSD = casos.filter(c => c.simboloMoneda === 'USD' || (c.costoUsd !== null && Number(c.costoUsd) > 0));
    const casosPESOS = casos.filter(c => c.simboloMoneda === 'ARS' || c.simboloMoneda === 'PESOS' || (c.costoMonedaLocal !== null && Number(c.costoMonedaLocal) > 0 && c.simboloMoneda !== 'USD'));
    
    const analisisUSD = {
      totalCasos: casosUSD.length,
      montoTotal: casosUSD.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0),
      montoPromedio: casosUSD.length > 0 ? casosUSD.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0) / casosUSD.length : 0,
      feeTotal: casosUSD.reduce((sum, caso) => sum + Number(caso.fee || 0), 0),
      feePromedio: casosUSD.filter(c => c.fee && Number(c.fee) > 0).length > 0 ? 
        casosUSD.reduce((sum, caso) => sum + Number(caso.fee || 0), 0) / casosUSD.filter(c => c.fee && Number(c.fee) > 0).length : 0,
      casosFacturados: casosUSD.filter(c => c.tieneFactura).length,
      montoFacturado: casosUSD.filter(c => c.tieneFactura).reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0)
    };

    const analisisPESOS = {
      totalCasos: casosPESOS.length,
      montoTotal: casosPESOS.reduce((sum, caso) => sum + Number(caso.costoMonedaLocal || 0), 0),
      montoPromedio: casosPESOS.length > 0 ? casosPESOS.reduce((sum, caso) => sum + Number(caso.costoMonedaLocal || 0), 0) / casosPESOS.length : 0,
      feeTotal: 0, // Asumiendo que fees son en USD
      feePromedio: 0,
      casosFacturados: casosPESOS.filter(c => c.tieneFactura).length,
      montoFacturado: casosPESOS.filter(c => c.tieneFactura).reduce((sum, caso) => sum + Number(caso.costoMonedaLocal || 0), 0)
    };

    // Análisis por tipo de servicio (estadoInterno)
    const analisisPorTipoServicio = Object.values(
      casos.reduce((acc, caso) => {
        const estado = caso.estadoInterno;
        if (!acc[estado]) {
          acc[estado] = {
            estadoInterno: estado,
            totalCasos: 0,
            casosFacturados: 0,
            montoTotalUSD: 0,
            montoTotalPesos: 0,
            feeTotalUSD: 0
          };
        }
        acc[estado].totalCasos++;
        if (caso.tieneFactura) acc[estado].casosFacturados++;
        acc[estado].montoTotalUSD += Number(caso.costoUsd || 0);
        acc[estado].montoTotalPesos += Number(caso.costoMonedaLocal || 0);
        acc[estado].feeTotalUSD += Number(caso.fee || 0);
        return acc;
      }, {} as Record<string, any>)
    ).map(servicio => ({
      ...servicio,
      porcentajeFacturado: servicio.totalCasos > 0 ? (servicio.casosFacturados / servicio.totalCasos) * 100 : 0,
      montoPromedioUSD: servicio.totalCasos > 0 ? servicio.montoTotalUSD / servicio.totalCasos : 0
    }));

    // Análisis temporal por mes
    const analisisTemporal = Array.from({ length: 6 }, (_, i) => {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - (5 - i));
      const mesInicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const mesFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
      
      const casosDelMes = casos.filter(caso => 
        caso.fechaInicioCaso >= mesInicio && caso.fechaInicioCaso <= mesFin
      );
      
      return {
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        totalCasos: casosDelMes.length,
        casosFacturados: casosDelMes.filter(c => c.tieneFactura).length,
        montoTotalUSD: casosDelMes.reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0),
        feeTotalUSD: casosDelMes.reduce((sum, caso) => sum + Number(caso.fee || 0), 0),
        montoFacturadoUSD: casosDelMes.filter(c => c.tieneFactura).reduce((sum, caso) => sum + Number(caso.costoUsd || 0), 0),
        feeFacturadoUSD: casosDelMes.filter(c => c.tieneFactura).reduce((sum, caso) => sum + Number(caso.fee || 0), 0)
      };
    });

    // Top corresponsales
    console.log('\n=== AGREGANDO DATOS POR CORRESPONSAL ===');
    const corresponsalesStats = casos.reduce((acc, caso) => {
      // Saltar casos sin corresponsal
      if (!caso.corresponsal || !caso.corresponsalId) return acc;
      
      const corrId = caso.corresponsalId;
      if (!acc[corrId]) {
        acc[corrId] = {
          corresponsalId: caso.corresponsalId,
          corresponsal: {
            nombre: caso.corresponsal.nombreCorresponsal || 'Sin nombre',
            ubicacion: caso.corresponsal.pais || 'Sin país'
          },
          totalCasos: 0,
          montoTotalUSD: 0,
          montoTotalPesos: 0,
          feeTotalUSD: 0,
          feeTotalPesos: 0
        };
      }
      
      const costoUsdNum = Number(caso.costoUsd || 0);
      const costoLocalNum = Number(caso.costoMonedaLocal || 0);
      const feeNum = Number(caso.fee || 0);
      
      // Log solo los primeros casos para ver los valores
      if (acc[corrId].totalCasos < 2) {
        console.log(`Caso ID ${caso.id} - ${caso.corresponsal.nombreCorresponsal}:`);
        console.log(`  costoUsd: ${caso.costoUsd} -> ${costoUsdNum}`);
        console.log(`  costoMonedaLocal: ${caso.costoMonedaLocal} -> ${costoLocalNum}`);
        console.log(`  fee: ${caso.fee} -> ${feeNum}`);
      }
      
      acc[corrId].totalCasos++;
      acc[corrId].montoTotalUSD += costoUsdNum;
      acc[corrId].montoTotalPesos += costoLocalNum;
      acc[corrId].feeTotalUSD += feeNum;
      return acc;
    }, {} as Record<number, any>);

    const topCorresponsales = Object.values(corresponsalesStats)
      .filter((c: any) => c.corresponsal && c.corresponsal.nombre)
      .sort((a: any, b: any) => b.montoTotalUSD - a.montoTotalUSD)
      .slice(0, 10);

    // Estadísticas de rentabilidad
    const casosRentables = casos.filter(caso => Number(caso.fee || 0) > 0).length;
    const porcentajeRentabilidad = totalCasos > 0 ? (casosRentables / totalCasos) * 100 : 0;
    const margenFeeUSD = montoTotalUSD > 0 ? (feeTotalUSD / montoTotalUSD) * 100 : 0;

    const data = {
      resumenGeneral: {
        totalCasos,
        porcentajeFacturado,
        montoTotalUSD,
        montoTotalPesos,
        feeTotalUSD
      },
      analisisMonedas: {
        USD: analisisUSD,
        PESOS: analisisPESOS
      },
      analisisPorTipoServicio,
      analisisTemporal,
      estadisticasRentabilidad: {
        margenFee: {
          USD: margenFeeUSD,
          PESOS: 0 // Asumiendo que fees son en USD
        },
        casosRentables,
        porcentajeRentabilidad,
        totalFees: {
          USD: feeTotalUSD,
          PESOS: 0
        }
      },
      topCorresponsales,
      fechaGeneracion: new Date().toISOString()
    };

    console.log('Datos financieros REALES generados exitosamente');
    console.log('Total casos analizados:', totalCasos);
    console.log('Monto total USD:', montoTotalUSD);
    console.log('Top corresponsales encontrados:', topCorresponsales.length);
    if (topCorresponsales.length > 0) {
      console.log('Primer corresponsal:', {
        nombre: topCorresponsales[0].corresponsal.nombre,
        casos: topCorresponsales[0].totalCasos,
        montoUSD: topCorresponsales[0].montoTotalUSD,
        feeUSD: topCorresponsales[0].feeTotalUSD
      });
    }

    res.status(200).json({
      success: true,
      data,
      message: 'Datos financieros REALES'
    });

  } catch (error) {
    console.error('Error en API financiero:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}