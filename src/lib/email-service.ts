/**
 * Email Service
 *
 * Serviço de envio de emails usando Nodemailer
 * Suporta notificações de testes, inspeções e relatórios públicos
 */

import nodemailer from 'nodemailer';

// Configuração do transporter
const createTransporter = () => {
  // Usar variáveis de ambiente para configuração
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  // Se não tiver configuração, usar ethereal (teste)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[EMAIL] SMTP credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport(config);
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia um email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('[EMAIL] Skipping email send - no transporter configured');
    console.log('[EMAIL] Subject:', options.subject);
    console.log('[EMAIL] To:', options.to);
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
}

/**
 * Template: Notificação de teste reprovado
 */
export function getTestFailEmailTemplate(data: {
  companyName: string;
  projectName: string;
  anchorPointNumber: string;
  testDate: string;
  technician: string;
  observations?: string;
  projectUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .details { background-color: white; padding: 15px; margin: 20px 0; }
    .details-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-row:last-child { border-bottom: none; }
    .label { font-weight: bold; display: inline-block; width: 150px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #6941DE; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Teste de Ancoragem Reprovado</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>Atenção:</strong> Um teste de ancoragem foi reprovado e requer atenção imediata.
      </div>

      <div class="details">
        <div class="details-row">
          <span class="label">Empresa:</span>
          <span>${data.companyName}</span>
        </div>
        <div class="details-row">
          <span class="label">Projeto:</span>
          <span>${data.projectName}</span>
        </div>
        <div class="details-row">
          <span class="label">Ponto:</span>
          <span>${data.anchorPointNumber}</span>
        </div>
        <div class="details-row">
          <span class="label">Data do Teste:</span>
          <span>${data.testDate}</span>
        </div>
        <div class="details-row">
          <span class="label">Técnico:</span>
          <span>${data.technician}</span>
        </div>
        ${data.observations ? `
        <div class="details-row">
          <span class="label">Observações:</span>
          <span>${data.observations}</span>
        </div>
        ` : ''}
      </div>

      ${data.projectUrl ? `
      <div style="text-align: center;">
        <a href="${data.projectUrl}" class="button">Ver Projeto</a>
      </div>
      ` : ''}

      <p>Por favor, tome as medidas necessárias para corrigir a situação.</p>
    </div>
    <div class="footer">
      <p>Este é um email automático do AnchorView</p>
      <p>Para alterar suas preferências de notificação, acesse as configurações da empresa</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template: Notificação de inspeção vencida/vencendo
 */
export function getInspectionDueEmailTemplate(data: {
  companyName: string;
  projectName: string;
  anchorPointNumber: string;
  dueDate: string;
  daysUntilDue: number;
  projectUrl?: string;
}): string {
  const isOverdue = data.daysUntilDue < 0;
  const urgencyColor = isOverdue ? '#dc2626' : data.daysUntilDue <= 7 ? '#f59e0b' : '#3b82f6';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .alert { background-color: #fef2f2; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; }
    .details { background-color: white; padding: 15px; margin: 20px 0; }
    .details-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-row:last-child { border-bottom: none; }
    .label { font-weight: bold; display: inline-block; width: 150px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #6941DE; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isOverdue ? '⚠️ Inspeção Vencida' : '📅 Inspeção Programada'}</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>${isOverdue ? 'Atenção!' : 'Lembrete:'}</strong>
        ${isOverdue
          ? `A inspeção deste ponto está vencida há ${Math.abs(data.daysUntilDue)} dias.`
          : `A inspeção deste ponto está programada para daqui a ${data.daysUntilDue} dias.`
        }
      </div>

      <div class="details">
        <div class="details-row">
          <span class="label">Empresa:</span>
          <span>${data.companyName}</span>
        </div>
        <div class="details-row">
          <span class="label">Projeto:</span>
          <span>${data.projectName}</span>
        </div>
        <div class="details-row">
          <span class="label">Ponto:</span>
          <span>${data.anchorPointNumber}</span>
        </div>
        <div class="details-row">
          <span class="label">Data Programada:</span>
          <span>${data.dueDate}</span>
        </div>
      </div>

      ${data.projectUrl ? `
      <div style="text-align: center;">
        <a href="${data.projectUrl}" class="button">Ver Projeto</a>
      </div>
      ` : ''}

      <p>${isOverdue
        ? 'Por favor, programe a inspeção o mais rápido possível.'
        : 'Certifique-se de agendar o técnico responsável.'
      }</p>
    </div>
    <div class="footer">
      <p>Este é um email automático do AnchorView</p>
      <p>Para alterar suas preferências de notificação, acesse as configurações da empresa</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template: Notificação de problema reportado publicamente
 */
export function getPublicReportEmailTemplate(data: {
  companyName: string;
  projectName: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  description: string;
  anchorPointNumber?: string;
  reportDate: string;
  reportId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .alert { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .details { background-color: white; padding: 15px; margin: 20px 0; }
    .details-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .details-row:last-child { border-bottom: none; }
    .label { font-weight: bold; display: inline-block; width: 150px; }
    .description { background-color: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📢 Novo Problema Reportado</h1>
    </div>
    <div class="content">
      <div class="alert">
        <strong>Novo relatório:</strong> Um problema foi reportado através da visualização pública do projeto.
      </div>

      <div class="details">
        <div class="details-row">
          <span class="label">Empresa:</span>
          <span>${data.companyName}</span>
        </div>
        <div class="details-row">
          <span class="label">Projeto:</span>
          <span>${data.projectName}</span>
        </div>
        ${data.anchorPointNumber ? `
        <div class="details-row">
          <span class="label">Ponto:</span>
          <span>${data.anchorPointNumber}</span>
        </div>
        ` : ''}
        <div class="details-row">
          <span class="label">Data:</span>
          <span>${data.reportDate}</span>
        </div>
        <div class="details-row">
          <span class="label">ID do Relatório:</span>
          <span>${data.reportId}</span>
        </div>
      </div>

      ${data.reporterName || data.reporterEmail || data.reporterPhone ? `
      <div class="details">
        <h3 style="margin-top: 0;">Informações do Relator:</h3>
        ${data.reporterName ? `
        <div class="details-row">
          <span class="label">Nome:</span>
          <span>${data.reporterName}</span>
        </div>
        ` : ''}
        ${data.reporterEmail ? `
        <div class="details-row">
          <span class="label">Email:</span>
          <span>${data.reporterEmail}</span>
        </div>
        ` : ''}
        ${data.reporterPhone ? `
        <div class="details-row">
          <span class="label">Telefone:</span>
          <span>${data.reporterPhone}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="description">
        <h3 style="margin-top: 0;">Descrição do Problema:</h3>
        <p>${data.description}</p>
      </div>

      <p>Por favor, revise este relatório e tome as medidas apropriadas.</p>
    </div>
    <div class="footer">
      <p>Este é um email automático do AnchorView</p>
      <p>Para gerenciar relatórios públicos, acesse o painel administrativo</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template: Relatório semanal/digest
 */
export function getWeeklyDigestEmailTemplate(data: {
  companyName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    testsPerformed: number;
    testsFailed: number;
    newProjects: number;
    newPoints: number;
    inspectionsDue: number;
  };
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6941DE; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background-color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .stat-number { font-size: 32px; font-weight: bold; color: #6941DE; }
    .stat-label { color: #666; font-size: 14px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal</h1>
      <p>${data.weekStart} - ${data.weekEnd}</p>
    </div>
    <div class="content">
      <h2>Resumo da Semana - ${data.companyName}</h2>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-number">${data.stats.testsPerformed}</div>
          <div class="stat-label">Testes Realizados</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.stats.testsFailed}</div>
          <div class="stat-label">Testes Reprovados</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.stats.newProjects}</div>
          <div class="stat-label">Novos Projetos</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.stats.newPoints}</div>
          <div class="stat-label">Novos Pontos</div>
        </div>
      </div>

      ${data.stats.inspectionsDue > 0 ? `
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <strong>Atenção:</strong> Há ${data.stats.inspectionsDue} inspeções programadas para esta semana.
      </div>
      ` : ''}

      <p style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}"
           style="display: inline-block; padding: 12px 24px; background-color: #6941DE; color: white; text-decoration: none; border-radius: 4px;">
          Acessar Dashboard
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Este é um email automático do AnchorView</p>
      <p>Para alterar suas preferências de notificação, acesse as configurações da empresa</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Helper: Remove tags HTML de uma string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
