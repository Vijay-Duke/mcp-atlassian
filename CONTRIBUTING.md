# Contributing to MCP-Atlassian

Thank you for your interest in contributing to MCP-Atlassian! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to be respectful and professional in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Vijay-Duke/mcp-atlassian/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why this would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass (`npm test`)
6. Check coverage (`npm run test:coverage`)
7. Commit your changes (`git commit -m 'feat: add amazing feature'`)
8. Push to your branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

#### PR Requirements

- All tests must pass
- Code coverage should not decrease
- Follow existing code style
- Include appropriate documentation
- Update README if needed
- One feature per PR

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or updates
- `chore:` Maintenance tasks
- `perf:` Performance improvements

Examples:
```
feat: add support for Confluence labels
fix: handle authentication errors properly
docs: update API documentation
test: add tests for Jira handlers
```

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mcp-atlassian.git
   cd mcp-atlassian
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment example:
   ```bash
   cp .env.example .env
   ```

4. Add your Atlassian credentials to `.env`

5. Run tests:
   ```bash
   npm test
   ```

6. Run in development mode:
   ```bash
   npm run dev
   ```

## Testing

- Write tests for all new features
- Maintain or improve code coverage
- Run tests before submitting PR:
  ```bash
  npm test
  npm run test:coverage
  ```

## Code Style

- Use TypeScript for all code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Questions?

Feel free to open an issue for any questions about contributing.