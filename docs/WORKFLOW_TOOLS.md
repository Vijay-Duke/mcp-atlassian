# Workflow Tools Documentation

This document describes all the automated workflow tools configured for the mcp-atlassian project.

## 📊 Code Coverage - Codecov

**Status:** ✅ Configured  
**Configuration:** `codecov.yml`  
**Badge:** [![codecov](https://codecov.io/gh/Vijay-Duke/mcp-atlassian/branch/main/graph/badge.svg)](https://codecov.io/gh/Vijay-Duke/mcp-atlassian)

### Features
- Automatic coverage reporting on every PR
- Coverage thresholds: 80% overall, 85% for patches
- Detailed coverage reports with line-by-line analysis
- PR comments with coverage changes

### Setup Required
1. Sign up at [codecov.io](https://codecov.io)
2. Add the repository
3. No token needed for public repos

## 🔍 Code Quality - SonarCloud

**Status:** ✅ Configured  
**Configuration:** `sonar-project.properties`, `.github/workflows/sonarcloud.yml`  
**Dashboard:** [SonarCloud Project](https://sonarcloud.io/project/overview?id=vijay-duke_mcp-atlassian)

### Features
- Static code analysis for bugs, vulnerabilities, and code smells
- Security hotspot detection
- Code duplication tracking
- Technical debt estimation
- Quality gate enforcement

### Setup Required
1. Sign up at [sonarcloud.io](https://sonarcloud.io)
2. Import the GitHub repository
3. Add `SONAR_TOKEN` to GitHub repository secrets
4. Configure quality gates and rules in SonarCloud dashboard

## 🚀 Automated Releases - Semantic Release

**Status:** ✅ Configured  
**Configuration:** `.releaserc.json`, `.github/workflows/release.yml`

### Features
- Automated version bumping based on conventional commits
- Automatic changelog generation
- NPM package publishing
- GitHub release creation
- Release notes in PRs

### Commit Convention
- `feat:` - Minor version bump (new features)
- `fix:` - Patch version bump (bug fixes)
- `perf:` - Patch version bump (performance improvements)
- `BREAKING CHANGE:` - Major version bump

### Setup Required
1. Add `NPM_TOKEN` to GitHub repository secrets (for npm publishing)
2. Ensure branch protection allows the bot to push

## 🔄 Dependency Management - Renovate

**Status:** ✅ Configured  
**Configuration:** `renovate.json`  
**Dashboard:** [Dependency Dashboard](https://github.com/Vijay-Duke/mcp-atlassian/issues)

### Features
- Automated dependency updates
- Grouped updates for related packages
- Auto-merge for minor and patch updates
- Security vulnerability alerts
- Weekly update schedule (Monday mornings)
- Lock file maintenance

### Configuration Highlights
- Minor/patch updates: Auto-merged
- Major updates: Require manual review
- Update schedule: Before 5am on Mondays (UTC)
- Package grouping: ESLint, TypeScript, Test packages, MCP SDK

## 👥 Contributors Recognition - All Contributors

**Status:** ✅ Configured  
**Configuration:** `.all-contributorsrc`

### Features
- Automatic contributor recognition
- README badges for contributors
- Support for various contribution types
- Bot-managed contributor list

### Usage
Comment on issues/PRs:
```
@all-contributors please add @username for code, docs
```

### Contribution Types
- code, docs, tests, bug, ideas, review, maintenance, infra, design, etc.

## 🕰️ Issue Management - Stale Bot

**Status:** ✅ Configured  
**Configuration:** `.github/workflows/stale.yml`

### Features
- Automatic marking of stale issues (60 days)
- Automatic marking of stale PRs (30 days)
- Grace period before closing (7 days for issues, 14 days for PRs)
- Exemptions for critical issues and active work

### Exempt Labels
- `pinned`, `security`, `bug:critical`
- `enhancement:approved`, `work-in-progress`
- `awaiting-response`, `awaiting-review`

### Timing
- Issues: Stale after 60 days, closed after 67 days
- PRs: Stale after 30 days, closed after 44 days
- Daily check at 1:00 AM UTC

## 📝 Release Notes - Release Drafter

**Status:** ✅ Configured  
**Configuration:** `.github/release-drafter.yml`, `.github/workflows/release-drafter.yml`

### Features
- Automated draft release notes
- PR categorization by labels
- Version suggestion based on changes
- Contributor recognition
- Auto-labeling based on PR content

### Categories
- 🚀 Features
- 🐛 Bug Fixes
- 🔒 Security
- ⚡ Performance
- 📚 Documentation
- 🧰 Maintenance
- ✅ Tests
- 📦 Dependencies

## 🔧 Setup Checklist

### Required GitHub Secrets
- [ ] `NPM_TOKEN` - For npm publishing (get from npm account settings)
- [ ] `SONAR_TOKEN` - For SonarCloud analysis (get from SonarCloud)
- [ ] `CODECOV_TOKEN` - Optional for private repos (get from Codecov)

### Required GitHub Settings
1. **Branch Protection Rules**
   - Enable "Allow force pushes" for semantic-release bot
   - Or add semantic-release bot to bypass list

2. **GitHub Apps to Install**
   - [Renovate](https://github.com/apps/renovate)
   - [All Contributors](https://github.com/apps/allcontributors)
   - [Codecov](https://github.com/apps/codecov)

3. **External Services to Configure**
   - [SonarCloud](https://sonarcloud.io) - Import repository
   - [Codecov](https://codecov.io) - Add repository

## 📈 Monitoring

### Dashboards
- **Code Coverage:** https://codecov.io/gh/Vijay-Duke/mcp-atlassian
- **Code Quality:** https://sonarcloud.io/project/overview?id=vijay-duke_mcp-atlassian
- **Dependencies:** Check the Dependency Dashboard issue in GitHub
- **Releases:** Check draft releases in GitHub Releases

### Badges for README
```markdown
[![codecov](https://codecov.io/gh/Vijay-Duke/mcp-atlassian/branch/main/graph/badge.svg)](https://codecov.io/gh/Vijay-Duke/mcp-atlassian)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vijay-duke_mcp-atlassian&metric=alert_status)](https://sonarcloud.io/dashboard?id=vijay-duke_mcp-atlassian)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![All Contributors](https://img.shields.io/github/all-contributors/Vijay-Duke/mcp-atlassian?color=ee8449&style=flat-square)](#contributors)
```

## 🚨 Troubleshooting

### Semantic Release Not Working
- Check if `NPM_TOKEN` is set correctly
- Ensure commits follow conventional format
- Check branch protection settings

### Renovate Not Creating PRs
- Check if Renovate app is installed
- Review renovate.json for syntax errors
- Check the Dependency Dashboard issue for errors

### SonarCloud Not Reporting
- Verify `SONAR_TOKEN` is set
- Check sonar-project.properties configuration
- Ensure tests generate coverage reports

### Codecov Not Updating
- Verify coverage reports are generated
- Check if codecov.yml syntax is correct
- For private repos, add `CODECOV_TOKEN`

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Renovate Docs](https://docs.renovatebot.com/)
- [SonarCloud Docs](https://docs.sonarcloud.io/)
- [Codecov Docs](https://docs.codecov.com/)
- [All Contributors Spec](https://allcontributors.org/)
- [Release Drafter](https://github.com/release-drafter/release-drafter)