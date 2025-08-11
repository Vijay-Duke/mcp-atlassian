# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please do the following:

1. **Do NOT** open a public issue
2. Email the details to the repository maintainer through GitHub
3. Include the following information:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Fix**: We will work on a fix and coordinate with you on disclosure
- **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

When using this MCP server:

1. **Never commit credentials**: Store API tokens in environment variables
2. **Use secure connections**: Always use HTTPS for Atlassian API endpoints
3. **Limit permissions**: Use API tokens with minimal required permissions
4. **Rotate tokens**: Regularly rotate your API tokens
5. **Monitor usage**: Keep track of API usage and watch for anomalies

## Security Features

This package includes:
- Input sanitization to prevent XSS attacks
- JQL query sanitization to prevent injection
- HTML content sanitization using DOMPurify
- Rate limiting recommendations
- Secure credential handling via environment variables