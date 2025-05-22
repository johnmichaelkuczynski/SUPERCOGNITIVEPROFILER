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

// Create basic Word XML format (simplified .docx format)
export function generateWordDocument(content: string): string {
  // Basic conversion from markdown to Word-compatible HTML
  const sanitizedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/\n/g, '<w:br/>');
  
  // Create minimal Word XML structure (simplified)
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${sanitizedContent}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:wordDocument>`;
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
export function generateDocument(content: string, format: 'txt' | 'html' | 'docx'): {content: string, mimeType: string} {
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
    case 'txt':
    default:
      return {
        content: createPlainText(content),
        mimeType: 'text/plain'
      };
  }
}