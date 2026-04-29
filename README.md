# n8n-nodes-chatterfox

n8n community node for [Chatterfox](https://chatterfox.co) — send WhatsApp messages from your n8n workflows.

**Published package name:** `@evolution-infosystem/n8n-nodes-chatterfox` (hyphens in the scope).

## Project structure

```
n8n-nodes-chatterfox/
├── .github/
│   └── workflows/
│       └── publish.yml           # npm publish with provenance (CI)
├── assets/
│   └── chatterfox-icon.svg      # Node/credential icon (copied to dist/assets on build)
├── credentials/
│   └── ChatterfoxApi.credentials.ts   # API key, Base URL, auth headers, credential test
├── nodes/
│   └── Chatterfox/
│       └── Chatterfox.node.ts   # Send Message operation, load options, HTTP calls
├── package.json
├── README.md
└── tsconfig.json
```

## Features

- **Send Message** — Send WhatsApp messages using your Chatterfox account
- **Credentials** — API Key and Base URL; WhatsApp accounts load from the Chatterfox API (name, phone, connected/disconnected status)
- **Secure requests** — HTTP calls use n8n’s `httpRequestWithAuthentication` and credential-based header auth (`x-api-key` and `Authorization: Bearer …`)
- **Clear errors** — HTTP failures surface in the n8n UI via `NodeApiError` (status and message from the API where available)
- **Load-options diagnostics** — If accounts, timezones, or countries fail to load (wrong URL, API key, or network), the node logs a **warning** on the n8n server so you can diagnose empty dropdowns (see [Troubleshooting](#troubleshooting))
- n8n expressions for dynamic recipient and message content
- Optional attachments: **binary** from a previous node or **public file URLs**; optional scheduled send, timezone, and disappearing messages

## Prerequisites

- Chatterfox account with at least one WhatsApp account (preferably **connected** for sending)
- Chatterfox **API key** (create in the Chatterfox dashboard under API Keys)

## Installation

### Community node (recommended)

Install the published package:

```bash
npm install @evolution_infosystem/n8n-nodes-chatterfox
```

Then enable it in n8n:

- **Settings → Community nodes** — install from npm, or  
- Set **`NODES_INCLUDE`** / your hosting provider’s equivalent so n8n loads the package.

Restart n8n if required, then search the node palette for **Chatterfox**.

### Local development

```bash
git clone <repository-url>
cd n8n-nodes-chatterfox
npm install
npm run dev
```

This runs n8n with the node loaded (via `@n8n/node-cli`). The package name must follow the `n8n-nodes-*` or `@scope/n8n-nodes-*` pattern (this repo uses `@evolution-infosystem/n8n-nodes-chatterfox`).

Alternatively:

```bash
npm run build:watch
```

and point your n8n instance at the built output per n8n’s [custom nodes](https://docs.n8n.io/integrations/creating-nodes/) documentation.

## Configuration

### Credentials (Chatterfox API)

1. In n8n, create **Credentials → Chatterfox API**.
2. **API Key** — from the Chatterfox dashboard.
3. **Base URL** — defaults to `https://api.chatterfox.co/`. Change only if your backend uses another host (must match your Chatterfox environment).

All API requests use this Base URL. Configure the correct URL in the credential (the node does not read a separate env var for the base URL).

4. Use **Test** to verify the key. The test calls `POST {baseUrl}/api/v1/whatsapp/accounts` with your credentials.

### Node: Send Message

1. **Credential** — Select your Chatterfox API credential.
2. **WhatsApp Account** — Pick an account from the list (loaded from Chatterfox). Entries show name, phone, and active/inactive style status where available.
3. **Country Code** + **Phone Number** — Recipient (dial code + local number). Supports expressions.
4. **Message** — Required text (caption when files are attached). Supports expressions (e.g. `{{ $json.output }}`).
5. **File Attachment Mode**
   - **No Files** — Text only (JSON request).
   - **Binary** — Files from the previous item’s binary fields; you can list property names or leave empty to attach all binaries present.
   - **File URLs** — One or more public `https://` URLs.
6. **Scheduled Time** (optional) — ISO-style datetime; leave empty to send immediately.
7. **Timezone** / **Disappearing Message** (optional) — As supported by your Chatterfox API.

### Binary attachments

- If a listed binary property is missing or invalid, the node **logs a warning** and skips that file; check the execution log if attachments are missing.
- If there are no binary properties to attach, the node errors or skips the item according to your workflow settings.

### Errors and “Continue on fail”

- Validation issues (e.g. missing phone or message) show as clear operation errors.
- HTTP/network/API errors from the Chatterfox API are shown using n8n’s API error formatting.
- Enable **Continue on fail** on the node to return `{ success: false, error: "..." }` for failed items instead of stopping the workflow.

## Troubleshooting

### Empty dropdowns (WhatsApp accounts, timezone, country)

The lists are loaded from your Chatterfox API using the credential **Base URL** and **API key**. If a dropdown is empty but send still might work with manual IDs, check:

1. **Credential test** — Confirm **Test** succeeds on the Chatterfox credential.
2. **Base URL** — Must match the environment that issued the API key (no trailing slash issues; the node normalizes the URL).
3. **n8n server logs** — Failed load-options requests log warnings such as `Chatterfox: failed to load … for dropdown` with error details. Inspect your n8n instance logs (not only the execution panel).

## API reference (summary)

| Use case | Method | Path (under Base URL) |
|----------|--------|------------------------|
| Credential test & account list | `POST` | `/api/v1/whatsapp/accounts` |
| Timezones (dropdown) | `GET` | `/timezones` |
| Countries (dropdown) | `GET` | `/countries` |
| Send message | `POST` | `/api/v1/send-message` |

Send message requests include your API key and account ID in the body (and multipart fields for binary uploads) as required by Chatterfox; authentication headers are applied through n8n credentials.

Official API docs: [Chatterfox API documentation](https://api.chatterfox.co/platform/api/docs#).

## Development

```bash
npm install
npm run build        # Compile TypeScript + copy assets to dist/
npm run build:watch  # Watch mode
npm run dev          # n8n with this node (dev)
npm run lint         # Lint
npm run lint:fix     # Lint with auto-fix
```

Release tooling (optional, local): `npm run release` uses `n8n-node release` (release-it). Publishing with **npm provenance** for verification is expected from **GitHub Actions** — see below.

## Publishing (maintainers)

Verified community nodes should be published from **GitHub Actions** with **npm provenance**. See [Trusted publishing](https://docs.npmjs.org/trusted-publishers) and the [n8n Creator Portal](https://creators.n8n.io/) requirements.

### One-time: authentication

**Recommended — npm Trusted Publishing (OIDC)**

1. On [npmjs.com](https://www.npmjs.com), open **Package → Access / Publishing → Trusted Publisher**.
2. Choose **GitHub Actions** and match **exactly** (case-sensitive): GitHub org/user, repository name, workflow filename **`publish.yml`**.
3. No **`NPM_TOKEN`** repository secret is required; the workflow uses short-lived OIDC on GitHub-hosted runners.

**Alternative — automation token**

1. Create an npm **granular** or **automation** token with publish rights for `@evolution-infosystem`.
2. Add it as GitHub repository secret **`NPM_TOKEN`**.
3. In `.github/workflows/publish.yml`, uncomment **`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`** on the publish step.

### Release a new version (step by step)

1. **Bump the version** (updates `package.json` and `package-lock.json`):

   ```bash
   npm version patch --no-git-tag-version
   ```

   Use `minor` or `major` instead of `patch` if appropriate. Commit the version bump with your other changes.

2. **Push** to the default branch (e.g. `main`).

3. **Publish from CI** — either:
   - **Actions → Publish to npm → Run workflow**, or  
   - Create a **GitHub Release** and publish it (the workflow also triggers on `release: published`).

   The workflow runs `npm ci`, `npm run build`, upgrades npm for OIDC/provenance, then **`npm publish --provenance --access public`** with **`RELEASE_MODE`** set so `prepublishOnly` (`n8n-node prerelease`) succeeds in CI.

4. **Verify** on npm that the new version appears and **provenance** is listed for that version.

5. **Creator Portal** — Submit or resubmit that **same published version** for community verification if needed.

## License

MIT
