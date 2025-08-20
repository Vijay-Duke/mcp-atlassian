import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolRegistry, type ToolDefinition, type ToolHandler } from '../../utils/tool-registry.js';
import { Logger } from '../../utils/logger.js';

// Mock the Logger
vi.mock('../../utils/logger.js', () => ({
  Logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    logToolCall: vi.fn(),
    logError: vi.fn(),
    logResponse: vi.fn(),
    logPerformance: vi.fn(),
  },
}));

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockHandler: ToolHandler;
  let mockValidator: (args: any) => { isValid: boolean; validatedArgs?: any; errors?: string[] };

  beforeEach(() => {
    registry = new ToolRegistry();
    mockHandler = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Success' }],
      isError: false,
    });
    mockValidator = vi.fn().mockReturnValue({
      isValid: true,
      validatedArgs: { validated: true },
    });
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new tool', () => {
      const toolDefinition: ToolDefinition = {
        name: 'test-tool',
        handler: mockHandler,
        description: 'A test tool',
      };

      registry.register(toolDefinition);

      expect(registry.hasTool('test-tool')).toBe(true);
      expect(Logger.debug).toHaveBeenCalledWith('Registered tool: test-tool', { tool: 'test-tool' });
    });

    it('should warn when overriding an existing tool', () => {
      const toolDefinition: ToolDefinition = {
        name: 'test-tool',
        handler: mockHandler,
      };

      // Register the tool twice
      registry.register(toolDefinition);
      registry.register(toolDefinition);

      expect(Logger.warn).toHaveBeenCalledWith('Tool test-tool is being overridden');
      expect(Logger.debug).toHaveBeenCalledTimes(2);
    });

    it('should register tool with validator', () => {
      const toolDefinition: ToolDefinition = {
        name: 'validated-tool',
        handler: mockHandler,
        validator: mockValidator,
        description: 'A tool with validation',
      };

      registry.register(toolDefinition);

      expect(registry.hasTool('validated-tool')).toBe(true);
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      const toolDefinition: ToolDefinition = {
        name: 'test-tool',
        handler: mockHandler,
        description: 'A test tool',
      };
      registry.register(toolDefinition);
    });

    it('should execute a tool successfully', async () => {
      const args = { param: 'value' };
      const requestId = 'req-123';

      const result = await registry.execute('test-tool', args, requestId);

      expect(mockHandler).toHaveBeenCalledWith(args);
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Success' }],
        isError: false,
      });
      expect(Logger.logToolCall).toHaveBeenCalledWith('test-tool', undefined, {
        requestId,
        args: { param: 'value' },
      });
      expect(Logger.logResponse).toHaveBeenCalledWith('tool-test-tool', expect.any(Number), {
        tool: 'test-tool',
        requestId,
      });
      expect(Logger.logPerformance).toHaveBeenCalledWith('tool-test-tool', expect.any(Number), {
        tool: 'test-tool',
        requestId,
      });
    });

    it('should execute tool without requestId', async () => {
      const args = { param: 'value' };

      const result = await registry.execute('test-tool', args);

      expect(mockHandler).toHaveBeenCalledWith(args);
      expect(result.isError).toBe(false);
      expect(Logger.logToolCall).toHaveBeenCalledWith('test-tool', undefined, {
        requestId: undefined,
        args: { param: 'value' },
      });
    });

    it('should return error for unknown tool', async () => {
      const args = { param: 'value' };
      const requestId = 'req-123';

      const result = await registry.execute('unknown-tool', args, requestId);

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Unknown tool: unknown-tool' }],
        isError: true,
      });
      expect(Logger.logError).toHaveBeenCalledWith(
        'tool-execution',
        expect.any(Error),
        { tool: 'unknown-tool', requestId }
      );
    });

    it('should validate args when validator is provided', async () => {
      const validatedTool: ToolDefinition = {
        name: 'validated-tool',
        handler: mockHandler,
        validator: mockValidator,
      };
      registry.register(validatedTool);

      const args = { param: 'value' };
      const result = await registry.execute('validated-tool', args);

      expect(mockValidator).toHaveBeenCalledWith(args);
      expect(mockHandler).toHaveBeenCalledWith({ validated: true });
      expect(result.isError).toBe(false);
    });

    it('should return error when validation fails', async () => {
      const failingValidator = vi.fn().mockReturnValue({
        isValid: false,
        errors: ['Missing required field', 'Invalid format'],
      });

      const validatedTool: ToolDefinition = {
        name: 'failing-tool',
        handler: mockHandler,
        validator: failingValidator,
      };
      registry.register(validatedTool);

      const args = { param: 'invalid' };
      const requestId = 'req-456';

      const result = await registry.execute('failing-tool', args, requestId);

      expect(failingValidator).toHaveBeenCalledWith(args);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toEqual({
        content: [{ 
          type: 'text', 
          text: 'Validation failed for tool failing-tool: Missing required field, Invalid format' 
        }],
        isError: true,
      });
      expect(Logger.logError).toHaveBeenCalledWith(
        'tool-validation',
        expect.any(Error),
        {
          tool: 'failing-tool',
          requestId,
          validationErrors: ['Missing required field', 'Invalid format'],
        }
      );
    });

    it('should use original args when validator returns no validatedArgs', async () => {
      const validatorWithoutArgs = vi.fn().mockReturnValue({
        isValid: true,
        // No validatedArgs provided
      });

      const validatedTool: ToolDefinition = {
        name: 'validator-no-args',
        handler: mockHandler,
        validator: validatorWithoutArgs,
      };
      registry.register(validatedTool);

      const args = { param: 'value' };
      await registry.execute('validator-no-args', args);

      expect(mockHandler).toHaveBeenCalledWith(args);
    });

    it('should handle tool execution errors', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Tool execution failed'));
      const errorTool: ToolDefinition = {
        name: 'error-tool',
        handler: errorHandler,
      };
      registry.register(errorTool);

      const args = { param: 'value' };
      const requestId = 'req-error';

      const result = await registry.execute('error-tool', args, requestId);

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Tool execution failed' }],
        isError: true,
      });
      expect(Logger.logError).toHaveBeenCalledWith(
        'tool-error-tool',
        expect.any(Error),
        {
          tool: 'error-tool',
          requestId,
          duration: expect.any(Number),
        }
      );
    });

    it('should handle non-Error exceptions', async () => {
      const errorHandler = vi.fn().mockRejectedValue('String error');
      const errorTool: ToolDefinition = {
        name: 'string-error-tool',
        handler: errorHandler,
      };
      registry.register(errorTool);

      const result = await registry.execute('string-error-tool', {});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'An unknown error occurred' }],
        isError: true,
      });
    });

    it('should sanitize sensitive arguments', async () => {
      const args = {
        username: 'user123',
        password: 'secret123',
        token: 'token456',
        apiKey: 'key789',
        secret: 'secretValue',
        authorization: 'Bearer token',
        normal: 'normalValue',
      };

      await registry.execute('test-tool', args);

      expect(Logger.logToolCall).toHaveBeenCalledWith('test-tool', undefined, {
        requestId: undefined,
        args: {
          username: 'user123',
          password: '[REDACTED]',
          token: '[REDACTED]',
          apiKey: '[REDACTED]',
          secret: '[REDACTED]',
          authorization: '[REDACTED]',
          normal: 'normalValue',
        },
      });
    });

    it('should handle non-object args in sanitization', async () => {
      await registry.execute('test-tool', 'string-args');

      expect(Logger.logToolCall).toHaveBeenCalledWith('test-tool', undefined, {
        requestId: undefined,
        args: {},
      });
    });

    it('should handle null args in sanitization', async () => {
      await registry.execute('test-tool', null);

      expect(Logger.logToolCall).toHaveBeenCalledWith('test-tool', undefined, {
        requestId: undefined,
        args: {},
      });
    });
  });

  describe('getRegisteredTools', () => {
    it('should return empty array when no tools registered', () => {
      const tools = registry.getRegisteredTools();
      expect(tools).toEqual([]);
    });

    it('should return array of registered tool names', () => {
      const tool1: ToolDefinition = { name: 'tool1', handler: mockHandler };
      const tool2: ToolDefinition = { name: 'tool2', handler: mockHandler };

      registry.register(tool1);
      registry.register(tool2);

      const tools = registry.getRegisteredTools();
      expect(tools).toEqual(['tool1', 'tool2']);
    });

    it('should return tools in registration order', () => {
      const toolNames = ['alpha', 'beta', 'gamma'];
      toolNames.forEach(name => {
        registry.register({ name, handler: mockHandler });
      });

      const tools = registry.getRegisteredTools();
      expect(tools).toEqual(toolNames);
    });
  });

  describe('hasTool', () => {
    it('should return false for non-existent tool', () => {
      expect(registry.hasTool('non-existent')).toBe(false);
    });

    it('should return true for registered tool', () => {
      const tool: ToolDefinition = { name: 'existing-tool', handler: mockHandler };
      registry.register(tool);

      expect(registry.hasTool('existing-tool')).toBe(true);
    });

    it('should be case sensitive', () => {
      const tool: ToolDefinition = { name: 'CaseSensitive', handler: mockHandler };
      registry.register(tool);

      expect(registry.hasTool('CaseSensitive')).toBe(true);
      expect(registry.hasTool('casesensitive')).toBe(false);
      expect(registry.hasTool('CASESENSITIVE')).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete tool lifecycle', async () => {
      // Register tool with validator
      const tool: ToolDefinition = {
        name: 'lifecycle-tool',
        handler: mockHandler,
        validator: mockValidator,
        description: 'Complete lifecycle test',
      };

      registry.register(tool);

      // Check registration
      expect(registry.hasTool('lifecycle-tool')).toBe(true);
      expect(registry.getRegisteredTools()).toContain('lifecycle-tool');

      // Execute tool
      const result = await registry.execute('lifecycle-tool', { input: 'test' }, 'req-lifecycle');

      expect(result.isError).toBe(false);
      expect(mockValidator).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle multiple tools with same execution flow', async () => {
      const tools = ['tool-a', 'tool-b', 'tool-c'];
      
      tools.forEach(name => {
        registry.register({
          name,
          handler: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: `Result from ${name}` }],
            isError: false,
          }),
        });
      });

      const results = await Promise.all(
        tools.map(name => registry.execute(name, { tool: name }))
      );

      results.forEach((result, index) => {
        expect(result.isError).toBe(false);
        expect(result.content[0].text).toBe(`Result from ${tools[index]}`);
      });
    });

    it('should handle tool override scenario', async () => {
      const originalHandler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Original' }],
        isError: false,
      });
      
      const overrideHandler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Override' }],
        isError: false,
      });

      // Register original tool
      registry.register({ name: 'override-test', handler: originalHandler });
      
      // Execute original
      let result = await registry.execute('override-test', {});
      expect(result.content[0].text).toBe('Original');

      // Override tool
      registry.register({ name: 'override-test', handler: overrideHandler });
      
      // Execute override
      result = await registry.execute('override-test', {});
      expect(result.content[0].text).toBe('Override');

      // Verify warning was logged
      expect(Logger.warn).toHaveBeenCalledWith('Tool override-test is being overridden');
    });
  });
});