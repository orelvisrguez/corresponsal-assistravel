import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { FiltroPeriodo } from '@/lib/dashboardUtils'

function calcularFiltroFechas(periodo: FiltroPeriodo) {
    const ahora = new Date()
    const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    let fechaInicio: Date
    let fechaFin: Date = fechaActual

    switch (periodo) {
        case 'actual':
            fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
            break
        case 'tres_meses':
            fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 2, 1)
            break
        case 'semestral':
            fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 5, 1)
            break
        case 'anual':
            fechaInicio = new Date(fechaActual.getFullYear() - 1, 0, 1)
            break
        case 'todo':
            fechaInicio = new Date(2020, 0, 1)
            break
        default:
            fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
    }

    return { fechaInicio, fechaFin }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const { periodo = 'actual' } = req.query
        const { fechaInicio, fechaFin } = calcularFiltroFechas(periodo as FiltroPeriodo)

        // Base where clause for filtering by date
        const whereClause = {
            fechaInicioCaso: {
                gte: fechaInicio,
                lte: fechaFin
            }
        }

        // Execute parallel queries for better performance
        const [
            totalCasos,
            totalCorresponsales,
            estadosInternos,
            estadosCaso,
            financiero,
            topCorresponsalesRaw,
            topMonedasRaw,
            casosRecientes
        ] = await Promise.all([
            // 1. Total Casos
            prisma.caso.count({ where: whereClause }),

            // 2. Total Corresponsales (Unique)
            prisma.caso.groupBy({
                by: ['corresponsalId'],
                where: whereClause,
            }).then(res => res.length),

            // 3. Group by Estado Interno
            prisma.caso.groupBy({
                by: ['estadoInterno'],
                where: whereClause,
                _count: true,
            }),

            // 4. Group by Estado Caso
            prisma.caso.groupBy({
                by: ['estadoDelCaso'],
                where: whereClause,
                _count: true,
            }),

            // 5. Financial Aggregates
            prisma.caso.aggregate({
                where: whereClause,
                _sum: {
                    costoUsd: true,
                },
                _count: {
                    tieneFactura: true, // This counts non-null values, but tieneFactura is boolean. We need filtering.
                }
            }),

            // 6. Top Corresponsales
            prisma.caso.groupBy({
                by: ['corresponsalId'],
                where: {
                    ...whereClause,
                    costoUsd: { gt: 0 }
                },
                _sum: {
                    costoUsd: true,
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _sum: {
                        costoUsd: 'desc'
                    }
                },
                take: 3
            }),

            // 7. Top Monedas
            prisma.caso.groupBy({
                by: ['simboloMoneda'],
                where: {
                    ...whereClause,
                    simboloMoneda: { not: null },
                    costoMonedaLocal: { gt: 0 }
                },
                _sum: {
                    costoMonedaLocal: true
                },
                _count: {
                    id: true
                },
                orderBy: {
                    _sum: {
                        costoMonedaLocal: 'desc'
                    }
                },
                take: 4
            }),

            // 8. Recent Casos
            prisma.caso.findMany({
                where: whereClause,
                orderBy: {
                    fechaInicioCaso: 'desc'
                },
                take: 5,
                include: {
                    corresponsal: {
                        select: {
                            nombreCorresponsal: true
                        }
                    }
                }
            })
        ])

        // Additional queries for specific counts that groupBy can't handle easily in one go
        // or require specific filtering
        const [casosConFactura, casosCobrados, casosParaRefacturar, casosSinFee, ingresosPendientes] = await Promise.all([
            prisma.caso.count({ where: { ...whereClause, tieneFactura: true } }),
            prisma.caso.count({ where: { ...whereClause, estadoDelCaso: 'COBRADO' } }),
            prisma.caso.count({ where: { ...whereClause, estadoDelCaso: 'PARA_REFACTURAR' } }),
            prisma.caso.count({ where: { ...whereClause, estadoDelCaso: 'NO_FEE' } }),
            prisma.caso.aggregate({
                where: {
                    ...whereClause,
                    tieneFactura: true,
                    estadoDelCaso: { not: 'COBRADO' }
                },
                _sum: {
                    costoUsd: true
                }
            })
        ])

        // Process Top Corresponsales to get names
        const topCorresponsales = await Promise.all(topCorresponsalesRaw.map(async (item) => {
            const corresponsal = await prisma.corresponsal.findUnique({
                where: { id: item.corresponsalId },
                select: { nombreCorresponsal: true }
            })
            return {
                nombre: corresponsal?.nombreCorresponsal || 'Desconocido',
                ingresos: item._sum.costoUsd || 0,
                casos: item._count.id
            }
        }))

        // Process Top Monedas
        const topMonedas = topMonedasRaw.map(item => ({
            moneda: item.simboloMoneda,
            total: item._sum.costoMonedaLocal || 0,
            count: item._count.id
        }))

        // Process Estados Internos
        const estadosInternosMap = estadosInternos.reduce((acc, curr) => {
            acc[curr.estadoInterno] = curr._count
            return acc
        }, {} as Record<string, number>)

        // Process Estados Caso
        const estadosCasoMap = estadosCaso.reduce((acc, curr) => {
            acc[curr.estadoDelCaso] = curr._count
            return acc
        }, {} as Record<string, number>)

        const response = {
            totalCasos,
            totalCorresponsales,
            casosAbiertos: estadosInternosMap['ABIERTO'] || 0,
            casosCerrados: estadosInternosMap['CERRADO'] || 0,
            casosPausados: estadosInternosMap['PAUSADO'] || 0,
            casosCancelados: estadosInternosMap['CANCELADO'] || 0,
            totalIngresosUSD: financiero._sum.costoUsd || 0,
            casosConFactura,
            casosCobrados,
            casosParaRefacturar,
            casosSinFee,
            casosEnProgreso: estadosCasoMap['ON_GOING'] || 0,
            ingresosPendientes: ingresosPendientes._sum.costoUsd || 0,
            topCorresponsales,
            topMonedas,
            casosRecientes
        }

        res.status(200).json(response)
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        res.status(500).json({ message: 'Error calculating stats' })
    }
}
