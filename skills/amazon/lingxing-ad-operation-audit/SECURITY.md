# Security Policy

## Supported Versions

| Version | Status |
| --- | --- |
| `v0.1.1` | Supported |

## Secret Handling

Do not commit or publish:

- `LINGXING_REMOTE_MCP_KEY`
- full `X-Mcp-Key` values
- LingXing App ID or AppSecret
- exported JSON data
- generated HTML reports containing business data
- screenshots that reveal sensitive operating data

Use `.env.example` as a template and keep real `.env` files local.

## Reporting Security Issues

When reporting an issue, include the Key ID only, never the full key. Include the client, time, expected scope, actual behavior, and tool name when possible.
