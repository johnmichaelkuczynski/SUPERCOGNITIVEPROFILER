import puppeteer from 'puppeteer';

export async function generatePDFWithMath(content: string, filename: string): Promise<Buffer> {
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Create HTML with MathJax support
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${filename}</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            },
            chtml: {
                scale: 1.0,
                minScale: 0.5,
                matchFontHeight: false
            },
            startup: {
                typeset: false
            }
        };
    </script>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            color: #333;
            font-size: 12pt;
        }
        .math { font-family: 'Times New Roman', serif; }
        h1, h2, h3 { color: #333; margin-top: 1.5em; margin-bottom: 0.5em; }
        p { margin-bottom: 1em; text-align: justify; }
        @media print {
            body { padding: 20px; }
            @page { margin: 1in; }
        }
    </style>
</head>
<body>
    <div id="content">${content.replace(/\n/g, '</p><p>').replace(/^<p>/, '<p>').replace(/<p><\/p>/g, '<br>')}</div>
</body>
</html>`;

    // Set content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait for MathJax to load and complete rendering
    await page.waitForFunction(() => {
      return (window as any).MathJax && (window as any).MathJax.startup && (window as any).MathJax.startup.document;
    }, { timeout: 15000 });
    
    // Trigger MathJax typesetting
    await page.evaluate(() => {
      return (window as any).MathJax.typesetPromise();
    });
    
    // Wait a bit more for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    return Buffer.from(pdfBuffer);
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}