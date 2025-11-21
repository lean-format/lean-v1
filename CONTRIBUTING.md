# Contributing to LEAN Format

Thank you for your interest in contributing to LEAN Format! We welcome contributions from everyone.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
- Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Check existing issues to avoid duplicates
- Include detailed steps to reproduce
- Provide environment information

### Suggesting Enhancements
- Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the problem you're trying to solve
- Provide examples of the proposed solution
- Consider potential impacts on existing users

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Local Development
```bash
# Fork and clone the repository
git clone https://github.com/lean-format/lean-v1.git
cd lean-v1

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Run linter
npm run lint
