'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import { CasoConCorresponsal, CorresponsalConCasos } from '@/types'
import { 
  UserGroupIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, getEstadoInternoLabel, getEstadoCasoLabel } from '@/lib/utils'
import Link from 'next/link'
import KPIsAvanzados from '@/components/dashboard/KPIsAvanzados'

interface CurrencyTotal {
  code: string
  total: number
  count: number
}

interface Stats {
  totalCorresponsales: number
  totalCasos: number
  casosAbiertos: number
  casosCerrados: number
  casosPausados: number
  casosCancelados: number
  totalMontoUSD: number
  totalMontoLocal: number // Mantener para compatibilidad
  monedasLocales: CurrencyTotal[] // Nueva estructura separada por moneda
  casosConFactura: number
  estadosCaso: {
    noFee: number
    refacturado: number
    paraRefacturar: number
    onGoing: number
    cobrado: number
  }
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ 
    totalCorresponsales: 0, 
    totalCasos: 0, 
    casosAbiertos: 0,
    casosCerrados: 0,
    casosPausados: 0,
    casosCancelados: 0,
    totalMontoUSD: 0,
    totalMontoLocal: 0,
    monedasLocales: [],
    casosConFactura: 0,
    estadosCaso: {
      noFee: 0,
      refacturado: 0,
      paraRefacturar: 0,
      onGoing: 0,
      cobrado: 0
    }
  })
  const [recentCasos, setRecentCasos] = useState<CasoConCorresponsal[]>([])
  const [allCasos, setAllCasos] = useState<CasoConCorresponsal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Obtener el rol del usuario actual
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserRole = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`)
          if (response.ok) {
            const userData = await response.json()
            setUserRole(userData.role)
          }
        } catch (error) {
          console.error('Error obteniendo rol del usuario:', error)
        }
      }
      fetchUserRole()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const [corresponsalesRes, casosRes] = await Promise.all([
        fetch('/api/corresponsales'),
        fetch('/api/casos')
      ])

      const corresponsales: CorresponsalConCasos[] = await corresponsalesRes.json()
      const casos: CasoConCorresponsal[] = await casosRes.json()

      // Calcular estadísticas detalladas
      const casosAbiertos = casos.filter(caso => caso.estadoInterno === 'ABIERTO').length
      const casosCerrados = casos.filter(caso => caso.estadoInterno === 'CERRADO').length
      const casosPausados = casos.filter(caso => caso.estadoInterno === 'PAUSADO').length
      const casosCancelados = casos.filter(caso => caso.estadoInterno === 'CANCELADO').length
      
      const totalMontoUSD = casos.reduce((sum, caso) => {
        return sum + (caso.costoUsd ? Number(caso.costoUsd) : 0)
      }, 0)
      
      // Calcular totales por moneda local separadamente
      const currencyMap = new Map<string, { total: number; count: number }>()
      let totalMontoLocal = 0
      
      casos.forEach(caso => {
        if (caso.costoMonedaLocal && caso.simboloMoneda) {
          const amount = Number(caso.costoMonedaLocal)
          const currency = caso.simboloMoneda.trim()
          
          if (amount > 0 && currency) {
            totalMontoLocal += amount
            
            if (!currencyMap.has(currency)) {
              currencyMap.set(currency, { total: 0, count: 0 })
            }
            
            const existing = currencyMap.get(currency)!
            existing.total += amount
            existing.count += 1
          }
        }
      })
      
      // Convertir Map a array y ordenar por total descendente
      const monedasLocales: CurrencyTotal[] = Array.from(currencyMap.entries())
        .map(([code, data]) => ({
          code,
          total: data.total,
          count: data.count
        }))
        .sort((a, b) => b.total - a.total)
      
      const casosConFactura = casos.filter(caso => caso.tieneFactura).length
      
      // Contar estados de casos
      const estadosCaso = {
        noFee: casos.filter(caso => caso.estadoDelCaso === 'NO_FEE').length,
        refacturado: casos.filter(caso => caso.estadoDelCaso === 'REFACTURADO').length,
        paraRefacturar: casos.filter(caso => caso.estadoDelCaso === 'PARA_REFACTURAR').length,
        onGoing: casos.filter(caso => caso.estadoDelCaso === 'ON_GOING').length,
        cobrado: casos.filter(caso => caso.estadoDelCaso === 'COBRADO').length
      }

      setStats({
        totalCorresponsales: corresponsales.length,
        totalCasos: casos.length,
        casosAbiertos,
        casosCerrados,
        casosPausados,
        casosCancelados,
        totalMontoUSD,
        totalMontoLocal,
        monedasLocales,
        casosConFactura,
        estadosCaso
      })

      // Almacenar todos los casos y obtener los 5 más recientes
      setAllCasos(casos)
      setRecentCasos(casos.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const statCards = [
    {
      name: 'Total Corresponsales',
      value: stats.totalCorresponsales,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      description: 'Corresponsales registrados'
    },
    {
      name: 'Total Casos',
      value: stats.totalCasos,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      description: 'Casos en el sistema'
    },
    {
      name: 'Casos Abiertos',
      value: stats.casosAbiertos,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      description: 'Casos en progreso'
    },
    {
      name: 'Casos Cerrados',
      value: stats.casosCerrados,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      description: 'Casos finalizados'
    },
    {
      name: 'Total USD',
      value: formatCurrency(stats.totalMontoUSD),
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      description: 'Monto total en USD'
    },
    {
      name: 'Con Factura',
      value: stats.casosConFactura,
      icon: DocumentCheckIcon,
      color: 'bg-indigo-500',
      description: 'Casos facturados'
    }
  ]

  const estadosInternosCards = [
    {
      name: 'Pausados',
      value: stats.casosPausados,
      icon: PauseCircleIcon,
      color: 'bg-orange-500'
    },
    {
      name: 'Cancelados',
      value: stats.casosCancelados,
      icon: XCircleIcon,
      color: 'bg-red-500'
    }
  ]

  const estadosCasoCards = [
    {
      name: 'No Fee',
      value: stats.estadosCaso.noFee,
      color: 'bg-gray-100 text-gray-800'
    },
    {
      name: 'Refacturado',
      value: stats.estadosCaso.refacturado,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'Para Refacturar',
      value: stats.estadosCaso.paraRefacturar,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      name: 'On Going',
      value: stats.estadosCaso.onGoing,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'Cobrado',
      value: stats.estadosCaso.cobrado,
      color: 'bg-green-100 text-green-800'
    }
  ]

  return (
    <>
      <Head>
        <title>Dashboard - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Resumen general de casos y corresponsales</p>
        </div>

        {/* Banner de configuración inicial para usuarios no admin */}
        {session && userRole && userRole !== 'ADMIN' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ¿Necesitas acceso de administrador?
                </h3>
                <p className="text-blue-800 mb-4">
                  Para acceder a las funciones de gestión de usuarios e importación de datos Excel, 
                  necesitas permisos de administrador. Si eres el primer usuario del sistema, 
                  puedes configurar estos permisos automáticamente.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    href="/setup"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Configurar Permisos
                  </Link>
                  <Link 
                    href="/usuarios"
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Ver Usuarios
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* KPIs Avanzados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">KPIs Avanzados</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <KPIsAvanzados casos={allCasos} autoFetch={false} />
        </div>

        {/* Estados Internos y Información Adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Estados Internos Adicionales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Estados Internos</h3>
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" title="Estados adicionales de casos" />
            </div>
            <div className="space-y-3">
              {estadosInternosCards.map((estado) => {
                const Icon = estado.icon
                return (
                  <div key={estado.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${estado.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">{estado.name}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{estado.value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Información Financiera */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resumen Financiero</h3>
              <BanknotesIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Total USD</span>
                <span className="text-lg font-bold text-green-900">{formatCurrency(stats.totalMontoUSD)}</span>
              </div>
              
              {/* Monedas Locales Separadas */}
              {stats.monedasLocales.length > 0 ? (
                <>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Monedas Locales</h4>
                    <div className="space-y-2">
                      {stats.monedasLocales.map((moneda, index) => {
                        const bgColors = ['bg-blue-50', 'bg-purple-50', 'bg-indigo-50', 'bg-teal-50', 'bg-orange-50']
                        const textColors = ['text-blue-700', 'text-purple-700', 'text-indigo-700', 'text-teal-700', 'text-orange-700']
                        const boldColors = ['text-blue-900', 'text-purple-900', 'text-indigo-900', 'text-teal-900', 'text-orange-900']
                        
                        const bgColor = bgColors[index % bgColors.length]
                        const textColor = textColors[index % textColors.length]
                        const boldColor = boldColors[index % boldColors.length]
                        
                        return (
                          <div key={moneda.code} className={`flex justify-between items-center p-3 ${bgColor} rounded-lg`}>
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${textColor}`}>Total {moneda.code}</span>
                              <span className={`text-xs ${textColor} opacity-75`}>{moneda.count} casos</span>
                            </div>
                            <span className={`text-lg font-bold ${boldColor}`}>
                              {moneda.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda.code}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-500">Sin monedas locales registradas</span>
                  <span className="text-sm text-gray-400">-</span>
                </div>
              )}
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-t pt-3">
                <span className="text-sm font-medium text-purple-700">% Facturados</span>
                <span className="text-lg font-bold text-purple-900">
                  {stats.totalCasos > 0 ? Math.round((stats.casosConFactura / stats.totalCasos) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estados de Casos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estados de Casos</h3>
            <p className="text-sm text-gray-500">Distribución por estado del caso</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {estadosCasoCards.map((estado) => (
              <div key={estado.name} className="text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${estado.color} w-full justify-center`}>
                  {estado.name}
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{estado.value}</div>
                <div className="text-xs text-gray-500">
                  {stats.totalCasos > 0 ? Math.round((estado.value / stats.totalCasos) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloque de Ayuda */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-blue-900">Centro de Ayuda</h3>
              <p className="text-blue-700 text-sm mt-1">
                ¿Necesitas ayuda? Aquí tienes algunos recursos útiles:
              </p>
              <div className="mt-3 space-y-2">
                <div className="text-sm text-blue-800">
                  • <strong>Estados Internos:</strong> Abierto (activo), Cerrado (finalizado), Pausado (suspendido), Cancelado (anulado)
                </div>
                <div className="text-sm text-blue-800">
                  • <strong>Estados de Caso:</strong> No Fee (sin tarifa), Refacturado, Para Refacturar, On Going (en progreso), Cobrado
                </div>
                <div className="text-sm text-blue-800">
                  • <strong>Búsqueda:</strong> Utiliza los filtros en las páginas de Casos y Corresponsales para encontrar información específica
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Cases */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Casos Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nro. Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Corresponsal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    País
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Interno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado del Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto USD
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCasos.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caso.nroCasoAssistravel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.corresponsal.nombreCorresponsal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.pais}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        caso.estadoInterno === 'ABIERTO' ? 'bg-green-100 text-green-800' :
                        caso.estadoInterno === 'CERRADO' ? 'bg-gray-100 text-gray-800' :
                        caso.estadoInterno === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getEstadoInternoLabel(caso.estadoInterno)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        caso.estadoDelCaso === 'COBRADO' ? 'bg-green-100 text-green-800' :
                        caso.estadoDelCaso === 'ON_GOING' ? 'bg-blue-100 text-blue-800' :
                        caso.estadoDelCaso === 'PARA_REFACTURAR' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getEstadoCasoLabel(caso.estadoDelCaso)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.costoUsd ? formatCurrency(Number(caso.costoUsd)) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <Link
                          href="/casos"
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                          title="Ver todos los casos"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                          Ver casos
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentCasos.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay casos</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer caso.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
    </>
  )
}