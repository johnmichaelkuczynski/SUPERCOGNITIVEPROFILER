import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import PDFDocument from 'pdfkit';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: any;

  constructor(config: GoogleDriveConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate authorization URL
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  // Set credentials from authorization code
  async setCredentials(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
  }

  // Set credentials from stored tokens
  setStoredCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  // Save PDF to Google Drive
  async savePDF(content: string, filename: string): Promise<string> {
    try {
      // Create PDF buffer from HTML content
      const pdfBuffer = await this.createPDFFromContent(content);
      
      const fileMetadata = {
        name: `${filename}.pdf`,
        parents: [] // Save to root directory, can be modified to save to specific folder
      };

      const media = {
        mimeType: 'application/pdf',
        body: pdfBuffer
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink'
      });

      console.log('File saved to Google Drive:', response.data);
      return response.data.webViewLink;
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      throw new Error('Failed to save to Google Drive');
    }
  }

  // Save text document to Google Drive
  async saveDocument(content: string, filename: string, mimeType: string = 'text/plain'): Promise<string> {
    try {
      const fileMetadata = {
        name: filename,
        parents: []
      };

      const media = {
        mimeType: mimeType,
        body: content
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink'
      });

      console.log('Document saved to Google Drive:', response.data);
      return response.data.webViewLink;
    } catch (error) {
      console.error('Error saving document to Google Drive:', error);
      throw new Error('Failed to save document to Google Drive');
    }
  }

  // Create PDF from content with mathematical notation
  private async createPDFFromContent(content: string): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Process mathematical notation
      const processedContent = this.processMathNotation(content);
      
      // Add content to PDF
      doc.fontSize(12);
      doc.text(processedContent, {
        width: 500,
        align: 'left'
      });

      doc.end();
    });
  }

  // Process mathematical notation for PDF
  private processMathNotation(content: string): string {
    let processed = content;

    // Convert LaTeX symbols to Unicode
    const mathSymbols: Record<string, string> = {
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
      '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
      '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
      '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
      '\\sigma': 'σ', '\\tau': 'τ', '\\phi': 'φ', '\\chi': 'χ',
      '\\psi': 'ψ', '\\omega': 'ω',
      '\\forall': '∀', '\\exists': '∃', '\\in': '∈', '\\notin': '∉',
      '\\subset': '⊂', '\\supset': '⊃', '\\cup': '∪', '\\cap': '∩',
      '\\land': '∧', '\\lor': '∨', '\\neg': '¬',
      '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
      '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
      '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
      '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\infty': '∞',
      '\\partial': '∂', '\\nabla': '∇', '\\sqrt': '√'
    };

    // Apply symbol conversions
    Object.entries(mathSymbols).forEach(([latex, unicode]) => {
      processed = processed.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
    });

    // Remove remaining LaTeX formatting
    processed = processed.replace(/\$\$([^$]+)\$\$/g, '$1');
    processed = processed.replace(/\$([^$]+)\$/g, '$1');
    processed = processed.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');

    return processed;
  }

  // List files in Google Drive
  async listFiles(): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      });
      
      return response.data.files || [];
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw new Error('Failed to list Google Drive files');
    }
  }
}

export default GoogleDriveService;