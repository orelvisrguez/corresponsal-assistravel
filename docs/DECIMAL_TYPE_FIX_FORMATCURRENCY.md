# Fix: TypeScript Compilation Error with Decimal Types in formatCurrency

## Problem
The application was failing to compile with the following TypeScript error:
```
Type error: Argument of type 'Decimal' is not assignable to parameter of type 'string | number'.
```

This occurred when trying to pass Prisma `Decimal` values directly to the `formatCurrency` function.

## Root Cause
- Prisma uses the `Decimal` type for monetary fields (`costoUsd`, `fee`, `costoTotal`, etc.) to maintain precision
- The `formatCurrency` function in `src/lib/utils.ts` expects `number | string` parameters
- TypeScript correctly prevents direct assignment from `Decimal` to `number | string`

## Solution
Convert Prisma `Decimal` values to JavaScript `number` using the `Number()` constructor before passing them to `formatCurrency`.

## Files Modified

### 1. `/src/components/corresponsales/CorresponsalView.tsx`
**Lines Fixed:**
- Line 326: `formatCurrency(caso.costoUsd)` → `formatCurrency(Number(caso.costoUsd))`
- Line 336: `formatCurrency(caso.fee)` → `formatCurrency(Number(caso.fee))`

### 2. `/src/components/reports/InformeFinanciero.tsx`
**Lines Fixed:**
- Line 510: `formatCurrency(caso.financiero.costoUsd)` → `formatCurrency(Number(caso.financiero.costoUsd))`
- Line 514: `formatCurrency(caso.financiero.montoAgregado)` → `formatCurrency(Number(caso.financiero.montoAgregado))`
- Line 518: `formatCurrency(caso.financiero.costoTotal)` → `formatCurrency(Number(caso.financiero.costoTotal))`

## Pattern for Future Development
When working with Prisma `Decimal` fields in TypeScript:

```typescript
// ❌ Incorrect - Will cause TypeScript error
formatCurrency(caso.costoUsd)

// ✅ Correct - Convert to number first
formatCurrency(Number(caso.costoUsd))

// ✅ Also correct with null safety
formatCurrency(Number(caso.costoUsd) || 0)
```

## Related Issues
This fix is related to the previous fix documented in `PRISMA_DECIMAL_FIX.md` which addressed arithmetic operations with Decimal types.

## Verification
After applying these fixes, the TypeScript compilation should succeed without errors related to Decimal type incompatibility with the `formatCurrency` function.

---
**Date:** 2025-10-15  
**Files Modified:** 2  
**Status:** ✅ Fixed
