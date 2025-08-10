import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const confluenceTools: Tool[] = [
  {
    name: 'read_confluence_page',
    description: 'Read content from a Confluence page by ID or title',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the Confluence page',
        },
        title: {
          type: 'string',
          description: 'The title of the page (alternative to pageId)',
        },
        spaceKey: {
          type: 'string',
          description: 'The space key (required when using title)',
        },
        expand: {
          type: 'string',
          description: 'Properties to expand (default: body.storage,version,space)',
          default: 'body.storage,version,space',
        },
        format: {
          type: 'string',
          description: 'Format for content output (default: storage)',
          enum: ['storage', 'markdown'],
          default: 'storage',
        },
      },
    },
  },
  {
    name: 'search_confluence_pages',
    description: 'Search for Confluence pages using CQL (Confluence Query Language)',
    inputSchema: {
      type: 'object',
      properties: {
        cql: {
          type: 'string',
          description: 'CQL query string (e.g., "space = DEV and type = page")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 25, max: 100)',
          default: 25,
          minimum: 1,
          maximum: 100,
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
          default: 0,
        },
        expand: {
          type: 'string',
          description: 'Properties to expand',
        },
      },
      required: ['cql'],
    },
  },
  {
    name: 'list_confluence_spaces',
    description: 'List available Confluence spaces',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of spaces to list',
          enum: ['global', 'personal'],
        },
        status: {
          type: 'string',
          description: 'Status of spaces to list (default: current)',
          enum: ['current', 'archived'],
          default: 'current',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 25, max: 100)',
          default: 25,
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
  {
    name: 'list_confluence_attachments',
    description: 'List attachments for a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the Confluence page',
        },
        mediaType: {
          type: 'string',
          description: 'Filter by media type (e.g., "image/png", "application/pdf")',
        },
        filename: {
          type: 'string',
          description: 'Filter by filename pattern',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50, max: 100)',
          default: 50,
          minimum: 1,
          maximum: 100,
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'download_confluence_attachment',
    description: 'Download a Confluence attachment as base64-encoded data',
    inputSchema: {
      type: 'object',
      properties: {
        attachmentId: {
          type: 'string',
          description: 'The ID of the attachment to download',
        },
        version: {
          type: 'number',
          description: 'Version number of the attachment (optional, defaults to latest)',
        },
      },
      required: ['attachmentId'],
    },
  },
  {
    name: 'download_confluence_page_complete',
    description: 'Download a complete Confluence page with all its content and optionally attachments',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the Confluence page to download',
        },
        includeAttachments: {
          type: 'boolean',
          description: 'Include all page attachments in the download (default: true)',
          default: true,
        },
        attachmentTypes: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Filter attachments by media type (e.g., ["image/png", "application/pdf"]). If not specified, all types are included',
        },
        maxAttachmentSize: {
          type: 'number',
          description: 'Maximum size of individual attachments to download in bytes (default: 50MB)',
          default: 52428800,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'create_confluence_page',
    description: 'Create a new Confluence page or blog post',
    inputSchema: {
      type: 'object',
      properties: {
        spaceKey: {
          type: 'string',
          description: 'The key of the space where the page will be created',
        },
        title: {
          type: 'string',
          description: 'The title of the new page',
        },
        content: {
          type: 'string',
          description: 'The content of the page in storage format (XHTML) or markdown',
        },
        parentId: {
          type: 'string',
          description: 'The ID of the parent page (optional)',
        },
        type: {
          type: 'string',
          description: 'Type of content to create (default: page)',
          enum: ['page', 'blogpost'],
          default: 'page',
        },
      },
      required: ['spaceKey', 'title', 'content'],
    },
  },
  {
    name: 'update_confluence_page',
    description: 'Update an existing Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the page to update',
        },
        title: {
          type: 'string',
          description: 'New title for the page (optional)',
        },
        content: {
          type: 'string',
          description: 'New content for the page in storage format (XHTML) or markdown',
        },
        version: {
          type: 'number',
          description: 'Current version number of the page (required for conflict detection)',
        },
        minorEdit: {
          type: 'boolean',
          description: 'Whether this is a minor edit (default: false)',
          default: false,
        },
        versionComment: {
          type: 'string',
          description: 'Comment describing the changes made',
        },
      },
      required: ['pageId', 'version'],
    },
  },
  {
    name: 'add_confluence_comment',
    description: 'Add a comment to a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the page to comment on',
        },
        content: {
          type: 'string',
          description: 'The comment content in storage format (XHTML) or plain text',
        },
        parentCommentId: {
          type: 'string',
          description: 'ID of the parent comment for nested replies (optional)',
        },
      },
      required: ['pageId', 'content'],
    },
  },
  {
    name: 'find_confluence_users',
    description: 'Search for Confluence users',
    inputSchema: {
      type: 'object',
      properties: {
        cql: {
          type: 'string',
          description: 'CQL query to search for users',
        },
        username: {
          type: 'string',
          description: 'Search by username',
        },
        userKey: {
          type: 'string',
          description: 'Search by user key',
        },
        accountId: {
          type: 'string',
          description: 'Search by account ID',
        },
        expand: {
          type: 'string',
          description: 'Properties to expand',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 25, max: 100)',
          default: 25,
          minimum: 1,
          maximum: 100,
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
          default: 0,
        },
      },
    },
  },
  {
    name: 'get_confluence_labels',
    description: 'Get labels for a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the page',
        },
        prefix: {
          type: 'string',
          description: 'Filter labels by prefix (e.g., "global", "my")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 25, max: 200)',
          default: 25,
          minimum: 1,
          maximum: 200,
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'add_confluence_labels',
    description: 'Add labels to a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the page',
        },
        labels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prefix: {
                type: 'string',
                description: 'Label prefix (e.g., "global", "my", "team")',
              },
              name: {
                type: 'string',
                description: 'Label name',
              },
            },
            required: ['name'],
          },
          description: 'Array of labels to add',
        },
      },
      required: ['pageId', 'labels'],
    },
  },
  {
    name: 'export_confluence_page',
    description: 'Export a Confluence page as HTML or Markdown format with all images embedded',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The ID of the Confluence page to export',
        },
        format: {
          type: 'string',
          description: 'Export format (html or markdown) - both include embedded images',
          enum: ['html', 'markdown'],
        },
      },
      required: ['pageId', 'format'],
    },
  },
];