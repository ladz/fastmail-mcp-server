# CLAUDE.md

> **CRITICAL: YOU MUST READ @AGENTS.md FIRST, EVERY TIME CLAUDE IS RUN.**
>
> This is MANDATORY. Read @AGENTS.md before doing ANYTHING else.
> It contains essential working rules and guidelines that override all other instructions.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
bun install

# Run the MCP server locally (requires FASTMAIL_API_TOKEN env var)
FASTMAIL_API_TOKEN=fmu1-... bun run start

# Run tests (uses MCP SDK client to test server)
FASTMAIL_API_TOKEN=fmu1-... bun run test

# Format code (using Biome)
bun run format

# Lint code (using Biome)
bun run lint
```

## Project Documentation & Task Management

This project uses a specific workflow for documentation and task management:

### Documentation (Bear Notes)

All plans, research, handoffs, and documentation are stored in Bear notes with nested tags:

- **Tag Structure**: `#3 projekte/fastmail-mcp-server/[CATEGORY]#`
- **Tag Placement**: Must be the FIRST LINE of every note (before title)
- **Available Categories**:
  - `plans` - Active implementation plans
  - `plans-completed` - Completed plans (archive)
  - `research` - Research documents and guides
  - `handoffs` - Handoff documentation
  - `collaboration` - Meeting notes, discussions
  - `inbox` - Unsorted/incoming notes
  - `private` - Personal notes
  - `archive` - Archived documents

**Bear MCP Commands**:

- `bear-create-note` - Create new note with title, text, and tags
- `bear-search-notes` - Search by term, tag, date range
- `bear-open-note` - Read full note content by identifier
- `bear-add-text` - Append to existing note
- `bear-notes-locator` agent - Find relevant notes by tags/search
- `bear-notes-analyzer` agent - Extract insights from notes

### Task Management

**Todoist** (Source of Work):

- Project: `fastmail-mcp-server` (ID: `6fxVMqfG7rMGGf3C`)
- Contains incoming tickets and work items
- Read tasks with `todoist_get_tasks({ filter: "#fastmail-mcp-server" })`
- Other useful filters: `"today"`, `"priority 1"`, `"overdue"`
- Create tasks with `todoist_create_task`
- Tickets from Todoist become the basis for creating plans in Bear

**Claude Code Internal Tasks** (Progress Tracking):

- Use `TaskCreate`, `TaskUpdate`, `TaskList` for tracking implementation progress
- Create internal tasks when working on Todoist tickets or implementing plans
- These are for execution tracking during implementation, not source tickets

### Workflow

1. **Read ticket** from Todoist (`todoist_get_tasks`)
2. **Create plan** → Bear note with `#3 projekte/fastmail-mcp-server/plans#` tag
3. **During implementation** → Use Claude's TaskCreate/TaskUpdate to track progress
4. **Write research/handoffs** → Bear notes with appropriate tags

### Files in Git

The following files remain in the git repository (not in Bear):

- `CLAUDE.md`, `AGENTS.md` - Project instructions
- `README.md` - Public documentation
- Standard project files (package.json, etc.)

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides Claude Desktop with access to Fastmail via the JMAP API (RFC 8620/8621).

### Layer Structure

1. **MCP Layer** (`src/index.ts`)
   - Entry point with shebang `#!/usr/bin/env bun`
   - Defines all MCP tools (list_emails, send_email, etc.)
   - Tool schemas defined with Zod for type safety and validation
   - Implements formatters for email/mailbox display
   - Manages preview→confirm flow for write operations
   - Provides MCP resources (attachment URIs) and prompts

2. **JMAP Client Layer** (`src/jmap/client.ts`)
   - `JMAPClient` class handles all API communication
   - Session management with lazy initialization (cached after first fetch)
   - `getAccountId()` extracts primary mail account from session
   - `request()` - low-level batch method calls
   - `call()` - high-level single method wrapper
   - `downloadBlob()` - specialized attachment download using JMAP download URL templates
   - Error handling for both HTTP and JMAP protocol errors
   - Singleton pattern via `getClient()` - one client instance per process

3. **JMAP Methods Layer** (`src/jmap/methods.ts`)
   - High-level domain functions that compose JMAP operations
   - Handles the **query→get pattern**: first query for IDs, then fetch details
   - Manages **email property sets**: `EMAIL_LIST_PROPERTIES` (minimal) vs `EMAIL_FULL_PROPERTIES` (complete)
   - Threading logic via `Thread/get` → `Email/get` with chronological sort
   - Search filter construction from user-friendly parameters to JMAP filters
   - Helper functions for reply/forward that build proper email headers

4. **Type Definitions** (`src/jmap/types.ts`)
   - Full TypeScript types for JMAP protocol structures (RFC 8620/8621)
   - Email, Mailbox, Identity, MaskedEmail domain types
   - JMAP protocol types: `JMAPMethodCall`, `JMAPResponse`, etc.
   - Helper types: `EmailCreate`, `SendEmailParams`, `SearchFilter`

### Key Design Patterns

#### 1. Preview→Confirm Flow (Safety Mechanism)

All destructive/send operations use a mandatory two-step flow:

- **Step 1**: Call with `action: "preview"` → returns formatted preview of what will happen
- **Step 2**: User approves → call again with `action: "confirm"` → executes the action

Implemented in: `send_email`, `reply_to_email`, `forward_email`, `mark_as_spam`

This prevents accidental sends and gives users control over destructive actions.

#### 2. Query→Get Pattern (JMAP Optimization)

JMAP separates searching from fetching to optimize bandwidth:

1. `Email/query` or `Mailbox/query` returns just IDs
2. `Email/get` or `Mailbox/get` fetches full objects with specified properties

Example from `listEmails()`:

```typescript
// Step 1: Query for IDs
const queryResult = await client.call("Email/query", {
  filter: { inMailbox: mailbox.id },
  sort: [{ property: "receivedAt", isAscending: false }],
});

// Step 2: Fetch details with specific properties
const getResult = await client.call("Email/get", {
  ids: queryResult.ids,
  properties: EMAIL_LIST_PROPERTIES, // Only what we need
});
```

#### 3. Property Sets (Minimize Data Transfer)

Different use cases need different email properties:

- **EMAIL_LIST_PROPERTIES**: For listings (id, from, subject, preview, etc.) - small, fast
- **EMAIL_FULL_PROPERTIES**: For single email view (adds bodyValues, attachments, headers, etc.)

The `fetchTextBodyValues: true` parameter fetches decoded body content in one request.

#### 4. Attachment Handling (Content-Aware)

The `get_attachment` tool adapts to content type:

1. **Text files** (text/\*, json, xml, csv): Decoded and returned inline
2. **Office documents** (PDF, DOCX, XLSX, PPTX, RTF, ODT, ODS, ODP):
   - Modern formats → `officeparser` library extracts text
   - Legacy .doc → macOS `textutil` command (better OLE format support)
3. **Images** (detected by MIME type OR file extension):
   - If >700KB binary → auto-resize with `sharp` library
   - Progressive quality reduction: 85% → 70% → 55% → 40% → 30%
   - Resize dimensions: 2048×2048 → 1600×1600
   - Convert to JPEG for better compression
   - Return as base64 for Claude's vision capabilities
4. **Other binaries**: Base64 fallback

**Why extension checking?** JMAP blob downloads often return `application/octet-stream` for all attachments, so we check filename extensions as a fallback.

#### 5. Thread Context (Conversation Awareness)

When you call `get_email`, it automatically:

1. Gets the email's `threadId`
2. Calls `Thread/get` to find all email IDs in the thread
3. Fetches all emails with `Email/get`
4. Sorts by `receivedAt` ascending (oldest first)
5. Marks which email was originally requested

This gives Claude full conversation context without extra tool calls.

#### 6. Mailbox Resolution (Flexible Lookup)

`getMailboxByName()` tries multiple strategies in order:

1. Exact name match: "INBOX" matches "INBOX"
2. Role match: "inbox" matches role="inbox"
3. Case-insensitive: "inbox" matches "INBOX"

This allows both user-friendly names ("inbox") and exact names ("INBOX").

#### 7. Email Sending (Multi-Step JMAP Transaction)

Sending emails is a complex multi-step operation in a single JMAP request:

```typescript
await client.request([
  // Step 1: Create draft email
  [
    "Email/set",
    {
      create: { draft: emailCreate },
    },
    "0",
  ],

  // Step 2: Submit for sending (references draft with "#draft")
  [
    "EmailSubmission/set",
    {
      create: {
        submission: {
          identityId: identity.id,
          emailId: "#draft", // Backreference to created email
        },
      },
      // Step 3: On success, move from Drafts to Sent
      onSuccessUpdateEmail: {
        "#submission": {
          mailboxIds: { [sentMailbox.id]: true },
          "keywords/$draft": null,
        },
      },
    },
    "1",
  ],
]);
```

This atomic operation ensures emails either fully send or fully fail.

#### 8. Keyword System (JMAP Email Flags)

JMAP uses keywords instead of IMAP flags:

- `$seen` - email has been read
- `$flagged` - email is starred/important
- `$draft` - email is a draft
- `$junk` - email is spam (trains filter!)
- `$notjunk` - explicitly not spam

Modifying keywords is done via `Email/set` with `keywords` object or `keywords/keywordname` patch.

#### 9. Search Filter Construction

`searchEmails()` converts user-friendly filters to JMAP format:

**General query** (`query: "text"`) → OR condition across multiple fields:

```typescript
{
  operator: "OR",
  conditions: [
    { subject: "text" },
    { from: "text" },
    { to: "text" },
    { body: "text" }
  ]
}
```

**Date filters** → Normalized to ISO 8601:

- Input: `"2024-01-01"` → Output: `"2024-01-01T00:00:00Z"`

**Keyword filters**:

- `unread: true` → `notKeyword: "$seen"`
- `flagged: true` → `hasKeyword: "$flagged"`

#### 10. Reply/Forward Helpers

`buildReply()` constructs proper email threading:

- Determines reply-to from `replyTo` header (fallback to `from`)
- Prepends "Re:" to subject if not present
- Builds references chain: original.references + original.messageId
- Sets `inReplyTo` to original message ID

`buildForward()` creates forwarded email structure:

- Prepends "Fwd:" to subject
- Extracts original body from bodyValues
- Formats attribution: "---------- Forwarded message ---------"
- Includes original From, Date, Subject headers

## Error Handling Patterns

### JMAP Protocol Errors

The client checks for error responses in `methodResponses`:

```typescript
for (const [methodName, data] of result.methodResponses) {
  if (methodName === "error") {
    throw new Error(`JMAP error: ${data.type} - ${data.description}`);
  }
}
```

### Operation-Specific Errors

For `Email/set`, `EmailSubmission/set`, and `MaskedEmail/set`, check both:

- `notCreated` - creation failures
- `notUpdated` - update failures

These contain structured error objects with `type` and optional `description`.

### HTTP Errors

Both session initialization and JMAP requests check `response.ok` and throw with status code + body text.

## MCP-Specific Features

### Resources

Exposes attachments as MCP resources with URI scheme:

```
fastmail://attachment/{emailId}/{blobId}
```

These can be referenced in MCP resource requests for direct blob access.

### Prompts

Provides a `fastmail-usage` prompt with guidance on:

- How to read emails effectively
- The mandatory preview→confirm flow
- Search capabilities
- Attachment access patterns

### Tool Organization

Tools are organized into functional groups:

- **Read tools**: list_mailboxes, list_emails, get_email, search_emails
- **Attachment tools**: list_attachments, get_attachment
- **Modification tools**: move_email, mark_as_read, mark_as_spam
- **Sending tools**: send_email, reply_to_email, forward_email
- **Masked email tools**: list/create/enable/disable/delete

## Testing Strategy

`src/test.ts` is a simple integration test that:

1. Spawns the MCP server as a subprocess
2. Connects via `StdioClientTransport`
3. Tests basic operations: list_mailboxes, list_emails, search_emails
4. Verifies tool calls return expected response structure

Run with: `FASTMAIL_API_TOKEN=... bun run test`

## Code Style

- **Biome** for formatting and linting (configured in `biome.json`)
- Indentation: **tabs** (not spaces)
- Bun-specific features: native `spawn`, file APIs, `$` shell templating
- Console.error for debug logging (stderr doesn't pollute MCP stdio transport)
- MCP tools return `{ content: [...] }` with text and/or image content blocks

## Important Implementation Details

### Session Caching

The JMAP session is fetched once and cached:

```typescript
async getSession(): Promise<JMAPSession> {
  if (this.session) return this.session;  // Cached
  // ... fetch from API
  this.session = result;
  return this.session;
}
```

### Singleton Client

One client instance per process via closure:

```typescript
let client: JMAPClient | null = null;

export function getClient(): JMAPClient {
  if (!client) {
    const token = process.env.FASTMAIL_API_TOKEN;
    if (!token) throw new Error("FASTMAIL_API_TOKEN required");
    client = new JMAPClient(token);
  }
  return client;
}
```

### Download URL Template

JMAP provides URL templates with placeholders:

```typescript
const url = session.downloadUrl
  .replace("{accountId}", accountId)
  .replace("{blobId}", blobId)
  .replace("{name}", "attachment")
  .replace("{type}", "application/octet-stream");
```

### Image Resizing Math

Target: <700KB binary (×1.33 base64 overhead = ~930KB < 1MB API limit)

Strategy:

1. Check binary size before base64 encoding
2. Resize progressively until under limit
3. Convert to JPEG for consistency

### JMAP Capabilities

All requests declare required capabilities:

- `urn:ietf:params:jmap:core` - Core JMAP (RFC 8620)
- `urn:ietf:params:jmap:mail` - Mail extension (RFC 8621)
- `urn:ietf:params:jmap:submission` - Email submission
- `https://www.fastmail.com/dev/maskedemail` - Fastmail-specific masked emails

## Common Pitfalls

1. **Don't fetch full emails for listings** - Use `EMAIL_LIST_PROPERTIES` to minimize bandwidth
2. **Always check both HTTP and JMAP errors** - JMAP returns 200 OK with error responses
3. **Image size includes base64 overhead** - 1MB binary → ~1.33MB base64
4. **Mailbox IDs vs names** - Always resolve names to IDs before JMAP calls
5. **Keywords are additive** - Merge with existing keywords, don't replace
6. **Thread/get returns IDs** - Still need Email/get to fetch actual emails
7. **Preview is mandatory** - Never skip preview→confirm for safety
8. **$junk trains spam filter** - mark_as_spam affects future email classification
