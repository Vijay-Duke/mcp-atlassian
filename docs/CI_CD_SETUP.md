# CI/CD Setup Guide

This guide will help you configure the CI/CD pipelines for the mcp-atlassian project.

## Prerequisites

1. GitHub repository with admin access
2. npm account with publish permissions
3. (Optional) Snyk account for security scanning

## Step 1: Configure GitHub Secrets

### Required Secrets

#### NPM_TOKEN
This token is required for publishing packages to npm.

1. Go to https://www.npmjs.com and log in
2. Click on your profile picture → Access Tokens
3. Click "Generate New Token" → Classic Token
4. Name: `mcp-atlassian-github-actions`
5. Type: Select "Automation"
6. Click "Generate Token" and copy the token
7. In GitHub, go to Settings → Secrets and variables → Actions
8. Click "New repository secret"
9. Name: `NPM_TOKEN`
10. Value: Paste the npm token
11. Click "Add secret"

#### SNYK_TOKEN (Optional)
For enhanced security scanning:

1. Go to https://app.snyk.io/account
2. Copy your API token
3. Add as GitHub secret named `SNYK_TOKEN`

## Step 2: Configure Branch Protection

1. Go to Settings → Branches in your GitHub repository
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 or more)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass:
     - `Test (20.x)` (from CI workflow)
     - `Build` (from CI workflow)
     - `Lint & Type Check` (from CI workflow)
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## Step 3: Enable GitHub Actions

1. Go to Settings → Actions → General
2. Under "Actions permissions":
   - Select "Allow all actions and reusable workflows"
3. Under "Workflow permissions":
   - Select "Read and write permissions"
   - ✅ Allow GitHub Actions to create and approve pull requests

## Step 4: Test the Workflows

### Test CI Pipeline
```bash
# Create a new branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline

# Create a PR - CI should run automatically
```

### Test Manual Release
```bash
# From GitHub Actions tab
1. Go to "Publish to npm" workflow
2. Click "Run workflow"
3. Select version type (patch/minor/major)
4. Click "Run workflow"
```

## Step 5: Monitor Workflows

### Checking Workflow Status
- Go to Actions tab in GitHub
- Each workflow run shows:
  - ✅ Success (green)
  - ❌ Failure (red)
  - 🟡 In progress (yellow)

### Debugging Failed Workflows
1. Click on the failed workflow run
2. Click on the failed job
3. Expand the failed step to see error details
4. Common issues:
   - Missing secrets (NPM_TOKEN)
   - Test failures
   - Type errors
   - Security vulnerabilities

## Workflow Triggers

| Workflow | Automatic Triggers | Manual Trigger |
|----------|-------------------|----------------|
| CI | Push to main/develop, PRs | ✅ Yes |
| Publish | GitHub releases | ✅ Yes (with version) |
| Security | Push to main, Weekly | ✅ Yes |
| Release | Version tags (v*) | ✅ Yes |
| PR Validation | PR events | ❌ No |

## Best Practices

1. **Always create PRs** - Never push directly to main
2. **Use semantic commits** - Follow conventional commits
3. **Keep PRs small** - Easier to review and test
4. **Update dependencies regularly** - Dependabot helps with this
5. **Monitor security alerts** - Address vulnerabilities promptly

## Troubleshooting

### npm publish fails
- Check NPM_TOKEN is set correctly
- Verify npm account has publish permissions
- Ensure version doesn't already exist on npm

### Tests fail in CI but pass locally
- Check Node.js version differences
- Review environment variables
- Look for timing-dependent tests

### Security scan finds vulnerabilities
- Run `npm audit fix` for automatic fixes
- Update dependencies manually if needed
- Some dev dependencies may have acceptable vulnerabilities

## Release Process

### Automated Release (Recommended)
1. Merge PR to main
2. Go to Actions → "Publish to npm"
3. Run workflow with version type
4. Workflow will:
   - Bump version
   - Create git tag
   - Publish to npm
   - Create GitHub release

### Manual Release
```bash
# Bump version locally
npm version patch -m "chore: release v%s"

# Push with tags
git push origin main --follow-tags

# This triggers the release workflow
```

## Maintenance

### Weekly Tasks
- Review Dependabot PRs
- Check security scan results
- Update dependencies if needed

### Monthly Tasks
- Review and update GitHub Actions versions
- Check for new security best practices
- Update documentation if needed

## Support

For CI/CD issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Create an issue with the `ci/cd` label
4. Contact repository maintainers