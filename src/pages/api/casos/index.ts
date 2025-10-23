import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { casoSchema } from '@/lib/validations'
import { registrarCambio } from '@/lib/caso-historial'
import { AccionHistorial } from '@prisma/client'

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

  try {
    switch (req.method) {
      case 'GET':
        const casos = await prisma.caso.findMany({
          include: {
            corresponsal: true
          },
          orderBy: {
            fechaInicioCaso: 'desc'
          }
        })
        return res.status(200).json(casos)

      case 'POST':
        const data = casoSchema.parse(req.body)
        
        const nuevoCaso = await prisma.caso.create({
          data: {
            corresponsalId: data.corresponsalId,
            nroCasoAssistravel: data.nroCasoAssistravel,
            nroCasoCorresponsal: data.nroCasoCorresponsal || null,
            fechaInicioCaso: createLocalDate(data.fechaInicioCaso),
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
        
        // Registrar creación en el historial
        await registrarCambio({
          casoId: nuevoCaso.id,
          usuarioEmail: session.user.email || 'sistema',
          usuarioNombre: session.user.name || undefined,
          accion: AccionHistorial.CREACION
        })
        
        return res.status(201).json(nuevoCaso)

      default:
        return res.status(405).json({ message: 'Método no permitido' })
    }
  } catch (error) {
    console.error('Error en /api/casos:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}