import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { casoSchema } from '@/lib/validations'
import { registrarCambio } from '@/lib/caso-historial'
import { AccionHistorial } from '@prisma/client'
import { createSafeDate } from '@/lib/dateUtils'

import { createSafeDate } from '@/lib/dateUtils'

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
            fechaInicioCaso: createSafeDate(data.fechaInicioCaso),
            pais: data.pais,
            informeMedico: data.informeMedico,
            fee: data.fee || null,
            costoUsd: data.costoUsd || null,
            costoMonedaLocal: data.costoMonedaLocal || null,
            simboloMoneda: data.simboloMoneda || null,
            montoAgregado: data.montoAgregado || null,
            tieneFactura: data.tieneFactura,
            nroFactura: data.nroFactura || null,
            fechaEmisionFactura: data.fechaEmisionFactura ? createSafeDate(data.fechaEmisionFactura) : null,
            fechaVencimientoFactura: data.fechaVencimientoFactura ? createSafeDate(data.fechaVencimientoFactura) : null,
            fechaPagoFactura: data.fechaPagoFactura ? createSafeDate(data.fechaPagoFactura) : null,
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