'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import CasoList from '@/components/casos/CasoList'
import { CasoConCorresponsal, CorresponsalConCasos } from '@/types'

export default function CasosPage() {
  const router = useRouter()
  const { edit } = router.query // Obtener el parámetro edit de la URL
  const [casos, setCasos] = useState<CasoConCorresponsal[]>([])
  const [corresponsales, setCorresponsales] = useState<CorresponsalConCasos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Si hay un parámetro edit y los datos ya están cargados, destacar el caso
    if (edit && casos.length > 0) {
      const casoId = parseInt(edit as string)
      if (!isNaN(casoId)) {
        // Aquí podrías agregar lógica adicional para destacar o abrir automáticamente el caso
        console.log('Caso a editar:', casoId)
      }
    }
  }, [edit, casos])

  const fetchData = async () => {
    try {
      const [casosRes, corresponsalesRes] = await Promise.all([
        fetch('/api/casos'),
        fetch('/api/corresponsales')
      ])

      if (casosRes.ok && corresponsalesRes.ok) {
        const casosData = await casosRes.json()
        const corresponsalesData = await corresponsalesRes.json()
        setCasos(casosData)
        setCorresponsales(corresponsalesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

  return (
    <>
      <Head>
        <title>Gestión de Casos - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout>
        <CasoList 
          casos={casos} 
          corresponsales={corresponsales}
          onRefresh={fetchData}
          initialEditCaseId={edit ? parseInt(edit as string) : undefined}
        />
      </Layout>
    </>
  )
}