#!/bin/bash

# Script to run the MCP Atlassian server with proper environment settings
# This sets MCP_SERVER_MODE to prevent console logging that interferes with JSON-RPC

export MCP_SERVER_MODE=true

# Run the server
node dist/index.js "$@"