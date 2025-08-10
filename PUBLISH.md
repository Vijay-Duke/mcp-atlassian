# Publishing to NPM Registry

## Prerequisites

1. Create an npm account at https://www.npmjs.com/signup (if you don't have one)
2. Log in to npm from your terminal

## Steps to Publish

### 1. Login to npm

```bash
npm login
# Or use
npm adduser
```

You'll be prompted for:
- Username
- Password  
- Email
- OTP (if 2FA is enabled)

### 2. Verify Login

```bash
npm whoami
```

### 3. Check Package Name Availability

```bash
npm view mcp-atlassian
```

If the package doesn't exist (404 error), the name is available.

### 4. Build the Project

```bash
npm run build
```

### 5. Test Locally (Optional)

```bash
# Create a test package locally
npm pack

# This creates mcp-atlassian-2.0.0.tgz
# You can test install it locally:
npm install -g ./mcp-atlassian-2.0.0.tgz
```

### 6. Publish to NPM

```bash
# For first time publish
npm publish

# If you need to publish with public access
npm publish --access public
```

### 7. Verify Publication

```bash
# Check if it's published
npm view mcp-atlassian

# Try installing it
npm install -g mcp-atlassian
```

## Important Notes

- Make sure `dist/` folder exists and contains the built JavaScript files
- The package name "mcp-atlassian" must be unique on npm
- If the name is taken, you'll need to:
  - Either use a scoped package: `@yourusername/mcp-atlassian`
  - Or choose a different name
- Version in package.json (currently 2.0.0) will be the published version
- You can update and republish with `npm version patch` and `npm publish`

## Updating the Package

After making changes:

```bash
# Update version (patch, minor, or major)
npm version patch  # Changes 2.0.0 to 2.0.1

# Build
npm run build

# Publish
npm publish
```

## Package.json is Ready

Your package.json already has:
- ✅ name: "mcp-atlassian"
- ✅ version: "2.0.0"
- ✅ description
- ✅ main: "dist/index.js"
- ✅ bin entry for global installation
- ✅ repository information
- ✅ license: MIT