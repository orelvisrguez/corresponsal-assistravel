import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { casoSchema } from '@/lib/validations'

// Helper function to create local dates (avoid UTC timezone issues)
function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque los meses en JS van de 0 a 11
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  const { id } = req.query
  const casoId = parseInt(id as string)

  if (isNaN(casoId)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  try {
    switch (req.method) {
      case 'GET':
        const caso = await prisma.caso.findUnique({
          where: { id: casoId },
          include: {
            corresponsal: true
          }
        })
        
        if (!caso) {
          return res.status(404).json({ message: 'Caso no encontrado' })
        }
        
        return res.status(200).json(caso)

      case 'PUT':
        const data = casoSchema.parse(req.body)
        
        // Crear fecha local (evitar problemas de timezone UTC)
        const fechaInicioCasoDate = createLocalDate(data.fechaInicioCaso)
        
        const casoActualizado = await prisma.caso.update({
          where: { id: casoId },
          data: {
            corresponsalId: data.corresponsalId,
            nroCasoAssistravel: data.nroCasoAssistravel,
            nroCasoCorresponsal: data.nroCasoCorresponsal || null,
            fechaInicioCaso: fechaInicioCasoDate,
            pais: data.pais,
            informeMedico: data.informeMedico,
            fee: data.fee || null,
            costoUsd: data.costoUsd || null,
            costoMonedaLocal: data.costoMonedaLocal || null,
            simboloMoneda: data.simboloMoneda || null,
            montoAgregado: data.montoAgregado || null,
            tieneFactura: data.tieneFactura,
            nroFactura: data.nroFactura || null,
            fechaEmisionFactura: data.fechaEmisionFactura ? createLocalDate(data.fechaEmisionFactura) : null,
            fechaVencimientoFactura: data.fechaVencimientoFactura ? createLocalDate(data.fechaVencimientoFactura) : null,
            fechaPagoFactura: data.fechaPagoFactura ? createLocalDate(data.fechaPagoFactura) : null,
            estadoInterno: data.estadoInterno,
            estadoDelCaso: data.estadoDelCaso,
            observaciones: data.observaciones || null
          },
          include: {
            corresponsal: true
          }
        })
        
        return res.status(200).json(casoActualizado)

      case 'DELETE':
        await prisma.caso.delete({
          where: { id: casoId }
        })
        
        return res.status(200).json({ message: 'Caso eliminado' })

      default:
        return res.status(405).json({ message: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error en /api/casos/[id]:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}