import { describe, it, expect } from 'vitest';
import { SimplePdfExport } from '../../utils/simple-pdf-export.js';

describe('SimplePdfExport', () => {
  describe('generatePrintableHtml', () => {
    const baseContent = '<h1>Test Page</h1><p>This is test content.</p>';
    const baseTitle = 'Test Document';
    const baseUrl = 'https://example.atlassian.net';

    it('should generate basic HTML document', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<title>Test Document</title>');
      expect(html).toContain('<h1>Test Page</h1>');
      expect(html).toContain('<p>This is test content.</p>');
    });

    it('should include CSS styles', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('<style>');
      expect(html).toContain('@page {');
      expect(html).toContain('size: A4;');
      expect(html).toContain('margin: 2cm;');
      expect(html).toContain('font-family: \'Inter\'');
      expect(html).toContain('@media print {');
    });

    it('should include document header with title', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('<div class="document-header">');
      expect(html).toContain('<h1 class="document-title">Test Document</h1>');
    });

    it('should include metadata when provided', () => {
      const metadata = {
        space: 'DEV',
        author: 'John Doe',
        lastModified: '2024-01-15'
      };
      
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl, metadata);
      
      expect(html).toContain('📁 Space: DEV');
      expect(html).toContain('👤 Author: John Doe');
      expect(html).toContain('📅 Modified: 2024-01-15');
    });

    it('should include export date', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('📄 Exported:');
      expect(html).toContain(new Date().toLocaleDateString());
    });

    it('should handle metadata with missing fields', () => {
      const metadata = {
        space: 'DEV'
        // author and lastModified missing
      };
      
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl, metadata);
      
      expect(html).toContain('📁 Space: DEV');
      expect(html).not.toContain('👤 Author:');
      expect(html).not.toContain('📅 Modified:');
    });

    it('should handle empty metadata', () => {
      const metadata = {};
      
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl, metadata);
      
      expect(html).not.toContain('📁 Space:');
      expect(html).not.toContain('👤 Author:');
      expect(html).not.toContain('📅 Modified:');
      expect(html).toContain('📄 Exported:'); // This should always be present
    });

    it('should work without metadata parameter', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('<div class="document-meta">');
      expect(html).toContain('📄 Exported:');
      expect(html).not.toContain('📁 Space:');
    });

    it('should remove Confluence-specific classes', () => {
      const contentWithClasses = '<div class="confluence-panel"><p class="confluence-text">Test</p></div>';
      const html = SimplePdfExport.generatePrintableHtml(contentWithClasses, baseTitle, baseUrl);
      
      expect(html).not.toContain('class="confluence-panel"');
      expect(html).not.toContain('class="confluence-text"');
      expect(html).toContain('<div ><p >Test</p></div>');
    });

    it('should fix relative wiki URLs', () => {
      const contentWithLinks = '<img src="/wiki/download/image.png"><a href="/wiki/spaces/DEV">Link</a>';
      const html = SimplePdfExport.generatePrintableHtml(contentWithLinks, baseTitle, baseUrl);
      
      expect(html).toContain(`src="${baseUrl}/wiki/download/image.png"`);
      expect(html).toContain(`href="${baseUrl}/wiki/spaces/DEV"`);
    });

    it('should include document footer', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('<div class="document-footer">');
      expect(html).toContain(`Exported from Confluence | ${baseUrl}`);
      expect(html).toContain('Generated on');
    });

    it('should handle complex content with various HTML elements', () => {
      const complexContent = `
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
        <table>
          <thead>
            <tr><th>Column 1</th><th>Column 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </tbody>
        </table>
        <blockquote>This is a quote</blockquote>
        <pre><code>console.log('code block');</code></pre>
      `;
      
      const html = SimplePdfExport.generatePrintableHtml(complexContent, baseTitle, baseUrl);
      
      expect(html).toContain('<h1>Main Title</h1>');
      expect(html).toContain('<h2>Subtitle</h2>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>List item 1</li>');
      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<blockquote>This is a quote</blockquote>');
      expect(html).toContain('<pre><code>console.log(\'code block\');</code></pre>');
    });

    it('should handle special characters in content', () => {
      const contentWithSpecialChars = '<p>Test with &amp; special &lt;characters&gt; "quotes" \'apostrophes\'</p>';
      const html = SimplePdfExport.generatePrintableHtml(contentWithSpecialChars, baseTitle, baseUrl);
      
      expect(html).toContain(contentWithSpecialChars);
    });

    it('should handle empty content', () => {
      const html = SimplePdfExport.generatePrintableHtml('', baseTitle, baseUrl);
      
      expect(html).toContain('<div class="document-content">');
      expect(html).toContain('</div>');
      expect(html).toContain('<title>Test Document</title>');
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Test & "Document" with <special> characters';
      const html = SimplePdfExport.generatePrintableHtml(baseContent, specialTitle, baseUrl);
      
      expect(html).toContain(`<title>${specialTitle}</title>`);
      expect(html).toContain(`<h1 class="document-title">${specialTitle}</h1>`);
    });

    it('should handle special characters in baseUrl', () => {
      const specialBaseUrl = 'https://test-org.atlassian.net/wiki';
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, specialBaseUrl);
      
      expect(html).toContain(`Exported from Confluence | ${specialBaseUrl}`);
    });

    it('should handle multiple class attributes in content', () => {
      const contentWithMultipleClasses = '<div class="class1 class2"><span class="class3">Text</span></div>';
      const html = SimplePdfExport.generatePrintableHtml(contentWithMultipleClasses, baseTitle, baseUrl);
      
      expect(html).not.toContain('class="class1 class2"');
      expect(html).not.toContain('class="class3"');
      expect(html).toContain('<div ><span >Text</span></div>');
    });

    it('should preserve content structure after class removal', () => {
      const structuredContent = `
        <div class="panel">
          <h3 class="panel-title">Important Note</h3>
          <p class="panel-body">This is important information.</p>
        </div>
      `;
      const html = SimplePdfExport.generatePrintableHtml(structuredContent, baseTitle, baseUrl);
      
      expect(html).toContain('<div >');
      expect(html).toContain('<h3 >Important Note</h3>');
      expect(html).toContain('<p >This is important information.</p>');
      // Check that the user content classes are removed, but CSS template classes remain
      expect(html).not.toContain('class="panel"');
      expect(html).not.toContain('class="panel-title"');
      expect(html).not.toContain('class="panel-body"');
    });

    it('should handle content with mixed wiki URL patterns', () => {
      const mixedContent = `
        <img src="/wiki/download/attachments/123/image.png">
        <a href="/wiki/spaces/DEV/pages/456/Page+Title">Page Link</a>
        <img src="https://external.com/image.jpg">
        <a href="https://external.com">External Link</a>
      `;
      const html = SimplePdfExport.generatePrintableHtml(mixedContent, baseTitle, baseUrl);
      
      expect(html).toContain(`src="${baseUrl}/wiki/download/attachments/123/image.png"`);
      expect(html).toContain(`href="${baseUrl}/wiki/spaces/DEV/pages/456/Page+Title"`);
      expect(html).toContain('src="https://external.com/image.jpg"'); // External URLs unchanged
      expect(html).toContain('href="https://external.com"'); // External URLs unchanged
    });

    it('should include complete HTML structure', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<head>');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('<div class="document-wrapper">');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');
    });

    it('should include all required CSS classes for styling', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      
      expect(html).toContain('.document-header');
      expect(html).toContain('.document-title');
      expect(html).toContain('.document-meta');
      expect(html).toContain('.document-content');
      expect(html).toContain('.document-footer');
      expect(html).toContain('.meta-item');
      expect(html).toContain('.document-wrapper');
    });

    it('should format dates consistently', () => {
      const html = SimplePdfExport.generatePrintableHtml(baseContent, baseTitle, baseUrl);
      const currentDate = new Date();
      
      expect(html).toContain(currentDate.toLocaleDateString());
      expect(html).toContain(currentDate.toLocaleString());
    });
  });
});