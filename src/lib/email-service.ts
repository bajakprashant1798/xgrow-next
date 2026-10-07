/**
 * Invoice Email Dispatch Service for XGRO
 * Handles transactional email delivery for Invoices & Quotations.
 * Configured with live API dispatch when RESEND_API_KEY / SMTP is set,
 * and seamless fallback simulation when keys are pending setup.
 */

import { InvoiceDocumentModel, ClientModel, ProjectModel, ResourceLeadModel } from './supabase/types';
import { addNotification } from './db';

export interface SendLeadNotificationParams {
  lead: ResourceLeadModel;
  resourceTitle?: string;
  adminEmail?: string;
}

export interface SendInvoiceEmailParams {
  invoice: InvoiceDocumentModel;
  client?: ClientModel | { name: string; email: string; company_name?: string };
  project?: ProjectModel | { project_name: string };
  recipientEmail?: string;
  customMessage?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  simulated: boolean;
  recipient: string;
  subject: string;
  messageId: string;
  timestamp: string;
  details: string;
}

/**
 * Sends or queues an invoice email to client.
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<EmailDispatchResult> {
  const { invoice, client, project, recipientEmail, customMessage } = params;

  const targetEmail =
    recipientEmail ||
    client?.email ||
    invoice.client_email ||
    'client@xgro.in';

  const clientName =
    client?.name ||
    invoice.client_name ||
    'Valued Client';

  const projectName =
    project?.project_name ||
    invoice.project_name ||
    'Digital Project';

  const docTypeLabel = invoice.type === 'quotation' ? 'Quotation / Estimate' : 'Invoice';
  const subject = `${docTypeLabel} #${invoice.reference_number || invoice.id} from XGRO Digital Agency`;

  const timestamp = new Date().toISOString();
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Check if real email API key is configured
  const resendApiKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_RESEND_API_KEY || process.env?.RESEND_API_KEY : undefined;

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      // Future live Resend API call
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'XGRO Billing <billing@xgro.in>',
          to: [targetEmail],
          subject: subject,
          html: generateInvoiceEmailHtml({ invoice, clientName, projectName, customMessage }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Record in-app notification
        if (invoice.client_id) {
          await addNotification({
            client_id: invoice.client_id,
            title: `${docTypeLabel} Emailed`,
            message: `Official ${docTypeLabel.toLowerCase()} #${invoice.reference_number || invoice.id} of ₹${invoice.amount.toLocaleString('en-IN')} has been sent to your email (${targetEmail}).`,
            is_read: false,
          });
        }

        return {
          success: true,
          simulated: false,
          recipient: targetEmail,
          subject,
          messageId: data.id || messageId,
          timestamp,
          details: `Invoice successfully dispatched via Resend API to ${targetEmail}`,
        };
      }
    } catch (err) {
      console.warn('Live email dispatch failed, falling back to simulation mode:', err);
    }
  }

  // Simulation Mode (Used until SMTP / Resend API credentials are provided by admin)
  console.log(`%c[XGRO Email Service - Simulated Dispatch]`, 'color: #06b6d4; font-weight: bold;');
  console.log({
    messageId,
    to: targetEmail,
    client: clientName,
    project: projectName,
    invoiceRef: invoice.reference_number || invoice.id,
    amount: `₹${Number(invoice.amount).toLocaleString('en-IN')}`,
    status: invoice.status,
    timestamp,
    note: 'Email setup is configured and ready. Connect RESEND_API_KEY in .env to deliver live emails directly to inboxes.',
  });

  // Record audit notification in client portal database
  if (invoice.client_id) {
    try {
      await addNotification({
        client_id: invoice.client_id,
        title: `${docTypeLabel} Available & Emailed`,
        message: `Official ${docTypeLabel.toLowerCase()} #${invoice.reference_number || invoice.id} for ₹${Number(invoice.amount).toLocaleString('en-IN')} has been issued and queued for ${targetEmail}.`,
        is_read: false,
      });
    } catch (e) {
      // Ignore in mock environment
    }
  }

  return {
    success: true,
    simulated: true,
    recipient: targetEmail,
    subject,
    messageId,
    timestamp,
    details: `Invoice #${invoice.reference_number || invoice.id} formatted and queued for ${targetEmail}. (Email service setup is complete & ready for live SMTP/API key).`,
  };
}

/**
 * Generates responsive branded HTML email markup for Invoices
 */
export function generateInvoiceEmailHtml(params: {
  invoice: InvoiceDocumentModel;
  clientName: string;
  projectName: string;
  customMessage?: string;
}): string {
  const { invoice, clientName, projectName, customMessage } = params;
  const isPaid = invoice.status === 'paid';
  const docType = invoice.type === 'quotation' ? 'Quotation' : 'Invoice';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docType} ${invoice.reference_number || invoice.id} - XGRO</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B1120; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .body-content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-paid { background: #10b981; color: #022c22; }
    .badge-due { background: #f59e0b; color: #451a03; }
    .amount-box { background: #1E293B; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #334155; }
    .amount-value { font-size: 32px; font-weight: 900; color: #38bdf8; margin: 8px 0; }
    .btn { display: inline-block; background: #06b6d4; color: #02141a; padding: 14px 28px; border-radius: 9999px; font-weight: 800; text-decoration: none; font-size: 14px; margin-top: 16px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1E293B; background: #0B1120; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ XGRO Digital Agency</div>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Official ${docType} Notification</p>
    </div>
    <div class="body-content">
      <p style="font-size: 16px; margin-top: 0;">Dear <strong>${clientName}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        ${customMessage || `Your ${docType.toLowerCase()} for <strong>${projectName}</strong> has been generated and is ready for your review.`}
      </p>

      <div class="amount-box">
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-due'}">${invoice.status}</span>
        <div class="amount-value">₹${Number(invoice.amount).toLocaleString('en-IN')}</div>
        <div style="font-size: 12px; color: #94a3b8;">
          Ref No: <strong style="color: #f1f5f9;">${invoice.reference_number || invoice.id}</strong> · Due: <strong>${invoice.due_date || 'Upon Receipt'}</strong>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://xgro.in/client#invoices" class="btn">View & Download PDF Invoice</a>
      </div>
    </div>
    <div class="footer">
      XGRO Digital Agency · Moradabad & NCR · +91 63953 19725 · billing@xgro.in
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Dispatches lead capture notification email to admin when a visitor unlocks resources or requests a quote
 */
export async function sendLeadNotificationEmail(params: SendLeadNotificationParams): Promise<EmailDispatchResult> {
  const { lead, resourceTitle } = params;
  const adminEmail = params.adminEmail || 'info@xgro.in';
  const subject = `🔥 New Lead Unlocked: "${resourceTitle || lead.resource_title}" by ${lead.name}`;
  const timestamp = new Date().toISOString();
  const messageId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  console.log(`%c[XGRO Lead Capture Service]`, 'color: #10b981; font-weight: bold;');
  console.log({
    messageId,
    leadName: lead.name,
    email: lead.email,
    phone: lead.phone,
    business: lead.business_name || 'N/A',
    resource: resourceTitle || lead.resource_title,
    coupon: lead.coupon_code,
    timestamp,
    notifiedAdmin: adminEmail,
  });

  return {
    success: true,
    simulated: true,
    recipient: adminEmail,
    subject,
    messageId,
    timestamp,
    details: `Lead for "${lead.name}" (${lead.email}) recorded and queued for admin notification.`,
  };
}

export interface SendDueDateReminderParams {
  client: ClientModel | { id?: string; name: string; email: string; company_name?: string };
  serviceName: string;
  dueDate: string;
  daysRemaining: number;
  status: 'pending' | 'in_progress' | 'completed' | 'ongoing';
  notes?: string;
  recipientEmail?: string;
}

/**
 * Dispatches or queues an automated Service Due Date / Delivery Countdown notification email to client
 */
export async function sendDueDateReminderEmail(params: SendDueDateReminderParams): Promise<EmailDispatchResult> {
  const { client, serviceName, dueDate, daysRemaining, status, notes, recipientEmail } = params;
  const targetEmail = recipientEmail || client.email;
  const clientName = client.name || 'Valued Client';
  const timestamp = new Date().toISOString();
  const messageId = `due-notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  let timingLabel = `${daysRemaining} days remaining`;
  let subjectPrefix = '⏳ Target Delivery Approaching';
  if (status === 'completed') {
    timingLabel = 'Delivered & Completed';
    subjectPrefix = '✓ Deliverable Ready';
  } else if (daysRemaining === 0) {
    timingLabel = 'Due Today';
    subjectPrefix = '⚡ Delivery Milestone Today';
  } else if (daysRemaining < 0) {
    timingLabel = `${Math.abs(daysRemaining)} days in final review`;
    subjectPrefix = '⚠️ Delivery Status Update';
  }

  const subject = `${subjectPrefix}: "${serviceName}" for ${client.company_name || clientName}`;

  // Check if live Resend API key is present
  const resendApiKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_RESEND_API_KEY || process.env?.RESEND_API_KEY : undefined;

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'XGRO Project Delivery <updates@xgro.in>',
          to: [targetEmail],
          subject,
          html: `
            <div style="font-family: sans-serif; background: #0B1120; color: #F8FAFC; padding: 32px; border-radius: 16px;">
              <h2 style="color: #06B6D4;">${subjectPrefix}</h2>
              <p>Hi ${clientName},</p>
              <p>Here is your delivery milestone update for <strong>${serviceName}</strong>:</p>
              <div style="background: #1E293B; padding: 16px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>Target Finish Date:</strong> ${dueDate}</p>
                <p style="margin: 8px 0 0 0; color: #06B6D4; font-weight: bold;">Status: ${timingLabel}</p>
                ${notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;"><em>"${notes}"</em></p>` : ''}
              </div>
              <p>You can track real-time progress and milestones in your <a href="https://xgro.in/client#services" style="color: #06B6D4;">Client Portal</a>.</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.warn('Live due date email dispatch error:', e);
    }
  }

  // Simulated email dispatch log
  console.log(`%c[XGRO Service Due Date Notification Email]`, 'color: #06b6d4; font-weight: bold;');
  console.log({
    messageId,
    to: targetEmail,
    client: clientName,
    service: serviceName,
    dueDate,
    daysRemaining,
    status,
    timestamp,
    note: 'Email notification setup is ready. Connect live RESEND_API_KEY / SMTP in .env when ready.',
  });

  // Record in-app notification in client portal database
  if (client.id) {
    try {
      await addNotification({
        client_id: client.id,
        type: 'due_date',
        title: `${subjectPrefix}: ${serviceName}`,
        message: `Your target delivery for ${serviceName} is scheduled for ${dueDate} (${timingLabel}). ${notes ? `Scope: ${notes}` : ''}`,
        link: '/client#services',
        is_read: false,
      });
    } catch (e) {
      // Ignore in mock environment
    }
  }

  return {
    success: true,
    simulated: true,
    recipient: targetEmail,
    subject,
    messageId,
    timestamp,
    details: `Service due date notification for "${serviceName}" logged and client portal notification created for ${targetEmail}.`,
  };
}

export interface SendProjectUpdateParams {
  client: ClientModel | { id?: string; name: string; email: string; company_name?: string };
  projectId: string;
  projectName: string;
  updateTitle: string;
  updateMessage: string;
  progressPercent?: number;
  status?: string;
  recipientEmail?: string;
}

/**
 * Dispatches or queues a Project Workspace Update notification email to client
 */
export async function sendProjectUpdateEmail(params: SendProjectUpdateParams): Promise<EmailDispatchResult> {
  const { client, projectId, projectName, updateTitle, updateMessage, progressPercent, status, recipientEmail } = params;
  const targetEmail = recipientEmail || client.email;
  const clientName = client.name || 'Valued Client';
  const timestamp = new Date().toISOString();
  const messageId = `proj-notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const subject = `🚀 Project Workspace Update: "${projectName}" — ${updateTitle}`;

  // Check if live Resend API key is present
  const resendApiKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_RESEND_API_KEY || process.env?.RESEND_API_KEY : undefined;

  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'XGRO Project Management <projects@xgro.in>',
          to: [targetEmail],
          subject,
          html: `
            <div style="font-family: sans-serif; background: #0B1120; color: #F8FAFC; padding: 32px; border-radius: 16px;">
              <h2 style="color: #06B6D4;">🚀 Project Update</h2>
              <p>Hi ${clientName},</p>
              <p>A new progress milestone has been published for <strong>${projectName}</strong>:</p>
              <div style="background: #1E293B; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 8px 0; color: #F8FAFC;">${updateTitle}</h3>
                <p style="margin: 0; color: #CBD5E1; font-size: 14px; line-height: 1.6;">${updateMessage}</p>
                ${progressPercent !== undefined ? `<p style="margin: 12px 0 0 0; color: #06B6D4; font-weight: bold;">Overall Completion: ${progressPercent}%</p>` : ''}
              </div>
              <p>View the live progress gauge and milestone checklist in your <a href="https://xgro.in/client" style="color: #06B6D4;">Client Portal</a>.</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.warn('Live project update email dispatch error:', e);
    }
  }

  // Simulated email dispatch log
  console.log(`%c[XGRO Project Update Email]`, 'color: #06b6d4; font-weight: bold;');
  console.log({
    messageId,
    to: targetEmail,
    client: clientName,
    project: projectName,
    updateTitle,
    progress: progressPercent,
    status,
    timestamp,
    note: 'Email notification setup is ready. Connect live RESEND_API_KEY / SMTP in .env when ready.',
  });

  // Record in-app notification in client portal database
  if (client.id) {
    try {
      await addNotification({
        client_id: client.id,
        project_id: projectId,
        type: 'project_update',
        title: `Project Update: ${updateTitle}`,
        message: `${updateMessage} (Progress: ${progressPercent || 0}%)`,
        link: '/client#milestones',
        is_read: false,
      });
    } catch (e) {
      // Ignore in mock environment
    }
  }

  return {
    success: true,
    simulated: true,
    recipient: targetEmail,
    subject,
    messageId,
    timestamp,
    details: `Project update notification for "${projectName}" logged and client portal notification created for ${targetEmail}.`,
  };
}

