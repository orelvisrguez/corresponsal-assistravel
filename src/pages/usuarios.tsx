'use client'

import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import UserList from '@/components/users/UserList'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

export default function UsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Solo administradores pueden acceder a esta página
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario tiene permisos de administrador
    const checkAdminPermission = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.status === 403) {
          toast.error('No tienes permisos para acceder a esta página')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error verificando permisos:', error)
        toast.error('Error al verificar permisos')
        router.push('/dashboard')
      }
    }

    checkAdminPermission()
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      <Head>
        <title>Gestión de Usuarios - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout>
        <UserList />
      </Layout>
    </>
  )
}
