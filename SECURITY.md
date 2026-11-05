# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it to us directly. Do not report vulnerabilities in public GitHub issues.

Please submit your report using the GitHub security advisories page: [Create a security advisory](https://github.com/psephopaiktes/figma-finder/security/advisories/new). We will respond as soon as possible and prioritize a fix.

## Security Considerations

- The shared Figma OAuth Client secret is held only by the Cloudflare Worker. It is not injected into the extension build. Client ID and Worker URL are public configuration.
- Per-user access/refresh tokens use extension-local storage. Preferences and account profiles may use browser sync; migration removes legacy credentials from the app's synchronized record after a local copy succeeds.
- The Worker processes authorization codes and refresh tokens transiently to call Figma. Profile, team, project and file requests go directly from the extension to Figma. See [PRIVACY.md](PRIVACY.md).
- OAuth state and redirect validation, fixed Worker endpoints, Web Locks around credential updates, least-privilege host permissions, and artifact sentinel scans reduce exposure. Extension-local storage is still accessible to extension code and anyone controlling the browser profile; it is not a server-only token vault.
- Old distributed extension packages contained the old Client secret. Rotation in Figma and registration of the new value only in the Worker are required after cutover. Do not restore a leaked key or re-embed one during rollback.

## Responsible Disclosure

We encourage responsible disclosure to ensure that security issues are addressed before being publicly known.
