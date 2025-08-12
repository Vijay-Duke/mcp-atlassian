# GitHub Packages Configuration

This project supports publishing to both npm Registry and GitHub Packages.

## 📦 Package Locations

- **npm Registry**: [`mcp-atlassian`](https://www.npmjs.com/package/mcp-atlassian)
- **GitHub Packages**: [`@vijay-duke/mcp-atlassian`](https://github.com/Vijay-Duke/mcp-atlassian/packages)

## 🚀 Installation

### From npm Registry (Default)
```bash
npm install mcp-atlassian
```

### From GitHub Packages
```bash
# Configure npm to use GitHub Packages for @vijay-duke scope
npm config set @vijay-duke:registry https://npm.pkg.github.com

# Install the package
npm install @vijay-duke/mcp-atlassian
```

## 🔐 Authentication

### For Public Packages
GitHub Packages allows public packages to be installed without authentication.

### For Private Access or Publishing
If you encounter authentication issues or need to publish:

1. Create a GitHub Personal Access Token with `read:packages` permission:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select `read:packages` scope (and `write:packages` for publishing)

2. Configure npm:
```bash
# Create or edit ~/.npmrc
echo "@vijay-duke:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

## 📝 Publishing Workflows

### Automatic Publishing
The package is automatically published to both registries when:
- A new GitHub Release is created
- The semantic-release workflow runs

### Manual Publishing
Use the "Publish to npm and GitHub Packages" workflow:
1. Go to [Actions](https://github.com/Vijay-Duke/mcp-atlassian/actions)
2. Select "Publish to npm and GitHub Packages"
3. Click "Run workflow"
4. Choose target: `both`, `npm-only`, or `github-only`

## 🎯 When to Use Which Registry?

### Use npm Registry when:
- You want the standard npm installation experience
- You're using the package in production
- You need maximum compatibility
- You want automatic updates via Renovate/Dependabot

### Use GitHub Packages when:
- You want to keep everything within GitHub ecosystem
- You're using GitHub Actions for CI/CD
- You need tighter integration with GitHub features
- You're testing pre-release versions

## 🔄 Version Synchronization

Both registries receive the same version simultaneously:
- Version numbers are kept in sync
- Same build artifacts are published
- Release notes are shared

## 📊 Benefits of Dual Publishing

1. **Redundancy**: If one registry is down, the other is available
2. **Choice**: Users can choose their preferred registry
3. **GitHub Integration**: Better integration with GitHub features
4. **npm Ecosystem**: Full compatibility with npm tooling
5. **Security**: GitHub Packages provides additional security scanning

## 🛠️ Configuration Files

### For npm Publishing
- Standard `package.json` with npm registry configuration
- Uses `NPM_TOKEN` secret for authentication

### For GitHub Packages
- Modified package name to `@vijay-duke/mcp-atlassian`
- Uses `GITHUB_TOKEN` for authentication
- Scoped to GitHub's npm registry

## 📈 Usage Statistics

- **npm Downloads**: Check [npm stats](https://www.npmjs.com/package/mcp-atlassian)
- **GitHub Packages**: View in [Packages tab](https://github.com/Vijay-Duke/mcp-atlassian/packages)

## 🤝 Contributing

When contributing, packages are automatically published from the main branch after:
1. PR approval and merge
2. Semantic version bump
3. All CI checks pass

## 💡 Tips

1. **Scoped vs Unscoped**: 
   - npm: `mcp-atlassian` (unscoped)
   - GitHub: `@vijay-duke/mcp-atlassian` (scoped)

2. **Version Resolution**:
   - Both registries maintain the same versions
   - Use standard npm version ranges

3. **Caching**:
   - GitHub Actions automatically cache packages from GitHub Packages
   - Faster CI/CD when using GitHub Packages in GitHub Actions

## 🔗 Related Links

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [npm Registry Documentation](https://docs.npmjs.com/)
- [Package Homepage](https://github.com/Vijay-Duke/mcp-atlassian)
- [Issue Tracker](https://github.com/Vijay-Duke/mcp-atlassian/issues)