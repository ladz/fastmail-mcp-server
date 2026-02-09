# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
bun install

# Run the MCP server locally (requires FASTMAIL_API_TOKEN env var)
FASTMAIL_API_TOKEN=fmu1-... bun run start

# Run tests
FASTMAIL_API_TOKEN=fmu1-... bun run test

# Format code (using Biome)
bun run format

# Lint code (using Biome)
bun run lint
```

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides Claude Desktop with access to Fastmail via the JMAP API.

### Layer Structure

1. **MCP Layer** (`src/index.ts`)
   - Entry point with shebang `#!/usr/bin/env bun`
   - Defines all MCP tools (list_emails, send_email, etc.)
   - Handles tool schemas using Zod
   - Implements formatters for email/mailbox display
   - Manages preview→confirm flow for write operations

2. **JMAP Client Layer** (`src/jmap/client.ts`)
   - `JMAPClient` class handles API communication
   - Manages session authentication and account ID resolution
   - Provides low-level `request()` and higher-level `call()` methods
   - Error handling for JMAP protocol errors

3. **JMAP Methods Layer** (`src/jmap/methods.ts`)
   - High-level domain functions (listEmails, sendEmail, etc.)
   - Handles complex operations like threading and search filters
   - Manages email property sets for different use cases
   - Uses singleton `getClient()` pattern

4. **Type Definitions** (`src/jmap/types.ts`)
   - TypeScript types for JMAP protocol structures
   - Email, Mailbox, Identity, MaskedEmail types

### Key Design Patterns

**Preview→Confirm Flow**: All destructive/send operations use a two-step safety mechanism:
- First call with `action: "preview"` shows what will happen
- Second call with `action: "confirm"` performs the action
- See: `send_email`, `reply_to_email`, `forward_email`, `mark_as_spam`

**Attachment Handling**: The `get_attachment` tool intelligently processes different file types:
- Plain text → returned inline
- Office docs (PDF, DOCX, etc.) → text extracted via `officeparser`
- Legacy .doc files → text extracted via macOS `textutil` command
- Images → auto-resized if >700KB, returned as base64 for Claude's vision
- Other binaries → base64 fallback

**Thread Context**: `get_email` automatically fetches and displays the full email thread, sorted chronologically with the selected email marked.

**Mailbox Resolution**: Functions accept either exact mailbox names ("INBOX") or role names ("inbox"), with case-insensitive fallback.

## Testing

The codebase includes `src/test.ts` for manual testing. You need a valid Fastmail API token in the environment to run it.

## Code Style

- Uses **Biome** for formatting and linting (configured in `biome.json`)
- Indentation: **tabs** (not spaces)
- Uses Bun runtime features (native spawn, file APIs)
- Console errors (stderr) used for debug logging
- MCP tools return structured `{ content: [...] }` responses

## Important Notes

- The package is distributed as a **global CLI tool** via npm/mise
- Main export is `src/index.ts` with executable shebang
- Requires Bun runtime (specified in `package.json` engines)
- API token must be provided via `FASTMAIL_API_TOKEN` environment variable
- All JMAP requests use these capabilities: `urn:ietf:params:jmap:core`, `urn:ietf:params:jmap:mail`, `urn:ietf:params:jmap:submission`, `https://www.fastmail.com/dev/maskedemail`

## Image Resizing Strategy

Images larger than 700KB binary are automatically resized to stay under the ~1MB limit when base64-encoded (700KB binary × 1.33 base64 overhead ≈ 930KB). The resize logic:
1. Resize to max 2048×2048 at 85% JPEG quality
2. If still too large, progressively reduce quality (down to 30%) and dimensions (1600×1600)
3. This ensures Claude receives images without hitting API limits
