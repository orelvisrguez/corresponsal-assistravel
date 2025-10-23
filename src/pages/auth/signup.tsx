'use client'

import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import Head from 'next/head'

export default function SignUp() {
  return (
    <>
      <Head>
        <title>Registro Deshabilitado - ASSISTRAVEL Corresponsalia</title>
      </Head>
      <Layout requireAuth={false}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Logo/Branding */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  ASSISTRAVEL
                </h1>
                <p className="text-lg text-gray-600">Corresponsalia</p>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mt-4 rounded-full"></div>
              </div>

              {/* Icono informativo */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Título principal */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Registro Deshabilitado
              </h2>

              {/* Mensaje explicativo */}
              <div className="text-gray-600 mb-8 leading-relaxed">
                <p className="mb-4">
                  El registro de nuevos usuarios está deshabilitado por razones de seguridad. 
                  Los usuarios son creados únicamente por los administradores del sistema.
                </p>
                <p className="mb-4">
                  Si necesitas acceso al sistema <strong>ASSISTRAVEL Corresponsalia</strong>, 
                  por favor contacta al administrador para que pueda crear tu cuenta.
                </p>
              </div>

              {/* Información de contacto */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">¿Cómo obtener acceso?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contacta al administrador del sistema</li>
                  <li>• Proporciona tu información de contacto</li>
                  <li>• Especifica el nivel de acceso requerido</li>
                  <li>• Espera la confirmación de tu cuenta</li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                <Link href="/auth/signin">
                  <Button className="w-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Ir al Inicio de Sesión
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-500">
                  ¿Ya tienes una cuenta? Inicia sesión con tus credenciales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}