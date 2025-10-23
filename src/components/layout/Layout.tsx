'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import Navbar from './Navbar'
import { Toaster } from 'react-hot-toast'

interface LayoutProps {
  children: ReactNode
  requireAuth?: boolean
}

export default function Layout({ children, requireAuth = true }: LayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, router, requireAuth])

  if (requireAuth && status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requireAuth && !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {session && <Navbar />}
      <main className={session ? 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20' : ''}>
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  )
}