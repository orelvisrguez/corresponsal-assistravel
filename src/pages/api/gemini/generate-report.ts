import { NextApiRequest, NextApiResponse } from 'next';

interface ReportRequest {
  tipo: 'ESTADISTICO_GENERAL' | 'FINANCIERO' | 'CASOS' | 'CORRESPONSAL' | 'FACTURACION';
  fechaInicio: string;
  fechaFin: string;
  datos: any;
  filtros?: any;
}

// Configuración de la API de Google Gemini
const GEMINI_API_KEY = 'AIzaSyC6CZKb5LZcoix0aR9IOLITPmO3N1-0IGc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Función para generar prompts específicos según el tipo de informe
function generatePromptForReport(tipo: string, fechaInicio: string, fechaFin: string, datos: any, filtros?: any): string {
  const fechaInicioFormatted = new Date(fechaInicio).toLocaleDateString('es-ES');
  const fechaFinFormatted = new Date(fechaFin).toLocaleDateString('es-ES');
  
  const datosResumen = datos ? JSON.stringify(datos, null, 2) : 'No hay datos específicos disponibles';
  const filtrosTexto = filtros ? `Filtros aplicados: ${JSON.stringify(filtros, null, 2)}` : '';

  const promptsBase = {
    ESTADISTICO_GENERAL: `Genera un informe estadístico general profesional y detallado para el período del ${fechaInicioFormatted} al ${fechaFinFormatted}.

El informe debe incluir:
- Resumen ejecutivo con métricas clave
- Análisis estadístico de casos y operaciones
- Distribución por estados y categorías
- Tendencias observadas durante el período
- Análisis de eficiencia operativa
- Recomendaciones estratégicas basadas en los datos

Datos disponibles:
${datosResumen}

${filtrosTexto}

Formato el informe en Markdown con títulos, subtítulos, listas y tablas cuando sea apropiado. Utiliza un tono profesional y datos específicos extraídos de la información proporcionada.`,

    FINANCIERO: `Genera un informe financiero completo y profesional para el período del ${fechaInicioFormatted} al ${fechaFinFormatted}.

El informe debe incluir:
- Resumen ejecutivo financiero
- Análisis de ingresos por categoría y moneda
- Métricas de rentabilidad (ROI, márgenes)
- Estado de facturación y cobranzas
- Análisis de flujo de caja
- Proyecciones financieras
- Recomendaciones para optimización financiera

Datos disponibles:
${datosResumen}

${filtrosTexto}

Formato el informe en Markdown con gráficos de texto cuando sea útil. Incluye análisis cuantitativo y cualitativo de la situación financiera.`,

    CASOS: `Genera un informe detallado de gestión de casos para el período del ${fechaInicioFormatted} al ${fechaFinFormatted}.

El informe debe incluir:
- Resumen ejecutivo de gestión de casos
- Distribución de casos por estado (abiertos, cerrados, pausados)
- Análisis por complejidad y tipo de caso
- Tiempos promedio de resolución
- Distribución geográfica y por corresponsales
- Métricas de eficiencia y calidad
- Identificación de cuellos de botella
- Recomendaciones para mejora de procesos

Datos disponibles:
${datosResumen}

${filtrosTexto}

Presenta el informe en Markdown con métricas específicas y análisis detallado de la operación.`,

    CORRESPONSAL: `Genera un informe completo de rendimiento de la red de corresponsales para el período del ${fechaInicioFormatted} al ${fechaFinFormatted}.

El informe debe incluir:
- Resumen ejecutivo de la red de corresponsales
- Métricas de cobertura geográfica
- Ranking de corresponsales por volumen y calidad
- Análisis de tiempos de respuesta
- Evaluación de calidad del servicio
- Distribución de casos por corresponsal
- Identificación de corresponsales estrella y áreas de mejora
- Recomendaciones para optimización de la red

Datos disponibles:
${datosResumen}

${filtrosTexto}

Estructura el informe en Markdown con tablas comparativas y análisis de rendimiento individual y colectivo.`,

    FACTURACION: `Genera un informe completo de facturación y cobranzas para el período del ${fechaInicioFormatted} al ${fechaFinFormatted}.

El informe debe incluir:
- Resumen ejecutivo de facturación
- Montos facturados por período y categoría
- Estado de cobranzas y cartera
- Análisis de morosidad y antigüedad de deuda
- Ciclos de facturación y tiempos de cobro
- Análisis de flujo de caja proyectado
- Identificación de riesgos de cobranza
- Recomendaciones para optimización del ciclo de facturación

Datos disponibles:
${datosResumen}

${filtrosTexto}

Presenta el informe en Markdown con análisis financiero detallado y métricas de gestión de cobranzas.`
  };

  return promptsBase[tipo as keyof typeof promptsBase] || promptsBase.ESTADISTICO_GENERAL;
}

// Función para llamar a la API de Google Gemini
async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extraer el texto generado de la respuesta
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Formato de respuesta inesperado de la API');
    }
  } catch (error) {
    console.error('Error llamando a Gemini API:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('=== GENERACIÓN DE INFORME CON GEMINI API ===');
    
    const { tipo, fechaInicio, fechaFin, datos, filtros }: ReportRequest = req.body;

    console.log('Datos recibidos:', { tipo, fechaInicio, fechaFin, filtros });

    if (!tipo || !fechaInicio || !fechaFin || !datos) {
      console.log('Error: Faltan parámetros requeridos');
      return res.status(400).json({ message: 'Faltan parámetros requeridos' });
    }

    // Generar el prompt específico para el tipo de informe
    const prompt = generatePromptForReport(tipo, fechaInicio, fechaFin, datos, filtros);
    console.log('Prompt generado para Gemini API');

    // Llamar a la API de Google Gemini
    console.log('Llamando a Gemini API...');
    const contenidoGenerado = await callGeminiAPI(prompt);
    console.log('Respuesta recibida de Gemini API');

    // Convertir Markdown a texto plano para la versión de texto
    const contenidoTextoPlano = contenidoGenerado
      .replace(/#{1,6}\s+/g, '') // Remover headers markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover bold
      .replace(/\*(.*?)\*/g, '$1') // Remover italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remover links
      .replace(/`(.*?)`/g, '$1') // Remover code
      .replace(/\|.*\|/g, '') // Remover tablas
      .replace(/\n\s*\n/g, '\n\n') // Limpiar espacios extra
      .trim();

    res.status(200).json({
      success: true,
      data: {
        contenidoMarkdown: contenidoGenerado,
        contenidoTextoPlano,
        prompt: `Informe ${tipo} generado con IA para el período ${fechaInicio} al ${fechaFin}`,
        datosUtilizados: datos,
        metadatos: {
          fechaGeneracion: new Date(),
          tokenCount: contenidoGenerado.length,
          modelo: 'gemini-2.0-flash',
          filtros,
          esSimulacion: false,
          mensaje: 'Informe generado con Google Gemini AI'
        }
      }
    });

    console.log('=== INFORME GENERADO EXITOSAMENTE CON GEMINI ===');

  } catch (error) {
    console.error('Error generando informe con Gemini:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: 'Error al comunicarse con la API de Google Gemini'
    });
  }
}