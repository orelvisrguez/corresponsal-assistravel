'use client'

import { useState, useEffect, useRef } from 'react'
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
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CogIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  BellIcon,
  SparklesIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { formatCurrency, getEstadoInternoLabel, getEstadoCasoLabel, formatCorresponsalNombre, formatPais } from '@/lib/utils'
import Link from 'next/link'
import {
  filtrarCasosPorPeriodo,
  calcularKPIsFinancieros,
  obtenerTopCorresponsales,
  calcularTendencias,
  calcularFiltroFechas,
  FiltroFechas,
  FiltroPeriodo
} from '@/lib/dashboardUtils'
import { useDashboardData } from '@/hooks/useDashboardData'

// Función auxiliar para convertir strings formateados a números
function parseFormattedNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return isFinite(value) ? value : 0
  if (typeof value === 'string') {
    let cleaned = value.trim().replace(/[^\d.,\-]/g, '')
    if (!cleaned) return 0

    const lastComma = cleaned.lastIndexOf(',')
    const lastPeriod = cleaned.lastIndexOf('.')

    if (lastComma > -1 && lastPeriod > -1) {
      if (lastComma > lastPeriod) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        cleaned = cleaned.replace(/,/g, '')
      }
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.')
    }

    const num = parseFloat(cleaned)
    if (!isFinite(num) || isNaN(num) || Math.abs(num) > 1e15) return 0
    return num
  }
  return 0
}

interface CurrencyTotal {
  code: string
  total: number
  count: number
}

export default function DashboardModerno() {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<FiltroPeriodo>('actual')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const {
    casos: allCasos,
    corresponsales: allCorresponsales,
    isLoading: loading,
    mutate,
    isValidating
  } = useDashboardData(autoRefresh, 5000) // 5 segundos para "tiempo real"

  useEffect(() => {
    if (!isValidating) {
      setLastUpdated(new Date())
    }
  }, [isValidating])

  // Obtener el rol del usuario
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

  const handleManualRefresh = async () => {
    await mutate()
  }

  // Calcular estadísticas del dashboard
  const getCasosFiltrados = () => {
    return filtrarCasosPorPeriodo(allCasos, periodoSeleccionado)
  }

  const casosFiltrados = getCasosFiltrados()
  const totalCorresponsales = new Set(casosFiltrados.map(c => c.corresponsal.id)).size
  const totalCasos = casosFiltrados.length

  // Estadísticas de estados
  const casosAbiertos = casosFiltrados.filter(c => c.estadoInterno === 'ABIERTO').length
  const casosCerrados = casosFiltrados.filter(c => c.estadoInterno === 'CERRADO').length
  const casosPausados = casosFiltrados.filter(c => c.estadoInterno === 'PAUSADO').length
  const casosCancelados = casosFiltrados.filter(c => c.estadoInterno === 'CANCELADO').length

  // Estadísticas financieras
  const totalIngresosUSD = casosFiltrados.reduce((sum, caso) => sum + parseFormattedNumber(caso.costoUsd), 0)
  const casosConFactura = casosFiltrados.filter(c => c.tieneFactura).length
  const casosCobrados = casosFiltrados.filter(c => c.estadoDelCaso === 'COBRADO').length
  const casosParaRefacturar = casosFiltrados.filter(c => c.estadoDelCaso === 'PARA_REFACTURAR').length
  const casosSinFee = casosFiltrados.filter(c => c.estadoDelCaso === 'NO_FEE').length

  // Cálculos de eficiencia
  const tasaFacturacion = totalCasos > 0 ? (casosConFactura / totalCasos) * 100 : 0
  const tasaCobro = casosConFactura > 0 ? (casosCobrados / casosConFactura) * 100 : 0
  const promedioPorCaso = totalCasos > 0 ? totalIngresosUSD / totalCasos : 0
  const ingresosPendientes = casosFiltrados
    .filter(c => c.tieneFactura && c.estadoDelCaso !== 'COBRADO')
    .reduce((sum, caso) => sum + parseFormattedNumber(caso.costoUsd), 0)

  // Top corresponsales
  const corresponsalMap = new Map<string, { casos: CasoConCorresponsal[], ingresos: number }>()
  casosFiltrados.forEach(caso => {
    const nombre = caso.corresponsal.nombreCorresponsal
    if (!corresponsalMap.has(nombre)) {
      corresponsalMap.set(nombre, { casos: [], ingresos: 0 })
    }
    corresponsalMap.get(nombre)!.casos.push(caso)
    corresponsalMap.get(nombre)!.ingresos += parseFormattedNumber(caso.costoUsd)
  })

  const topCorresponsales = Array.from(corresponsalMap.entries())
    .sort(([, a], [, b]) => b.ingresos - a.ingresos)
    .slice(0, 3)

  // Distribución por moneda
  const currencyMap = new Map<string, { total: number; count: number }>()
  casosFiltrados.forEach(caso => {
    if (caso.simboloMoneda && caso.costoMonedaLocal) {
      const amount = parseFormattedNumber(caso.costoMonedaLocal)
      const currency = caso.simboloMoneda.trim()
      if (amount > 0 && currency) {
        if (!currencyMap.has(currency)) {
          currencyMap.set(currency, { total: 0, count: 0 })
        }
        const existing = currencyMap.get(currency)!
        existing.total += amount
        existing.count += 1
      }
    }
  })

  const topMonedas = Array.from(currencyMap.entries())
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 4)

  // Casos recientes para mostrar
  const casosRecientes = casosFiltrados
    .sort((a, b) => new Date(b.fechaInicioCaso!).getTime() - new Date(a.fechaInicioCaso!).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>Dashboard Ejecutivo - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Header Hero */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold">Dashboard Ejecutivo</h1>
                      <p className="text-blue-100 text-lg">Análisis integral en tiempo real</p>
                    </div>
                  </div>

                  {/* Controles del dashboard */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <select
                      value={periodoSeleccionado}
                      onChange={(e) => setPeriodoSeleccionado(e.target.value as any)}
                      className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="actual" className="text-gray-900">Mes Actual</option>
                      <option value="mes" className="text-gray-900">Último Mes</option>
                      <option value="trimestre" className="text-gray-900">Último Trimestre</option>
                      <option value="año" className="text-gray-900">Último Año</option>
                      <option value="todo" className="text-gray-900">Todos los Períodos</option>
                    </select>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefresh
                          ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                          : 'bg-white/10 text-white border border-white/20'
                          }`}
                      >
                        <BoltIcon className="w-4 h-4 inline mr-1" />
                        Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                      </button>

                      <button
                        onClick={handleManualRefresh}
                        disabled={isValidating}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <ArrowPathIcon className={`w-4 h-4 inline mr-1 ${isValidating ? 'animate-spin' : ''}`} />
                        Actualizar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Estado en tiempo real */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isValidating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-sm font-medium">En Tiempo Real</span>
                  </div>
                  <p className="text-xs text-blue-100">
                    Última actualización: {lastUpdated.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {casosFiltrados.length} casos activos • {totalCorresponsales} corresponsales
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Banner de configuración para usuarios no admin */}
            {session && userRole && userRole !== 'ADMIN' && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">
                      ¿Necesitas acceso administrativo?
                    </h3>
                    <p className="text-indigo-700 mb-4">
                      Para acceder a funciones avanzadas como gestión de usuarios e importación Excel,
                      configura los permisos de administrador.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/setup"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        <CogIcon className="w-4 h-4 mr-2" />
                        Configurar Permisos
                      </Link>
                      <Link
                        href="/usuarios"
                        className="inline-flex items-center px-4 py-2 bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                      >
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        Ver Usuarios
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs Principales - Grid moderno */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ingresos Totales */}
              <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIngresosUSD)}</p>
                    <p className="text-sm text-gray-500">Ingresos Totales</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">
                    {casosFiltrados.length} casos procesados
                  </span>
                </div>
              </div>

              {/* Casos Activos */}
              <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{casosFiltrados.length}</p>
                    <p className="text-sm text-gray-500">Casos Totales</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">
                    {casosAbiertos} casos activos
                  </span>
                </div>
              </div>

              {/* Eficiencia de Cobro */}
              <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{tasaCobro.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Eficiencia</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 font-medium">
                    {casosCobrados} casos cobrados
                  </span>
                </div>
              </div>

              {/* Tasa de Facturación */}
              <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                    <BanknotesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{tasaFacturacion.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Facturación</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">
                    {casosConFactura} con factura
                  </span>
                </div>
              </div>
            </div>

            {/* Panel de Distribución de Estados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Estados Internos */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Estados Internos</h3>
                      <p className="text-sm text-gray-500">Estado de los casos</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Abiertos', count: casosAbiertos, color: 'emerald', icon: CheckCircleIcon, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                    { label: 'Cerrados', count: casosCerrados, color: 'slate', icon: DocumentTextIcon, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
                    { label: 'Pausados', count: casosPausados, color: 'amber', icon: PauseCircleIcon, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                    { label: 'Cancelados', count: casosCancelados, color: 'red', icon: XCircleIcon, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
                  ].map((estado) => {
                    const Icon = estado.icon
                    return (
                      <div key={estado.label} className={`flex items-center justify-between p-4 rounded-xl ${estado.bg} border ${estado.border} hover:shadow-md transition-all`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-${estado.color}-500 rounded-xl flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={`font-semibold ${estado.text}`}>{estado.label}</span>
                        </div>
                        <span className={`text-2xl font-bold ${estado.text}`}>{estado.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Estados del Caso */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Estados del Proceso</h3>
                      <p className="text-sm text-gray-500">Estado de facturación</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Sin Fee', count: casosSinFee, color: 'gray', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
                    { label: 'Para Refacturar', count: casosParaRefacturar, color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                    { label: 'En Progreso', count: casosFiltrados.filter(c => c.estadoDelCaso === 'ON_GOING').length, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    { label: 'Cobrados', count: casosCobrados, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
                  ].map((estado) => (
                    <div key={estado.label} className={`flex items-center justify-between p-4 rounded-xl ${estado.bg} border ${estado.border} hover:shadow-md transition-all`}>
                      <span className={`font-semibold ${estado.text}`}>{estado.label}</span>
                      <span className={`text-2xl font-bold ${estado.text}`}>{estado.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel Financiero Completo */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <BanknotesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Resumen Financiero</h3>
                      <p className="text-sm text-gray-500">Análisis completo de ingresos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(promedioPorCaso)}</p>
                    <p className="text-xs text-gray-500">Promedio por caso</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <CurrencyDollarIcon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalIngresosUSD)}</p>
                    <p className="text-sm text-emerald-700">Ingresos USD</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(ingresosPendientes)}</p>
                    <p className="text-sm text-blue-700">Pendientes</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <TrophyIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(casosCobrados > 0 ? totalIngresosUSD * (casosCobrados / casosConFactura) : 0)}</p>
                    <p className="text-sm text-purple-700">Cobrados</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                    <FireIcon className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-900">{formatCurrency(promedioPorCaso)}</p>
                    <p className="text-sm text-amber-700">Promedio</p>
                  </div>
                </div>

                {/* Distribución por Monedas */}
                {topMonedas.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Monedas Locales</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {topMonedas.map(([moneda, datos], index) => {
                        const colors = ['emerald', 'blue', 'purple', 'amber']
                        const color = colors[index % colors.length]
                        return (
                          <div key={moneda} className={`p-4 bg-gradient-to-r from-${color}-50 to-${color}-100 rounded-xl border border-${color}-200`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center`}>
                                <span className="text-xs font-bold text-white">{moneda.charAt(0)}</span>
                              </div>
                              <span className="text-xs text-gray-500">{datos.count} casos</span>
                            </div>
                            <p className={`text-lg font-bold text-${color}-900`}>
                              {datos.total.toFixed(2)} {moneda}
                            </p>
                            <p className="text-xs text-gray-600">Total {moneda}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Corresponsales y Casos Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Corresponsales */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <TrophyIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Top Corresponsales</h3>
                      <p className="text-sm text-gray-500">Mejor rendimiento por ingresos</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {topCorresponsales.length > 0 ? (
                    <div className="space-y-4">
                      {topCorresponsales.map(([nombre, datos], index) => {
                        const positions = ['🥇', '🥈', '🥉']
                        const colors = ['from-yellow-400 to-yellow-600', 'from-gray-400 to-gray-600', 'from-amber-400 to-amber-600']
                        return (
                          <div key={nombre} className={`p-4 bg-gradient-to-r ${colors[index]} rounded-xl text-white`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{positions[index]}</span>
                                <div>
                                  <p className="font-bold">{nombre}</p>
                                  <p className="text-xs opacity-75">{datos.casos.length} casos</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{formatCurrency(datos.ingresos)}</p>
                                <p className="text-xs opacity-75">ingresos USD</p>
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
              </div>

              {/* Casos Recientes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Casos Recientes</h3>
                      <p className="text-sm text-gray-500">Últimos casos registrados</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {casosRecientes.length > 0 ? (
                    <div className="space-y-3">
                      {casosRecientes.map((caso) => (
                        <div key={caso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{caso.nroCasoAssistravel}</p>
                            <p className="text-xs text-gray-500">{formatCorresponsalNombre(caso.corresponsal.nombreCorresponsal)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {caso.costoUsd ? formatCurrency(parseFormattedNumber(caso.costoUsd)) : 'Sin costo'}
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${caso.estadoInterno === 'ABIERTO' ? 'bg-green-100 text-green-800' :
                              caso.estadoInterno === 'CERRADO' ? 'bg-gray-100 text-gray-800' :
                                caso.estadoInterno === 'PAUSADO' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                              }`}>
                              {getEstadoInternoLabel(caso.estadoInterno)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No hay casos recientes en este período</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Centro de Ayuda Moderno */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                  <BellIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Guía de Interpretación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Estados Internos</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• <strong>Abierto:</strong> Caso activo en progreso</li>
                        <li>• <strong>Cerrado:</strong> Caso finalizado completamente</li>
                        <li>• <strong>Pausado:</strong> Caso temporalmente suspendido</li>
                        <li>• <strong>Cancelado:</strong> Caso anulado</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Estados del Proceso</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• <strong>Sin Fee:</strong> No requiere tarifa</li>
                        <li>• <strong>Para Refacturar:</strong> Pendiente de nueva facturación</li>
                        <li>• <strong>En Progreso:</strong> Activo</li>
                        <li>• <strong>Cobrado:</strong> Pago recibido</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}