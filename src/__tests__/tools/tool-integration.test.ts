import { describe, it, expect } from 'vitest';
import { confluenceTools } from '../../confluence/tools.js';
import { jiraTools } from '../../jira/tools.js';

describe('Tool Integration', () => {
  describe('combined tool registry', () => {
    it('should have no naming conflicts between Confluence and Jira tools', () => {
      const confluenceNames = confluenceTools.map((tool) => tool.name);
      const jiraNames = jiraTools.map((tool) => tool.name);

      const intersection = confluenceNames.filter((name) => jiraNames.includes(name));
      expect(intersection).toHaveLength(0);
    });

    it('should have a reasonable total number of tools', () => {
      const totalTools = confluenceTools.length + jiraTools.length;

      expect(totalTools).toBeGreaterThan(10);
      expect(totalTools).toBeLessThan(100); // Reasonable upper bound
    });

    it('should have consistent naming patterns across both tool sets', () => {
      const allTools = [...confluenceTools, ...jiraTools];

      allTools.forEach((tool) => {
        // Should use snake_case
        expect(tool.name).toMatch(/^[a-z]+(_[a-z]+)*$/);

        // Should start with action verb
        const actionVerbs = [
          'get',
          'read',
          'search',
          'list',
          'create',
          'update',
          'add',
          'upload',
          'download',
          'export',
          'find',
        ];
        const startsWithAction = actionVerbs.some((verb) => tool.name.startsWith(verb + '_'));
        expect(startsWithAction).toBe(true);
      });
    });

    it('should have consistent schema structure across all tools', () => {
      const allTools = [...confluenceTools, ...jiraTools];

      allTools.forEach((tool) => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');

        // Properties should be an object
        expect(typeof tool.inputSchema.properties).toBe('object');

        // Each property should have type and description
        Object.entries(tool.inputSchema.properties || {}).forEach(
          ([key, property]: [string, any]) => {
            expect(property).toHaveProperty('type');
            expect(property).toHaveProperty('description');

            expect(typeof property.type).toBe('string');
            expect(typeof property.description).toBe('string');
            expect(property.description.length).toBeGreaterThan(0);
          }
        );
      });
    });
  });

  describe('user identification patterns', () => {
    it('should have consistent user identification parameters', () => {
      const allTools = [...confluenceTools, ...jiraTools];
      const userIdentityTools = allTools.filter((tool) => {
        const properties = tool.inputSchema.properties || {};
        return properties.username || properties.accountId || properties.email;
      });

      userIdentityTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        // Should have at least one user identification method
        const hasUserIdentity = properties.username || properties.accountId || properties.email;
        expect(hasUserIdentity).toBeTruthy();

        // If they have user identity fields, they should follow consistent patterns
        if (properties.username) {
          expect((properties.username as any)?.type).toBe('string');
          expect((properties.username as any)?.description.toLowerCase()).toContain('username');
        }

        if (properties.accountId) {
          expect((properties.accountId as any)?.type).toBe('string');
          expect((properties.accountId as any)?.description.toLowerCase()).toContain('account');
        }

        if (properties.email) {
          expect((properties.email as any)?.type).toBe('string');
          expect((properties.email as any)?.description.toLowerCase()).toContain('email');
        }
      });
    });

    it('should provide alternative user identification methods', () => {
      const allTools = [...confluenceTools, ...jiraTools];
      const userTools = allTools.filter((tool) => tool.name.includes('user'));

      userTools.forEach((tool) => {
        if (tool.name.includes('current')) return; // Current user tools don't need parameters

        const properties = tool.inputSchema.properties || {};
        const userIdMethods = [properties.username, properties.accountId, properties.email].filter(
          Boolean
        );

        expect(userIdMethods.length).toBeGreaterThan(0);
      });
    });
  });

  describe('pagination patterns', () => {
    it('should have consistent pagination parameters', () => {
      const allTools = [...confluenceTools, ...jiraTools];
      const paginatedTools = allTools.filter((tool) => {
        const properties = tool.inputSchema.properties || {};
        return properties.limit || properties.maxResults || properties.start || properties.startAt;
      });

      paginatedTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        // Should use consistent naming patterns
        if (properties.limit || properties.maxResults) {
          const limitParam = properties.limit || properties.maxResults;
          expect((limitParam as any)?.type).toBe('number');
        }

        if (properties.start || properties.startAt) {
          const startParam = properties.start || properties.startAt;
          expect((startParam as any)?.type).toBe('number');
        }
      });
    });
  });

  describe('search functionality patterns', () => {
    it('should have proper search tools for both services', () => {
      const confluenceSearchTools = confluenceTools.filter(
        (tool) => tool.name.includes('search') || tool.name.includes('find')
      );
      const jiraSearchTools = jiraTools.filter(
        (tool) => tool.name.includes('search') || tool.name.includes('find')
      );

      expect(confluenceSearchTools.length).toBeGreaterThan(0);
      expect(jiraSearchTools.length).toBeGreaterThan(0);
    });

    it('should have query language parameters in search tools', () => {
      const confluenceSearch = confluenceTools.find(
        (tool) => tool.name === 'search_confluence_pages'
      );
      const jiraSearch = jiraTools.find((tool) => tool.name === 'search_jira_issues');

      if (confluenceSearch) {
        const properties = confluenceSearch.inputSchema.properties || {};
        expect(properties).toHaveProperty('cql');
        expect((properties.cql as any)?.description.toLowerCase()).toContain('cql');
      }

      if (jiraSearch) {
        const properties = jiraSearch.inputSchema.properties || {};
        expect(properties).toHaveProperty('jql');
        expect((properties.jql as any)?.description.toLowerCase()).toContain('jql');
      }
    });
  });

  describe('CRUD operation coverage', () => {
    it('should provide create operations for both services', () => {
      const confluenceCreateTools = confluenceTools.filter((tool) =>
        tool.name.startsWith('create_')
      );
      const jiraCreateTools = jiraTools.filter((tool) => tool.name.startsWith('create_'));

      expect(confluenceCreateTools.length).toBeGreaterThan(0);
      expect(jiraCreateTools.length).toBeGreaterThan(0);
    });

    it('should provide read operations for both services', () => {
      const confluenceReadTools = confluenceTools.filter(
        (tool) => tool.name.startsWith('read_') || tool.name.startsWith('get_')
      );
      const jiraReadTools = jiraTools.filter(
        (tool) => tool.name.startsWith('read_') || tool.name.startsWith('get_')
      );

      expect(confluenceReadTools.length).toBeGreaterThan(0);
      expect(jiraReadTools.length).toBeGreaterThan(0);
    });

    it('should provide update operations where appropriate', () => {
      const confluenceUpdateTools = confluenceTools.filter((tool) =>
        tool.name.startsWith('update_')
      );

      expect(confluenceUpdateTools.length).toBeGreaterThan(0);

      // Jira might not have update operations for security reasons, that's okay
    });

    it('should provide list/browse operations for both services', () => {
      const confluenceListTools = confluenceTools.filter((tool) => tool.name.startsWith('list_'));
      const jiraListTools = jiraTools.filter((tool) => tool.name.startsWith('list_'));

      expect(confluenceListTools.length).toBeGreaterThan(0);
      expect(jiraListTools.length).toBeGreaterThan(0);
    });
  });

  describe('service-specific functionality', () => {
    it('should have Confluence-specific features', () => {
      const confluenceSpecific = ['spaces', 'pages', 'attachments', 'export'];

      confluenceSpecific.forEach((feature) => {
        const hasFeature = confluenceTools.some(
          (tool) => tool.name.includes(feature) || (tool.description || '').toLowerCase().includes(feature)
        );
        expect(hasFeature).toBe(true);
      });
    });

    it('should have Jira-specific features', () => {
      const jiraSpecific = ['issues', 'projects', 'boards', 'sprints', 'worklog'];

      jiraSpecific.forEach((feature) => {
        const hasFeature = jiraTools.some(
          (tool) => tool.name.includes(feature) || (tool.description || '').toLowerCase().includes(feature)
        );
        expect(hasFeature).toBe(true);
      });
    });

    it('should have agile-specific tools in Jira', () => {
      const agileTools = jiraTools.filter(
        (tool) =>
          tool.name.includes('board') ||
          tool.name.includes('sprint') ||
          (tool.description || '').toLowerCase().includes('agile') ||
          (tool.description || '').toLowerCase().includes('scrum')
      );

      expect(agileTools.length).toBeGreaterThan(1);
    });
  });

  describe('error prevention', () => {
    it('should not have any empty tool arrays', () => {
      expect(confluenceTools.length).toBeGreaterThan(0);
      expect(jiraTools.length).toBeGreaterThan(0);
    });

    it('should not have any tools with empty schemas', () => {
      const allTools = [...confluenceTools, ...jiraTools];

      allTools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should not have any malformed enum values', () => {
      const allTools = [...confluenceTools, ...jiraTools];

      allTools.forEach((tool) => {
        const properties = tool.inputSchema.properties || {};

        Object.entries(properties).forEach(([key, property]: [string, any]) => {
          if (property.enum) {
            expect(Array.isArray(property.enum)).toBe(true);
            expect(property.enum.length).toBeGreaterThan(0);

            // All enum values should be strings and non-empty
            property.enum.forEach((value: any) => {
              expect(typeof value).toBe('string');
              expect(value.length).toBeGreaterThan(0);
            });
          }
        });
      });
    });
  });
});
