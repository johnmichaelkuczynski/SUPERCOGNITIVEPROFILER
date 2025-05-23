/**
 * Document export service for converting text content to different document formats
 */

// Convert markdown content to HTML
export function markdownToHtml(markdown: string): string {
  // Very basic markdown conversion for simple formatting
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italics
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Lists
    .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs - wrap any content not already wrapped
    .replace(/^(?!<[oh][1-6l]|<pre|<p)(.*$)/gim, '<p>$1</p>');
  
  // Wrap lists
  html = html.replace(/(<li>.*?<\/li>\s*)+/gim, '<ul>$&</ul>');
  
  // Return fully formatted HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Export</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
    pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    ul, ol { margin-bottom: 1em; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

// Create HTML document that can be opened in Word
export function generateWordDocument(content: string): string {
  // Convert markdown to HTML first
  let htmlContent = markdownToHtml(content);
  
  // Strip the doctype and html wrappers to get just the body content
  htmlContent = htmlContent.replace(/<!DOCTYPE[^>]*>/, '')
                         .replace(/<html[^>]*>([\s\S]*)<\/html>/, '$1')
                         .replace(/<head>[\s\S]*<\/head>/, '')
                         .replace(/<body[^>]*>([\s\S]*)<\/body>/, '$1');
  
  // Create a Word-compatible HTML document
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<meta name="Originator" content="Microsoft Word 15">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body {
  font-family: 'Calibri', sans-serif;
  font-size: 11pt;
  line-height: 1.5;
}
h1, h2, h3, h4, h5, h6 {
  font-family: 'Calibri', sans-serif;
  font-weight: bold;
  margin-top: 12pt;
  margin-bottom: 6pt;
}
h1 { font-size: 16pt; }
h2 { font-size: 14pt; }
h3 { font-size: 12pt; }
p { margin-bottom: 10pt; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

/**
 * Create a plain text version of the document
 * Strips markdown formatting for clean text
 */
export function createPlainText(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#+\s+(.*$)/gim, '$1\n')
    // Remove bold/italic markers
    .replace(/\*\*(.*?)\*\*/gim, '$1')
    .replace(/\*(.*?)\*/gim, '$1')
    // Remove code blocks 
    .replace(/```([\s\S]*?)```/gim, '$1')
    // Remove inline code
    .replace(/`(.*?)`/gim, '$1');
}

/**
 * Generate document in requested format
 * @param content Document content (markdown format)
 * @param format Output format (txt, html, docx)
 * @returns Formatted document content
 */
export function generateDocument(content: string, format: 'txt' | 'html' | 'docx' | 'pdf'): {content: string, mimeType: string} {
  switch (format) {
    case 'html':
      return {
        content: markdownToHtml(content),
        mimeType: 'text/html'
      };
    case 'docx':
      return {
        content: generateWordDocument(content),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
    case 'pdf':
      // For PDF, we generate an HTML document optimized for printing
      // Most browsers will download this as HTML, but when opened
      // it will be set up for clean printing to PDF
      const htmlForPrint = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Export</title>
  <style>
    @page { size: 8.5in 11in; margin: 1in; }
    body { 
      font-family: 'Calibri', Arial, sans-serif; 
      line-height: 1.6;
      font-size: 12pt;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.25in;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; page-break-after: avoid; }
    p { margin-bottom: 1em; }
    pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; page-break-inside: avoid; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    ul, ol { margin-bottom: 1em; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 1em; page-break-inside: avoid; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    @media print {
      body { font-size: 12pt; color: black; }
      a { color: black; text-decoration: none; }
      @page { margin: 1in; }
    }
  </style>
  <script>
    window.onload = function() {
      // Auto-trigger print dialog when opened
      window.print();
    }
  </script>
</head>
<body>
  ${markdownToHtml(content).replace(/<!DOCTYPE[^>]*>/, '')
                           .replace(/<html[^>]*>([\s\S]*)<\/html>/, '$1')
                           .replace(/<head>[\s\S]*<\/head>/, '')
                           .replace(/<body[^>]*>([\s\S]*)<\/body>/, '$1')}
</body>
</html>`;
      return {
        content: htmlForPrint,
        mimeType: 'text/html'
      };
    case 'txt':
    default:
      return {
        content: createPlainText(content),
        mimeType: 'text/plain'
      };
  }
}