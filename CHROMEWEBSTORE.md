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

The submission uses API v2 and `DEFAULT_PUBLISH`: new submissions are released
automatically after review approval. This setting applies to future submissions;
a revision already approved under staged publishing must be released from the
dashboard. Manual dry-runs still do not upload or publish.

Configure these in GitHub repository **Settings → Secrets and variables → Actions**:

| Kind | Name | Purpose |
| --- | --- | --- |
| Variable | `CHROME_PUBLISHER_ID` | Publisher ID from the Chrome Web Store dashboard |
| Variable | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | Authorized Google service account email |
| Secret | `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | Corresponding PEM private key |
| Variable | `WXT_FIGMA_ID` | Figma OAuth application ID used at build time |
| Variable (optional) | `WXT_AUTH_BASE_URL` | HTTPS Worker origin; defaults to the deployed figma-finder Worker |

Enable Chrome Web Store API in the service account's Google Cloud project and
authorize that service account for the publisher in the Chrome Web Store
dashboard. The configured item ID is `klifomaejfaibpkbigbpljdmelbkehbe`.
GitHub repository settings are separate from this cloud development environment.
Never put secret values in commits, PRs, logs, or this document.
The Figma Client secret now belongs only in the Worker runtime Secret
`FIGMA_CLIENT_SECRET`. Remove the obsolete GitHub `WXT_FIGMA_SECRET` after this
change lands; real extension builds no longer read it.

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
| `https://api.figma.com/*` | Load the signed-in user profile, teams, projects and files |
| `https://figma-finder.hirataakira6.workers.dev/*` | Exchange an authorization code and refresh tokens without distributing the shared Client secret |

Opening the welcome page with `tabs.create()` and querying the active tab for
its `windowId` do not require `tabs` or `activeTab`. The extension does not read
tab URLs, titles or favicons, and does not inject content scripts. The Figma login
page is opened with `identity.launchWebAuthFlow()`; it needs no host permission
for `www.figma.com`. Cross-origin API requests to Figma and the explicitly configured OAuth Worker
require host access.

The application processes Figma account identifiers, email/handle, authentication
tokens and project/file metadata. Preferences and account profiles use browser
sync storage; access/refresh tokens use extension-local storage (`local:auth`).
Legacy sync credentials are copied locally before cleanup, and local rotated
credentials take precedence. Each device needs its own login after migration.

The Cloudflare-hosted Worker receives authorization codes and refresh tokens for
Figma token exchange/refresh. It holds the shared Client secret in a runtime
Secret, returns only necessary token fields, and does not persist tokens or log
request bodies. Figma profile/file requests continue directly from the extension.
The extension includes no shared Client secret. A CI sentinel scan checks both
browser builds and source ZIPs for raw/encoded leakage.

[PRIVACY.md](PRIVACY.md) documents this flow. Update the dashboard privacy policy
URL and authentication/third-party processing disclosures before submitting this
version. Suggested policy URL after merge:
https://github.com/psephopaiktes/figma-finder/blob/main/PRIVACY.md

Old distributed builds still contain the old secret. After real login/refresh
validation of the new extension, rotate it in Figma and update only the Worker
Secret. Account settings, key rotation behavior and store approval must be checked
separately; no secret has been rotated by this code change.

## Version history

| Version | Date | Change | Status |
| --- | --- | --- | --- |
| 1.0.7 | 2026-11-05 | Worker-backed OAuth; local credential migration; archive leak regression checks | Prepared; real browser OAuth validation pending |
| 1.0.6 | 2026-11-04 | Remove unused tabs, activeTab and Figma login-page host permissions | Review approved; ready to publish in the supplied dashboard screenshot |
| 1.0.5 | 2026-11-04 | Chrome-only automated submission; separate development audit reporting | Rejected: unused tabs permission (Purple Potassium) |

## Rejection response: Purple Potassium

The supplied review email identified the unused `tabs` permission in item
`klifomaejfaibpkbigbpljdmelbkehbe` (routing ID FZSL). Version 1.0.6 removes that
permission and the unused `activeTab` and `www.figma.com` host permissions.
The install-time welcome page and sidebar window lookup are retained. The user
subsequently supplied a dashboard screenshot showing the revision ready for
publication (review approved); live release status has not been verified.

## OAuth Worker integration

The Worker at `https://figma-finder.hirataakira6.workers.dev` is deployed and its
readiness endpoint returned HTTP 200 / `{"ok":true}` after runtime settings were
registered. The extension now uses it for exchange and refresh. A health response
does not validate Figma credentials; verify real login, refresh, account switching
and logout using the PR's Chrome archive before merging the version bump.
Worker deployment instructions remain in [SETUP.md](workers/figma-auth/SETUP.md),
and the migration/rollout checklist is in [the plan](docs/oauth-worker-plan.md).
The current Worker pins the Chrome redirect ID; Firefox builds pass but live
Firefox OAuth requires a separately verified allowed redirect/origin.
