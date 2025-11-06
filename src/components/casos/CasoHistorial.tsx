'use client'

import { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  UserIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { obtenerNombreCampo, formatearValor } from '@/lib/caso-historial'

interface HistorialEntry {
  id: number
  casoId: number
  usuarioEmail: string
  usuarioNombre: string | null
  accion: 'CREACION' | 'EDICION' | 'ELIMINACION' | 'CAMBIO_ESTADO'
  campoModificado: string | null
  valorAnterior: string | null
  valorNuevo: string | null
  fechaHora: string
}

interface CasoHistorialProps {
  casoId: number
  compact?: boolean // Modo compacto para mostrar dentro del detalle del caso
}

export default function CasoHistorial({ casoId, compact = false }: CasoHistorialProps) {
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const fetchHistorial = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filtroFechaInicio) params.append('fechaInicio', filtroFechaInicio)
      if (filtroFechaFin) params.append('fechaFin', filtroFechaFin)
      if (filtroUsuario) params.append('usuario', filtroUsuario)
      
      const response = await fetch(`/api/casos/${casoId}/historial?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar historial')
      
      const result = await response.json()
      setHistorial(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistorial()
  }, [casoId])

  const handleAplicarFiltros = () => {
    fetchHistorial()
  }

  const handleLimpiarFiltros = () => {
    setFiltroUsuario('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setTimeout(() => fetchHistorial(), 100)
  }

  const getIconoAccion = (accion: string) => {
    switch (accion) {
      case 'CREACION':
        return <PlusCircleIcon className="h-5 w-5 text-green-600" />
      case 'EDICION':
        return <PencilSquareIcon className="h-5 w-5 text-blue-600" />
      case 'ELIMINACION':
        return <TrashIcon className="h-5 w-5 text-red-600" />
      case 'CAMBIO_ESTADO':
        return <ArrowPathIcon className="h-5 w-5 text-purple-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getColorAccion = (accion: string) => {
    switch (accion) {
      case 'CREACION':
        return 'bg-green-50 border-green-200'
      case 'EDICION':
        return 'bg-blue-50 border-blue-200'
      case 'ELIMINACION':
        return 'bg-red-50 border-red-200'
      case 'CAMBIO_ESTADO':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextoAccion = (accion: string) => {
    switch (accion) {
      case 'CREACION':
        return 'Creó el caso'
      case 'EDICION':
        return 'Editó'
      case 'ELIMINACION':
        return 'Eliminó el caso'
      case 'CAMBIO_ESTADO':
        return 'Cambió estado de'
      default:
        return 'Acción'
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <ClockIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar historial</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchHistorial}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'space-y-6'}>
      {/* Header y filtros */}
      {!compact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Historial de Cambios</h2>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <FunnelIcon className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  placeholder="Email o nombre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAplicarFiltros}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Aplicar
                </button>
                <button
                  onClick={handleLimpiarFiltros}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de cambios */}
      <div className={compact ? 'space-y-3' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'}>
        {compact && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial Reciente</h3>
        )}
        
        {historial.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay cambios registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(compact ? historial.slice(0, 5) : historial).map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 transition-colors ${getColorAccion(entry.accion)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIconoAccion(entry.accion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {entry.usuarioNombre || entry.usuarioEmail}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getTextoAccion(entry.accion)}
                      </span>
                      {entry.campoModificado && (
                        <span className="text-sm font-medium text-gray-700">
                          {obtenerNombreCampo(entry.campoModificado)}
                        </span>
                      )}
                    </div>
                    
                    {entry.accion === 'EDICION' || entry.accion === 'CAMBIO_ESTADO' ? (
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-red-600 line-through">
                            {formatearValor(entry.campoModificado || '', entry.valorAnterior || '')}
                          </span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">
                            {formatearValor(entry.campoModificado || '', entry.valorNuevo || '')}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      <span>{formatearFecha(entry.fechaHora)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {compact && historial.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Mostrando {historial.slice(0, 5).length} de {historial.length} cambios
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
