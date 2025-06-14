import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable must be set for email functionality");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Use verified sender email for all outgoing emails
const VERIFIED_SENDER = process.env.SENDGRID_VERIFIED_SENDER || 'JM@ANALYTICPHILOSOPHY.AI';

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters including to, from, subject, text/html content
 * @returns True if the email was sent successfully, false otherwise
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

  try {
    // Log the email attempt for debugging
    console.log(`Attempting to send email from ${params.from} to ${params.to}`);
    
    // Always use verified sender address to prevent SendGrid blocking
    const from = VERIFIED_SENDER;
    
    // Add detailed logging
    console.log('SendGrid params:', {
      to: params.to,
      from: from,
      subject: params.subject,
      hasText: !!params.text,
      hasHtml: !!params.html,
      hasAttachments: !!(params.attachments && params.attachments.length > 0)
    });
    
    // Ensure attachments is properly formatted for SendGrid
    const attachments = params.attachments && params.attachments.length > 0 
      ? params.attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type,
          disposition: attachment.disposition || 'attachment'
        }))
      : undefined;
    
    // Reset API key before sending (might help with token expiration issues)
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    
    await mailService.send({
      to: params.to,
      from: from,
      subject: params.subject,
      text: params.text || "Please see the attached document.",
      html: params.html || "<p>Please see the attached document.</p>",
      attachments: attachments
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    // More detailed error logging
    console.error('Error sharing document via email:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.message.includes('forbidden')) {
      console.error('This error might be related to using an unverified sender address. Make sure to use a verified sender in SendGrid.');
    }
    
    return false; // Return false instead of throwing to handle gracefully
  }
}