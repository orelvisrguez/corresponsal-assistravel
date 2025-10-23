'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import CorresponsalView from '@/components/corresponsales/CorresponsalView'
import { CorresponsalConCasos } from '@/types'

export default function CorresponsalDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [corresponsal, setCorresponsal] = useState<CorresponsalConCasos | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchCorresponsal()
    }
  }, [id])

  const fetchCorresponsal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/corresponsales/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setCorresponsal(data)
      } else if (response.status === 404) {
        setError('Corresponsal no encontrado')
      } else {
        setError('Error al cargar el corresponsal')
      }
    } catch (error) {
      console.error('Error fetching corresponsal:', error)
      setError('Error al cargar el corresponsal')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/corresponsales')
  }

  const handleEditCase = (casoId: number) => {
    // Navegar a la página de casos con el caso específico seleccionado
    router.push(`/casos?edit=${casoId}`)
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

  if (error || !corresponsal) {
    return (
      <>
        <Head>
          <title>Error - ASSISTRAVEL Corresponsalia</title>
        </Head>
        <Layout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Corresponsal no encontrado'}
            </h1>
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Volver a Corresponsales
            </button>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`${corresponsal.nombreCorresponsal} - ASSISTRAVEL Corresponsalia`}</title>
      </Head>
      <Layout>
        <CorresponsalView
          corresponsal={corresponsal}
          onBack={handleBack}
          onEditCase={handleEditCase}
        />
      </Layout>
    </>
  )
}
