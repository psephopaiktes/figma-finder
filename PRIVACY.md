# Figma Finder Privacy Policy

Updated: November 5, 2026. This policy describes version 1.0.7 and later.
Figma Finder is maintained by Akira HIRATA. Its purpose is to help you find and
open your Figma files.

## Information used

When you sign into Figma, the extension uses your account ID, email address,
display name, profile image, OAuth tokens, team/project information and file
metadata. It uses this information to authenticate, display your accounts and
search/open the files available to you. It does not ask for access to arbitrary
web pages or collect browsing history through a tabs permission.

## Where information is stored

Access and refresh tokens are stored in extension-local browser storage. They
are not written to the extension's browser-sync settings. Preferences and account
profiles, including configured teams, may be synchronized by your browser.
Cached project/file metadata is stored locally.

Older releases put tokens in synchronized account settings. The migration first
saves them locally and then removes them from the extension's synchronized record.
Existing locally rotated credentials take precedence. Update older installations
on other devices as well; this does not erase downloaded packages, historical
browser backups or copies retained outside the extension's control.

Extension-local storage is accessible to extension code and anyone controlling
your browser profile. It is not a separate server-side token vault.

## Services receiving information

Figma receives authentication and API requests needed for your account and files.
A Cloudflare Worker operated for Figma Finder receives the authorization code
and refresh token when exchanging or refreshing credentials with Figma. The
Worker holds the application's shared Client secret on the server; that secret
is not distributed in the extension.

The Worker processes these requests transiently. Its application code does not
persist tokens in a database or log request bodies, codes or tokens. Cloudflare
processes network information such as IP addresses to deliver and protect the
service, including rate limiting. Cloudflare and Figma apply their own service
privacy policies. Profile images and thumbnails load from URLs supplied by Figma;
those hosting services receive the corresponding image requests.

The extension does not include advertising or analytics scripts and does not sell
your information or use it for unrelated marketing or credit decisions.

## Retention and control

Use **Log out** in the extension to remove an account's local credentials and its
stored account entry. Logging out clears the extension's current project cache.
You can also revoke Figma Finder's access from your Figma account settings.
Browser sync and historical backups are controlled by your browser provider;
uninstalling on one device does not guarantee deletion of those external copies.

## Contact and changes

For privacy questions, contact the maintainer through the project's
[GitHub issues](https://github.com/psephopaiktes/figma-finder/issues).
For vulnerabilities, use the private reporting route in [SECURITY.md](SECURITY.md).
Material changes to this processing will be reflected in this policy and the
extension's store disclosures.
