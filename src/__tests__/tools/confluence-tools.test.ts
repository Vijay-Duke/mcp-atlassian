import { describe, it, expect } from 'vitest';
import { confluenceTools } from '../../confluence/tools.js';

describe('Confluence Tools', () => {
  describe('tool registration', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(confluenceTools)).toBe(true);
      expect(confluenceTools.length).toBeGreaterThan(0);
    });

    it('should have tools with required properties', () => {
      confluenceTools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');

        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    it('should have unique tool names', () => {
      const names = confluenceTools.map((tool) => tool.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have non-empty names and descriptions', () => {
      confluenceTools.forEach((tool) => {
        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid JSON schemas', () => {
      confluenceTools.forEach((tool) => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });
  });

  describe('specific tools', () => {
    it('should include get_confluence_current_user', () => {
      const currentUserTool = confluenceTools.find(
        (tool) => tool.name === 'get_confluence_current_user'
      );

      expect(currentUserTool).toBeDefined();
      expect(currentUserTool?.description).toContain('current user');
      expect(Object.keys(currentUserTool?.inputSchema.properties || {})).toHaveLength(0);
    });

    it('should include get_confluence_user with proper schema', () => {
      const getUserTool = confluenceTools.find((tool) => tool.name === 'get_confluence_user');

      expect(getUserTool).toBeDefined();
      expect(getUserTool?.description).toContain('specific');

      const properties = getUserTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('username');
      expect(properties).toHaveProperty('accountId');
      expect(properties).toHaveProperty('email');
    });

    it('should include read_confluence_page with proper schema', () => {
      const readPageTool = confluenceTools.find((tool) => tool.name === 'read_confluence_page');

      expect(readPageTool).toBeDefined();
      expect(readPageTool?.description).toContain('page');

      const properties = readPageTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('pageId');
      expect(properties).toHaveProperty('title');
      expect(properties).toHaveProperty('spaceKey');
    });

    it('should include search_confluence_pages with CQL parameter', () => {
      const searchTool = confluenceTools.find((tool) => tool.name === 'search_confluence_pages');

      expect(searchTool).toBeDefined();
      expect(searchTool?.description).toContain('search');

      const properties = searchTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('cql');
      expect(properties.cql.type).toBe('string');
    });

    it('should include list_confluence_spaces', () => {
      const listSpacesTool = confluenceTools.find((tool) => tool.name === 'list_confluence_spaces');

      expect(listSpacesTool).toBeDefined();
      expect(listSpacesTool?.description).toContain('spaces');

      const properties = listSpacesTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('type');
      expect(properties).toHaveProperty('status');
    });

    it('should include create_confluence_page with required fields', () => {
      const createPageTool = confluenceTools.find((tool) => tool.name === 'create_confluence_page');

      expect(createPageTool).toBeDefined();
      expect(createPageTool?.description.toLowerCase()).toContain('create');

      const properties = createPageTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('spaceKey');
      expect(properties).toHaveProperty('title');
      expect(properties).toHaveProperty('content');
      expect(properties).toHaveProperty('parentId');
      expect(properties).toHaveProperty('type');
    });

    it('should include update_confluence_page with version field', () => {
      const updatePageTool = confluenceTools.find((tool) => tool.name === 'update_confluence_page');

      expect(updatePageTool).toBeDefined();
      expect(updatePageTool?.description).toContain('update');

      const properties = updatePageTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('pageId');
      expect(properties).toHaveProperty('version');
      expect(properties).toHaveProperty('title');
      expect(properties).toHaveProperty('content');
    });

    it('should include attachment tools', () => {
      const attachmentTools = confluenceTools.filter((tool) => tool.name.includes('attachment'));

      expect(attachmentTools.length).toBeGreaterThan(0);

      const uploadTool = confluenceTools.find(
        (tool) => tool.name === 'upload_confluence_attachment'
      );
      expect(uploadTool).toBeDefined();

      const listTool = confluenceTools.find((tool) => tool.name === 'list_confluence_attachments');
      expect(listTool).toBeDefined();

      const downloadTool = confluenceTools.find(
        (tool) => tool.name === 'download_confluence_attachment'
      );
      expect(downloadTool).toBeDefined();
    });

    it('should include user-specific search tools', () => {
      const userSearchTool = confluenceTools.find(
        (tool) => tool.name === 'search_confluence_pages_by_user'
      );

      expect(userSearchTool).toBeDefined();

      const properties = userSearchTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('searchType');
      expect(properties.searchType).toHaveProperty('enum');
      expect(properties.searchType.enum).toContain('creator');
      expect(properties.searchType.enum).toContain('lastModifier');
    });

    it('should include export functionality', () => {
      const exportTool = confluenceTools.find((tool) => tool.name === 'export_confluence_page');

      expect(exportTool).toBeDefined();

      const properties = exportTool?.inputSchema.properties || {};
      expect(properties).toHaveProperty('format');
      expect(properties.format).toHaveProperty('enum');
      expect(properties.format.enum).toContain('html');
      expect(properties.format.enum).toContain('markdown');
    });
  });

  describe('schema validation', () => {
    it('should have proper enum definitions where applicable', () => {
      confluenceTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          if (property.enum) {
            expect(Array.isArray(property.enum)).toBe(true);
            expect(property.enum.length).toBeGreaterThan(0);

            property.enum.forEach((value: any) => {
              expect(typeof value).toBe('string');
            });
          }
        });
      });
    });

    it('should have descriptions for all properties', () => {
      confluenceTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          expect(property).toHaveProperty('description');
          expect(typeof property.description).toBe('string');
          expect(property.description.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have appropriate types for properties', () => {
      confluenceTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          expect(property).toHaveProperty('type');
          expect(['string', 'number', 'boolean', 'object', 'array']).toContain(property.type);
        });
      });
    });
  });

  describe('tool naming conventions', () => {
    it('should follow consistent naming patterns', () => {
      confluenceTools.forEach((tool) => {
        // Should start with action verb or 'get_'
        const namePattern =
          /^(get_|read_|search_|list_|create_|update_|add_|upload_|download_|export_|find_)/;
        expect(tool.name).toMatch(namePattern);

        // Should contain 'confluence' to identify the service
        expect(tool.name).toContain('confluence');
      });
    });

    it('should have tool names that match their functionality', () => {
      const toolMappings = [
        { name: 'get_confluence_current_user', keywords: ['get', 'current', 'user'] },
        { name: 'search_confluence_pages', keywords: ['search', 'pages'] },
        { name: 'create_confluence_page', keywords: ['create', 'page'] },
        { name: 'update_confluence_page', keywords: ['update', 'page'] },
        { name: 'list_confluence_spaces', keywords: ['list', 'spaces'] },
      ];

      toolMappings.forEach(({ name, keywords }) => {
        const tool = confluenceTools.find((t) => t.name === name);
        if (tool) {
          keywords.forEach((keyword) => {
            expect(tool.name.toLowerCase()).toContain(keyword);
          });
        }
      });
    });
  });

  describe('comprehensive tool coverage', () => {
    it('should have all expected Confluence operations', () => {
      const expectedOperations = [
        'get_confluence_current_user',
        'read_confluence_page',
        'search_confluence_pages',
        'list_confluence_spaces',
        'create_confluence_page',
        'update_confluence_page',
        'add_confluence_comment',
        'list_confluence_attachments',
        'download_confluence_attachment',
        'upload_confluence_attachment',
      ];

      expectedOperations.forEach((operation) => {
        const tool = confluenceTools.find((t) => t.name === operation);
        expect(tool).toBeDefined();
      });
    });

    it('should cover CRUD operations for pages', () => {
      const crudOperations = [
        { action: 'create', name: 'create_confluence_page' },
        { action: 'read', name: 'read_confluence_page' },
        { action: 'update', name: 'update_confluence_page' },
        // Delete is typically not implemented for safety
      ];

      crudOperations.forEach(({ action, name }) => {
        const tool = confluenceTools.find((t) => t.name === name);
        expect(tool).toBeDefined();
      });
    });

    it('should support user-centric operations', () => {
      const userOperations = confluenceTools.filter(
        (tool) => tool.name.includes('user') || tool.description.toLowerCase().includes('user')
      );

      expect(userOperations.length).toBeGreaterThan(2);
    });

    it('should support search and discovery', () => {
      const searchOperations = confluenceTools.filter(
        (tool) =>
          tool.name.includes('search') || tool.name.includes('list') || tool.name.includes('find')
      );

      expect(searchOperations.length).toBeGreaterThan(3);
    });
  });
});
