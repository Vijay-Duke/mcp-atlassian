# MCP Atlassian Server

A Model Context Protocol (MCP) server for integrating with Atlassian products (Confluence and Jira). This server provides tools for AI assistants to interact with Atlassian Cloud APIs, enabling document management, search, and export capabilities.

## Features

### Confluence Integration
- **Read & Search**: Access pages, spaces, and content
- **Content Management**: Create, update pages and comments
- **Export**: Export pages as HTML or Markdown with embedded images
- **Attachments**: List and download attachments
- **Labels**: Manage page labels
- **Users**: Find and query users

### Jira Integration  
- **Issues**: Read and search issues
- **Projects**: List and explore projects
- **Comments**: Add comments to issues
- **Issue Creation**: Create new issues with custom fields

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-atlassian.git
cd mcp-atlassian

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
ATLASSIAN_BASE_URL=https://yourdomain.atlassian.net
ATLASSIAN_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

### Getting API Token

1. Log in to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label and copy the token
4. Use this token in your `.env` file

### MCP Settings Configuration

Add to your Claude Desktop or MCP client configuration:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "node",
      "args": ["path/to/mcp-atlassian/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "https://yourdomain.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email@example.com", 
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

### Confluence Tools

| Tool | Description |
|------|-------------|
| `read_confluence_page` | Read a Confluence page by ID or title |
| `search_confluence_pages` | Search pages using CQL (Confluence Query Language) |
| `list_confluence_spaces` | List all accessible spaces |
| `create_confluence_page` | Create a new page |
| `update_confluence_page` | Update existing page content |
| `export_confluence_page` | Export page as HTML or Markdown with embedded images |
| `list_confluence_attachments` | List page attachments |
| `download_confluence_attachment` | Download specific attachment |
| `add_confluence_comment` | Add comment to a page |
| `get_confluence_labels` | Get page labels |
| `add_confluence_labels` | Add labels to a page |
| `find_confluence_users` | Search for users |

### Jira Tools

| Tool | Description |
|------|-------------|
| `read_jira_issue` | Read issue details by key |
| `search_jira_issues` | Search issues using JQL |
| `list_jira_projects` | List all accessible projects |
| `create_jira_issue` | Create new issue |
| `add_jira_comment` | Add comment to issue |

## Usage Examples

### Export Confluence Page

```javascript
// Export as HTML (raw content with embedded images)
{
  "tool": "export_confluence_page",
  "arguments": {
    "pageId": "123456789",
    "format": "html"
  }
}

// Export as Markdown with metadata
{
  "tool": "export_confluence_page",
  "arguments": {
    "pageId": "123456789",
    "format": "markdown"
  }
}
```

### Search Confluence

```javascript
{
  "tool": "search_confluence_pages",
  "arguments": {
    "cql": "space=DEV AND text~'architecture'",
    "limit": 10
  }
}
```

### Create Jira Issue

```javascript
{
  "tool": "create_jira_issue",
  "arguments": {
    "projectKey": "PROJ",
    "issueType": "Task",
    "summary": "Implement new feature",
    "description": "Detailed description here",
    "priority": "Medium"
  }
}
```

## Content Format Support

### Markdown ↔ Confluence Storage Format

The server automatically converts between Markdown and Confluence's storage format:
- Write content in Markdown when creating/updating pages
- Read pages in either storage format or converted to Markdown
- Preserves formatting, links, and structure

### Export Formats

- **HTML**: Raw Confluence HTML with all images embedded as base64 data URIs
- **Markdown**: Clean Markdown with YAML frontmatter, includes metadata and embedded images

## Development

```bash
# Run TypeScript compiler in watch mode
npm run dev

# Build for production
npm run build

# Run tests (if available)
npm test
```

## Project Structure

```
mcp-atlassian/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── types/                   # TypeScript type definitions
│   ├── confluence/
│   │   ├── handlers.ts          # Confluence API handlers
│   │   └── tools.ts             # Tool definitions
│   ├── jira/
│   │   ├── handlers.ts          # Jira API handlers
│   │   └── tools.ts             # Tool definitions
│   └── utils/
│       ├── http-client.ts       # Axios HTTP client setup
│       ├── content-converter.ts # Markdown ↔ Storage conversion
│       └── export-converter.ts  # HTML/Markdown export utilities
├── dist/                        # Compiled JavaScript
├── .env                         # Environment variables (not in git)
├── package.json
└── tsconfig.json
```

## Security Notes

- API tokens are stored in environment variables, never in code
- Uses Basic Authentication with API tokens (not passwords)
- All requests are made over HTTPS
- Supports Atlassian Cloud only (not Server/Data Center)

## Limitations

- No delete operations implemented (by design for safety)
- Export to PDF requires browser conversion (HTML → Print → PDF)
- Some Confluence macros may not convert perfectly to Markdown
- Rate limits apply based on Atlassian Cloud API limits

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check Atlassian API documentation for API-specific questions
- Review MCP documentation for protocol-related topics

## Acknowledgments

Built with:
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [Atlassian REST APIs](https://developer.atlassian.com/cloud/)
- TypeScript, Node.js, Axios