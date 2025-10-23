import { prisma } from './prisma';
import { AccionHistorial } from '@prisma/client';

interface RegistrarCambioParams {
  casoId: number;
  usuarioEmail: string;
  usuarioNombre?: string;
  accion: AccionHistorial;
  campoModificado?: string;
  valorAnterior?: any;
  valorNuevo?: any;
}

/**
 * Registra un cambio en el historial del caso
 */
export async function registrarCambio(params: RegistrarCambioParams) {
  const {
    casoId,
    usuarioEmail,
    usuarioNombre,
    accion,
    campoModificado,
    valorAnterior,
    valorNuevo
  } = params;

  try {
    await prisma.casoHistorial.create({
      data: {
        casoId,
        usuarioEmail,
        usuarioNombre: usuarioNombre || usuarioEmail.split('@')[0],
        accion,
        campoModificado,
        valorAnterior: valorAnterior !== undefined ? serializarValor(valorAnterior) : null,
        valorNuevo: valorNuevo !== undefined ? serializarValor(valorNuevo) : null
      }
    });
  } catch (error) {
    console.error('Error al registrar cambio en historial:', error);
    // No lanzamos el error para no interrumpir la operación principal
  }
}

/**
 * Compara dos objetos y registra los cambios en el historial
 */
export async function registrarCambiosMultiples(
  casoId: number,
  usuarioEmail: string,
  usuarioNombre: string | undefined,
  datosAnteriores: any,
  datosNuevos: any,
  camposAIgnorar: string[] = ['updatedAt', 'createdAt']
) {
  const cambios: Array<{
    campo: string;
    valorAnterior: any;
    valorNuevo: any;
  }> = [];

  // Detectar campos modificados
  for (const campo in datosNuevos) {
    if (camposAIgnorar.includes(campo)) continue;
    
    const valorAnterior = datosAnteriores[campo];
    const valorNuevo = datosNuevos[campo];

    // Comparar valores (manejando nulos y undefined)
    if (!sonValoresIguales(valorAnterior, valorNuevo)) {
      cambios.push({
        campo,
        valorAnterior,
        valorNuevo
      });
    }
  }

  // Registrar cada cambio
  for (const cambio of cambios) {
    const accion = (cambio.campo === 'estadoInterno' || cambio.campo === 'estadoDelCaso') 
      ? AccionHistorial.CAMBIO_ESTADO 
      : AccionHistorial.EDICION;

    await registrarCambio({
      casoId,
      usuarioEmail,
      usuarioNombre,
      accion,
      campoModificado: cambio.campo,
      valorAnterior: cambio.valorAnterior,
      valorNuevo: cambio.valorNuevo
    });
  }

  return cambios.length;
}

/**
 * Serializa un valor para guardarlo como string
 */
function serializarValor(valor: any): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  
  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }
  
  return String(valor);
}

/**
 * Compara dos valores considerando tipos especiales
 */
function sonValoresIguales(valor1: any, valor2: any): boolean {
  // Ambos nulos o undefined
  if ((valor1 === null || valor1 === undefined) && (valor2 === null || valor2 === undefined)) {
    return true;
  }
  
  // Uno es null/undefined y el otro no
  if ((valor1 === null || valor1 === undefined) !== (valor2 === null || valor2 === undefined)) {
    return false;
  }
  
  // Fechas
  if (valor1 instanceof Date && valor2 instanceof Date) {
    return valor1.getTime() === valor2.getTime();
  }
  
  // Objetos Decimal de Prisma
  if (valor1?.constructor?.name === 'Decimal' || valor2?.constructor?.name === 'Decimal') {
    return Number(valor1) === Number(valor2);
  }
  
  // Objetos
  if (typeof valor1 === 'object' && typeof valor2 === 'object') {
    return JSON.stringify(valor1) === JSON.stringify(valor2);
  }
  
  // Comparación simple
  return valor1 === valor2;
}

/**
 * Obtiene el nombre legible de un campo
 */
export function obtenerNombreCampo(campo: string): string {
  const nombres: Record<string, string> = {
    corresponsalId: 'Corresponsal',
    nroCasoAssistravel: 'Nº Caso Assistravel',
    nroCasoCorresponsal: 'Nº Caso Corresponsal',
    fechaInicioCaso: 'Fecha Inicio',
    pais: 'País',
    informeMedico: 'Informe Médico',
    fee: 'Fee',
    costoUsd: 'Costo USD',
    costoMonedaLocal: 'Costo Moneda Local',
    simboloMoneda: 'Moneda',
    montoAgregado: 'Monto Agregado',
    tieneFactura: 'Tiene Factura',
    nroFactura: 'Nº Factura',
    fechaEmisionFactura: 'Fecha Emisión Factura',
    fechaVencimientoFactura: 'Fecha Vencimiento Factura',
    fechaPagoFactura: 'Fecha Pago Factura',
    estadoInterno: 'Estado Interno',
    estadoDelCaso: 'Estado del Caso',
    observaciones: 'Observaciones'
  };
  
  return nombres[campo] || campo;
}

/**
 * Formatea un valor para mostrarlo en el historial
 */
export function formatearValor(campo: string, valor: string): string {
  if (!valor || valor === '') return '(vacío)';
  
  // Fechas
  if (campo.includes('fecha') || campo.includes('Fecha')) {
    try {
      const fecha = new Date(valor);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return valor;
    }
  }
  
  // Booleanos
  if (valor === 'true') return 'Sí';
  if (valor === 'false') return 'No';
  
  // Números con decimales (montos)
  if (campo.includes('costo') || campo.includes('fee') || campo.includes('monto')) {
    const numero = parseFloat(valor);
    if (!isNaN(numero)) {
      return `$${numero.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;  
    }
  }
  
  return valor;
}
