# Security Policy

## Supported Versions

We take security seriously for all supported versions of LEAN Format. Please ensure you're using a supported version when reporting vulnerabilities.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **leanformat@gmail.com**.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### When to Report

Please report security vulnerabilities if:
- You believe you've found a potential security vulnerability in LEAN Format
- You are unsure how a vulnerability affects LEAN Format
- You suspect a vulnerability in a dependency of LEAN Format

### What to Include

When reporting, please include:
- The version of LEAN Format you're using
- Steps to reproduce the issue
- Any potential impact
- Suggested fix (if any)

## Security Best Practices

### For Users
- Always validate and sanitize input before parsing
- Use the latest version of LEAN Format
- Review the code when using in security-sensitive applications

### For Contributors
- Run security audits: `npm audit`
- Update dependencies regularly
- Follow secure coding practices
- Add security tests for new features

## Security Updates

Security updates will be released as:
- **Critical**: Patched within 24 hours with immediate release
- **High**: Patched within 72 hours
- **Medium**: Patched in the next regular release
- **Low**: Addressed in upcoming releases

## Recognition

We appreciate and recognize security researchers who help us keep LEAN Format secure. Contributors who report valid security vulnerabilities will be credited (unless they prefer to remain anonymous).

---

*Last updated: {DATE}*
