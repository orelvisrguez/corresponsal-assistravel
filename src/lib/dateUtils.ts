/**
 * Utilidades para manejo consistente de fechas
 * Evita problemas de timezone entre frontend y backend
 */

/**
 * Convierte una fecha a string en formato YYYY-MM-DD para inputs
 * Mantiene la fecha exacta sin conversión de timezone
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  try {
    // Si ya es string en formato YYYY-MM-DD, devolver directamente
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    
    // Crear fecha usando componentes para evitar timezone issues
    const d = new Date(date)
    
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) {
      return ''
    }
    
    // Extraer componentes de fecha y formatear
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0') // Mes empieza en 0
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * Crea una fecha local a partir de string YYYY-MM-DD
 * VERSIÓN ROBUSTA: Evita problemas de timezone creando fecha "pura"
 * Esta función es crítica para el funcionamiento correcto en Vercel
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Crear fecha usando constructor Date con componentes directos
  // JavaScript crea la fecha como local sin conversión de timezone
  const date = new Date(year, month - 1, day)
  
  // Verificar que la fecha sea válida
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateString}`)
  }
  
  return date
}

/**
 * Función alternativa más explícita para casos problemáticos
 * Fuerza que la fecha se interprete sin timezone
 */
export function createSafeDate(dateString: string): Date {
  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Formato de fecha inválido: ${dateString}. Use YYYY-MM-DD`)
  }
  
  const [year, month, day] = dateString.split('-').map(Number)
  
  // Crear fecha usando Date.UTC para evitar timezone issues
  const utcDate = new Date(Date.UTC(year, month - 1, day))
  
  // Convertir de vuelta a fecha local (elimina el offset UTC)
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate()
  )
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD de forma segura
 * SIN usar toISOString() para evitar problemas de timezone
 * CORRECCIÓN: Reemplaza el patrón problemático toISOString().split('T')[0]
 */
export function dateToInputString(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return ''
  }
  
  // Extraer componentes locales de fecha y formatear
  // Esto evita los problemas de timezone de toISOString()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Mes empieza en 0
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}