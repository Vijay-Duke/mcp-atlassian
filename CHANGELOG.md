# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2024-01-10

### Security
- Added HTML sanitization using DOMPurify to prevent XSS attacks
- Implemented comprehensive input validation for all API handlers
- Added validation for spaceKeys, pageIds, and issueKeys
- Added content size limits (configurable, default 10MB)
- Added parameter type checking across all handlers

### Fixed
- Fixed TypeScript compilation errors
- Fixed test failures related to proxy configuration
- Added missing `start` property to ListConfluenceSpacesArgs interface

### Changed
- Improved error handling with contextual error messages
- Enhanced test coverage for security measures
- Updated dependencies including DOMPurify

## [2.0.1] - 2024-01-09

### Added
- Initial release with full Confluence and Jira integration
- Support for reading, creating, and updating Confluence pages
- Support for Jira issue management and sprint tracking
- User-specific operations for both platforms
- Export functionality for Confluence pages (HTML/Markdown)
- Comprehensive test coverage

### Features
- Confluence page hierarchy navigation
- Jira board and sprint management
- Attachment handling for Confluence
- Label management for pages
- Personal dashboard views
- User activity tracking

## [2.0.0] - 2024-01-08

### Breaking Changes
- Complete rewrite in TypeScript
- New MCP protocol implementation
- Changed API structure

### Added
- TypeScript support
- Comprehensive type definitions
- Modern ES modules
- Improved error handling
- Better security practices

[2.0.2]: https://github.com/Vijay-Duke/mcp-atlassian/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/Vijay-Duke/mcp-atlassian/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Vijay-Duke/mcp-atlassian/releases/tag/v2.0.0