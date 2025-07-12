# Changelog

All notable changes to the Browserless library will be documented in this file.

## [1.0.0] - 2024-01-XX

### Added

#### Core Features
- **BrowserlessClient** - Main client class for interacting with Browserless API
- **TypeScript Support** - Complete type definitions for all API endpoints
- **Zod Validation** - Runtime validation for all request parameters
- **Error Handling** - Comprehensive error classes with specific error types
- **Multi-region Support** - Built-in support for US, EU, and Asia regions
- **Self-hosted Support** - Works with self-hosted Browserless instances

#### REST API Endpoints
- **PDF Generation** (`/pdf`) - Generate PDFs from URLs or HTML content
- **Screenshots** (`/screenshot`) - Capture screenshots in PNG, JPEG, or WebP formats
- **Content Extraction** (`/content`) - Extract HTML content from web pages
- **Function Execution** (`/function`) - Execute custom JavaScript functions
- **Web Scraping** (`/scrape`) - Extract specific elements from web pages
- **Performance Analysis** (`/performance`) - Run Lighthouse audits
- **Content Unblocking** (`/unblock`) - Access protected content with stealth mode
- **File Downloads** (`/download`) - Download files from web pages
- **Data Export** (`/export`) - Export data in JSON, CSV, or XML formats
- **Session Management** (`/sessions`) - Create and manage persistent browser sessions
- **Health Checks** (`/health`) - Check service health status
- **Metrics** (`/metrics`) - Get usage statistics and performance metrics
- **Configuration** (`/config`) - Get server configuration information

#### WebSocket Integration
- **Puppeteer Support** - Direct integration with Puppeteer via WebSocket
- **Playwright Support** - Direct integration with Playwright via WebSocket
- **Connection Helpers** - Utility functions for easy WebSocket connections
- **Browser Selection** - Support for Chrome, Firefox, Webkit, and Edge

#### Utility Functions
- **File Handling** - Save files, convert between formats
- **Base64 Conversion** - Convert between ArrayBuffer and base64
- **URL Validation** - Validate URLs and WebSocket endpoints
- **Retry Logic** - Built-in retry mechanisms with exponential backoff
- **Query String Building** - Utility for building URL query parameters
- **Deep Merging** - Merge configuration objects
- **Byte Formatting** - Human-readable byte size formatting

#### Configuration Options
- **Cloud Regions** - Easy configuration for different cloud regions
- **Timeouts** - Configurable request timeouts
- **Browser Selection** - Default browser type configuration
- **Authentication** - Token-based authentication
- **Custom Headers** - Support for custom HTTP headers
- **Proxy Support** - Proxy configuration for requests

#### Advanced Features
- **Stealth Mode** - Bypass bot detection systems
- **Ad Blocking** - Built-in ad and resource blocking
- **Cookie Management** - Set and manage cookies
- **Viewport Control** - Configure browser viewport settings
- **Wait Conditions** - Wait for selectors, functions, or timeouts
- **Performance Budgets** - Set performance thresholds for Lighthouse audits
- **Session Persistence** - Maintain browser sessions across requests

#### Testing
- **Unit Tests** - Comprehensive test suite with Vitest
- **Mock Support** - Built-in mocks for testing environments
- **Coverage Reports** - Test coverage reporting
- **Type Testing** - TypeScript type validation tests

#### Documentation
- **API Reference** - Complete API documentation
- **Usage Examples** - Real-world usage examples
- **Error Handling Guide** - Comprehensive error handling documentation
- **Migration Guide** - Guide for migrating from other libraries
- **Best Practices** - Recommended usage patterns

#### Development Tools
- **TypeScript Configuration** - Optimized TypeScript setup
- **Build System** - Modern build system with tsup
- **Linting** - ESLint configuration for code quality
- **Formatting** - Prettier configuration for consistent formatting
- **Package Management** - Optimized for pnpm

### Technical Details

#### Dependencies
- **Runtime Dependencies**: Zod for validation
- **Peer Dependencies**: Puppeteer-core and Playwright-core (optional)
- **Development Dependencies**: TypeScript, Vitest, ESLint, tsup

#### Browser Support
- **Chrome/Chromium** - Full support (default)
- **Firefox** - Full support
- **Webkit/Safari** - Full support
- **Microsoft Edge** - Full support

#### Node.js Support
- **Minimum Version**: Node.js 16.0.0+
- **Recommended Version**: Node.js 18.0.0+
- **ESM Support**: Full ES modules support
- **CommonJS Support**: Full CommonJS support

#### API Compatibility
- **Browserless v2.x** - Full compatibility
- **REST API** - All documented endpoints supported
- **WebSocket API** - Full Puppeteer and Playwright support
- **Authentication** - Token-based authentication

### Examples Included

1. **Basic PDF Generation** - Simple PDF creation from URLs
2. **Advanced Screenshots** - Full-page and element-specific screenshots
3. **Content Extraction** - HTML content extraction with wait conditions
4. **Custom Functions** - Execute custom JavaScript in browser context
5. **Puppeteer Integration** - Direct Puppeteer usage via WebSocket
6. **Playwright Integration** - Direct Playwright usage via WebSocket
7. **Self-hosted Setup** - Configuration for self-hosted instances
8. **Error Handling** - Comprehensive error handling patterns
9. **Web Scraping** - Extract specific data from web pages
10. **Performance Analysis** - Lighthouse audits and performance monitoring
11. **Content Unblocking** - Access protected content with stealth mode
12. **Session Management** - Persistent browser sessions
13. **Monitoring** - Real-time metrics and health monitoring
14. **Batch Operations** - Process multiple URLs concurrently

### Performance Optimizations

- **Connection Pooling** - Efficient connection management
- **Request Batching** - Batch multiple requests when possible
- **Timeout Management** - Configurable timeouts for all operations
- **Memory Management** - Efficient memory usage patterns
- **Error Recovery** - Automatic retry with exponential backoff

### Security Features

- **Token Authentication** - Secure API token authentication
- **Input Validation** - Comprehensive input validation with Zod
- **Error Sanitization** - Safe error message handling
- **Proxy Support** - Secure proxy configuration
- **Stealth Mode** - Advanced bot detection bypass

### Future Roadmap

- **BrowserQL Integration** - Support for BrowserQL queries
- **Streaming Support** - Real-time streaming capabilities
- **Advanced Caching** - Response caching mechanisms
- **Plugin System** - Extensible plugin architecture
- **CLI Tool** - Command-line interface for common operations
