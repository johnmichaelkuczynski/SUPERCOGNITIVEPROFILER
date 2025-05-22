import sgMail from '@sendgrid/mail';

// Set the API key for SendGrid email service
if (!process.env.SENDGRID_API_KEY) {
  console.error("Warning: SENDGRID_API_KEY is not set. Email features will not work.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
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
 * @param options Email options (to, from, subject, text/html, attachments)
 * @returns Promise resolving to boolean success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not set. Cannot send email.");
  }

  try {
    await sgMail.send({
      to: options.to,
      from: options.from,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
      attachments: options.attachments
    });
    
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${(error as Error).message}`);
  }
}

/**
 * Send a document via email
 * @param to Recipient email address
 * @param fromEmail Sender email address
 * @param documentTitle Title of the document
 * @param documentContent Content of the document
 * @param format Format of the document ("txt" | "html")
 * @returns Promise resolving to boolean success status
 */
export async function sendDocumentByEmail(
  to: string,
  fromEmail: string,
  documentTitle: string,
  documentContent: string,
  format: "txt" | "html" = "txt"
): Promise<boolean> {
  // Create simple email body
  const emailText = `Here is your document: ${documentTitle}`;
  const emailHtml = `<p>Here is your document: <strong>${documentTitle}</strong></p>`;
  
  // Create attachment for the document
  const attachment = {
    content: Buffer.from(documentContent).toString('base64'),
    filename: `${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`,
    type: format === "txt" ? "text/plain" : "text/html",
    disposition: "attachment"
  };
  
  // Send the email with attachment
  return await sendEmail({
    to,
    from: fromEmail,
    subject: `Document: ${documentTitle}`,
    text: emailText,
    html: emailHtml,
    attachments: [attachment]
  });
}