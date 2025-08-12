# MCP Server Configuration Guide

## Resolving "Unexpected token" Errors

If you're seeing errors like:
```
[error] Connection state: Error: Unexpected token '', "info"... is not valid JSON
```

This occurs because the MCP server communicates via JSON-RPC over stdio, and any console output interferes with this protocol.

## Solution

### Option 1: Use the MCP-specific npm script
```bash
npm run start:mcp
```

### Option 2: Set environment variable
When configuring the MCP server in Claude Code or other MCP clients, add the environment variable:
```json
{
  "mcp-atlassian": {
    "command": "node",
    "args": ["path/to/mcp-atlassian/dist/index.js"],
    "env": {
      "MCP_SERVER_MODE": "true",
      "ATLASSIAN_BASE_URL": "your-url",
      "ATLASSIAN_EMAIL": "your-email",
      "ATLASSIAN_API_TOKEN": "your-token"
    }
  }
}
```

### Option 3: Use the wrapper script
```bash
./run-mcp-server.sh
```

## What Changed

1. **Logger Configuration**: The Winston logger now checks for `MCP_SERVER_MODE` environment variable and disables console output when running as an MCP server.

2. **Console Statements Removed**: All `console.log`, `console.error`, and `console.warn` statements have been replaced with Logger calls that respect the MCP_SERVER_MODE setting.

3. **Scripts Added**:
   - `npm run start:mcp` - Runs the server with MCP_SERVER_MODE=true
   - `./run-mcp-server.sh` - Wrapper script that sets the environment variable

## Technical Details

MCP servers must not write to stdout/stderr as these streams are used for JSON-RPC communication. Any non-JSON output will cause parsing errors in the MCP client.

When `MCP_SERVER_MODE=true` is set:
- Console transport is disabled in Winston logger
- All logging is suppressed to prevent interference with JSON-RPC
- The server operates in "silent mode" suitable for MCP protocol

For development and debugging, run without MCP_SERVER_MODE to see all logs in the console.