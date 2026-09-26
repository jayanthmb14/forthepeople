# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ForThePeople.in, please report it responsibly. **Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email **support@forthepeople.in** (the single security contact; also published at [`/.well-known/security.txt`](https://forthepeople.in/.well-known/security.txt)) with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. The potential impact
4. Any suggested fixes (optional)

### What to Expect

- **Acknowledgement within 7 days** of your report (this is a solo-maintained project; you will get a human reply, not an auto-responder)
- A status update once the issue is confirmed and a fix is planned
- A fix deployed as quickly as severity allows, and credit in the changelog if you want it

### What Counts as a Security Issue

- Exposed API keys or credentials
- SQL injection or database access vulnerabilities
- Cross-site scripting (XSS)
- Authentication or authorization bypasses (admin sessions, 2FA, cron endpoints)
- Payment-flow issues (Razorpay order / verify / webhook signature handling)
- Data leaks or privacy violations
- Server-side request forgery (SSRF)

### What is NOT a Security Issue

- Bugs that don't have security implications (use regular GitHub issues)
- Feature requests
- Questions about the project

## Supported Versions

Only the latest version deployed at [forthepeople.in](https://forthepeople.in) is actively maintained and receives security updates.

## Thank You

We appreciate security researchers who help keep ForThePeople.in and its users safe. Responsible disclosure helps protect the citizens who rely on this platform.
