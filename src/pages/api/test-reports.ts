import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('🧪 Iniciando test de API...');
    
    // Test 1: Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    console.log('📋 Sesión:', session ? 'Válida' : 'No encontrada');
    
    if (!session?.user?.id) {
      console.log('❌ No hay usuario autenticado');
      return res.status(401).json({ 
        message: 'No autorizado',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
          sessionData: session ? {
            userEmail: session.user.email,
            userRole: session.user.role
          } : null
        }
      });
    }
    
    console.log(`✅ Usuario autenticado: ${session.user.email}`);
    
    // Test 2: Verificar conexión a Prisma
    console.log('🔍 Probando conexión a Prisma...');
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma conectado. Usuarios: ${userCount}`);
    
    // Test 3: Verificar datos de corresponsales
    console.log('🔍 Probando datos de corresponsales...');
    const corresponsalCount = await prisma.corresponsal.count();
    console.log(`✅ Corresponsales encontrados: ${corresponsalCount}`);
    
    // Test 4: Verificar datos de casos
    console.log('🔍 Probando datos de casos...');
    const casoCount = await prisma.caso.count();
    console.log(`✅ Casos encontrados: ${casoCount}`);
    
    // Test 5: Verificar consulta con include
    console.log('🔍 Probando consulta con relación...');
    const casoConCorresponsal = await prisma.caso.findFirst({
      include: {
        corresponsal: true
      }
    });
    
    const testResult = {
      success: true,
      message: 'Test API funcionando correctamente',
      debug: {
        userAuthenticated: true,
        userEmail: session.user.email,
        userRole: session.user.role,
        prismaConnected: true,
        dataAvailable: {
          users: userCount,
          corresponsales: corresponsalCount,
          casos: casoCount,
          relationWorking: !!casoConCorresponsal
        },
        sampleData: casoConCorresponsal ? {
          casoId: casoConCorresponsal.id,
          nroCaso: casoConCorresponsal.nroCasoAssistravel,
          corresponsalNombre: casoConCorresponsal.corresponsal.nombreCorresponsal,
          corresponsalPais: casoConCorresponsal.corresponsal.pais
        } : null
      }
    };
    
    console.log('✅ Test completado exitosamente');
    res.status(200).json(testResult);

  } catch (error) {
    console.error('❌ Error en test API:', error);
    res.status(500).json({ 
      message: 'Error en test', 
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
}