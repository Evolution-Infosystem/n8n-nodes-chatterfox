# n8n-nodes-chatterfox

n8n community node for [Chatterfox](https://chatterfox.co) - send WhatsApp messages from your n8n workflows.

## Project structure

```
n8n-nodes-chatterfox/
├── credentials/
│   └── ChatterfoxApi.credentials.ts   # Credential definition (API Key, Account ID, Base URL)
├── nodes/
│   └── Chatterfox/
│       ├── Chatterfox.node.ts         # Chatterfox node logic
│       └── chatterfox.svg             # Node icon
├── docs/                              # Documentation
│   └── IT-WHITELIST-REQUEST.md       # Template for IT to whitelist dev tunnel
├── .env.example                      # Optional env vars (copy to .env if needed)
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

## Features

- **Send Message** - Send WhatsApp messages to phone numbers using your Chatterfox account
- Configurable credentials (API Key, Account ID, Base URL)
- Supports n8n expressions for dynamic `to` and `message` values

## Prerequisites

- Chatterfox account with at least one WhatsApp account connected
- Chatterfox API key (create in Chatterfox dashboard under API Keys)
- Account ID of your WhatsApp account

## Installation

### Option 1: Community Node (npm)

```bash
npm install n8n-nodes-chatterfox
```

Then add to your n8n `NODES_INCLUDE` environment variable or install via n8n's Community Nodes UI.

### Option 2: Local Development

```bash
cd n8n-nodes-chatterfox
npm install
npm run dev
```

This starts n8n with the Chatterfox node loaded and hot-reload enabled.

## Configuration

### Optional: `.env` (base API URL)

A `.env` file is **not required**. The node gets the API base URL from the n8n credential. If you want to use an environment variable (e.g. to match your frontend or to avoid setting Base URL in every credential):

1. Copy the example file: `cp .env.example .env`
2. Set `CHATTERFOX_API_BASE_URL` (or re-use `NEXT_PUBLIC_BACKEND_URL` if n8n runs with the same env as your frontend):

   ```env
   CHATTERFOX_API_BASE_URL=https://api.chatterfox.co/
   ```

3. When the credential’s **Base URL** is empty, the node will use this env value. Staging default: `https://api.chatterfox.co/`; production: `https://api.chatterfox.co`.

### Credentials

1. Create a new Chatterfox credential in n8n
2. Enter your **API Key** (from Chatterfox dashboard > API Keys)
3. Enter your **Account ID** (WhatsApp account ID from Chatterfox)
4. (Optional) **Base URL** - default is staging `https://api.chatterfox.co/`. Leave empty to use `CHATTERFOX_API_BASE_URL` or `NEXT_PUBLIC_BACKEND_URL` from `.env` if set.

### Send Message

- **Country Code** + **Phone Number** – Recipient (e.g. `91` + `9876543210`). Can be fixed or from previous nodes via expressions.
- **Message** – The text to send. Supports n8n expressions for dynamic content, e.g. from an AI Agent: `{{ $json.output }}` or `{{ $node["AI Agent"].json.output }}`; from email: `{{ $json.text }}` or `{{ $json.body }}`.

For a full **Email → AI Agent → Chatterfox** workflow (trigger on email, rewrite with AI, send via WhatsApp), see [docs/EMAIL_TO_WHATSAPP_WORKFLOW.md](docs/EMAIL_TO_WHATSAPP_WORKFLOW.md).

## API Reference

The node calls the Chatterfox API:

- `POST {baseUrl}/api/v1/send-message`
- Body: `{ apiKey, accountId, to, message }`

Base URL defaults to staging (`https://api.chatterfox.co/`); override in the credential or via `CHATTERFOX_API_BASE_URL` in `.env`.

## Development

```bash
npm install
npm run build      # Build for production
npm run dev        # Run n8n with node and watch mode
npm run lint       # Run linter
npm run lint:fix   # Fix lint issues
```

## License

MIT
