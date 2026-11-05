# Chrome Web Store — Figma Finder

Last updated: 2026-11-05. These are repository facts and setup instructions;
dashboard settings have not been independently verified. Version 1.0.5 was
submitted automatically and rejected according to the supplied review email.

## Automatic submission

Merge a PR into `main` with an increased version in both package files
(`npm version patch --no-git-tag-version`). After required checks pass, the
workflow submits the Chrome ZIP for review. Unchanged versions skip automatic
submission because the store requires a newer version for each upload.
Pull requests never submit. Firefox submission has been removed; local Firefox
development and builds remain available.

The submission uses API v2 and `STAGED_PUBLISH`: approval does not automatically
release the extension to users. Release an approved version from the dashboard.

Configure these in GitHub repository **Settings → Secrets and variables → Actions**:

| Kind | Name | Purpose |
| --- | --- | --- |
| Variable | `CHROME_PUBLISHER_ID` | Publisher ID from the Chrome Web Store dashboard |
| Variable | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | Authorized Google service account email |
| Secret | `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | Corresponding PEM private key |
| Variable | `WXT_FIGMA_ID` | Figma OAuth application ID used at build time |
| Secret | `WXT_FIGMA_SECRET` | Figma OAuth application secret used at build time |

Enable Chrome Web Store API in the service account's Google Cloud project and
authorize that service account for the publisher in the Chrome Web Store
dashboard. The configured item ID is `klifomaejfaibpkbigbpljdmelbkehbe`.
GitHub repository settings are separate from this cloud development environment.
Never put secret values in commits, PRs, logs, or this document.

## Diagnose a missing submission

1. Open the workflow on the Actions tab. Check the `version` step's `changed`
   output; `false` intentionally skips automatic submission.
2. Inspect the required `checks` job: type check, lint, tests, production
   dependency audit, Figma configuration, Chrome build and archive checks.
3. Run the workflow manually on `main` with `dry_run: true` to test Chrome
   credentials and item access without uploading or requesting review. The
   default is dry-run. To retry an actual submission, explicitly select false;
   its package version must still be newer than the store's uploaded version.
4. Inspect the `submit` job for authentication, permission, upload or review
   errors. A successful workflow is not evidence of review approval or release.

The full dependency audit is a separate advisory job. At this change, moderate
minimatch advisories affect development tools (ESLint/web-ext) and a low-severity
deepmerge advisory affects build tools. They remain unresolved and visible in
the audit log and job summary. `npm audit --omit=dev --audit-level=moderate`
remains mandatory; test/build failures remain blocking. Development advisories
still need maintenance, especially before processing untrusted patterns.

## Store listing and review reference

- Name: Figma Finder. Description: “You can quickly find and open Figma files.”
- Single purpose: find and open the user's Figma files. Default language: English.
- Suggested category: Productivity; current dashboard category is unverified.
- Homepage: https://github.com/psephopaiktes/figma-finder
- Publisher in package metadata: Akira HIRATA. Public contact, privacy policy URL,
  screenshots, distribution settings and live listing copy need dashboard verification.
- Generated store icon: `build/chrome-mv3/icons/128.png` (128 × 128).
  This workflow change does not update store graphics or listing text.

| Permission | Purpose |
| --- | --- |
| `storage` | Persist accounts, preferences and cached file/project state |
| `identity` | Sign into Figma through the browser authentication flow |
| `sidePanel` | Display the file finder beside the current tab |
| `https://api.figma.com/*` | Exchange/refresh OAuth tokens and load profile, projects and files |

Opening the welcome page with `tabs.create()` and querying the active tab for
its `windowId` do not require `tabs` or `activeTab`. The extension does not read
tab URLs, titles or favicons, and does not inject content scripts. The Figma login
page is opened with `identity.launchWebAuthFlow()`; it needs no host permission
for `www.figma.com`. Only cross-origin requests to `api.figma.com` require host
access.

The application processes Figma account identifiers, email/handle, authentication
tokens and project/file metadata. Account data and tokens are written to browser
sync storage; cached projects are stored locally. Figma receives authentication
and API requests. Verify dashboard disclosures and the live privacy policy against
this behavior; do not claim that the extension processes no user data.
The existing OAuth client secret is embedded in built JavaScript; this workflow
change does not fix that application design limitation.

## Version history

| Version | Date | Change | Status |
| --- | --- | --- | --- |
| 1.0.6 | 2026-11-04 | Remove unused tabs, activeTab and Figma login-page host permissions | Prepared for resubmission |
| 1.0.5 | 2026-11-04 | Chrome-only automated submission; separate development audit reporting | Rejected: unused tabs permission (Purple Potassium) |

## Rejection response: Purple Potassium

The supplied review email identified the unused `tabs` permission in item
`klifomaejfaibpkbigbpljdmelbkehbe` (routing ID FZSL). Version 1.0.6 removes that
permission and the unused `activeTab` and `www.figma.com` host permissions.
The install-time welcome page and sidebar window lookup are retained. Review
approval and general release remain pending. Merging this version bump into main
triggers the existing Chrome-only resubmission workflow.

## OAuth Worker preparation

A standalone token broker is implemented in `workers/figma-auth`; deployment
instructions are in [SETUP.md](workers/figma-auth/SETUP.md). The browser extension
is not connected to it yet. Its current embedded Client secret and sync-stored
tokens remain unchanged until the follow-up migration; do not claim those issues
are resolved. Preparing this Worker does not change the extension version,
permissions, or the current store release.
