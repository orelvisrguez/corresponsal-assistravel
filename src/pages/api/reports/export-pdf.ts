import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { title, content, metadata } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Faltan título o contenido' });
    }

    // Convertir Markdown a HTML para el PDF
    const htmlContent = convertMarkdownToHTML(content);
    
    // Crear el HTML completo del PDF
    const fullHTML = generatePDFHTML(title, htmlContent, metadata);

    // Para esta implementación, retornamos el HTML que puede ser convertido a PDF en el frontend
    // usando bibliotecas como puppeteer o html2pdf
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.html"`);
    res.status(200).send(fullHTML);

  } catch (error) {
    console.error('Error exportando a PDF:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

function convertMarkdownToHTML(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #333;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 22px; font-weight: bold; margin: 25px 0 15px 0; color: #333;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 26px; font-weight: bold; margin: 30px 0 20px 0; color: #333;">$1</h1>')
    
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
    
    // Lists
    .replace(/^\* (.*$)/gim, '<li style="margin: 5px 0; margin-left: 20px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin: 5px 0; margin-left: 20px;">$1</li>')
    
    // Tables (basic support)
    .replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => `<td style="border: 1px solid #ddd; padding: 8px;">${cell.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    
    // Line breaks and paragraphs
    .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6; color: #555;">')
    .replace(/\n/g, '<br>')
    
    // Wrap content in paragraphs
    .split('\n').map(line => {
      if (line.trim() && !line.startsWith('<h') && !line.startsWith('<li')) {
        return `<p style="margin: 10px 0; line-height: 1.6; color: #555;">${line}</p>`
      }
      return line
    }).join('\n')
}

function generatePDFHTML(title: string, content: string, metadata: any): string {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            color: #333;
        }
        
        .header {
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #4F46E5;
            margin: 0 0 10px 0;
        }
        
        .subtitle {
            font-size: 16px;
            color: #666;
            margin: 0;
        }
        
        .metadata {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0 30px 0;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        
        .metadata-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .metadata-value {
            color: #6B7280;
            font-size: 14px;
        }
        
        .content {
            line-height: 1.8;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #9CA3AF;
            font-size: 12px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .header {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${title}</h1>
        <p class="subtitle">Informe generado automáticamente con inteligencia artificial</p>
    </div>
    
    ${metadata ? `
    <div class="metadata">
        <div class="metadata-grid">
            <div class="metadata-item">
                <span class="metadata-label">Tipo de Informe</span>
                <span class="metadata-value">${metadata.tipo || 'No especificado'}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Período de Análisis</span>
                <span class="metadata-value">
                    ${metadata.fechaInicio ? new Date(metadata.fechaInicio).toLocaleDateString('es-ES') : ''} - 
                    ${metadata.fechaFin ? new Date(metadata.fechaFin).toLocaleDateString('es-ES') : ''}
                </span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Fecha de Generación</span>
                <span class="metadata-value">${metadata.fechaGeneracion ? new Date(metadata.fechaGeneracion).toLocaleDateString('es-ES') : currentDate}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Sistema</span>
                <span class="metadata-value">Plataforma de Gestión - Informes Automáticos</span>
            </div>
        </div>
    </div>
    ` : ''}
    
    <div class="content">
        ${content}
    </div>
    
    <div class="footer">
        <p>Documento generado el ${currentDate} | Plataforma de Gestión - Informes Automáticos</p>
        <p>Este informe ha sido generado automáticamente utilizando inteligencia artificial</p>
    </div>
</body>
</html>
  `.trim();
}