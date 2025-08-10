import { AxiosInstance } from 'axios';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { 
  ReadConfluencePageArgs, 
  SearchConfluencePagesArgs, 
  ListConfluenceSpacesArgs,
  ListConfluenceAttachmentsArgs,
  DownloadConfluenceAttachmentArgs,
  DownloadConfluencePageCompleteArgs,
  CreateConfluencePageArgs,
  UpdateConfluencePageArgs,
  AddConfluenceCommentArgs,
  FindConfluenceUsersArgs,
  GetConfluenceLabelsArgs,
  AddConfluenceLabelsArgs,
  ExportConfluencePageArgs,
  ConfluencePage,
  ConfluenceSpace,
  ConfluenceAttachment
} from '../types/index.js';
import { formatApiError } from '../utils/http-client.js';
import { ContentConverter } from '../utils/content-converter.js';
import { ExportConverter } from '../utils/export-converter.js';

export class ConfluenceHandlers {
  constructor(private client: AxiosInstance) {}

  async readConfluencePage(args: ReadConfluencePageArgs): Promise<CallToolResult> {
    try {
      const { pageId, title, spaceKey, expand = 'body.storage,version,space', format = 'storage' } = args;

      if (!pageId && !title) {
        return {
          content: [{ type: 'text', text: 'Error: Either pageId or title must be provided' }],
          isError: true,
        };
      }

      if (title && !spaceKey) {
        return {
          content: [{ type: 'text', text: 'Error: spaceKey is required when using title' }],
          isError: true,
        };
      }

      let page: ConfluencePage;

      if (pageId) {
        const response = await this.client.get(`/wiki/rest/api/content/${pageId}`, {
          params: { expand },
        });
        page = response.data;
      } else {
        const searchResponse = await this.client.get('/wiki/rest/api/content', {
          params: {
            spaceKey,
            title,
            expand,
          },
        });

        if (searchResponse.data.results.length === 0) {
          return {
            content: [{ type: 'text', text: `No page found with title "${title}" in space ${spaceKey}` }],
          };
        }

        page = searchResponse.data.results[0];
      }

      const storageContent = page.body?.storage?.value || '';
      const content = format === 'markdown' 
        ? ContentConverter.storageToMarkdown(storageContent)
        : storageContent;

      const result = {
        id: page.id,
        title: page.title,
        space: page.space,
        version: page.version?.number,
        webUrl: `${this.client.defaults.baseURL}/wiki${page._links?.webui}`,
        content,
        format,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async searchConfluencePages(args: SearchConfluencePagesArgs): Promise<CallToolResult> {
    try {
      const { cql, limit = 25, start = 0, expand } = args;

      const response = await this.client.get('/wiki/rest/api/content/search', {
        params: {
          cql,
          limit: Math.min(limit, 100),
          start,
          expand,
        },
      });

      const results = response.data.results.map((page: ConfluencePage) => ({
        id: page.id,
        title: page.title,
        type: page.type,
        space: page.space,
        webUrl: `${this.client.defaults.baseURL}/wiki${page._links?.webui}`,
      }));

      const resultData = {
        totalResults: response.data.totalSize,
        startAt: response.data.start,
        limit: response.data.limit,
        results,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listConfluenceSpaces(args: ListConfluenceSpacesArgs): Promise<CallToolResult> {
    try {
      const { type, status = 'current', limit = 25 } = args;

      const params: any = {
        limit: Math.min(limit, 100),
        status,
      };

      if (type) {
        params.type = type;
      }

      const response = await this.client.get('/wiki/rest/api/space', { params });

      const results = response.data.results.map((space: ConfluenceSpace) => ({
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        status: space.status,
        webUrl: `${this.client.defaults.baseURL}/wiki${space._links?.webui}`,
      }));

      const resultData = {
        totalResults: response.data.size,
        startAt: response.data.start,
        limit: response.data.limit,
        results,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async listConfluenceAttachments(args: ListConfluenceAttachmentsArgs): Promise<CallToolResult> {
    try {
      const { pageId, mediaType, filename, limit = 50, start = 0 } = args;

      const response = await this.client.get(`/wiki/rest/api/content/${pageId}/child/attachment`, {
        params: {
          limit: Math.min(limit, 100),
          start,
          ...(mediaType && { mediaType }),
          ...(filename && { filename }),
        },
      });

      const attachments = response.data.results.map((attachment: ConfluenceAttachment) => ({
        id: attachment.id,
        title: attachment.title,
        mediaType: attachment.extensions.mediaType,
        fileSize: attachment.extensions.fileSize,
        version: attachment.version.number,
        downloadUrl: `${this.client.defaults.baseURL}/wiki${attachment._links?.download}`,
        webUrl: `${this.client.defaults.baseURL}/wiki${attachment._links?.webui}`,
      }));

      const resultData = {
        totalResults: response.data.size,
        startAt: response.data.start,
        limit: response.data.limit,
        pageId,
        attachments,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(resultData, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async downloadConfluenceAttachment(args: DownloadConfluenceAttachmentArgs): Promise<CallToolResult> {
    try {
      const { attachmentId, version } = args;

      // First get attachment metadata
      const metadataResponse = await this.client.get(`/wiki/rest/api/content/${attachmentId}`, {
        params: {
          expand: 'version,metadata',
        },
      });

      const attachment = metadataResponse.data;
      
      // Use the download link from the attachment metadata
      if (!attachment._links?.download) {
        return {
          content: [{ type: 'text', text: 'No download link available for this attachment' }],
          isError: true,
        };
      }

      // Build the download URL
      let downloadPath = `/wiki${attachment._links.download}`;
      
      // If a specific version is requested, update the URL
      if (version && version !== attachment.version.number) {
        // Parse existing URL and update version parameter
        const url = new URL(downloadPath, this.client.defaults.baseURL);
        url.searchParams.set('version', version.toString());
        downloadPath = url.pathname + url.search;
      }

      // Download the attachment
      const downloadResponse = await this.client.get(downloadPath, {
        responseType: 'arraybuffer',
      });

      // Convert to base64
      const base64Data = Buffer.from(downloadResponse.data).toString('base64');

      const result = {
        id: attachment.id,
        title: attachment.title,
        mediaType: attachment.metadata?.mediaType || attachment.extensions?.mediaType || 'application/octet-stream',
        fileSize: downloadResponse.data.byteLength,
        version: attachment.version.number,
        base64Data,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async downloadConfluencePageComplete(args: DownloadConfluencePageCompleteArgs): Promise<CallToolResult> {
    try {
      const { 
        pageId, 
        includeAttachments = true, 
        attachmentTypes,
        maxAttachmentSize = 52428800 // 50MB default
      } = args;

      // Get page content with all expansions
      const pageResponse = await this.client.get(`/wiki/rest/api/content/${pageId}`, {
        params: {
          expand: 'body.storage,body.view,version,space,ancestors,descendants,metadata.labels',
        },
      });

      const page = pageResponse.data;
      const result: any = {
        page: {
          id: page.id,
          title: page.title,
          version: page.version?.number,
          space: page.space,
          webUrl: `${this.client.defaults.baseURL}/wiki${page._links?.webui}`,
          content: {
            storage: page.body?.storage?.value,
            view: page.body?.view?.value,
          },
          metadata: {
            labels: page.metadata?.labels?.results || [],
            created: page.version?.when,
            createdBy: page.version?.by?.displayName,
          },
          ancestors: page.ancestors || [],
        },
        attachments: [],
      };

      if (includeAttachments) {
        // Get all attachments for the page
        const attachmentsResponse = await this.client.get(`/wiki/rest/api/content/${pageId}/child/attachment`, {
          params: {
            limit: 100,
            expand: 'version,metadata',
          },
        });

        const attachments = attachmentsResponse.data.results;
        const downloadPromises = [];

        for (const attachment of attachments) {
          // Filter by type if specified
          if (attachmentTypes && attachmentTypes.length > 0) {
            if (!attachmentTypes.includes(attachment.extensions.mediaType)) {
              continue;
            }
          }

          // Skip if too large
          if (attachment.extensions.fileSize > maxAttachmentSize) {
            result.attachments.push({
              id: attachment.id,
              title: attachment.title,
              mediaType: attachment.extensions.mediaType,
              fileSize: attachment.extensions.fileSize,
              skipped: true,
              reason: `File size (${attachment.extensions.fileSize} bytes) exceeds maximum (${maxAttachmentSize} bytes)`,
            });
            continue;
          }

          // Download attachment
          const downloadPromise = (async () => {
            try {
              if (!attachment._links?.download) {
                return {
                  id: attachment.id,
                  title: attachment.title,
                  mediaType: attachment.extensions.mediaType,
                  fileSize: attachment.extensions.fileSize,
                  error: 'No download link available',
                };
              }

              const downloadPath = `/wiki${attachment._links.download}`;
              const downloadResponse = await this.client.get(downloadPath, {
                responseType: 'arraybuffer',
              });

              const base64Data = Buffer.from(downloadResponse.data).toString('base64');

              return {
                id: attachment.id,
                title: attachment.title,
                mediaType: attachment.extensions.mediaType,
                fileSize: downloadResponse.data.byteLength,
                version: attachment.version.number,
                base64Data,
              };
            } catch (error) {
              return {
                id: attachment.id,
                title: attachment.title,
                mediaType: attachment.extensions.mediaType,
                fileSize: attachment.extensions.fileSize,
                error: formatApiError(error),
              };
            }
          })();

          downloadPromises.push(downloadPromise);
        }

        // Wait for all downloads to complete
        const downloadedAttachments = await Promise.all(downloadPromises);
        result.attachments.push(...downloadedAttachments);

        // Add summary
        result.summary = {
          totalAttachments: attachments.length,
          downloadedAttachments: downloadedAttachments.filter((a: any) => a.base64Data).length,
          skippedAttachments: result.attachments.filter((a: any) => a.skipped).length,
          failedAttachments: downloadedAttachments.filter((a: any) => a.error && !a.skipped).length,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async createConfluencePage(args: CreateConfluencePageArgs): Promise<CallToolResult> {
    try {
      const { spaceKey, title, content, parentId, type = 'page' } = args;

      // Convert to storage format if needed
      const storageContent = ContentConverter.ensureStorageFormat(content);

      const requestBody: any = {
        type,
        title,
        space: {
          key: spaceKey,
        },
        body: {
          storage: {
            value: storageContent,
            representation: 'storage',
          },
        },
      };

      // Add parent relationship if specified
      if (parentId) {
        requestBody.ancestors = [{ id: parentId }];
      }

      const response = await this.client.post('/wiki/rest/api/content', requestBody);

      const result = {
        id: response.data.id,
        title: response.data.title,
        type: response.data.type,
        space: response.data.space,
        version: response.data.version?.number,
        webUrl: `${this.client.defaults.baseURL}/wiki${response.data._links?.webui}`,
        message: 'Page created successfully',
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async updateConfluencePage(args: UpdateConfluencePageArgs): Promise<CallToolResult> {
    try {
      const { pageId, title, content, version, minorEdit = false, versionComment } = args;

      // First, get the current page to maintain existing properties
      const currentPageResponse = await this.client.get(`/wiki/rest/api/content/${pageId}`, {
        params: { expand: 'body.storage,version,space' },
      });

      const currentPage = currentPageResponse.data;

      // Prepare update request
      const requestBody: any = {
        id: pageId,
        type: currentPage.type,
        title: title || currentPage.title,
        space: currentPage.space,
        version: {
          number: version,
          minorEdit,
        },
      };

      // Add version comment if provided
      if (versionComment) {
        requestBody.version.message = versionComment;
      }

      // Update content if provided
      if (content) {
        const storageContent = ContentConverter.ensureStorageFormat(content);
        requestBody.body = {
          storage: {
            value: storageContent,
            representation: 'storage',
          },
        };
      } else {
        requestBody.body = currentPage.body;
      }

      const response = await this.client.put(`/wiki/rest/api/content/${pageId}`, requestBody);

      const result = {
        id: response.data.id,
        title: response.data.title,
        version: response.data.version?.number,
        previousVersion: version,
        webUrl: `${this.client.defaults.baseURL}/wiki${response.data._links?.webui}`,
        message: 'Page updated successfully',
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async addConfluenceComment(args: AddConfluenceCommentArgs): Promise<CallToolResult> {
    try {
      const { pageId, content, parentCommentId } = args;

      // Convert to storage format if needed
      const storageContent = ContentConverter.ensureStorageFormat(content);

      const requestBody: any = {
        type: 'comment',
        container: {
          id: pageId,
          type: 'page',
        },
        body: {
          storage: {
            value: storageContent,
            representation: 'storage',
          },
        },
      };

      // Add parent comment relationship if specified
      if (parentCommentId) {
        requestBody.ancestors = [{ id: parentCommentId }];
      }

      const response = await this.client.post('/wiki/rest/api/content', requestBody);

      const result = {
        id: response.data.id,
        type: response.data.type,
        pageId,
        parentCommentId,
        version: response.data.version?.number,
        createdBy: response.data.version?.by?.displayName,
        createdAt: response.data.version?.when,
        webUrl: `${this.client.defaults.baseURL}/wiki${response.data._links?.webui}`,
        message: 'Comment added successfully',
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async findConfluenceUsers(args: FindConfluenceUsersArgs): Promise<CallToolResult> {
    try {
      const { cql, username, userKey, accountId, expand, limit = 25, start = 0 } = args;

      // Build query parameters
      const params: any = {
        limit: Math.min(limit, 100),
        start,
      };

      if (cql) params.cql = cql;
      if (username) params.username = username;
      if (userKey) params.key = userKey;
      if (accountId) params.accountId = accountId;
      if (expand) params.expand = expand;

      // Try different endpoints based on Confluence version
      let response;
      try {
        // Try the standard user search endpoint first
        response = await this.client.get('/wiki/rest/api/user/search', { params });
      } catch (error) {
        // If that fails, try the alternative search/user endpoint
        try {
          response = await this.client.get('/wiki/rest/api/search/user', { params });
        } catch (searchError) {
          // If both fail, return a helpful message
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                message: 'User search endpoint not available. This might be due to Confluence version or permissions.',
                suggestion: 'Try using the Confluence web interface to search for users.',
                error: formatApiError(error)
              }, null, 2)
            }],
            isError: false, // Not marking as error since it's a known limitation
          };
        }
      }

      const users = response.data.results?.map((user: any) => ({
        userKey: user.userKey,
        username: user.username,
        accountId: user.accountId,
        displayName: user.displayName,
        email: user.email,
        profilePicture: user.profilePicture,
        active: user.active,
      })) || [];

      const result = {
        totalResults: response.data.size || users.length,
        startAt: response.data.start || start,
        limit: response.data.limit || limit,
        users,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async getConfluenceLabels(args: GetConfluenceLabelsArgs): Promise<CallToolResult> {
    try {
      const { pageId, prefix, limit = 25, start = 0 } = args;

      const params: any = {
        limit: Math.min(limit, 200),
        start,
      };

      if (prefix) {
        params.prefix = prefix;
      }

      const response = await this.client.get(`/wiki/rest/api/content/${pageId}/label`, { params });

      const labels = response.data.results?.map((label: any) => ({
        prefix: label.prefix,
        name: label.name,
        id: label.id,
        label: label.label,
      })) || [];

      const result = {
        pageId,
        totalResults: response.data.size || labels.length,
        startAt: response.data.start || start,
        limit: response.data.limit || limit,
        labels,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async addConfluenceLabels(args: AddConfluenceLabelsArgs): Promise<CallToolResult> {
    try {
      const { pageId, labels } = args;

      // Format labels for the API
      const formattedLabels = labels.map(label => ({
        prefix: label.prefix || 'global',
        name: label.name,
      }));

      const response = await this.client.post(
        `/wiki/rest/api/content/${pageId}/label`,
        formattedLabels
      );

      const addedLabels = response.data.results?.map((label: any) => ({
        prefix: label.prefix,
        name: label.name,
        id: label.id,
        label: label.label,
      })) || [];

      const result = {
        pageId,
        addedLabels,
        totalLabels: addedLabels.length,
        message: `Successfully added ${addedLabels.length} label(s) to page`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: formatApiError(error) }],
        isError: true,
      };
    }
  }

  async exportConfluencePage(args: ExportConfluencePageArgs): Promise<CallToolResult> {
    try {
      const { pageId, format } = args;

      console.error(`Exporting page ${pageId} to ${format.toUpperCase()} format...`);

      // Step 1: Get the page content with export view
      const pageResponse = await this.client.get(`/wiki/rest/api/content/${pageId}`, {
        params: {
          expand: 'body.export_view,space,version'
        }
      });

      if (!pageResponse.data || !pageResponse.data.body?.export_view) {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              error: 'Could not retrieve page export view',
              message: 'The page may not have export view available',
              pageId
            }, null, 2)
          }],
          isError: true,
        };
      }

      const page = pageResponse.data;
      let htmlContent = page.body.export_view.value;
      const title = page.title;
      const baseUrl = this.client.defaults.baseURL || '';

      console.error(`Page retrieved: "${title}", processing content...`);

      // Step 2: Process and embed all images
      const imageResult = await ExportConverter.processImages(
        htmlContent,
        this.client,
        true // Always embed images
      );
      htmlContent = imageResult.html;
      const processedImages = imageResult.images;
      console.error(`Processed and embedded ${processedImages.length} images`);

      let exportContent: string;
      let mimeType: string;
      let fileExtension: string;

      if (format === 'html') {
        // Step 3a: Return just the HTML content without wrapper
        exportContent = htmlContent;
        mimeType = 'text/html';
        fileExtension = 'html';
      } else {
        // Step 3b: Convert to Markdown
        const markdownContent = ExportConverter.htmlToMarkdown(htmlContent);
        
        // Create markdown document with metadata
        exportContent = ExportConverter.createMarkdownDocument(
          markdownContent,
          {
            title,
            space: page.space?.name,
            spaceKey: page.space?.key,
            version: page.version?.number,
            modified: page.version?.when ? new Date(page.version.when) : undefined,
            pageId,
            sourceUrl: `${baseUrl}/wiki${page._links?.webui || ''}`
          }
        );
        mimeType = 'text/markdown';
        fileExtension = 'md';
      }

      // Step 4: Return as base64
      const contentBuffer = Buffer.from(exportContent, 'utf-8');
      const base64Data = contentBuffer.toString('base64');
      
      const result = {
        pageId,
        title,
        format,
        spaceKey: page.space?.key,
        spaceName: page.space?.name,
        filename: `${title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`,
        fileSize: contentBuffer.length,
        mimeType,
        base64Data,
        imagesEmbedded: processedImages.length,
        webUrl: `${baseUrl}/wiki${page._links?.webui || ''}`,
        message: `Page exported successfully to ${format.toUpperCase()} format with ${processedImages.length} embedded images`,
        exportMethod: format === 'html' ? 'html-export' : 'markdown-conversion',
        timestamp: new Date().toISOString()
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            error: 'Export failed',
            message: error instanceof Error ? error.message : String(error),
            pageId: args.pageId,
            format: args.format,
            suggestion: 'Ensure the page exists and has proper permissions'
          }, null, 2)
        }],
        isError: true,
      };
    }
  }
}