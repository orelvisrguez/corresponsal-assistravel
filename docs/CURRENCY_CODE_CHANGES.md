# Cambios en Sistema de Monedas - Códigos ISO 4217

## Resumen de Modificaciones

Se ha actualizado el sistema de monedas para usar códigos internacionales ISO 4217 en lugar de símbolos monetarios, mejorando la estandarización y claridad del sistema.

## Archivos Modificados

### 1. `/src/types/index.ts`
**Cambio:** Actualización del array `MONEDAS`
- **Antes:** Etiquetas con símbolos: `'Dólar Estadounidense ($)'`
- **Después:** Etiquetas con códigos: `'USD - Dólar Estadounidense'`

```typescript
// ANTES
{ value: 'USD', label: 'Dólar Estadounidense ($)' }

// DESPUÉS  
{ value: 'USD', label: 'USD - Dólar Estadounidense' }
```

### 2. `/src/lib/calculations.ts`
**Cambio:** Función `formatearMoneda` actualizada
- **Antes:** Mostraba símbolos: `$1,250.00`
- **Después:** Muestra códigos: `1.250,00 USD`

```typescript
// ANTES
export function formatearMoneda(value, currency = 'USD'): string {
  const num = Number(value) || 0
  
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  return `${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// DESPUÉS
export function formatearMoneda(value, currency = 'USD'): string {
  const num = Number(value) || 0
  const formattedValue = num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  return `${formattedValue} ${currency}`
}
```

### 3. `/src/lib/utils.ts`
**Cambio:** Función `formatCurrency` actualizada
- **Antes:** Usaba `Intl.NumberFormat` con símbolos automáticos
- **Después:** Formato manual con códigos de moneda

```typescript
// ANTES
export function formatCurrency(amount, currency = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(numAmount)
}

// DESPUÉS
export function formatCurrency(amount, currency = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const formattedValue = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
  
  return `${formattedValue} ${currency}`
}
```

### 4. `/src/components/casos/CasoList.tsx`
**Cambio:** Orden de visualización en moneda local
- **Antes:** `ARS $1,250.50`
- **Después:** `1.250,50 ARS`

## Monedas Soportadas

Las siguientes monedas están configuradas con sus códigos ISO 4217:

| Código | Moneda |
|--------|--------|
| USD | Dólar Estadounidense |
| EUR | Euro |
| GBP | Libra Esterlina |
| JPY | Yen Japonés |
| ARS | Peso Argentino |
| BRL | Real Brasileño |
| CLP | Peso Chileno |
| COP | Peso Colombiano |
| MXN | Peso Mexicano |
| PEN | Sol Peruano |
| UYU | Peso Uruguayo |
| CAD | Dólar Canadiense |
| CHF | Franco Suizo |
| CNY | Yuan Chino |

## Impacto en la Interfaz

### Formularios
- Los selectores de moneda ahora muestran códigos ISO en lugar de símbolos
- Ejemplo: "USD - Dólar Estadounidense" en lugar de "Dólar Estadounidense ($)"

### Visualización de Datos
- Todos los valores monetarios se muestran con el formato: `valor CÓDIGO`
- Ejemplo: `1.250,00 USD` en lugar de `$1,250.00`

### Reportes y Estadísticas
- Las funciones de formateo mantienen la consistencia en todo el sistema
- Los reportes financieros usan el mismo formato estandardizado

## Beneficios

1. **Estandarización:** Uso de códigos ISO 4217 reconocidos internacionalmente
2. **Claridad:** Eliminación de ambigüedad entre símbolos similares ($, $, $)
3. **Consistencia:** Formato uniforme en toda la aplicación
4. **Internacionalización:** Preparación para futuras expansiones globales

## Archivos No Modificados

Los siguientes archivos mantienen su funcionalidad sin cambios:
- Validaciones (`/src/lib/validations.ts`)
- Esquemas de base de datos
- APIs endpoints
- Lógica de negocio de cálculos

## Pruebas Recomendadas

1. Verificar formularios de creación/edición de casos
2. Comprobar visualización en listas y tablas
3. Revisar reportes financieros
4. Validar exportación de datos
5. Confirmar vista de detalles de corresponsales

---

**Fecha de implementación:** 2025-10-15  
**Estado:** Completado y listo para producción
