import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import {
  createEnhancedError,
  createValidationError,
  createUserNotFoundError,
  type ErrorContext,
} from '../../utils/error-handler.js';

describe('ErrorHandler', () => {
  const mockContext: ErrorContext = {
    operation: 'test operation',
    component: 'jira',
    userInput: { testParam: 'value' },
    suggestions: ['Test suggestion'],
  };

  describe('createEnhancedError', () => {
    it('should handle Axios 400 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errorMessages: ['Invalid request format'],
          },
        },
        message: 'Request failed with status code 400',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('**Error in JIRA**');
      expect(result.content[0].text).toContain('Bad request - Invalid parameters');
      expect(result.content[0].text).toContain('Invalid request format');
      expect(result.content[0].text).toContain('validation');
      expect(result.content[0].text).toContain('HTTP 400');
      expect(result.content[0].text).toContain('**Retryable**: Yes');
    });

    it('should handle Axios 401 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: null,
        },
        message: 'Unauthorized',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Authentication failed');
      expect(result.content[0].text).toContain('authentication');
      expect(result.content[0].text).toContain('ATLASSIAN_API_TOKEN');
      expect(result.content[0].text).toContain('**Retryable**: No');
    });

    it('should handle Axios 403 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {
            message: 'Access denied to resource',
          },
        },
        message: 'Forbidden',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Permission denied');
      expect(result.content[0].text).toContain('Access denied to resource');
      expect(result.content[0].text).toContain('permission');
      expect(result.content[0].text).toContain('administrator');
    });

    it('should handle Axios 404 error with user operation', () => {
      const userContext: ErrorContext = {
        operation: 'get user details',
        component: 'jira',
      };

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            errorMessages: ['User not found'],
          },
        },
        message: 'Not Found',
      } as AxiosError;

      const result = createEnhancedError(axiosError, userContext);

      expect(result.content[0].text).toContain('Resource not found');
      expect(result.content[0].text).toContain('User not found');
      expect(result.content[0].text).toContain('username or accountId');
      expect(result.content[0].text).toContain('notFound');
    });

    it('should handle Axios 404 error with issue operation', () => {
      const issueContext: ErrorContext = {
        operation: 'get issue data',
        component: 'jira',
      };

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: null,
        },
        message: 'Not Found',
      } as AxiosError;

      const result = createEnhancedError(axiosError, issueContext);

      expect(result.content[0].text).toContain('issue key format');
      expect(result.content[0].text).toContain('PROJ-123');
    });

    it('should handle Axios 404 error with project operation', () => {
      const projectContext: ErrorContext = {
        operation: 'get project details',
        component: 'jira',
      };

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: null,
        },
        message: 'Not Found',
      } as AxiosError;

      const result = createEnhancedError(axiosError, projectContext);

      expect(result.content[0].text).toContain('project key is correct');
      expect(result.content[0].text).toContain('project exists');
    });

    it('should handle Axios 429 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: null,
        },
        message: 'Too Many Requests',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Rate limit exceeded');
      expect(result.content[0].text).toContain('rateLimit');
      expect(result.content[0].text).toContain('Wait a few minutes');
      expect(result.content[0].text).toContain('**Retryable**: Yes');
    });

    it('should handle Axios 500 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: null,
        },
        message: 'Internal Server Error',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Server error');
      expect(result.content[0].text).toContain('server');
      expect(result.content[0].text).toContain('Atlassian Status page');
      expect(result.content[0].text).toContain('HTTP 500');
    });

    it('should handle Axios 502 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 502,
          data: null,
        },
        message: 'Bad Gateway',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Server error');
      expect(result.content[0].text).toContain('HTTP 502');
    });

    it('should handle Axios 503 error', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: null,
        },
        message: 'Service Unavailable',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Server error');
      expect(result.content[0].text).toContain('HTTP 503');
    });

    it('should handle Axios error with unknown status code', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 418,
          data: null,
        },
        message: "I'm a teapot",
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Network or API error');
      expect(result.content[0].text).toContain('network');
      expect(result.content[0].text).toContain('internet connection');
      expect(result.content[0].text).toContain('HTTP 418');
    });

    it('should handle Axios error without response', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'Network error',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Network or API error');
      expect(result.content[0].text).toContain('Network error');
      expect(result.content[0].text).toContain('network');
    });

    it('should handle validation errors with lowercase detection', () => {
      const validationError = new Error('validation failed: missing required field');

      const result = createEnhancedError(validationError, mockContext);

      expect(result.content[0].text).toContain('Input validation failed');
      expect(result.content[0].text).toContain('validation failed: missing required field');
      expect(result.content[0].text).toContain('validation');
      expect(result.content[0].text).toContain('required parameters');
      expect(result.content[0].text).toContain('**Retryable**: Yes');
    });

    it('should handle validation errors with capital V as unknown', () => {
      const validationError = new Error('Validation failed: missing required field');

      const result = createEnhancedError(validationError, mockContext);

      expect(result.content[0].text).toContain('An unexpected error occurred');
      expect(result.content[0].text).toContain('Validation failed: missing required field');
      expect(result.content[0].text).toContain('unknown');
      expect(result.content[0].text).toContain('network connection');
      expect(result.content[0].text).toContain('**Retryable**: Yes');
    });

    it('should handle generic Error objects', () => {
      const genericError = new Error('Something went wrong');

      const result = createEnhancedError(genericError, mockContext);

      expect(result.content[0].text).toContain('An unexpected error occurred');
      expect(result.content[0].text).toContain('Something went wrong');
      expect(result.content[0].text).toContain('unknown');
      expect(result.content[0].text).toContain('network connection');
    });

    it('should handle non-Error objects', () => {
      const stringError = 'Simple string error';

      const result = createEnhancedError(stringError, mockContext);

      expect(result.content[0].text).toContain('An unexpected error occurred');
      expect(result.content[0].text).toContain('Simple string error');
      expect(result.content[0].text).toContain('unknown');
    });

    it('should handle errors with different response data formats', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: 'Simple string error response',
        },
        message: 'Bad Request',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Simple string error response');
    });

    it('should handle Confluence component context', () => {
      const confluenceContext: ErrorContext = {
        operation: 'get page',
        component: 'confluence',
      };

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: null,
        },
        message: 'Unauthorized',
      } as AxiosError;

      const result = createEnhancedError(axiosError, confluenceContext);

      expect(result.content[0].text).toContain('**Error in CONFLUENCE**');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error for jira component', () => {
      const errors = ['Field is required', 'Invalid format'];
      const operation = 'create issue';

      const result = createValidationError(errors, operation, 'jira');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('**Error in JIRA**');
      expect(result.content[0].text).toContain('An unexpected error occurred');
      expect(result.content[0].text).toContain('create issue');
      expect(result.content[0].text).toContain('Field is required, Invalid format');
      expect(result.content[0].text).toContain('unknown');
    });

    it('should create validation error for confluence component', () => {
      const errors = ['Missing page title'];
      const operation = 'create page';

      const result = createValidationError(errors, operation, 'confluence');

      expect(result.content[0].text).toContain('**Error in CONFLUENCE**');
      expect(result.content[0].text).toContain('create page');
      expect(result.content[0].text).toContain('Missing page title');
      expect(result.content[0].text).toContain('An unexpected error occurred');
    });

    it('should default to jira component', () => {
      const errors = ['Test error'];
      const operation = 'test operation';

      const result = createValidationError(errors, operation);

      expect(result.content[0].text).toContain('**Error in JIRA**');
      expect(result.content[0].text).toContain('An unexpected error occurred');
    });
  });

  describe('createUserNotFoundError', () => {
    it('should create user not found error for jira', () => {
      const identifier = 'john.doe@example.com';

      const result = createUserNotFoundError(identifier, 'jira');

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('**User Not Found**');
      expect(result.content[0].text).toContain('john.doe@example.com');
      expect(result.content[0].text).toContain('user lookup');
      expect(result.content[0].text).toContain('Use accountId instead');
      expect(result.content[0].text).toContain('Security Best Practice');
      expect(result.content[0].text).toContain('privacy and security');
    });

    it('should create user not found error for confluence', () => {
      const identifier = 'username123';

      const result = createUserNotFoundError(identifier, 'confluence');

      expect(result.content[0].text).toContain('**User Not Found**');
      expect(result.content[0].text).toContain('username123');
      expect(result.content[0].text).toContain('accountId instead of username');
    });

    it('should default to jira component', () => {
      const identifier = 'test-user';

      const result = createUserNotFoundError(identifier);

      expect(result.content[0].text).toContain('**User Not Found**');
      expect(result.content[0].text).toContain('test-user');
    });
  });

  describe('API error details extraction', () => {
    it('should extract Jira error messages', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errorMessages: ['First error', 'Second error'],
          },
        },
        message: 'Bad Request',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('First error; Second error');
    });

    it('should extract Confluence error message', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            message: 'Confluence specific error',
          },
        },
        message: 'Bad Request',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Confluence specific error');
    });

    it('should handle string response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: 'Plain text error',
        },
        message: 'Bad Request',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Plain text error');
    });

    it('should fallback to axios message when no response data', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: null,
        },
        message: 'Original axios error message',
      } as AxiosError;

      const result = createEnhancedError(axiosError, mockContext);

      expect(result.content[0].text).toContain('Original axios error message');
    });
  });

  describe('error formatting', () => {
    it('should format error message with all sections', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: null,
        },
        message: 'Unauthorized',
      } as AxiosError;

      const context: ErrorContext = {
        operation: 'test operation',
        component: 'jira',
        userInput: { param: 'value' },
        suggestions: ['Custom suggestion'],
      };

      const result = createEnhancedError(axiosError, context);
      const text = result.content[0].text;

      expect(text).toContain('**Error in JIRA**');
      expect(text).toContain('**Operation**: test operation');
      expect(text).toContain('**Details**:');
      expect(text).toContain('**Suggestions**:');
      expect(text).toContain('**Type**: authentication');
      expect(text).toContain('**Retryable**: No');
    });

    it('should handle missing status code', () => {
      const genericError = new Error('Test error');

      const result = createEnhancedError(genericError, mockContext);

      expect(result.content[0].text).toContain('**Type**: unknown');
      expect(result.content[0].text).not.toContain('HTTP');
    });
  });
});