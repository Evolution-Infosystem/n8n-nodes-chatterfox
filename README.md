# n8n-nodes-chatterfox

n8n community node for [Chatterfox](https://chatterfox.co) — send WhatsApp messages from your n8n workflows.

## Project structure

```
n8n-nodes-chatterfox/
├── assets/
│   └── chatterfox-icon.svg       # Shared node/credential icon
├── credentials/
│   └── ChatterfoxApi.credentials.ts   # Credential (API Key, Base URL + credential test)
├── nodes/
│   └── Chatterfox/
│       └── Chatterfox.node.ts    # Chatterfox node logic
├── .env.example                  # Optional env vars (copy to .env if needed)
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## Features

- **Send Message** — Send WhatsApp messages using your Chatterfox account
- **Credentials**: API Key + Base URL only; select **WhatsApp Account** from a dropdown in the node (loaded from Chatterfox API; shows connected/disconnected status)
- Supports n8n expressions for dynamic recipient and message content
- Optional file attachments (binary from previous node or file URLs), scheduled send, and disappearing messages

## Prerequisites

- Chatterfox account with at least one **connected** WhatsApp account
- Chatterfox API key (create in Chatterfox dashboard under API Keys)

## Installation

### Option 1: Community node (npm)

**Scoped (org):**
```bash
npm install @evolution_infosystem/n8n-nodes-chatterfox
```

**Unscoped (if published as `n8n-nodes-chatterfox`):**
```bash
npm install n8n-nodes-chatterfox
```

Then add the package via n8n **Settings → Community nodes** or set `NODES_INCLUDE` in your environment.

### Option 2: Local development

```bash
cd n8n-nodes-chatterfox
npm install
npm run dev
```

This starts n8n with the Chatterfox node loaded and hot-reload enabled.  
Note: `n8n-node dev` requires the package name to start with `n8n-nodes-` or `@org/n8n-nodes-`. If you use a scoped name that fails validation, temporarily set `"name": "n8n-nodes-chatterfox"` in `package.json` for local dev, or use `npm run build:watch` and run n8n separately.

## Configuration

### Optional: `.env` (base API URL)

A `.env` file is **not required**. The node uses the Base URL from the credential. To override via environment:

1. Copy `.env.example` to `.env`
2. Set `CHATTERFOX_API_BASE_URL`, e.g.:
   ```env
   CHATTERFOX_API_BASE_URL=https://api.chatterfox.co
   ```
3. If the credential’s **Base URL** is empty, the node falls back to this value.

### Credentials

1. In n8n, create a new **Chatterfox API** credential.
2. Enter your **API Key** (from Chatterfox dashboard → API Keys).
3. (Optional) **Base URL** — default is `https://api.chatterfox.co/`. Leave empty to use `CHATTERFOX_API_BASE_URL` from `.env` if set.
4. Save; n8n will run a credential test against the Chatterfox API.

No Account ID is entered in the credential. The **WhatsApp account** is chosen in the node (see below).

### Send Message

1. **Credential** — Select your Chatterfox API credential.
2. **WhatsApp Account** — Choose from the list (loaded from your API key; shows name, phone, and status e.g. connected/disconnected). Only connected accounts can send.
3. **Country Code** + **Phone Number** — Recipient (e.g. India +91 and `9876543210`). Supports expressions.
4. **Message** — Text to send. Supports n8n expressions, e.g. `{{ $json.output }}` from an AI node or `{{ $json.text }}` from email.
5. **File Attachment Mode** (optional) — None, Binary (from previous node), or File URLs.
6. **Scheduled Time** (optional) — Leave empty to send immediately.
7. **Disappearing Message** (optional) — No expiration or 24h / 7d / 90d.

## API reference

The node uses the Chatterfox API:

- **Credentials test**: `POST {baseUrl}/api/v1/whatsapp/accounts` (validates API key).
- **List accounts**: Same endpoint to populate the WhatsApp Account dropdown.
- **Send message**: `POST {baseUrl}/api/v1/send-message` with `apiKey`, `accountId` (from selected account), `to`, `message`, and optional files/scheduling.

Base URL defaults to `https://api.chatterfox.co/`; override in the credential or via `CHATTERFOX_API_BASE_URL`.

## Development

```bash
npm install
npm run build        # Build for production
npm run build:watch  # Watch mode (no n8n server)
npm run dev          # n8n with node + watch (requires n8n-nodes-* or @org/n8n-nodes-* name)
npm run lint         # Lint
npm run lint:fix     # Lint with auto-fix
```

## License

MIT
