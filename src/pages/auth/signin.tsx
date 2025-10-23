'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signinSchema } from '@/lib/validations'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import { z } from 'zod'

type FormData = z.infer<typeof signinSchema>

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(signinSchema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        toast.error('Credenciales inválidas')
      } else {
        toast.success('Inicio de sesión exitoso')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Panel Izquierdo - Información del Sistema */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 items-center justify-center">
            <div className="max-w-lg text-white">
              {/* Logo/Nombre de la aplicación */}
              <div className="text-center mb-8">
                <div className="inline-block">
                  <h1 className="text-5xl font-bold leading-tight">
                    ASSISTRAVEL
                  </h1>
                  <div className="text-xl font-light tracking-wider mt-2 text-blue-100">
                    Corresponsalia
                  </div>
                  <div className="h-1 bg-white/30 mt-4 rounded-full"></div>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-3">
                    Sistema de Gestión Integral
                  </h2>
                  <p className="text-blue-100 leading-relaxed">
                    Plataforma especializada para la administración y seguimiento de casos de corresponsalía, 
                    diseñada para optimizar el flujo de trabajo y mejorar la eficiencia operativa.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Gestión de Casos</h3>
                      <p className="text-sm text-blue-100">Control completo del ciclo de vida de cada caso</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Reportes Financieros</h3>
                      <p className="text-sm text-blue-100">Análisis detallado de costos y facturación</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Red de Corresponsales</h3>
                      <p className="text-sm text-blue-100">Administración centralizada de contactos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Formulario de Login */}
          <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              {/* Header para móvil */}
              <div className="text-center lg:hidden mb-8">
                <h1 className="text-3xl font-bold text-gray-900">ASSISTRAVEL</h1>
                <p className="text-lg text-gray-600">Corresponsalia</p>
              </div>

              {/* Título del formulario */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">
                  Iniciar Sesión
                </h2>
                <p className="mt-3 text-gray-600">
                  Accede a tu cuenta para gestionar casos y corresponsales
                </p>
              </div>
              
              {/* Formulario */}
              <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  
                  <Input
                    label="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Iniciar Sesión
                </Button>
              </form>

              {/* Información adicional */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  ¿Necesitas acceso? Contacta al administrador del sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}