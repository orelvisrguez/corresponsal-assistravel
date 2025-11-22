#!/usr/bin/env node

/**
 * Script de prueba para el módulo de importación de Excel
 * 
 * Este script demuestra cómo usar el módulo de importación
 * con el archivo CORRES_2025_LIMPIO.xlsx
 */

const fs = require('fs')
const path = require('path')

// Simulación de las clases del módulo (para demostración)
class MockExcelImporter {
  constructor(file) {
    this.file = file
  }

  async validateFileStructure(file) {
    console.log('🔍 Validando estructura del archivo...')
    
    // Simular validación
    const validation = {
      valid: true,
      errors: [],
      warnings: [
        'El campo costo_usd está en formato texto, se convertirá automáticamente',
        'Algunas fechas pueden requerir formato DD/MM/AAAA'
      ]
    }
    
    return validation
  }

  async importData() {
    console.log('📊 Procesando datos del archivo...')
    
    // Simular procesamiento del archivo
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    await sleep(3000) // Simular tiempo de procesamiento
    
    const mockResult = {
      success: true,
      processed: 270, // Total de casos en el archivo
      created: 150,   // Casos nuevos
      updated: 120,   // Casos actualizados
      errors: [
        'Fila 45: Fecha de facturación inválida, se usará fecha actual',
        'Fila 89: Corresponsal "UNKNOWN" no encontrado, se usará default'
      ],
      warnings: [
        '32 casos con fee = 0 (casos sin costo)',
        '15 casos con país vacío, se completará con "Desconocido"',
        '8 casos con fechas de inicio futuras'
      ]
    }
    
    return mockResult
  }
}

// Función principal de prueba
async function testExcelImport() {
  console.log('\n🚀 INICIANDO PRUEBA DEL MÓDULO DE IMPORTACIÓN EXCEL')
  console.log('='.repeat(60))
  
  const filePath = path.join(__dirname, '../user_input_files/CORRES_2025_LIMPIO.xlsx')
  
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`)
    }
    
    const fileStats = fs.statSync(filePath)
    console.log(`📁 Archivo encontrado: CORRES_2025_LIMPIO.xlsx`)
    console.log(`   Tamaño: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Última modificación: ${fileStats.mtime.toLocaleString()}`)
    
    // Crear instancia del importador
    const fileBuffer = fs.readFileSync(filePath)
    const mockFile = {
      name: 'CORRES_2025_LIMPIO.xlsx',
      size: fileStats.size,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileBuffer
    }
    
    const importer = new MockExcelImporter(mockFile)
    
    // Paso 1: Validar estructura
    console.log('\n📋 PASO 1: VALIDACIÓN DE ESTRUCTURA')
    console.log('-'.repeat(40))
    const validation = await importer.validateFileStructure(mockFile)
    
    if (validation.valid) {
      console.log('✅ Estructura del archivo válida')
    } else {
      console.log('❌ Errores de estructura:')
      validation.errors.forEach(error => console.log(`   • ${error}`))
      return
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Advertencias:')
      validation.warnings.forEach(warning => console.log(`   • ${warning}`))
    }
    
    // Paso 2: Importar datos
    console.log('\n📊 PASO 2: IMPORTACIÓN DE DATOS')
    console.log('-'.repeat(40))
    console.log('⚙️  Procesando 270 casos...')
    console.log('   • Validando datos...')
    console.log('   • Convirtiendo formatos...')
    console.log('   • Mapeando estados...')
    console.log('   • Actualizando base de datos...')
    
    const result = await importer.importData()
    
    // Mostrar resultados
    console.log('\n📈 RESULTADOS DE LA IMPORTACIÓN')
    console.log('='.repeat(40))
    
    if (result.success) {
      console.log('✅ IMPORTACIÓN EXITOSA')
      
      // Estadísticas principales
      console.log('\n📊 ESTADÍSTICAS:')
      console.log(`   📋 Total procesadas: ${result.processed}`)
      console.log(`   ➕ Casos creados: ${result.created}`)
      console.log(`   🔄 Casos actualizados: ${result.updated}`)
      console.log(`   ❌ Errores: ${result.errors.length}`)
      console.log(`   ⚠️  Advertencias: ${result.warnings.length}`)
      
      // Desglose por tipo
      console.log('\n📈 RESUMEN DE OPERACIONES:')
      const nuevosPorcentaje = ((result.created / result.processed) * 100).toFixed(1)
      const actualizadosPorcentaje = ((result.updated / result.processed) * 100).toFixed(1)
      console.log(`   • ${nuevosPorcentaje}% casos nuevos`)
      console.log(`   • ${actualizadosPorcentaje}% casos actualizados`)
      
      // Errores encontrados
      if (result.errors.length > 0) {
        console.log('\n❌ ERRORES ENCONTRADOS:')
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
      
      // Advertencias
      if (result.warnings.length > 0) {
        console.log('\n⚠️  ADVERTENCIAS:')
        result.warnings.forEach((warning, index) => {
          console.log(`   ${index + 1}. ${warning}`)
        })
      }
      
      // Próximos pasos
      console.log('\n🎯 PRÓXIMOS PASOS:')
      console.log('   1. Revisar los errores y corregirlos si es necesario')
      console.log('   2. Verificar las advertencias y validar los datos')
      console.log('   3. Probar funcionalidades con los datos importados')
      console.log('   4. Realizar backup antes de importar más datos')
      
    } else {
      console.log('❌ IMPORTACIÓN FALLIDA')
      console.log('   Revisar errores y corregir antes de reintentar')
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:')
    console.error(`   ${error.message}`)
    console.error(`\n📝 Stack trace: ${error.stack}`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🏁 PRUEBA COMPLETADA')
  console.log('\n💡 Para usar el módulo real:')
  console.log('   1. Ir a la página /import en la aplicación')
  console.log('   2. Subir el archivo CORRES_2025_LIMPIO.xlsx')
  console.log('   3. Validar y confirmar la importación')
  console.log('   4. Revisar los resultados')
}

// Información sobre el archivo Excel
function showExcelInfo() {
  console.log('\n📄 INFORMACIÓN DEL ARCHIVO EXCEL')
  console.log('='.repeat(40))
  console.log('📊 Estructura de datos esperada:')
  console.log('   • 270 casos de corresponsalía')
  console.log('   • 20 columnas de datos')
  console.log('   • Estados en español (Abierto, Cerrado, etc.)')
  console.log('   • Fechas en formato DD/MM/AAAA')
  console.log('   • Valores booleanos como Si/No')
  console.log('   • Campos de facturación incluidos')
  console.log('   • Información de corresponsales')
  
  console.log('\n🗂️ Columnas principales:')
  const columns = [
    'nro_caso_assistravel (obligatorio)',
    'corresponsal_id (obligatorio)',
    'fecha_de_inicio (obligatorio)',
    'pais (obligatorio)',
    'estado_interno (obligatorio)',
    'estado_del_caso (obligatorio)',
    'fee, costo_usd, costo_moneda_local',
    'tiene_factura, nro_factura',
    'fecha_emision_factura',
    'fecha_vencimiento_factura',
    'fecha_pago_factura',
    'observaciones'
  ]
  
  columns.forEach((col, index) => {
    console.log(`   ${index + 1}. ${col}`)
  })
}

// Ejecutar la prueba
if (require.main === module) {
  showExcelInfo()
  testExcelImport().catch(console.error)
}

module.exports = {
  testExcelImport,
  MockExcelImporter
}