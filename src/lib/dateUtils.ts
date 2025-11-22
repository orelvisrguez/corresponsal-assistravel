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
    
    // Extraer componentes de fecha y formatear usando UTC para evitar problemas de timezone
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0') // Mes empieza en 0
    const day = String(d.getUTCDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * Crea una fecha local a partir de diferentes tipos de entrada
 * VERSIÓN ROBUSTA: Maneja strings, números (Excel serial) y Date objects
 * Esta función es crítica para el funcionamiento correcto en Vercel
 */
export function createLocalDate(dateInput: any): Date {
  // Si es null, undefined o vacío, retornar fecha actual
  if (!dateInput || dateInput === '') {
    return new Date()
  }
  
  // Si ya es un Date válido, devolverlo
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput
  }
  
  // Si es un número, podría ser Excel serial date
  if (typeof dateInput === 'number') {
    // Excel cuenta desde 1900-01-01, JavaScript desde 1970-01-01
    // Excel serial 1 = 1900-01-01, pero Excel tiene un bug donde 1900-02-29 existe
    // Por eso restamos 2 en lugar de 1
    const excelEpoch = new Date(1900, 0, 1) // 1900-01-01
    const date = new Date(excelEpoch.getTime() + (dateInput - 2) * 24 * 60 * 60 * 1000)
    
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // Si es string, intentar parsear
  if (typeof dateInput === 'string') {
    // Si está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Si está en formato DD/MM/YYYY o MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
      const parts = dateInput.split('/')
      // Asumir DD/MM/YYYY (formato común en español)
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10)
      const year = parseInt(parts[2], 10)
      
      const date = new Date(year, month - 1, day)
      
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    
    // Intentar parseo general como último recurso
    const parsedDate = new Date(dateInput)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate
    }
    
    throw new Error(`No se pudo parsear la fecha: ${dateInput}`)
  }
  
  // Si no se puede convertir, retornar fecha actual
  console.warn(`No se pudo convertir la fecha: ${dateInput}, usando fecha actual`)
  return new Date()
}

/**
 * Función alternativa más explícita para casos problemáticos
 * VERSIÓN ROBUSTA: Fuerza que la fecha se interprete sin timezone y maneja múltiples formatos
 */
export function createSafeDate(dateInput: any): Date {
  // Si no es string, intentar convertir primero
  if (typeof dateInput !== 'string') {
    return createLocalDate(dateInput)
  }
  
  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    throw new Error(`Formato de fecha inválido: ${dateInput}. Use YYYY-MM-DD`)
  }
  
  const [year, month, day] = dateInput.split('-').map(Number)
  
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
  
  // Extraer componentes UTC de fecha y formatear
  // Esto evita los problemas de timezone de toISOString() y asegura consistencia
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0') // Mes empieza en 0
  const day = String(date.getUTCDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}