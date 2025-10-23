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
 * Equivalente a la función createLocalDate del backend
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque los meses en JS van de 0 a 11
}