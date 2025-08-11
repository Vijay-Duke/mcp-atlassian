import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../utils/html-sanitizer.js';

describe('HTML Sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Safe <strong>bold</strong> and <em>italic</em> text</p>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should remove script tags completely', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script><p>More content</p>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Safe content</p>');
      expect(result).toContain('<p>More content</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove style tags completely', () => {
      const input = '<p>Content</p><style>body { background: red; }</style>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('background: red');
    });

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert(\'xss\')" onmouseover="hack()" autofocus>Content</p>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('autofocus');
    });

    it('should allow safe attributes', () => {
      const input = '<a href="https://example.com" title="Example" class="link">Link</a>';

      const result = sanitizeHtml(input);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="Example"');
      expect(result).toContain('class="link"');
    });

    it('should allow header tags', () => {
      const input = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should allow list structures', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should allow table structures', () => {
      const input = `
        <table>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </table>
      `;

      const result = sanitizeHtml(input);

      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<tr>');
      expect(result).toContain('<th>');
      expect(result).toContain('<td>');
    });

    it('should allow code elements', () => {
      const input =
        '<p>Use <code>console.log()</code> for debugging.</p><pre>Multi-line code</pre>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should allow images with safe attributes', () => {
      const input = '<img src="/image.png" alt="Description" width="100" height="50">';

      const result = sanitizeHtml(input);

      expect(result).toContain('src="/image.png"');
      expect(result).toContain('alt="Description"');
      expect(result).toContain('width="100"');
      expect(result).toContain('height="50"');
    });

    it('should allow Confluence-specific macro tags', () => {
      const input = `
        <ac:structured-macro ac:name="code">
          <ac:parameter ac:name="language">javascript</ac:parameter>
          <ac:plain-text-body><![CDATA[console.log("hello");]]></ac:plain-text-body>
        </ac:structured-macro>
      `;

      const result = sanitizeHtml(input);

      expect(result).toContain('<ac:structured-macro');
      expect(result).toContain('ac:name="code"');
      expect(result).toContain('<ac:parameter');
      expect(result).toContain('<ac:plain-text-body>');
      // CDATA content may be processed differently
      expect(result.length).toBeGreaterThan(0);
    });

    it('should allow Confluence link elements', () => {
      const input = `
        <ac:link>
          <ri:page ri:content-title="Page Title" ri:version-at-save="1"/>
        </ac:link>
      `;

      const result = sanitizeHtml(input);

      expect(result).toContain('<ac:link>');
      expect(result).toContain('<ri:page');
      expect(result).toContain('ri:content-title="Page Title"');
      expect(result).toContain('ri:version-at-save="1"');
    });

    it('should remove iframe tags', () => {
      const input = '<p>Content</p><iframe src="evil.com"></iframe>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
    });

    it('should remove object and embed tags', () => {
      const input = '<p>Content</p><object data="evil.swf"></object><embed src="hack.swf">';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('<object>');
      expect(result).not.toContain('<embed>');
      expect(result).not.toContain('evil.swf');
      expect(result).not.toContain('hack.swf');
    });

    it('should remove form elements', () => {
      const input = '<p>Content</p><form><input type="text" name="data"></form>';

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Content</p>');
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
    });

    it('should allow data attributes', () => {
      const input = '<div data-id="123" data-type="content">Content</div>';

      const result = sanitizeHtml(input);

      expect(result).toContain('data-id="123"');
      expect(result).toContain('data-type="content"');
    });

    it('should remove forbidden tags and their content', () => {
      const input = '<p>Safe</p><script>alert("xss")</script><p>More safe</p>';

      const result = sanitizeHtml(input);

      // Safe content should be kept
      expect(result).toContain('<p>Safe</p>');
      expect(result).toContain('<p>More safe</p>');
      // Script tags and their content should be completely removed
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("xss")');
    });

    it('should handle complex nested structures', () => {
      const input = `
        <div class="content">
          <h1>Title</h1>
          <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
          <ul>
            <li>Item with <a href="#link">link</a></li>
            <li>Code: <code>function()</code></li>
          </ul>
          <table>
            <tr>
              <td>Cell with <img src="/img.png" alt="image"></td>
            </tr>
          </table>
        </div>
      `;

      const result = sanitizeHtml(input);

      expect(result).toContain('<div class="content">');
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<a href="#link">link</a>');
      expect(result).toContain('<code>function()</code>');
      expect(result).toContain('<img src="/img.png" alt="image">');
    });

    it('should handle mixed dangerous and safe content', () => {
      const input = `
        <p>Safe paragraph</p>
        <script>dangerous()</script>
        <h2>Safe heading</h2>
        <style>.hack { display: none; }</style>
        <div onclick="alert('xss')">Div content</div>
      `;

      const result = sanitizeHtml(input);

      expect(result).toContain('<p>Safe paragraph</p>');
      expect(result).toContain('<h2>Safe heading</h2>');
      expect(result).toContain('<div>Div content</div>');
      // Script and style tags should be completely removed with their content
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('dangerous()');
      expect(result).not.toContain('.hack { display: none; }');
      expect(result).not.toContain('onclick');
    });

    it('should handle empty and whitespace content', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml('   ')).toBe('   ');
      expect(sanitizeHtml('\n\t')).toBe('\n\t');
    });

    it('should handle plain text without HTML', () => {
      const input = 'This is just plain text without any HTML tags.';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should handle malformed HTML gracefully', () => {
      const input = '<p>Unclosed paragraph<div>Nested <strong>unclosed bold';

      const result = sanitizeHtml(input);

      // DOMPurify should fix malformed HTML
      expect(result).toContain('Unclosed paragraph');
      expect(result).toContain('Nested');
      expect(result).toContain('unclosed bold');
    });

    it('should allow blockquote elements', () => {
      const input = '<blockquote>This is a quote with <em>emphasis</em></blockquote>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should allow line break elements', () => {
      const input = 'Line 1<br>Line 2<br/>Line 3<hr>Horizontal rule';

      const result = sanitizeHtml(input);

      expect(result).toContain('<br>');
      expect(result).toContain('<br>'); // br/ gets normalized
      expect(result).toContain('<hr>');
    });

    it('should allow strikethrough and underline elements', () => {
      const input =
        '<p>Text with <s>strike</s>, <del>delete</del>, <u>underline</u>, <sub>sub</sub>, and <sup>super</sup></p>';

      const result = sanitizeHtml(input);

      expect(result).toBe(input);
    });
  });

  describe('security edge cases', () => {
    it('should prevent javascript: URLs in links', () => {
      const input = '<a href="javascript:alert(\'xss\')">Click me</a>';

      const result = sanitizeHtml(input);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
      expect(result).toContain('Click me'); // Content should remain
    });

    it('should prevent data: URLs with scripts', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';

      const result = sanitizeHtml(input);

      expect(result).not.toContain('data:text/html');
      expect(result).toContain('Link'); // Content should remain
    });

    it('should handle complex XSS attempts', () => {
      const input = `
        <img src="x" onerror="alert('xss')" />
        <svg onload="alert('svg xss')">
        <iframe srcdoc="<script>alert('iframe xss')</script>">
        <object data="data:text/html,<script>alert('object xss')</script>">
      `;

      const result = sanitizeHtml(input);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<object');
      expect(result).not.toContain('alert(');
    });

    it('should handle encoded XSS attempts', () => {
      const input =
        '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#120;&#115;&#115;&#39;&#41;">';

      const result = sanitizeHtml(input);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('&#97;'); // Should not contain encoded alert
    });
  });
});
