# Security Policy & Trust Model

## 1. Supported Versions

| Version | Supported |
|---|---|
| 1.0.x (Latest) | :white_check_mark: |
| < 1.0.0 | :x: |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability in the ARCADE_ engine or web shell, please do **NOT** file a public GitHub issue.

Please report vulnerabilities privately to the maintainers via:
- **Email:** `security@arcade.games` (or via GitHub Private Vulnerability Reporting)

Please include:
1. Detailed description of the vulnerability.
2. Steps or proof-of-concept to reproduce the behavior.
3. Potential impact on client integrity or cross-site scripting (XSS).

We will acknowledge your report within 48 hours and work on a fix promptly.

---

## 3. Client-Side Security & Threat Model

### 1. Cross-Site Scripting (XSS) Defense
- All dynamic game descriptions, user inputs, and query tokens are rendered through React's safe JSX escaping.
- The use of `dangerouslySetInnerHTML` is strictly restricted to compile-time generated JSON-LD structured data and static `<style>` definitions.
- Dynamic `eval()`, `new Function()`, and raw HTML string injections are strictly forbidden.

### 2. Local Storage Trust Boundary
- All player scores, unlocked cartridges, and settings are stored locally on the client (`localStorage`).
- Local storage is user-controlled and unauthenticated. ARCADE_ makes no claims of cryptographic tamper-resistance or cheat-proof high scores.

### 3. Analytics & Telemetry
- ARCADE_ uses **Vercel Analytics** for aggregate, anonymous page-view metrics.
- No personally identifiable information (PII), user IP addresses, or tracking cookies are stored.
- Gameplay actions and simulation states are never transmitted over the network.
