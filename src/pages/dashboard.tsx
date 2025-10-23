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
  CogIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, getEstadoInternoLabel, getEstadoCasoLabel, formatCorresponsalNombre, formatPais } from '@/lib/utils'
import Link from 'next/link'
import KPIsAvanzados from '@/components/dashboard/KPIsAvanzados'
import MapaCalorAtrasos from '@/components/dashboard/MapaCalorAtrasos'
import FiltrosTemporales, { FiltroPeriodo } from '@/components/dashboard/FiltrosTemporales'
import {
  filtrarCasosPorPeriodo,
  calcularKPIsFinancieros,
  obtenerTopCorresponsales,
  calcularTendencias,
  formatearNumero,
  calcularPorcentajeCambio,
  calcularFiltroFechas,
  FiltroFechas
} from '@/lib/dashboardUtils'

// Función auxiliar para convertir strings formateados a números (misma que en dashboardUtils)
function parseFormattedNumber(value: any): number {
  // Si es null, undefined o string vacío, retornar 0
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  if (typeof value === 'number') {
    return isFinite(value) ? value : 0
  }
  
  if (typeof value === 'string') {
    // Limpiar el string: eliminar espacios y caracteres no numéricos (excepto punto y coma)
    let cleaned = value.trim().replace(/[^\d.,\-]/g, '')
    
    // Si el string está vacío después de limpiar, retornar 0
    if (!cleaned) {
      return 0
    }
    
    // Detectar y manejar diferentes formatos de número
    const lastComma = cleaned.lastIndexOf(',')
    const lastPeriod = cleaned.lastIndexOf('.')
    
    // Si tiene tanto punto como coma, determinar cuál es el separador decimal
    if (lastComma > -1 && lastPeriod > -1) {
      if (lastComma > lastPeriod) {
        // Español: 1.234.567,89 (coma decimal, punto miles)
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // Inglés: 1,234,567.89 (punto decimal, coma miles)
        cleaned = cleaned.replace(/,/g, '')
      }
    } else if (cleaned.includes(',')) {
      // Solo coma - asumir que es separador decimal
      cleaned = cleaned.replace(',', '.')
    }
    // Si solo tiene punto, asumir que es separador decimal (sin cambios)
    
    const num = parseFloat(cleaned)
    
    // Validar que el número es válido y razonable
    if (!isFinite(num) || isNaN(num)) {
      return 0
    }
    
    // Si el número es demasiado grande (probablemente mal formateado), retornarlo tal como está
    // pero con un límite razonable
    if (Math.abs(num) > 1e15) { // Más de 1 cuatrillón probablemente es un error
      console.warn(`Número potencialmente mal formateado detectado: ${value} -> ${num}`)
      return 0 // Retornar 0 para evitar cálculos erróneos
    }
    
    return num
  }
  
  return 0
}

interface CurrencyTotal {
  code: string
  total: number
  count: number
}

import { KPIFinanciero, TopCorresponsal, TendenciaData } from '@/lib/dashboardUtils'

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

interface DashboardData {
  stats: Stats
  casosFiltrados: CasoConCorresponsal[]
  kpisFinancieros: KPIFinanciero
  topCorresponsales: TopCorresponsal[]
  tendencias: TendenciaData[]
  filtroActual: FiltroFechas
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<FiltroPeriodo>('actual')
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { 
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
    },
    casosFiltrados: [],
    kpisFinancieros: {
      ingresoTotalUSD: 0,
      ingresoTotalLocal: {},
      promedioPorCaso: 0,
      casosFacturados: 0,
      tasaFacturacion: 0,
      casosCobrados: 0,
      tasaCobro: 0,
      ingresosPendientes: 0,
      casosPendientesPago: 0
    },
    topCorresponsales: [],
    tendencias: [],
    filtroActual: {
      fechaInicio: new Date(),
      fechaFin: new Date(),
      label: 'Mes Actual'
    }
  })
  const [allCasos, setAllCasos] = useState<CasoConCorresponsal[]>([])
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())

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

  // Función para actualizar datos cuando cambie el filtro
  const actualizarDatosPorFiltro = (periodo: FiltroPeriodo) => {
    setLoading(true)
    
    // Filtrar casos según el período seleccionado
    const casosFiltrados = filtrarCasosPorPeriodo(allCasos, periodo)
    
    // Calcular estadísticas para el período filtrado
    const casosAbiertos = casosFiltrados.filter(caso => caso.estadoInterno === 'ABIERTO').length
    const casosCerrados = casosFiltrados.filter(caso => caso.estadoInterno === 'CERRADO').length
    const casosPausados = casosFiltrados.filter(caso => caso.estadoInterno === 'PAUSADO').length
    const casosCancelados = casosFiltrados.filter(caso => caso.estadoInterno === 'CANCELADO').length
    
    const totalMontoUSD = casosFiltrados.reduce((sum, caso) => {
      return sum + parseFormattedNumber(caso.costoUsd)
    }, 0)
    
    // Calcular totales por moneda local para el período
    const currencyMap = new Map<string, { total: number; count: number }>()
    let totalMontoLocal = 0
    
    casosFiltrados.forEach(caso => {
      if (caso.costoMonedaLocal && caso.simboloMoneda) {
        const amount = parseFormattedNumber(caso.costoMonedaLocal)
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
    
    const monedasLocales: CurrencyTotal[] = Array.from(currencyMap.entries())
      .map(([code, data]) => ({
        code,
        total: data.total,
        count: data.count
      }))
      .sort((a, b) => b.total - a.total)
    
    const casosConFactura = casosFiltrados.filter(caso => caso.tieneFactura).length
    
    const estadosCaso = {
      noFee: casosFiltrados.filter(caso => caso.estadoDelCaso === 'NO_FEE').length,
      refacturado: casosFiltrados.filter(caso => caso.estadoDelCaso === 'REFACTURADO').length,
      paraRefacturar: casosFiltrados.filter(caso => caso.estadoDelCaso === 'PARA_REFACTURAR').length,
      onGoing: casosFiltrados.filter(caso => caso.estadoDelCaso === 'ON_GOING').length,
      cobrado: casosFiltrados.filter(caso => caso.estadoDelCaso === 'COBRADO').length
    }
    
    // Calcular KPIs avanzados
    const kpisFinancieros = calcularKPIsFinancieros(casosFiltrados)
    const topCorresponsales = obtenerTopCorresponsales(casosFiltrados)
    const tendencias = calcularTendencias(casosFiltrados, periodo)
    const filtroActual = calcularFiltroFechas(periodo)
    
    // Actualizar estado
    setDashboardData({
      stats: {
        totalCorresponsales: new Set(casosFiltrados.map(c => c.corresponsal.id)).size,
        totalCasos: casosFiltrados.length,
        casosAbiertos,
        casosCerrados,
        casosPausados,
        casosCancelados,
        totalMontoUSD,
        totalMontoLocal,
        monedasLocales,
        casosConFactura,
        estadosCaso
      },
      casosFiltrados,
      kpisFinancieros,
      topCorresponsales,
      tendencias,
      filtroActual
    })
    
    setUltimaActualizacion(new Date())
    setLoading(false)
  }

  const fetchDashboardData = async () => {
    try {
      const [corresponsalesRes, casosRes] = await Promise.all([
        fetch('/api/corresponsales'),
        fetch('/api/casos')
      ])

      const corresponsales: CorresponsalConCasos[] = await corresponsalesRes.json()
      const casos: CasoConCorresponsal[] = await casosRes.json()

      // Almacenar todos los casos
      setAllCasos(casos)
      
      // Inicializar con el filtro actual
      actualizarDatosPorFiltro(periodoSeleccionado)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  // Actualizar datos cuando cambie el período
  useEffect(() => {
    if (allCasos.length > 0) {
      actualizarDatosPorFiltro(periodoSeleccionado)
    }
  }, [periodoSeleccionado, allCasos])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  // Cards principales con KPIs más relevantes
  const statCards = [
    {
      name: 'Ingresos Totales',
      value: formatCurrency(dashboardData.kpisFinancieros.ingresoTotalUSD),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      description: `${dashboardData.filtroActual.label} - ${dashboardData.stats.totalCasos} casos`
    },
    {
      name: 'Casos Registrados',
      value: dashboardData.stats.totalCasos,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      description: `${dashboardData.kpisFinancieros.tasaFacturacion.toFixed(1)}% con factura`
    },
    {
      name: 'Tasa de Conversión',
      value: `${dashboardData.kpisFinancieros.tasaCobro.toFixed(1)}%`,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      description: `${dashboardData.kpisFinancieros.casosCobrados} casos cobrados`
    },
    {
      name: 'Casos Activos',
      value: dashboardData.stats.casosAbiertos,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      description: 'En progreso'
    },
    {
      name: 'Ingresos Pendientes',
      value: formatCurrency(dashboardData.kpisFinancieros.ingresosPendientes),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      description: `${dashboardData.kpisFinancieros.casosPendientesPago} casos por cobrar`
    },
    {
      name: 'Promedio por Caso',
      value: formatCurrency(dashboardData.kpisFinancieros.promedioPorCaso),
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      description: 'Valor promedio'
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Inteligente</h1>
          <p className="mt-2 text-gray-600">Análisis integral de casos y corresponsales en tiempo real</p>
        </div>

        {/* Filtros Temporales - Actualización Automática */}
        <FiltrosTemporales
          periodoSeleccionado={periodoSeleccionado}
          onCambiarPeriodo={setPeriodoSeleccionado}
          ultimaActualizacion={ultimaActualizacion}
        />

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

        {/* Estados Internos - Bloques Separados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Estados Internos</h3>
            <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400 cursor-help" title="Estados internos de los casos" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estados Internos con bloques individuales */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-sm font-semibold text-green-800">Abiertos</span>
              </div>
              <span className="text-2xl font-bold text-green-900">{dashboardData.stats.casosAbiertos}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <DocumentCheckIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-sm font-semibold text-gray-800">Cerrados</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{dashboardData.stats.casosCerrados}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <PauseCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-sm font-semibold text-orange-800">Pausados</span>
              </div>
              <span className="text-2xl font-bold text-orange-900">{dashboardData.stats.casosPausados}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-sm font-semibold text-red-800">Cancelados</span>
              </div>
              <span className="text-2xl font-bold text-red-900">{dashboardData.stats.casosCancelados}</span>
            </div>
          </div>
        </div>

        {/* Estados del Caso - Bloques Separados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Estados del Caso</h3>
            <QuestionMarkCircleIcon className="h-6 w-6 text-gray-400 cursor-help" title="Estados del proceso de caso" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">NF</span>
                </div>
                <span className="ml-3 text-sm font-semibold text-gray-800">No Fee</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{dashboardData.stats.estadosCaso.noFee}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RF</span>
                </div>
                <span className="ml-3 text-sm font-semibold text-blue-800">Refacturado</span>
              </div>
              <span className="text-2xl font-bold text-blue-900">{dashboardData.stats.estadosCaso.refacturado}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PR</span>
                </div>
                <span className="ml-3 text-sm font-semibold text-orange-800">Para Refacturar</span>
              </div>
              <span className="text-2xl font-bold text-orange-900">{dashboardData.stats.estadosCaso.paraRefacturar}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OG</span>
                </div>
                <span className="ml-3 text-sm font-semibold text-purple-800">On Going</span>
              </div>
              <span className="text-2xl font-bold text-purple-900">{dashboardData.stats.estadosCaso.onGoing}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-sm font-semibold text-green-800">Cobrado</span>
              </div>
              <span className="text-2xl font-bold text-green-900">{dashboardData.stats.estadosCaso.cobrado}</span>
            </div>
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
              <span className="text-lg font-bold text-green-900">{formatCurrency(dashboardData.kpisFinancieros.ingresoTotalUSD)}</span>
            </div>
            
            {/* Monedas Locales Separadas */}
            {Object.keys(dashboardData.kpisFinancieros.ingresoTotalLocal).length > 0 ? (
              <>
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Monedas Locales</h4>
                  <div className="space-y-2">
                    {Object.entries(dashboardData.kpisFinancieros.ingresoTotalLocal).map(([moneda, total], index) => {
                      const bgColors = ['bg-blue-50', 'bg-purple-50', 'bg-indigo-50', 'bg-teal-50', 'bg-orange-50']
                      const textColors = ['text-blue-700', 'text-purple-700', 'text-indigo-700', 'text-teal-700', 'text-orange-700']
                      const boldColors = ['text-blue-900', 'text-purple-900', 'text-indigo-900', 'text-teal-900', 'text-orange-900']
                      
                      const bgColor = bgColors[index % bgColors.length]
                      const textColor = textColors[index % textColors.length]
                      const boldColor = boldColors[index % boldColors.length]
                      
                      return (
                        <div key={moneda} className={`flex justify-between items-center p-3 ${bgColor} rounded-lg`}>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${textColor}`}>Total {moneda}</span>
                            <span className={`text-xs ${textColor} opacity-75`}>
                              {dashboardData.stats.monedasLocales.find(m => m.code === moneda)?.count || 0} casos
                            </span>
                          </div>
                          <span className={`text-lg font-bold ${boldColor}`}>
                            {total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {moneda}
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
                {dashboardData.kpisFinancieros.tasaFacturacion.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Top Corresponsales del Período */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Top Corresponsales</h3>
              <p className="text-sm text-gray-600 mt-1">
                Corresponsales más activos en {dashboardData.filtroActual.label}
              </p>
            </div>
            <UserGroupIcon className="h-6 w-6 text-gray-400" />
          </div>

          {dashboardData.topCorresponsales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.topCorresponsales.map((corresponsal, index) => {
                const positionColors = [
                  'bg-gradient-to-r from-yellow-400 to-yellow-500',
                  'bg-gradient-to-r from-gray-400 to-gray-500', 
                  'bg-gradient-to-r from-orange-400 to-orange-500'
                ]
                const borderColors = ['border-yellow-300', 'border-gray-300', 'border-orange-300']
                const textColors = ['text-yellow-800', 'text-gray-800', 'text-orange-800']
                
                const isTopThree = index < 3
                const bgColor = isTopThree ? positionColors[index] : 'bg-gray-100'
                const borderColor = isTopThree ? borderColors[index] : 'border-gray-200'
                const textColor = isTopThree ? textColors[index] : 'text-gray-800'
                
                return (
                  <div
                    key={corresponsal.id}
                    className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-sm font-bold ${isTopThree ? 'text-white' : 'text-gray-600'}`}>
                        #{index + 1}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isTopThree ? 'text-white' : textColor}`}>
                          {formatCurrency(corresponsal.ingresosUSD)}
                        </div>
                        <div className={`text-xs ${isTopThree ? 'text-white opacity-75' : 'text-gray-500'}`}>
                          ingresos USD
                        </div>
                      </div>
                    </div>
                    
                    <h4 className={`font-semibold text-sm mb-1 ${isTopThree ? 'text-white' : textColor}`}>
                      {corresponsal.nombre}
                    </h4>
                    
                    <div className={`flex items-center space-x-2 mb-2 ${isTopThree ? 'text-white opacity-75' : 'text-gray-600'}`}>
                      <GlobeAltIcon className="w-3 h-3" />
                      <span className="text-xs">{formatPais(corresponsal.pais)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className={`text-xs ${isTopThree ? 'text-white opacity-75' : 'text-gray-500'}`}>
                        {corresponsal.totalCasos} casos
                      </div>
                      <div className={`text-xs font-medium ${isTopThree ? 'text-white' : 'text-green-600'}`}>
                        {corresponsal.eficiencia.toFixed(1)}% eficiencia
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay corresponsales activos en este período</p>
            </div>
          )}
        </div>

        {/* Mapa de Calor - Casos con Atrasos */}
        <MapaCalorAtrasos casos={dashboardData.casosFiltrados} maxItems={12} />

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

        {/* Casos Recientes del Período */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Casos Recientes - {dashboardData.filtroActual.label}
              </h2>
              <span className="text-sm text-gray-500">
                Mostrando {Math.min(5, dashboardData.casosFiltrados.length)} de {dashboardData.casosFiltrados.length} casos
              </span>
            </div>
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
                {dashboardData.casosFiltrados
                  .sort((a, b) => new Date(b.fechaInicioCaso!).getTime() - new Date(a.fechaInicioCaso!).getTime())
                  .slice(0, 5)
                  .map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caso.nroCasoAssistravel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCorresponsalNombre(caso.corresponsal.nombreCorresponsal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPais(caso.pais)}
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
          {dashboardData.casosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay casos en este período</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron casos en {dashboardData.filtroActual.label.toLowerCase()}. 
                Selecciona un período diferente o crea nuevos casos.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
    </>
  )
}