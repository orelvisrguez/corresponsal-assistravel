import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { casoSchema } from '@/lib/validations'
import { registrarCambio, registrarCambiosMultiples } from '@/lib/caso-historial'
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
        
        // Obtener caso actual antes de actualizar
        const casoAnterior = await prisma.caso.findUnique({
          where: { id: casoId }
        })
        
        if (!casoAnterior) {
          return res.status(404).json({ message: 'Caso no encontrado' })
        }
        
        // Crear fecha local (evitar problemas de timezone UTC)
        const fechaInicioCasoDate = createSafeDate(data.fechaInicioCaso)
        
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
        
        // Registrar cambios en el historial
        const datosNuevos = {
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
          fechaEmisionFactura: data.fechaEmisionFactura ? createSafeDate(data.fechaEmisionFactura) : null,
          fechaVencimientoFactura: data.fechaVencimientoFactura ? createSafeDate(data.fechaVencimientoFactura) : null,
          fechaPagoFactura: data.fechaPagoFactura ? createSafeDate(data.fechaPagoFactura) : null,
          estadoInterno: data.estadoInterno,
          estadoDelCaso: data.estadoDelCaso,
          observaciones: data.observaciones || null
        }
        
        await registrarCambiosMultiples(
          casoId,
          session.user.email || 'sistema',
          session.user.name || undefined,
          casoAnterior,
          datosNuevos
        )
        
        return res.status(200).json(casoActualizado)

      case 'DELETE':
        // Obtener caso antes de eliminar para el historial
        const casoAEliminar = await prisma.caso.findUnique({
          where: { id: casoId }
        })
        
        if (!casoAEliminar) {
          return res.status(404).json({ message: 'Caso no encontrado' })
        }
        
        // Registrar eliminación en el historial
        await registrarCambio({
          casoId,
          usuarioEmail: session.user.email || 'sistema',
          usuarioNombre: session.user.name || undefined,
          accion: AccionHistorial.ELIMINACION
        })
        
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