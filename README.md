# Sistema de Administración de Casos y Corresponsales

Una aplicación web full-stack para administrar casos y corresponsales con autenticación y base de datos PostgreSQL.

## ➡️ Características

- ✓ **Autenticación completa** con NextAuth.js
- ✓ **CRUD completo** para casos y corresponsales  
- ✓ **Centro de Reportes** con análisis financiero y dashboards interactivos
- ✓ **Base de datos PostgreSQL** con Neon.tech
- ✓ **Interfaz responsiva** con Tailwind CSS
- ✓ **Validación de formularios** con React Hook Form y Zod
- ✓ **Dashboard con estadísticas** en tiempo real
- ✓ **Relaciones entre tablas** (casos ↔ corresponsales)
- ✓ **Sistema de roles** (ADMIN, USER)
- ✓ **Configurado para Vercel** y GitHub

## 🎯 Módulos Principales

- **📊 Dashboard**: Métricas ejecutivas y KPIs en tiempo real
- **📋 Casos**: Gestión completa de casos de asistencia al viajero con trazabilidad
- **👥 Corresponsales**: Administración de la red de corresponsales y su rendimiento
- **📈 Reportes**: Centro de análisis con dashboards interactivos:
  - Dashboard ejecutivo con métricas clave
  - Reporte de facturación y casos pendientes
  - Análisis de rendimiento por corresponsal
  - Informe financiero detallado con análisis de rentabilidad
- **👤 Usuarios**: Sistema de gestión de usuarios y permisos (Admin/User)

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 13.5, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Neon.tech)
- **ORM**: Prisma 5.x
- **Autenticación**: NextAuth.js 4.x
- **Estilos**: Tailwind CSS 3.x
- **Validación**: Zod + React Hook Form
- **UI**: Headless UI + Heroicons
- **Despliegue**: Vercel

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
│   ├── casos/          # Componentes específicos de casos
│   ├── corresponsales/ # Componentes de corresponsales
│   ├── dashboard/      # Componentes del dashboard y KPIs
│   ├── layout/         # Layout y navegación
│   ├── reports/        # Centro de reportes y análisis
│   ├── ui/            # Componentes UI genéricos
│   └── users/         # Gestión de usuarios
├── lib/               # Utilidades y configuraciones
│   ├── auth.ts        # Configuración de NextAuth
│   ├── prisma.ts      # Cliente de Prisma
│   └── utils.ts       # Utilidades generales
├── pages/             # Páginas de Next.js
│   ├── api/          # API Routes
│   │   └── reports/  # APIs específicas de reportes
│   └── ...           # Páginas principales (incluye reportes.tsx)
├── styles/           # Estilos globales
└── types/            # Definiciones de TypeScript

docs/                 # Documentación de cambios implementados
prisma/               # Schema de base de datos
```

## 🚀 Instalación y Configuración

### 1. Clona el repositorio
```bash
git clone <tu-repositorio>
cd casos-corresponsales-admin
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Configura las variables de entorno
Copia `.env.example` a `.env` y configura:

```env
# Database (Neon.tech)
DATABASE_URL="postgresql://username:password@hostname:port/database_name?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
```

### 4. Configura la base de datos
```bash
# Aplica el schema a la base de datos
npx prisma db push

# (Opcional) Abre Prisma Studio
npx prisma studio
```

### 5. Ejecuta en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 💾 Estructura de la Base de Datos

### Tabla `corresponsales`
- `id` (Primary Key)
- `nombreCorresponsal`
- `nombreContacto`
- `nroTelefono`
- `email`
- `web`
- `direccion`
- `pais`

### Tabla `casos`
- `id` (Primary Key)
- `corresponsalId` (Foreign Key)
- `nroCasoAssistravel`
- `nroCasoCorresponsal`
- `fechaInicioCaso`
- `pais`
- `informeMedico`
- `costoUsd`
- `costoMonedaLocal`
- `simboloMoneda`
- `montoAgregado`
- `tieneFactura`
- `nroFactura`
- `fechaEmisionFactura`
- `fechaVencimientoFactura`
- `fechaPagoFactura`
- `estadoInterno` (Enum: ABIERTO, CERRADO, PAUSADO, CANCELADO)
- `estadoDelCaso` (Enum: NO_FEE, REFACTURADO, PARA_REFACTURAR, ON_GOING, COBRADO)
- `observaciones`

## 🚀 Despliegue en Vercel

### 1. Conecta tu repositorio de GitHub
1. Ve a [Vercel](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Next.js

### 2. Configura las variables de entorno en Vercel
En la configuración del proyecto en Vercel, agrega:

```
DATABASE_URL=tu_url_de_neon_tech
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=tu_secret_de_produccion
```

### 3. Despliega
Vercel desplegara automáticamente cuando hagas push a tu rama principal.

## 📝 Configuración de Neon.tech

1. Crea una cuenta en [Neon.tech](https://neon.tech)
2. Crea un nuevo proyecto PostgreSQL
3. Copia la URL de conexión
4. Pégala en tu archivo `.env` como `DATABASE_URL`

## 🔐 Primer Usuario

Para crear tu primer usuario administrador:

1. Ve a `/auth/signup`
2. Crea tu cuenta
3. Inicia sesión en `/auth/signin`

## 📦 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar en producción
npm run lint         # Linter
npx prisma db push   # Aplicar schema a DB
npx prisma studio    # Abrir Prisma Studio
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que la `DATABASE_URL` sea correcta
- Asegúrate de que Neon.tech esté funcionando
- Ejecuta `npx prisma db push` para aplicar el schema

### Error de autenticación
- Verifica que `NEXTAUTH_SECRET` esté configurado
- En producción, asegúrate de que `NEXTAUTH_URL` sea la URL correcta

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

---

**Desarrollado por Orelvis Rguez** 🤖
