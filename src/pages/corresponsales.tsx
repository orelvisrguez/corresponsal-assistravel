'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import CorresponsalList from '@/components/corresponsales/CorresponsalList'
import { CorresponsalConCasos } from '@/types'

export default function CorresponsalesPage() {
  const [corresponsales, setCorresponsales] = useState<CorresponsalConCasos[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCorresponsales()
  }, [])

  const fetchCorresponsales = async () => {
    try {
      const response = await fetch('/api/corresponsales')
      if (response.ok) {
        const data = await response.json()
        setCorresponsales(data)
      }
    } catch (error) {
      console.error('Error fetching corresponsales:', error)
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
        <title>Corresponsales - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout>
        <CorresponsalList 
          corresponsales={corresponsales} 
          onRefresh={fetchCorresponsales} 
        />
      </Layout>
    </>
  )
}