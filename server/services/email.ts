import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable must be set for email functionality");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

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
    
    // Make sure from is never undefined
    const from = params.from || "noreply@example.com";
    
    await mailService.send({
      to: params.to,
      from: from,
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
      attachments: params.attachments
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    // More detailed error logging
    console.error('Error sharing document via email:', error);
    throw error; // Rethrow to see the full error in logs
  }
}