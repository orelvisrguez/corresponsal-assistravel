/**
 * Script para convertir datos existentes de mayúsculas a formato de oración
 * Aplica el formateo toSentenceCase a campos de texto en la base de datos
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Convierte texto a formato de oración (cada palabra con inicial mayúscula)
 * Ejemplo: "HOLA MUNDO" -> "Hola Mundo"
 * @param {string} text - Texto a convertir
 * @returns {string} - Texto formateado
 */
function toSentenceCase(text) {
  if (!text || typeof text !== 'string') return text
  
  // Convertir todo a minúsculas primero
  let result = text.toLowerCase()
  
  // Dividir en palabras y capitalizar la primera letra de cada palabra
  result = result
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Manejar casos especiales como números de teléfono, emails, URLs
      if (word.includes('@') || word.includes('.com') || /^\d/.test(word)) {
        return word // No modificar números, emails o URLs
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
  
  return result
}

async function convertCorresponsalesToSentenceCase() {
  console.log('🔄 Iniciando conversión de datos a formato de oración...')
  
  try {
    // Obtener todos los corresponsales
    const corresponsales = await prisma.corresponsal.findMany()
    
    let convertedCount = 0
    
    for (const corresponsal of corresponsales) {
      let needsUpdate = false
      const updates = {}
      
      // Verificar y convertir nombreCorresponsal
      if (corresponsal.nombreCorresponsal && corresponsal.nombreCorresponsal === corresponsal.nombreCorresponsal.toUpperCase()) {
        const newNombre = toSentenceCase(corresponsal.nombreCorresponsal)
        if (newNombre !== corresponsal.nombreCorresponsal) {
          updates.nombreCorresponsal = newNombre
          needsUpdate = true
          console.log(`📝 Convertido: "${corresponsal.nombreCorresponsal}" -> "${newNombre}"`)
        }
      }
      
      // Verificar y convertir nombreContacto
      if (corresponsal.nombreContacto && corresponsal.nombreContacto === corresponsal.nombreContacto.toUpperCase()) {
        const newNombreContacto = toSentenceCase(corresponsal.nombreContacto)
        if (newNombreContacto !== corresponsal.nombreContacto) {
          updates.nombreContacto = newNombreContacto
          needsUpdate = true
          console.log(`📝 Convertido: "${corresponsal.nombreContacto}" -> "${newNombreContacto}"`)
        }
      }
      
      // Verificar y convertir direccion
      if (corresponsal.direccion && corresponsal.direccion === corresponsal.direccion.toUpperCase()) {
        const newDireccion = toSentenceCase(corresponsal.direccion)
        if (newDireccion !== corresponsal.direccion) {
          updates.direccion = newDireccion
          needsUpdate = true
          console.log(`📝 Convertido: "${corresponsal.direccion}" -> "${newDireccion}"`)
        }
      }
      
      // Verificar y convertir pais
      if (corresponsal.pais && corresponsal.pais === corresponsal.pais.toUpperCase()) {
        const newPais = toSentenceCase(corresponsal.pais)
        if (newPais !== corresponsal.pais) {
          updates.pais = newPais
          needsUpdate = true
          console.log(`📝 Convertido: "${corresponsal.pais}" -> "${newPais}"`)
        }
      }
      
      // Aplicar actualizaciones si hay cambios
      if (needsUpdate) {
        await prisma.corresponsal.update({
          where: { id: corresponsal.id },
          data: updates
        })
        convertedCount++
      }
    }
    
    console.log(`✅ Conversión completada: ${convertedCount} corresponsales convertidos`)
    
  } catch (error) {
    console.error('❌ Error durante la conversión:', error)
    throw error
  }
}

async function convertCasosToSentenceCase() {
  console.log('🔄 Iniciando conversión de casos a formato de oración...')
  
  try {
    // Obtener todos los casos
    const casos = await prisma.caso.findMany()
    
    let convertedCount = 0
    
    for (const caso of casos) {
      let needsUpdate = false
      const updates = {}
      
      // Verificar y convertir pais
      if (caso.pais && caso.pais === caso.pais.toUpperCase()) {
        const newPais = toSentenceCase(caso.pais)
        if (newPais !== caso.pais) {
          updates.pais = newPais
          needsUpdate = true
          console.log(`📝 Convertido caso ${caso.id} país: "${caso.pais}" -> "${newPais}"`)
        }
      }
      
      // Verificar y convertir observaciones (si es solo texto en mayúsculas)
      if (caso.observaciones && caso.observaciones === caso.observaciones.toUpperCase() && !caso.observaciones.includes('\n')) {
        const newObservaciones = toSentenceCase(caso.observaciones)
        if (newObservaciones !== caso.observaciones) {
          updates.observaciones = newObservaciones
          needsUpdate = true
          console.log(`📝 Convertido caso ${caso.id} observaciones: "${caso.observaciones}" -> "${newObservaciones}"`)
        }
      }
      
      // Aplicar actualizaciones si hay cambios
      if (needsUpdate) {
        await prisma.caso.update({
          where: { id: caso.id },
          data: updates
        })
        convertedCount++
      }
    }
    
    console.log(`✅ Conversión de casos completada: ${convertedCount} casos convertidos`)
    
  } catch (error) {
    console.error('❌ Error durante la conversión de casos:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Script de conversión a formato de oración iniciado')
  
  try {
    await convertCorresponsalesToSentenceCase()
    await convertCasosToSentenceCase()
    
    console.log('🎉 ¡Conversión completada exitosamente!')
    
  } catch (error) {
    console.error('💥 Error en el script de conversión:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
  main()
}

module.exports = {
  toSentenceCase,
  convertCorresponsalesToSentenceCase,
  convertCasosToSentenceCase
}